import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
// import nodePolyfills from 'rollup-plugin-polyfill-node';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import sha1 from 'crypto-js/sha1';

import { uglify } from "rollup-plugin-uglify";


import { createFilter } from '@rollup/pluginutils';





function replaceCrypto(options = {}) {

  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'rollup-plugin-require-static',
    transform(code, file) {

      if (!filter(file)) return;
      // let source = new MagicString(code)

      code = code.replace("var hash = crypto.createHash('sha1');", "var sha1 = require('crypto-js/sha1')")
      code = code.replace("hash.update(str + options.prefix);", "")
      code = code.replace("hash.digest('hex')", "sha1(str + options.prefix)")

      return { code: code, map: { mappings: null } };
    }
  };
}


export default {
  input: './src/index.js',
  output: [
    {
      file: './lib/index.js',
      format: 'cjs'
    },
    {
      file: './lib/stylus_compiler_index.js',
      format: 'iife',
      name: "stylusCompiler",
      sourcemap: true,
    }
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers']
    }),
    replaceCrypto({
      include: ['./node_modules/stylus/lib/cache/memory.js']
    }),
    resolve({
      browser: true
    }),
    commonjs(),
    nodePolyfills({}),
    // uglify()
  ]
}
