import {
  nodesToJSON,
  repeatString,
  replaceFirstATSymbol,
  trimFirstLinefeedLength
} from '../util.js'

let oldLineno = 1
let oldColumn = 1
let transfrom = ''
let returnSymbol = ''
let isProperty = false
let isIfExpression = false

const COMPIL_CONFIT = {
  scss: {
    variable: '$'
  },
  less: {
    variable: '@'
  }
}

const TYPE_VISITOR_MAP = {
  If: visitIf,
  RGBA: visitRGBA,
  Unit: visitUnit,
  Call: visitCall,
  BinOp: visitBinOp,
  Ident: visitIdent,
  Group: visitGroup,
  Import: visitImport,
  Literal: visitLiteral,
  Params: visitArguments,
  Property: visitProperty,
  'Boolean': visitBoolean,
  'Function': visitFunction,
  Selector: visitSelector,
  Arguments: visitArguments,
  Expression: visitExpression
}

function handleLineno (lineno) {
  return repeatString('\n', lineno - oldLineno)
}

function handleColumn (column) {
  return repeatString(' ', column - oldColumn)
}

function handleLinenoAndColumn ({ lineno, column }) {
  return handleLineno(lineno) + handleColumn(column)
}

function findNodesType (list, type) {
  const nodes = nodesToJSON(list)
  return nodes.find(node => node.__type === type)
}

function visitNode (node) {
  const handler = TYPE_VISITOR_MAP[node.__type]
  return handler ? handler(node) : ''
}

// 处理 nodes
function visitNodes (list = []) {
  let text = ''
  const nodes = nodesToJSON(list)
  nodes.forEach(node => { text += visitNode(node) })
  return text
}

// 处理 import；handler import
function visitImport (node) {
  const before = handleLineno(node.lineno) + '@import '
  oldLineno = node.lineno
  let quote = ''
  let text = ''
  const nodes = nodesToJSON(node.path.nodes || [])
  nodes.forEach(node => {
    text += node.val
    if (!quote && node.quote) quote = node.quote
  })
  return `${before}${quote}${text}${quote};`
}

function visitSelector (node) {
  let text = handleLinenoAndColumn(node)
  oldLineno = node.lineno
  return text + visitNodes(node.segments)
}

function visitGroup (node) {
  const selector = visitNodes(node.nodes)
  const blockEnd = findNodesType(node.nodes, 'Selector') && selector || ''
  const endSymbol = handleColumn(node.block.column)
  const block = visitBlock(node.block, endSymbol)
  return selector + block
}

function visitBlock (node, suffix = '') {
  const before = ' {'
  const after = `\n${suffix}}`
  const text = visitNodes(node.nodes)
  return `${before}${text}${after}`
}

function visitLiteral (node) {
  return node.val || ''
}

function visitProperty (node) {
  const hasCall = findNodesType(node.expr.nodes, 'Call')
  const suffix = hasCall ? '' : ';'
  let before = handleLinenoAndColumn(node)
  oldLineno = node.lineno
  isProperty = true
  const result = `${before + visitNodes(node.segments)}: ${visitExpression(node.expr) + suffix}`
  isProperty = false
  return result
}

function visitIdent (node) {
  const val = node.val && node.val.toJSON() || ''
  if (val.__type === 'Null' || !val) return node.name
  if (val.__type === 'Function') {
    const result = visitFunction(val)
    oldLineno = node.lineno
    return result
  } else {
    const before = handleLineno(node.lineno)
    oldLineno = node.lineno
    return `${before + replaceFirstATSymbol(node.name)} = ${visitNode(val)};`
  }
}

function visitExpression (node) {
  const result = visitNodes(node.nodes)
  if (!returnSymbol || isIfExpression) return result
  let before = '\n'
  before += handleColumn((node.column + 1) - result.length)
  return before + returnSymbol + result
}

function visitCall ({ name, args, lineno, column }) {
  let before = handleLineno(lineno)
  const argsText = visitArguments(args)
  oldLineno = lineno
  if (!isProperty) {
    const exprLen = name.length + argsText.length + 1
    before += handleColumn(column - exprLen)
  }
  return `${before + name}(${argsText});`
}

function visitArguments (node) {
  const nodes = nodesToJSON(node.nodes)
  let text = ''
  nodes.forEach((node, idx) => {
    const prefix = idx ? ', ' : ''
    text += prefix + visitNode(node)
  })
  return text || ''
}

function visitRGBA (node, prop) {
  return node.raw
}

function visitUnit ({ val, type }) {
  return type ? val + type : val
}

function visitBoolean (node) {
  return node.val
}

function visitIf (node, symbol = '@if ') {
  let before = ''
  isIfExpression = true
  const condText = visitExpression(node.cond)
  isIfExpression = false
  const condLen = node.column - (condText.length + 2)
  if (symbol === '@if ') {
    before += handleLineno(node.lineno)
    oldLineno = node.lineno
    before += handleColumn(condLen)
  }
  const block = visitBlock(node.block, handleColumn(condLen))
  let elseText = ''
  if (node.elses && node.elses.length) {
    const elses = nodesToJSON(node.elses)
    elses.forEach(node => {
      if (node.__type === 'If') {
        elseText += visitIf(node, ' @else if ')
      } else {
        elseText += ' @else' + visitBlock(node, handleColumn(condLen))
      }
    })
  }
  return before + symbol + condText + block + elseText
}

function visitFunction (node) {
  const isFn = !findNodesType(node.block.nodes, 'Property')
  const hasIf = findNodesType(node.block.nodes, 'If')
  const before = handleLineno(node.lineno)
  let symbol = ''
  oldLineno = node.lineno
  if (isFn) {
    returnSymbol = '@return '
    symbol = '@function'
  } else {
    returnSymbol = ''
    symbol = '@mixin '
  }
  const fnName = `${symbol} ${node.name} (${visitArguments(node.params)})`
  const block = visitBlock(node.block)
  returnSymbol = ''
  return before + fnName + block
}

function visitBinOp (node) {
  return `${visitIdent(node.left)} ${node.op} ${visitIdent(node.right)}`
}

// 处理 stylus 语法树；handle stylus Syntax Tree
export default function visitor (ast, option) {
  transfrom = option
  const result = visitNodes(ast.nodes) || ''
  oldLineno = 1
  return result
}