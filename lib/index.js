'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
				var args = [null];
				args.push.apply(args, arguments);
				var Ctor = Function.bind.apply(f, args);
				return new Ctor();
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var parserExports$1 = {};
var parser = {
  get exports(){ return parserExports$1; },
  set exports(v){ parserExports$1 = v; },
};

var lexerExports = {};
var lexer = {
  get exports(){ return lexerExports; },
  set exports(v){ lexerExports = v; },
};

var tokenExports = {};
var token = {
  get exports(){ return tokenExports; },
  set exports(v){ tokenExports = v; },
};

var global$1 = (typeof global !== "undefined" ? global :
  typeof self !== "undefined" ? self :
  typeof window !== "undefined" ? window : {});

var lookup$1 = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var inited = false;
function init () {
  inited = true;
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup$1[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;
}

function toByteArray (b64) {
  if (!inited) {
    init();
  }
  var i, j, l, tmp, placeHolders, arr;
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders);

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len;

  var L = 0;

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
    arr[L++] = (tmp >> 16) & 0xFF;
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
    arr[L++] = tmp & 0xFF;
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup$1[num >> 18 & 0x3F] + lookup$1[num >> 12 & 0x3F] + lookup$1[num >> 6 & 0x3F] + lookup$1[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
    output.push(tripletToBase64(tmp));
  }
  return output.join('')
}

function fromByteArray (uint8) {
  if (!inited) {
    init();
  }
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
  var output = '';
  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    output += lookup$1[tmp >> 2];
    output += lookup$1[(tmp << 4) & 0x3F];
    output += '==';
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
    output += lookup$1[tmp >> 10];
    output += lookup$1[(tmp >> 4) & 0x3F];
    output += lookup$1[(tmp << 2) & 0x3F];
    output += '=';
  }

  parts.push(output);

  return parts.join('')
}

function read (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? (nBytes - 1) : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

function write (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
  var i = isLE ? 0 : (nBytes - 1);
  var d = isLE ? 1 : -1;
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
}

var toString = {}.toString;

var isArray$3 = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var INSPECT_MAX_BYTES = 50;

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
  ? global$1.TYPED_ARRAY_SUPPORT
  : true;

/*
 * Export kMaxLength after typed array support is determined.
 */
kMaxLength();

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length);
    that.__proto__ = Buffer.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length);
    }
    that.length = length;
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192; // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype;
  return arr
};

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
};

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype;
  Buffer.__proto__ = Uint8Array;
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size);
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
};

function allocUnsafe (that, size) {
  assertSize(size);
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0;
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
};

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0;
  that = createBuffer(that, length);

  var actual = that.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual);
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  that = createBuffer(that, length);
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255;
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array);
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset);
  } else {
    array = new Uint8Array(array, byteOffset, length);
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array;
    that.__proto__ = Buffer.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array);
  }
  return that
}

function fromObject (that, obj) {
  if (internalIsBuffer(obj)) {
    var len = checked(obj.length) | 0;
    that = createBuffer(that, len);

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len);
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray$3(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}
Buffer.isBuffer = isBuffer$1;
function internalIsBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
};

Buffer.concat = function concat (list, length) {
  if (!isArray$3(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i;
  if (length === undefined) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer
};

function byteLength (string, encoding) {
  if (internalIsBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string;
  }

  var len = string.length;
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer.byteLength = byteLength;

function slowToString (encoding, start, end) {
  var loweredCase = false;

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0;
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true;

function swap (b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }
  return this
};

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this
};

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this
};

Buffer.prototype.toString = function toString () {
  var length = this.length | 0;
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
};

Buffer.prototype.equals = function equals (b) {
  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
};

Buffer.prototype.inspect = function inspect () {
  var str = '';
  var max = INSPECT_MAX_BYTES;
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
    if (this.length > max) str += ' ... ';
  }
  return '<Buffer ' + str + '>'
};

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = target ? target.length : 0;
  }
  if (thisStart === undefined) {
    thisStart = 0;
  }
  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;

  if (this === target) return 0

  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);

  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }
  byteOffset = +byteOffset;  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1);
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding);
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (internalIsBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
};

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
};

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
};

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed;
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0;
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0;
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8';

  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
};

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return fromByteArray(buf)
  } else {
    return fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];

  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = '';
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    );
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;

  var newBuf;
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer(sliceLen, undefined);
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start];
    }
  }

  return newBuf
};

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val
};

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val
};

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset]
};

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | (this[offset + 1] << 8)
};

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return (this[offset] << 8) | this[offset + 1]
};

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
};

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
};

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
};

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | (this[offset + 1] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | (this[offset] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
};

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
};

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4)
};

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4)
};

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8)
};

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8)
};

function checkInt (buf, value, offset, ext, max, min) {
  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = (value & 0xff);
  return offset + 1
};

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8;
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24);
    this[offset + 2] = (value >>> 16);
    this[offset + 1] = (value >>> 8);
    this[offset] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = (value & 0xff);
  return offset + 1
};

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
    this[offset + 2] = (value >>> 16);
    this[offset + 3] = (value >>> 24);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4);
  }
  write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
};

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
};

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8);
  }
  write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
};

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;
  var i;

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    );
  }

  return len
};

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) {
        val = code;
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;

  if (!val) val = 0;

  var i;
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = internalIsBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this
};

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '=';
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        }

        // valid lead
        leadSurrogate = codePoint;

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray
}


function base64ToBytes (str) {
  return toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i];
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}


// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
function isBuffer$1(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
}

function isFastBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
}

// shim for using process in browser
// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
var cachedSetTimeout = defaultSetTimout;
var cachedClearTimeout = defaultClearTimeout;
if (typeof global$1.setTimeout === 'function') {
    cachedSetTimeout = setTimeout;
}
if (typeof global$1.clearTimeout === 'function') {
    cachedClearTimeout = clearTimeout;
}

function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}
function nextTick(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
}
// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
var title = 'browser';
var platform = 'browser';
var browser$2 = true;
var env = {};
var argv = [];
var version$1 = ''; // empty string to avoid regexp issues
var versions = {};
var release = {};
var config = {};

function noop() {}

var on = noop;
var addListener = noop;
var once$3 = noop;
var off = noop;
var removeListener = noop;
var removeAllListeners = noop;
var emit = noop;

function binding(name) {
    throw new Error('process.binding is not supported');
}

function cwd () { return '/' }
function chdir (dir) {
    throw new Error('process.chdir is not supported');
}function umask() { return 0; }

// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
var performance = global$1.performance || {};
var performanceNow =
  performance.now        ||
  performance.mozNow     ||
  performance.msNow      ||
  performance.oNow       ||
  performance.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp){
  var clocktime = performanceNow.call(performance)*1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor((clocktime%1)*1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds,nanoseconds]
}

var startTime = new Date();
function uptime() {
  var currentTime = new Date();
  var dif = currentTime - startTime;
  return dif / 1000;
}

var browser$1$1 = {
  nextTick: nextTick,
  title: title,
  browser: browser$2,
  env: env,
  argv: argv,
  version: version$1,
  versions: versions,
  on: on,
  addListener: addListener,
  once: once$3,
  off: off,
  removeListener: removeListener,
  removeAllListeners: removeAllListeners,
  emit: emit,
  binding: binding,
  cwd: cwd,
  chdir: chdir,
  umask: umask,
  hrtime: hrtime,
  platform: platform,
  release: release,
  config: config,
  uptime: uptime
};

var process = browser$1$1;

var inherits;
if (typeof Object.create === 'function'){
  inherits = function inherits(ctor, superCtor) {
    // implementation from standard node.js 'util' module
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  inherits = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  };
}
var inherits$1 = inherits;

var formatRegExp = /%[sdj%]/g;
function format$1(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect$1(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject$1(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect$1(x);
    }
  }
  return str;
}

// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
function deprecate(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global$1.process)) {
    return function() {
      return deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

var debugs = {};
var debugEnviron;
function debuglog(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = 0;
      debugs[set] = function() {
        var msg = format$1.apply(null, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
}

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect$1(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    _extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect$1.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect$1.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect$1.styles[styleType];

  if (style) {
    return '\u001b[' + inspect$1.colors[style][0] + 'm' + str +
           '\u001b[' + inspect$1.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction$1(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== inspect$1 &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction$1(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray$2(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction$1(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty$1(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty$1(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var length = output.reduce(function(prev, cur) {
    if (cur.indexOf('\n') >= 0) ;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray$2(ar) {
  return Array.isArray(ar);
}

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isNull(arg) {
  return arg === null;
}

function isNullOrUndefined(arg) {
  return arg == null;
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isString(arg) {
  return typeof arg === 'string';
}

function isSymbol(arg) {
  return typeof arg === 'symbol';
}

function isUndefined(arg) {
  return arg === void 0;
}

function isRegExp(re) {
  return isObject$1(re) && objectToString(re) === '[object RegExp]';
}

function isObject$1(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isDate(d) {
  return isObject$1(d) && objectToString(d) === '[object Date]';
}

function isError(e) {
  return isObject$1(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}

function isFunction$1(arg) {
  return typeof arg === 'function';
}

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}

function isBuffer(maybeBuf) {
  return Buffer.isBuffer(maybeBuf);
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
function log() {
  console.log('%s - %s', timestamp(), format$1.apply(null, arguments));
}

function _extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject$1(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}
function hasOwnProperty$1(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var util = {
  inherits: inherits$1,
  _extend: _extend,
  log: log,
  isBuffer: isBuffer,
  isPrimitive: isPrimitive,
  isFunction: isFunction$1,
  isError: isError,
  isDate: isDate,
  isObject: isObject$1,
  isRegExp: isRegExp,
  isUndefined: isUndefined,
  isSymbol: isSymbol,
  isString: isString,
  isNumber: isNumber,
  isNullOrUndefined: isNullOrUndefined,
  isNull: isNull,
  isBoolean: isBoolean,
  isArray: isArray$2,
  inspect: inspect$1,
  deprecate: deprecate,
  format: format$1,
  debuglog: debuglog
};

var util$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	format: format$1,
	deprecate: deprecate,
	debuglog: debuglog,
	inspect: inspect$1,
	isArray: isArray$2,
	isBoolean: isBoolean,
	isNull: isNull,
	isNullOrUndefined: isNullOrUndefined,
	isNumber: isNumber,
	isString: isString,
	isSymbol: isSymbol,
	isUndefined: isUndefined,
	isRegExp: isRegExp,
	isObject: isObject$1,
	isDate: isDate,
	isError: isError,
	isFunction: isFunction$1,
	isPrimitive: isPrimitive,
	isBuffer: isBuffer,
	log: log,
	inherits: inherits$1,
	_extend: _extend,
	'default': util
});

var require$$11 = /*@__PURE__*/getAugmentedNamespace(util$1);

(function (module, exports) {
	/*!
	 * Stylus - Token
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var inspect = require$$11.inspect;

	/**
	 * Initialize a new `Token` with the given `type` and `val`.
	 *
	 * @param {String} type
	 * @param {Mixed} val
	 * @api private
	 */

	var Token = module.exports = function Token(type, val) {
	  this.type = type;
	  this.val = val;
	};

	/**
	 * Custom inspect.
	 *
	 * @return {String}
	 * @api public
	 */

	Token.prototype.inspect = function(){
	  var val = ' ' + inspect(this.val);
	  return '[Token:' + this.lineno + ':' + this.column + ' '
	    + '\x1b[32m' + this.type + '\x1b[0m'
	    + '\x1b[33m' + (this.val ? val : '') + '\x1b[0m'
	    + ']';
	};

	/**
	 * Return type or val.
	 *
	 * @return {String}
	 * @api public
	 */

	Token.prototype.toString = function(){
	  return (undefined === this.val
	    ? this.type
	    : this.val).toString();
	};
} (token));

var nodes = {};

var nodeExports = {};
var node = {
  get exports(){ return nodeExports; },
  set exports(v){ nodeExports = v; },
};

var evaluatorExports = {};
var evaluator = {
  get exports(){ return evaluatorExports; },
  set exports(v){ evaluatorExports = v; },
};

var visitorExports = {};
var visitor$1 = {
  get exports(){ return visitorExports; },
  set exports(v){ visitorExports = v; },
};

/*!
 * Stylus - Visitor
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

/**
 * Initialize a new `Visitor` with the given `root` Node.
 *
 * @param {Node} root
 * @api private
 */

var Visitor = visitor$1.exports = function Visitor(root) {
  this.root = root;
};

/**
 * Visit the given `node`.
 *
 * @param {Node|Array} node
 * @api public
 */

Visitor.prototype.visit = function(node, fn){
  var method = 'visit' + node.constructor.name;
  if (this[method]) return this[method](node);
  return node;
};

/*!
 * Stylus - units
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

// units found in http://www.w3.org/TR/css3-values

var units = [
    'em', 'ex', 'ch', 'rem' // relative lengths
  , 'vw', 'vh', 'vmin', 'vmax' // relative viewport-percentage lengths
  , 'cm', 'mm', 'in', 'pt', 'pc', 'px' // absolute lengths
  , 'deg', 'grad', 'rad', 'turn' // angles
  , 's', 'ms' // times
  , 'Hz', 'kHz' // frequencies
  , 'dpi', 'dpcm', 'dppx', 'x' // resolutions
  , '%' // percentage type
  , 'fr' // grid-layout (http://www.w3.org/TR/css3-grid-layout/)
];

var stackExports = {};
var stack = {
  get exports(){ return stackExports; },
  set exports(v){ stackExports = v; },
};

/*!
 * Stylus - Stack
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

/**
 * Initialize a new `Stack`.
 *
 * @api private
 */

var Stack = stack.exports = function Stack() {
  Array.apply(this, arguments);
};

/**
 * Inherit from `Array.prototype`.
 */

Stack.prototype.__proto__ = Array.prototype;

/**
 * Push the given `frame`.
 *
 * @param {Frame} frame
 * @api public
 */

Stack.prototype.push = function(frame){
  frame.stack = this;
  frame.parent = this.currentFrame;
  return [].push.apply(this, arguments);
};

/**
 * Return the current stack `Frame`.
 *
 * @return {Frame}
 * @api private
 */

Stack.prototype.__defineGetter__('currentFrame', function(){
  return this[this.length - 1];
});

/**
 * Lookup stack frame for the given `block`.
 *
 * @param {Block} block
 * @return {Frame}
 * @api private
 */

Stack.prototype.getBlockFrame = function(block){
  for (var i = 0; i < this.length; ++i) {
    if (block == this[i].block) {
      return this[i];
    }
  }
};

/**
 * Lookup the given local variable `name`, relative
 * to the lexical scope of the current frame's `Block`.
 *
 * When the result of a lookup is an identifier
 * a recursive lookup is performed, defaulting to
 * returning the identifier itself.
 *
 * @param {String} name
 * @return {Node}
 * @api private
 */

Stack.prototype.lookup = function(name){
  var block = this.currentFrame.block
    , val
    ;

  do {
    var frame = this.getBlockFrame(block);
    if (frame && (val = frame.lookup(name))) {
      return val;
    }
  } while (block = block.parent);
};

/**
 * Custom inspect.
 *
 * @return {String}
 * @api private
 */

Stack.prototype.inspect = function(){
  return this.reverse().map(function(frame){
    return frame.inspect();
  }).join('\n');
};

/**
 * Return stack string formatted as:
 *
 *   at <context> (<filename>:<lineno>:<column>)
 *
 * @return {String}
 * @api private
 */

Stack.prototype.toString = function(){
  var block
    , node
    , buf = []
    , location
    , len = this.length;

  while (len--) {
    block = this[len].block;
    if (node = block.node) {
      location = '(' + node.filename + ':' + (node.lineno + 1) + ':' + node.column + ')';
      switch (node.nodeName) {
        case 'function':
          buf.push('    at ' + node.name + '() ' + location);
          break;
        case 'group':
          buf.push('    at "' + node.nodes[0].val + '" ' + location);
          break;
      }
    }
  }

  return buf.join('\n');
};

var frameExports = {};
var frame = {
  get exports(){ return frameExports; },
  set exports(v){ frameExports = v; },
};

var scopeExports = {};
var scope = {
  get exports(){ return scopeExports; },
  set exports(v){ scopeExports = v; },
};

/*!
 * Stylus - stack - Scope
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

/**
 * Initialize a new `Scope`.
 *
 * @api private
 */

var Scope$1 = scope.exports = function Scope() {
  this.locals = {};
};

/**
 * Add `ident` node to the current scope.
 *
 * @param {Ident} ident
 * @api private
 */

Scope$1.prototype.add = function(ident){
  this.locals[ident.name] = ident.val;
};

/**
 * Lookup the given local variable `name`.
 *
 * @param {String} name
 * @return {Node}
 * @api private
 */

Scope$1.prototype.lookup = function(name){
  return this.locals[name];
};

/**
 * Custom inspect.
 *
 * @return {String}
 * @api public
 */

Scope$1.prototype.inspect = function(){
  var keys = Object.keys(this.locals).map(function(key){ return '@' + key; });
  return '[Scope'
    + (keys.length ? ' ' + keys.join(', ') : '')
    + ']';
};

/*!
 * Stylus - stack - Frame
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Scope = scopeExports;

/**
 * Initialize a new `Frame` with the given `block`.
 *
 * @param {Block} block
 * @api private
 */

var Frame = frame.exports = function Frame(block) {
  this._scope = false === block.scope
    ? null
    : new Scope;
  this.block = block;
};

/**
 * Return this frame's scope or the parent scope
 * for scope-less blocks.
 *
 * @return {Scope}
 * @api public
 */

Frame.prototype.__defineGetter__('scope', function(){
  return this._scope || this.parent.scope;
});

/**
 * Lookup the given local variable `name`.
 *
 * @param {String} name
 * @return {Node}
 * @api private
 */

Frame.prototype.lookup = function(name){
  return this.scope.lookup(name)
};

/**
 * Custom inspect.
 *
 * @return {String}
 * @api public
 */

Frame.prototype.inspect = function(){
  return '[Frame '
    + (false === this.block.scope
        ? 'scope-less'
        : this.scope.inspect())
    + ']';
};

var __dirname$2 = '/Node\stylus-converter\node_modules\stylus\lib';

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var utils = {};

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
function resolve() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : '/';

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter$1(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
}
// path.normalize(path)
// posix version
function normalize(path) {
  var isPathAbsolute = isAbsolute$1(path),
      trailingSlash = substr$1(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter$1(path.split('/'), function(p) {
    return !!p;
  }), !isPathAbsolute).join('/');

  if (!path && !isPathAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isPathAbsolute ? '/' : '') + path;
}
// posix version
function isAbsolute$1(path) {
  return path.charAt(0) === '/';
}

// posix version
function join() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return normalize(filter$1(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
}


// path.relative(from, to)
// posix version
function relative(from, to) {
  from = resolve(from).substr(1);
  to = resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
}

var sep = '/';
var delimiter$1 = ':';

function dirname$1(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
}

function basename$1(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
}


function extname$1(path) {
  return splitPath(path)[3];
}
var path$3 = {
  extname: extname$1,
  basename: basename$1,
  dirname: dirname$1,
  sep: sep,
  delimiter: delimiter$1,
  relative: relative,
  join: join,
  isAbsolute: isAbsolute$1,
  normalize: normalize,
  resolve: resolve
};
function filter$1 (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr$1 = 'ab'.substr(-1) === 'b' ?
    function (str, start, len) { return str.substr(start, len) } :
    function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

var path$4 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	resolve: resolve,
	normalize: normalize,
	isAbsolute: isAbsolute$1,
	join: join,
	relative: relative,
	sep: sep,
	delimiter: delimiter$1,
	dirname: dirname$1,
	basename: basename$1,
	extname: extname$1,
	'default': path$3
});

var require$$7 = /*@__PURE__*/getAugmentedNamespace(path$4);

var empty = {};

var empty$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': empty
});

var require$$0$1 = /*@__PURE__*/getAugmentedNamespace(empty$1);

var old$1 = {};

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var pathModule = require$$7;
var isWindows = process.platform === 'win32';
var fs$1 = require$$0$1;

// JavaScript implementation of realpath, ported from node pre-v6

var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);

function rethrow() {
  // Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
  // is fairly slow to generate.
  var callback;
  if (DEBUG) {
    var backtrace = new Error;
    callback = debugCallback;
  } else
    callback = missingCallback;

  return callback;

  function debugCallback(err) {
    if (err) {
      backtrace.message = err.message;
      err = backtrace;
      missingCallback(err);
    }
  }

  function missingCallback(err) {
    if (err) {
      if (process.throwDeprecation)
        throw err;  // Forgot a callback but don't know where? Use NODE_DEBUG=fs
      else if (!process.noDeprecation) {
        var msg = 'fs: missing callback ' + (err.stack || err.message);
        if (process.traceDeprecation)
          console.trace(msg);
        else
          console.error(msg);
      }
    }
  }
}

function maybeCallback(cb) {
  return typeof cb === 'function' ? cb : rethrow();
}

pathModule.normalize;

// Regexp that finds the next partion of a (partial) path
// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
if (isWindows) {
  var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
} else {
  var nextPartRe = /(.*?)(?:[\/]+|$)/g;
}

// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
if (isWindows) {
  var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
} else {
  var splitRootRe = /^[\/]*/;
}

old$1.realpathSync = function realpathSync(p, cache) {
  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return cache[p];
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs$1.lstatSync(base);
      knownHard[base] = true;
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  // NB: p.length changes.
  while (pos < p.length) {
    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      continue;
    }

    var resolvedLink;
    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // some known symbolic link.  no need to stat again.
      resolvedLink = cache[base];
    } else {
      var stat = fs$1.lstatSync(base);
      if (!stat.isSymbolicLink()) {
        knownHard[base] = true;
        if (cache) cache[base] = base;
        continue;
      }

      // read the link if it wasn't read before
      // dev/ino always return 0 on windows, so skip the check.
      var linkTarget = null;
      if (!isWindows) {
        var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
        if (seenLinks.hasOwnProperty(id)) {
          linkTarget = seenLinks[id];
        }
      }
      if (linkTarget === null) {
        fs$1.statSync(base);
        linkTarget = fs$1.readlinkSync(base);
      }
      resolvedLink = pathModule.resolve(previous, linkTarget);
      // track this, if given a cache.
      if (cache) cache[base] = resolvedLink;
      if (!isWindows) seenLinks[id] = linkTarget;
    }

    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }

  if (cache) cache[original] = p;

  return p;
};


old$1.realpath = function realpath(p, cache, cb) {
  if (typeof cb !== 'function') {
    cb = maybeCallback(cache);
    cache = null;
  }

  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return process.nextTick(cb.bind(null, null, cache[p]));
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs$1.lstat(base, function(err) {
        if (err) return cb(err);
        knownHard[base] = true;
        LOOP();
      });
    } else {
      process.nextTick(LOOP);
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  function LOOP() {
    // stop if scanned past end of path
    if (pos >= p.length) {
      if (cache) cache[original] = p;
      return cb(null, p);
    }

    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      return process.nextTick(LOOP);
    }

    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // known symbolic link.  no need to stat again.
      return gotResolvedLink(cache[base]);
    }

    return fs$1.lstat(base, gotStat);
  }

  function gotStat(err, stat) {
    if (err) return cb(err);

    // if not a symlink, skip to the next path part
    if (!stat.isSymbolicLink()) {
      knownHard[base] = true;
      if (cache) cache[base] = base;
      return process.nextTick(LOOP);
    }

    // stat & read the link if not read before
    // call gotTarget as soon as the link target is known
    // dev/ino always return 0 on windows, so skip the check.
    if (!isWindows) {
      var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
      if (seenLinks.hasOwnProperty(id)) {
        return gotTarget(null, seenLinks[id], base);
      }
    }
    fs$1.stat(base, function(err) {
      if (err) return cb(err);

      fs$1.readlink(base, function(err, target) {
        if (!isWindows) seenLinks[id] = target;
        gotTarget(err, target);
      });
    });
  }

  function gotTarget(err, target, base) {
    if (err) return cb(err);

    var resolvedLink = pathModule.resolve(previous, target);
    if (cache) cache[base] = resolvedLink;
    gotResolvedLink(resolvedLink);
  }

  function gotResolvedLink(resolvedLink) {
    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }
};

var fs_realpath = realpath;
realpath.realpath = realpath;
realpath.sync = realpathSync;
realpath.realpathSync = realpathSync;
realpath.monkeypatch = monkeypatch;
realpath.unmonkeypatch = unmonkeypatch;

var fs = require$$0$1;
var origRealpath = fs.realpath;
var origRealpathSync = fs.realpathSync;

var version = process.version;
var ok$1 = /^v[0-5]\./.test(version);
var old = old$1;

function newError (er) {
  return er && er.syscall === 'realpath' && (
    er.code === 'ELOOP' ||
    er.code === 'ENOMEM' ||
    er.code === 'ENAMETOOLONG'
  )
}

function realpath (p, cache, cb) {
  if (ok$1) {
    return origRealpath(p, cache, cb)
  }

  if (typeof cache === 'function') {
    cb = cache;
    cache = null;
  }
  origRealpath(p, cache, function (er, result) {
    if (newError(er)) {
      old.realpath(p, cache, cb);
    } else {
      cb(er, result);
    }
  });
}

function realpathSync (p, cache) {
  if (ok$1) {
    return origRealpathSync(p, cache)
  }

  try {
    return origRealpathSync(p, cache)
  } catch (er) {
    if (newError(er)) {
      return old.realpathSync(p, cache)
    } else {
      throw er
    }
  }
}

function monkeypatch () {
  fs.realpath = realpath;
  fs.realpathSync = realpathSync;
}

function unmonkeypatch () {
  fs.realpath = origRealpath;
  fs.realpathSync = origRealpathSync;
}

var concatMap$1 = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray$1(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray$1 = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var balancedMatch = balanced$1;
function balanced$1(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range$1(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced$1.range = range$1;
function range$1(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    if(a===b) {
      return [ai, bi];
    }
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}

var concatMap = concatMap$1;
var balanced = balancedMatch;

var braceExpansion = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand$1(escapeBraces(str), true).map(unescapeBraces);
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand$1(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand$1(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand$1(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand$1(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand$1(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length);
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand$1(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}

var minimatch_1 = minimatch$1;
minimatch$1.Minimatch = Minimatch$1;

var path$2 = (function () { try { return require$$7 } catch (e) {}}()) || {
  sep: '/'
};
minimatch$1.sep = path$2.sep;

var GLOBSTAR = minimatch$1.GLOBSTAR = Minimatch$1.GLOBSTAR = {};
var expand = braceExpansion;

var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
};

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]';

// * => any number of characters
var star = qmark + '*?';

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?';

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?';

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!');

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true;
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/;

minimatch$1.filter = filter;
function filter (pattern, options) {
  options = options || {};
  return function (p, i, list) {
    return minimatch$1(p, pattern, options)
  }
}

function ext (a, b) {
  b = b || {};
  var t = {};
  Object.keys(a).forEach(function (k) {
    t[k] = a[k];
  });
  Object.keys(b).forEach(function (k) {
    t[k] = b[k];
  });
  return t
}

minimatch$1.defaults = function (def) {
  if (!def || typeof def !== 'object' || !Object.keys(def).length) {
    return minimatch$1
  }

  var orig = minimatch$1;

  var m = function minimatch (p, pattern, options) {
    return orig(p, pattern, ext(def, options))
  };

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  };
  m.Minimatch.defaults = function defaults (options) {
    return orig.defaults(ext(def, options)).Minimatch
  };

  m.filter = function filter (pattern, options) {
    return orig.filter(pattern, ext(def, options))
  };

  m.defaults = function defaults (options) {
    return orig.defaults(ext(def, options))
  };

  m.makeRe = function makeRe (pattern, options) {
    return orig.makeRe(pattern, ext(def, options))
  };

  m.braceExpand = function braceExpand (pattern, options) {
    return orig.braceExpand(pattern, ext(def, options))
  };

  m.match = function (list, pattern, options) {
    return orig.match(list, pattern, ext(def, options))
  };

  return m
};

Minimatch$1.defaults = function (def) {
  return minimatch$1.defaults(def).Minimatch
};

function minimatch$1 (p, pattern, options) {
  assertValidPattern(pattern);

  if (!options) options = {};

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  return new Minimatch$1(pattern, options).match(p)
}

function Minimatch$1 (pattern, options) {
  if (!(this instanceof Minimatch$1)) {
    return new Minimatch$1(pattern, options)
  }

  assertValidPattern(pattern);

  if (!options) options = {};

  pattern = pattern.trim();

  // windows support: need to use /, not \
  if (!options.allowWindowsEscape && path$2.sep !== '/') {
    pattern = pattern.split(path$2.sep).join('/');
  }

  this.options = options;
  this.set = [];
  this.pattern = pattern;
  this.regexp = null;
  this.negate = false;
  this.comment = false;
  this.empty = false;
  this.partial = !!options.partial;

  // make the set of regexps etc.
  this.make();
}

Minimatch$1.prototype.debug = function () {};

Minimatch$1.prototype.make = make;
function make () {
  var pattern = this.pattern;
  var options = this.options;

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true;
    return
  }
  if (!pattern) {
    this.empty = true;
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate();

  // step 2: expand braces
  var set = this.globSet = this.braceExpand();

  if (options.debug) this.debug = function debug() { console.error.apply(console, arguments); };

  this.debug(this.pattern, set);

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  });

  this.debug(this.pattern, set);

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this);

  this.debug(this.pattern, set);

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  });

  this.debug(this.pattern, set);

  this.set = set;
}

Minimatch$1.prototype.parseNegate = parseNegate;
function parseNegate () {
  var pattern = this.pattern;
  var negate = false;
  var options = this.options;
  var negateOffset = 0;

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate;
    negateOffset++;
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset);
  this.negate = negate;
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch$1.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
};

Minimatch$1.prototype.braceExpand = braceExpand;

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch$1) {
      options = this.options;
    } else {
      options = {};
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern;

  assertValidPattern(pattern);

  // Thanks to Yeting Li <https://github.com/yetingli> for
  // improving this regexp to avoid a ReDOS vulnerability.
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

var MAX_PATTERN_LENGTH = 1024 * 64;
var assertValidPattern = function (pattern) {
  if (typeof pattern !== 'string') {
    throw new TypeError('invalid pattern')
  }

  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError('pattern is too long')
  }
};

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch$1.prototype.parse = parse$4;
var SUBPARSE = {};
function parse$4 (pattern, isSub) {
  assertValidPattern(pattern);

  var options = this.options;

  // shortcuts
  if (pattern === '**') {
    if (!options.noglobstar)
      return GLOBSTAR
    else
      pattern = '*';
  }
  if (pattern === '') return ''

  var re = '';
  var hasMagic = !!options.nocase;
  var escaping = false;
  // ? => one single character
  var patternListStack = [];
  var negativeLists = [];
  var stateChar;
  var inClass = false;
  var reClassStart = -1;
  var classStart = -1;
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)';
  var self = this;

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star;
          hasMagic = true;
        break
        case '?':
          re += qmark;
          hasMagic = true;
        break
        default:
          re += '\\' + stateChar;
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re);
      stateChar = false;
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c);

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c;
      escaping = false;
      continue
    }

    switch (c) {
      /* istanbul ignore next */
      case '/': {
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false
      }

      case '\\':
        clearStateChar();
        escaping = true;
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c);

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class');
          if (c === '!' && i === classStart + 1) c = '^';
          re += c;
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar);
        clearStateChar();
        stateChar = c;
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar();
      continue

      case '(':
        if (inClass) {
          re += '(';
          continue
        }

        if (!stateChar) {
          re += '\\(';
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        });
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:';
        this.debug('plType %j %j', stateChar, re);
        stateChar = false;
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)';
          continue
        }

        clearStateChar();
        hasMagic = true;
        var pl = patternListStack.pop();
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close;
        if (pl.type === '!') {
          negativeLists.push(pl);
        }
        pl.reEnd = re.length;
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|';
          escaping = false;
          continue
        }

        clearStateChar();
        re += '|';
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar();

        if (inClass) {
          re += '\\' + c;
          continue
        }

        inClass = true;
        classStart = i;
        reClassStart = re.length;
        re += c;
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c;
          escaping = false;
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        // split where the last [ was, make sure we don't have
        // an invalid re. if so, re-walk the contents of the
        // would-be class to re-translate any characters that
        // were passed through as-is
        // TODO: It would probably be faster to determine this
        // without a try/catch and a new RegExp, but it's tricky
        // to do safely.  For now, this is safe and works.
        var cs = pattern.substring(classStart + 1, i);
        try {
          RegExp('[' + cs + ']');
        } catch (er) {
          // not a valid class!
          var sp = this.parse(cs, SUBPARSE);
          re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]';
          hasMagic = hasMagic || sp[1];
          inClass = false;
          continue
        }

        // finish up the class.
        hasMagic = true;
        inClass = false;
        re += c;
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar();

        if (escaping) {
          // no need
          escaping = false;
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\';
        }

        re += c;

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1);
    sp = this.parse(cs, SUBPARSE);
    re = re.substr(0, reClassStart) + '\\[' + sp[0];
    hasMagic = hasMagic || sp[1];
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length);
    this.debug('setting tail', re, pl);
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\';
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    });

    this.debug('tail=%j\n   %s', tail, tail, pl, re);
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type;

    hasMagic = true;
    re = re.slice(0, pl.reStart) + t + '\\(' + tail;
  }

  // handle trailing things that only matter at the very end.
  clearStateChar();
  if (escaping) {
    // trailing \\
    re += '\\\\';
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false;
  switch (re.charAt(0)) {
    case '[': case '.': case '(': addPatternStart = true;
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n];

    var nlBefore = re.slice(0, nl.reStart);
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
    var nlAfter = re.slice(nl.reEnd);

    nlLast += nlAfter;

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1;
    var cleanAfter = nlAfter;
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '');
    }
    nlAfter = cleanAfter;

    var dollar = '';
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$';
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
    re = newRe;
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re;
  }

  if (addPatternStart) {
    re = patternStart + re;
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : '';
  try {
    var regExp = new RegExp('^' + re + '$', flags);
  } catch (er) /* istanbul ignore next - should be impossible */ {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern;
  regExp._src = re;

  return regExp
}

minimatch$1.makeRe = function (pattern, options) {
  return new Minimatch$1(pattern, options || {}).makeRe()
};

Minimatch$1.prototype.makeRe = makeRe;
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set;

  if (!set.length) {
    this.regexp = false;
    return this.regexp
  }
  var options = this.options;

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot;
  var flags = options.nocase ? 'i' : '';

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|');

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$';

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$';

  try {
    this.regexp = new RegExp(re, flags);
  } catch (ex) /* istanbul ignore next - should be impossible */ {
    this.regexp = false;
  }
  return this.regexp
}

minimatch$1.match = function (list, pattern, options) {
  options = options || {};
  var mm = new Minimatch$1(pattern, options);
  list = list.filter(function (f) {
    return mm.match(f)
  });
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list
};

Minimatch$1.prototype.match = function match (f, partial) {
  if (typeof partial === 'undefined') partial = this.partial;
  this.debug('match', f, this.pattern);
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options;

  // windows: need to use /, not \
  if (path$2.sep !== '/') {
    f = f.split(path$2.sep).join('/');
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit);
  this.debug(this.pattern, 'split', f);

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set;
  this.debug(this.pattern, 'set', set);

  // Find the basename of the path by looking for the last non-empty segment
  var filename;
  var i;
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i];
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i];
    var file = f;
    if (options.matchBase && pattern.length === 1) {
      file = [filename];
    }
    var hit = this.matchOne(file, pattern, partial);
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
};

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch$1.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options;

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern });

  this.debug('matchOne', file.length, pattern.length);

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop');
    var p = pattern[pi];
    var f = file[fi];

    this.debug(pattern, p, f);

    // should be impossible.
    // some invalid regexp stuff in the set.
    /* istanbul ignore if */
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f]);

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi;
      var pr = pi + 1;
      if (pr === pl) {
        this.debug('** at the end');
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr];

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee);
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr);
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue');
          fr++;
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      /* istanbul ignore if */
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit;
    if (typeof p === 'string') {
      hit = f === p;
      this.debug('string match', p, f, hit);
    } else {
      hit = f.match(p);
      this.debug('pattern match', p, f, hit);
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else /* istanbul ignore else */ if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    return (fi === fl - 1) && (file[fi] === '')
  }

  // should be unreachable.
  /* istanbul ignore next */
  throw new Error('wtf?')
};

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

var inherits_browserExports = {};
var inherits_browser = {
  get exports(){ return inherits_browserExports; },
  set exports(v){ inherits_browserExports = v; },
};

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  inherits_browser.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  inherits_browser.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  };
}

var domain;

// This constructor is used to store event handlers. Instantiating this is
// faster than explicitly calling `Object.create(null)` to get a "clean" empty
// object (tested with v8 v4.9).
function EventHandlers() {}
EventHandlers.prototype = Object.create(null);

function EventEmitter() {
  EventEmitter.init.call(this);
}

// nodejs oddity
// require('events') === require('events').EventEmitter
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.usingDomains = false;

EventEmitter.prototype.domain = undefined;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
  this.domain = null;
  if (EventEmitter.usingDomains) {
    // if there is an active domain, then attach to it.
    if (domain.active ) ;
  }

  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
    this._events = new EventHandlers();
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events, domain;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  domain = this.domain;

  // If there is no 'error' event listener then throw.
  if (doError) {
    er = arguments[1];
    if (domain) {
      if (!er)
        er = new Error('Uncaught, unspecified "error" event');
      er.domainEmitter = this;
      er.domain = domain;
      er.domainThrown = false;
      domain.emit('error', er);
    } else if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
    // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
    // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = new EventHandlers();
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] :
                                          [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + type + ' listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        emitWarning(w);
      }
    }
  }

  return target;
}
function emitWarning(e) {
  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function _onceWrap(target, type, listener) {
  var fired = false;
  function g() {
    target.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(target, arguments);
    }
  }
  g.listener = listener;
  return g;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || (list.listener && list.listener === listener)) {
        if (--this._eventsCount === 0)
          this._events = new EventHandlers();
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (list.length === 1) {
          list[0] = undefined;
          if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
          } else {
            delete events[type];
          }
        } else {
          spliceOne(list, position);
        }

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = new EventHandlers();
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        for (var i = 0, key; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = new EventHandlers();
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        do {
          this.removeListener(type, listeners[listeners.length - 1]);
        } while (listeners[0]);
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount$1.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount$1;
function listenerCount$1(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, i) {
  var copy = new Array(i);
  while (i--)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

var events = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': EventEmitter,
	EventEmitter: EventEmitter
});

var require$$1$1 = /*@__PURE__*/getAugmentedNamespace(events);

function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
var hasOwn = Object.prototype.hasOwnProperty;

var objectKeys$1 = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};
var pSlice = Array.prototype.slice;
var _functionsHaveNames;
function functionsHaveNames() {
  if (typeof _functionsHaveNames !== 'undefined') {
    return _functionsHaveNames;
  }
  return _functionsHaveNames = (function () {
    return function foo() {}.name === 'foo';
  }());
}
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer$1(arrbuf)) {
    return false;
  }
  if (typeof global$1.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

function assert(value, message) {
  if (!value) fail(value, true, message, '==', ok);
}

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!isFunction$1(func)) {
    return;
  }
  if (functionsHaveNames()) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = AssertionError;
function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
}

// assert.AssertionError instanceof Error
inherits$1(AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames() || !isFunction$1(something)) {
    return inspect$1(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);
assert.equal = equal;
function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', equal);
}

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);
assert.notEqual = notEqual;
function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', notEqual);
  }
}

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);
assert.deepEqual = deepEqual;
function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', deepEqual);
  }
}
assert.deepStrictEqual = deepStrictEqual;
function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', deepStrictEqual);
  }
}

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer$1(actual) && isBuffer$1(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (isDate(actual) && isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (isRegExp(actual) && isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer$1(actual) !== isBuffer$1(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments$1(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (isPrimitive(a) || isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments$1(a);
  var bIsArgs = isArguments$1(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys$1(a);
  var kb = objectKeys$1(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);
assert.notDeepEqual = notDeepEqual;
function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', notDeepEqual);
  }
}

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);
assert.strictEqual = strictEqual;
function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', strictEqual);
  }
}

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
assert.notStrictEqual = notStrictEqual;
function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', notStrictEqual);
  }
}

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);
assert.throws = throws;
function throws(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
}

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = doesNotThrow;
function doesNotThrow(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
}

assert.ifError = ifError;
function ifError(err) {
  if (err) throw err;
}

var assert$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': assert,
	AssertionError: AssertionError,
	fail: fail,
	ok: ok,
	assert: ok,
	equal: equal,
	notEqual: notEqual,
	deepEqual: deepEqual,
	deepStrictEqual: deepStrictEqual,
	notDeepEqual: notDeepEqual,
	notDeepStrictEqual: notDeepStrictEqual,
	strictEqual: strictEqual,
	notStrictEqual: notStrictEqual,
	throws: throws,
	doesNotThrow: doesNotThrow,
	ifError: ifError
});

var require$$6 = /*@__PURE__*/getAugmentedNamespace(assert$1);

var pathIsAbsoluteExports = {};
var pathIsAbsolute = {
  get exports(){ return pathIsAbsoluteExports; },
  set exports(v){ pathIsAbsoluteExports = v; },
};

function posix(path) {
	return path.charAt(0) === '/';
}

function win32(path) {
	// https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
	var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
	var result = splitDeviceRe.exec(path);
	var device = result[1] || '';
	var isUnc = Boolean(device && device.charAt(1) !== ':');

	// UNC paths are always absolute
	return Boolean(result[2] || isUnc);
}

pathIsAbsolute.exports = process.platform === 'win32' ? win32 : posix;
pathIsAbsoluteExports.posix = posix;
pathIsAbsoluteExports.win32 = win32;

var common = {};

common.alphasort = alphasort;
common.alphasorti = alphasorti;
common.setopts = setopts;
common.ownProp = ownProp;
common.makeAbs = makeAbs;
common.finish = finish;
common.mark = mark;
common.isIgnored = isIgnored;
common.childrenIgnored = childrenIgnored;

function ownProp (obj, field) {
  return Object.prototype.hasOwnProperty.call(obj, field)
}

var path$1 = require$$7;
var minimatch = minimatch_1;
var isAbsolute = pathIsAbsoluteExports;
var Minimatch = minimatch.Minimatch;

function alphasorti (a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase())
}

function alphasort (a, b) {
  return a.localeCompare(b)
}

function setupIgnores (self, options) {
  self.ignore = options.ignore || [];

  if (!Array.isArray(self.ignore))
    self.ignore = [self.ignore];

  if (self.ignore.length) {
    self.ignore = self.ignore.map(ignoreMap);
  }
}

// ignore patterns are always in dot:true mode.
function ignoreMap (pattern) {
  var gmatcher = null;
  if (pattern.slice(-3) === '/**') {
    var gpattern = pattern.replace(/(\/\*\*)+$/, '');
    gmatcher = new Minimatch(gpattern, { dot: true });
  }

  return {
    matcher: new Minimatch(pattern, { dot: true }),
    gmatcher: gmatcher
  }
}

function setopts (self, pattern, options) {
  if (!options)
    options = {};

  // base-matching: just use globstar for that.
  if (options.matchBase && -1 === pattern.indexOf("/")) {
    if (options.noglobstar) {
      throw new Error("base matching requires globstar")
    }
    pattern = "**/" + pattern;
  }

  self.silent = !!options.silent;
  self.pattern = pattern;
  self.strict = options.strict !== false;
  self.realpath = !!options.realpath;
  self.realpathCache = options.realpathCache || Object.create(null);
  self.follow = !!options.follow;
  self.dot = !!options.dot;
  self.mark = !!options.mark;
  self.nodir = !!options.nodir;
  if (self.nodir)
    self.mark = true;
  self.sync = !!options.sync;
  self.nounique = !!options.nounique;
  self.nonull = !!options.nonull;
  self.nosort = !!options.nosort;
  self.nocase = !!options.nocase;
  self.stat = !!options.stat;
  self.noprocess = !!options.noprocess;

  self.maxLength = options.maxLength || Infinity;
  self.cache = options.cache || Object.create(null);
  self.statCache = options.statCache || Object.create(null);
  self.symlinks = options.symlinks || Object.create(null);

  setupIgnores(self, options);

  self.changedCwd = false;
  var cwd = process.cwd();
  if (!ownProp(options, "cwd"))
    self.cwd = cwd;
  else {
    self.cwd = path$1.resolve(options.cwd);
    self.changedCwd = self.cwd !== cwd;
  }

  self.root = options.root || path$1.resolve(self.cwd, "/");
  self.root = path$1.resolve(self.root);
  if (process.platform === "win32")
    self.root = self.root.replace(/\\/g, "/");

  self.cwdAbs = makeAbs(self, self.cwd);
  self.nomount = !!options.nomount;

  // disable comments and negation in Minimatch.
  // Note that they are not supported in Glob itself anyway.
  options.nonegate = true;
  options.nocomment = true;

  self.minimatch = new Minimatch(pattern, options);
  self.options = self.minimatch.options;
}

function finish (self) {
  var nou = self.nounique;
  var all = nou ? [] : Object.create(null);

  for (var i = 0, l = self.matches.length; i < l; i ++) {
    var matches = self.matches[i];
    if (!matches || Object.keys(matches).length === 0) {
      if (self.nonull) {
        // do like the shell, and spit out the literal glob
        var literal = self.minimatch.globSet[i];
        if (nou)
          all.push(literal);
        else
          all[literal] = true;
      }
    } else {
      // had matches
      var m = Object.keys(matches);
      if (nou)
        all.push.apply(all, m);
      else
        m.forEach(function (m) {
          all[m] = true;
        });
    }
  }

  if (!nou)
    all = Object.keys(all);

  if (!self.nosort)
    all = all.sort(self.nocase ? alphasorti : alphasort);

  // at *some* point we statted all of these
  if (self.mark) {
    for (var i = 0; i < all.length; i++) {
      all[i] = self._mark(all[i]);
    }
    if (self.nodir) {
      all = all.filter(function (e) {
        var notDir = !(/\/$/.test(e));
        var c = self.cache[e] || self.cache[makeAbs(self, e)];
        if (notDir && c)
          notDir = c !== 'DIR' && !Array.isArray(c);
        return notDir
      });
    }
  }

  if (self.ignore.length)
    all = all.filter(function(m) {
      return !isIgnored(self, m)
    });

  self.found = all;
}

function mark (self, p) {
  var abs = makeAbs(self, p);
  var c = self.cache[abs];
  var m = p;
  if (c) {
    var isDir = c === 'DIR' || Array.isArray(c);
    var slash = p.slice(-1) === '/';

    if (isDir && !slash)
      m += '/';
    else if (!isDir && slash)
      m = m.slice(0, -1);

    if (m !== p) {
      var mabs = makeAbs(self, m);
      self.statCache[mabs] = self.statCache[abs];
      self.cache[mabs] = self.cache[abs];
    }
  }

  return m
}

// lotta situps...
function makeAbs (self, f) {
  var abs = f;
  if (f.charAt(0) === '/') {
    abs = path$1.join(self.root, f);
  } else if (isAbsolute(f) || f === '') {
    abs = f;
  } else if (self.changedCwd) {
    abs = path$1.resolve(self.cwd, f);
  } else {
    abs = path$1.resolve(f);
  }

  if (process.platform === 'win32')
    abs = abs.replace(/\\/g, '/');

  return abs
}


// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
function isIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
  })
}

function childrenIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return !!(item.gmatcher && item.gmatcher.match(path))
  })
}

var sync;
var hasRequiredSync;

function requireSync () {
	if (hasRequiredSync) return sync;
	hasRequiredSync = 1;
	sync = globSync;
	globSync.GlobSync = GlobSync;

	var fs = require$$0$1;
	var rp = fs_realpath;
	var minimatch = minimatch_1;
	minimatch.Minimatch;
	requireGlob().Glob;
	var path = require$$7;
	var assert = require$$6;
	var isAbsolute = pathIsAbsoluteExports;
	var common$1 = common;
	common$1.alphasort;
	common$1.alphasorti;
	var setopts = common$1.setopts;
	var ownProp = common$1.ownProp;
	var childrenIgnored = common$1.childrenIgnored;

	function globSync (pattern, options) {
	  if (typeof options === 'function' || arguments.length === 3)
	    throw new TypeError('callback provided to sync glob\n'+
	                        'See: https://github.com/isaacs/node-glob/issues/167')

	  return new GlobSync(pattern, options).found
	}

	function GlobSync (pattern, options) {
	  if (!pattern)
	    throw new Error('must provide pattern')

	  if (typeof options === 'function' || arguments.length === 3)
	    throw new TypeError('callback provided to sync glob\n'+
	                        'See: https://github.com/isaacs/node-glob/issues/167')

	  if (!(this instanceof GlobSync))
	    return new GlobSync(pattern, options)

	  setopts(this, pattern, options);

	  if (this.noprocess)
	    return this

	  var n = this.minimatch.set.length;
	  this.matches = new Array(n);
	  for (var i = 0; i < n; i ++) {
	    this._process(this.minimatch.set[i], i, false);
	  }
	  this._finish();
	}

	GlobSync.prototype._finish = function () {
	  assert(this instanceof GlobSync);
	  if (this.realpath) {
	    var self = this;
	    this.matches.forEach(function (matchset, index) {
	      var set = self.matches[index] = Object.create(null);
	      for (var p in matchset) {
	        try {
	          p = self._makeAbs(p);
	          var real = rp.realpathSync(p, self.realpathCache);
	          set[real] = true;
	        } catch (er) {
	          if (er.syscall === 'stat')
	            set[self._makeAbs(p)] = true;
	          else
	            throw er
	        }
	      }
	    });
	  }
	  common$1.finish(this);
	};


	GlobSync.prototype._process = function (pattern, index, inGlobStar) {
	  assert(this instanceof GlobSync);

	  // Get the first [n] parts of pattern that are all strings.
	  var n = 0;
	  while (typeof pattern[n] === 'string') {
	    n ++;
	  }
	  // now n is the index of the first one that is *not* a string.

	  // See if there's anything else
	  var prefix;
	  switch (n) {
	    // if not, then this is rather simple
	    case pattern.length:
	      this._processSimple(pattern.join('/'), index);
	      return

	    case 0:
	      // pattern *starts* with some non-trivial item.
	      // going to readdir(cwd), but not include the prefix in matches.
	      prefix = null;
	      break

	    default:
	      // pattern has some string bits in the front.
	      // whatever it starts with, whether that's 'absolute' like /foo/bar,
	      // or 'relative' like '../baz'
	      prefix = pattern.slice(0, n).join('/');
	      break
	  }

	  var remain = pattern.slice(n);

	  // get the list of entries.
	  var read;
	  if (prefix === null)
	    read = '.';
	  else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
	    if (!prefix || !isAbsolute(prefix))
	      prefix = '/' + prefix;
	    read = prefix;
	  } else
	    read = prefix;

	  var abs = this._makeAbs(read);

	  //if ignored, skip processing
	  if (childrenIgnored(this, read))
	    return

	  var isGlobStar = remain[0] === minimatch.GLOBSTAR;
	  if (isGlobStar)
	    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar);
	  else
	    this._processReaddir(prefix, read, abs, remain, index, inGlobStar);
	};


	GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
	  var entries = this._readdir(abs, inGlobStar);

	  // if the abs isn't a dir, then nothing can match!
	  if (!entries)
	    return

	  // It will only match dot entries if it starts with a dot, or if
	  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
	  var pn = remain[0];
	  var negate = !!this.minimatch.negate;
	  var rawGlob = pn._glob;
	  var dotOk = this.dot || rawGlob.charAt(0) === '.';

	  var matchedEntries = [];
	  for (var i = 0; i < entries.length; i++) {
	    var e = entries[i];
	    if (e.charAt(0) !== '.' || dotOk) {
	      var m;
	      if (negate && !prefix) {
	        m = !e.match(pn);
	      } else {
	        m = e.match(pn);
	      }
	      if (m)
	        matchedEntries.push(e);
	    }
	  }

	  var len = matchedEntries.length;
	  // If there are no matched entries, then nothing matches.
	  if (len === 0)
	    return

	  // if this is the last remaining pattern bit, then no need for
	  // an additional stat *unless* the user has specified mark or
	  // stat explicitly.  We know they exist, since readdir returned
	  // them.

	  if (remain.length === 1 && !this.mark && !this.stat) {
	    if (!this.matches[index])
	      this.matches[index] = Object.create(null);

	    for (var i = 0; i < len; i ++) {
	      var e = matchedEntries[i];
	      if (prefix) {
	        if (prefix.slice(-1) !== '/')
	          e = prefix + '/' + e;
	        else
	          e = prefix + e;
	      }

	      if (e.charAt(0) === '/' && !this.nomount) {
	        e = path.join(this.root, e);
	      }
	      this.matches[index][e] = true;
	    }
	    // This was the last one, and no stats were needed
	    return
	  }

	  // now test all matched entries as stand-ins for that part
	  // of the pattern.
	  remain.shift();
	  for (var i = 0; i < len; i ++) {
	    var e = matchedEntries[i];
	    var newPattern;
	    if (prefix)
	      newPattern = [prefix, e];
	    else
	      newPattern = [e];
	    this._process(newPattern.concat(remain), index, inGlobStar);
	  }
	};


	GlobSync.prototype._emitMatch = function (index, e) {
	  this._makeAbs(e);
	  if (this.mark)
	    e = this._mark(e);

	  if (this.matches[index][e])
	    return

	  if (this.nodir) {
	    var c = this.cache[this._makeAbs(e)];
	    if (c === 'DIR' || Array.isArray(c))
	      return
	  }

	  this.matches[index][e] = true;
	  if (this.stat)
	    this._stat(e);
	};


	GlobSync.prototype._readdirInGlobStar = function (abs) {
	  // follow all symlinked directories forever
	  // just proceed as if this is a non-globstar situation
	  if (this.follow)
	    return this._readdir(abs, false)

	  var entries;
	  var lstat;
	  try {
	    lstat = fs.lstatSync(abs);
	  } catch (er) {
	    // lstat failed, doesn't exist
	    return null
	  }

	  var isSym = lstat.isSymbolicLink();
	  this.symlinks[abs] = isSym;

	  // If it's not a symlink or a dir, then it's definitely a regular file.
	  // don't bother doing a readdir in that case.
	  if (!isSym && !lstat.isDirectory())
	    this.cache[abs] = 'FILE';
	  else
	    entries = this._readdir(abs, false);

	  return entries
	};

	GlobSync.prototype._readdir = function (abs, inGlobStar) {

	  if (inGlobStar && !ownProp(this.symlinks, abs))
	    return this._readdirInGlobStar(abs)

	  if (ownProp(this.cache, abs)) {
	    var c = this.cache[abs];
	    if (!c || c === 'FILE')
	      return null

	    if (Array.isArray(c))
	      return c
	  }

	  try {
	    return this._readdirEntries(abs, fs.readdirSync(abs))
	  } catch (er) {
	    this._readdirError(abs, er);
	    return null
	  }
	};

	GlobSync.prototype._readdirEntries = function (abs, entries) {
	  // if we haven't asked to stat everything, then just
	  // assume that everything in there exists, so we can avoid
	  // having to stat it a second time.
	  if (!this.mark && !this.stat) {
	    for (var i = 0; i < entries.length; i ++) {
	      var e = entries[i];
	      if (abs === '/')
	        e = abs + e;
	      else
	        e = abs + '/' + e;
	      this.cache[e] = true;
	    }
	  }

	  this.cache[abs] = entries;

	  // mark and cache dir-ness
	  return entries
	};

	GlobSync.prototype._readdirError = function (f, er) {
	  // handle errors, and cache the information
	  switch (er.code) {
	    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
	    case 'ENOTDIR': // totally normal. means it *does* exist.
	      var abs = this._makeAbs(f);
	      this.cache[abs] = 'FILE';
	      if (abs === this.cwdAbs) {
	        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
	        error.path = this.cwd;
	        error.code = er.code;
	        throw error
	      }
	      break

	    case 'ENOENT': // not terribly unusual
	    case 'ELOOP':
	    case 'ENAMETOOLONG':
	    case 'UNKNOWN':
	      this.cache[this._makeAbs(f)] = false;
	      break

	    default: // some unusual error.  Treat as failure.
	      this.cache[this._makeAbs(f)] = false;
	      if (this.strict)
	        throw er
	      if (!this.silent)
	        console.error('glob error', er);
	      break
	  }
	};

	GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {

	  var entries = this._readdir(abs, inGlobStar);

	  // no entries means not a dir, so it can never have matches
	  // foo.txt/** doesn't match foo.txt
	  if (!entries)
	    return

	  // test without the globstar, and with every child both below
	  // and replacing the globstar.
	  var remainWithoutGlobStar = remain.slice(1);
	  var gspref = prefix ? [ prefix ] : [];
	  var noGlobStar = gspref.concat(remainWithoutGlobStar);

	  // the noGlobStar pattern exits the inGlobStar state
	  this._process(noGlobStar, index, false);

	  var len = entries.length;
	  var isSym = this.symlinks[abs];

	  // If it's a symlink, and we're in a globstar, then stop
	  if (isSym && inGlobStar)
	    return

	  for (var i = 0; i < len; i++) {
	    var e = entries[i];
	    if (e.charAt(0) === '.' && !this.dot)
	      continue

	    // these two cases enter the inGlobStar state
	    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
	    this._process(instead, index, true);

	    var below = gspref.concat(entries[i], remain);
	    this._process(below, index, true);
	  }
	};

	GlobSync.prototype._processSimple = function (prefix, index) {
	  // XXX review this.  Shouldn't it be doing the mounting etc
	  // before doing stat?  kinda weird?
	  var exists = this._stat(prefix);

	  if (!this.matches[index])
	    this.matches[index] = Object.create(null);

	  // If it doesn't exist, then just mark the lack of results
	  if (!exists)
	    return

	  if (prefix && isAbsolute(prefix) && !this.nomount) {
	    var trail = /[\/\\]$/.test(prefix);
	    if (prefix.charAt(0) === '/') {
	      prefix = path.join(this.root, prefix);
	    } else {
	      prefix = path.resolve(this.root, prefix);
	      if (trail)
	        prefix += '/';
	    }
	  }

	  if (process.platform === 'win32')
	    prefix = prefix.replace(/\\/g, '/');

	  // Mark this as a match
	  this.matches[index][prefix] = true;
	};

	// Returns either 'DIR', 'FILE', or false
	GlobSync.prototype._stat = function (f) {
	  var abs = this._makeAbs(f);
	  var needDir = f.slice(-1) === '/';

	  if (f.length > this.maxLength)
	    return false

	  if (!this.stat && ownProp(this.cache, abs)) {
	    var c = this.cache[abs];

	    if (Array.isArray(c))
	      c = 'DIR';

	    // It exists, but maybe not how we need it
	    if (!needDir || c === 'DIR')
	      return c

	    if (needDir && c === 'FILE')
	      return false

	    // otherwise we have to stat, because maybe c=true
	    // if we know it exists, but not what it is.
	  }
	  var stat = this.statCache[abs];
	  if (!stat) {
	    var lstat;
	    try {
	      lstat = fs.lstatSync(abs);
	    } catch (er) {
	      return false
	    }

	    if (lstat.isSymbolicLink()) {
	      try {
	        stat = fs.statSync(abs);
	      } catch (er) {
	        stat = lstat;
	      }
	    } else {
	      stat = lstat;
	    }
	  }

	  this.statCache[abs] = stat;

	  var c = stat.isDirectory() ? 'DIR' : 'FILE';
	  this.cache[abs] = this.cache[abs] || c;

	  if (needDir && c !== 'DIR')
	    return false

	  return c
	};

	GlobSync.prototype._mark = function (p) {
	  return common$1.mark(this, p)
	};

	GlobSync.prototype._makeAbs = function (f) {
	  return common$1.makeAbs(this, f)
	};
	return sync;
}

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
var wrappy_1 = wrappy$2;
function wrappy$2 (fn, cb) {
  if (fn && cb) return wrappy$2(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k];
  });

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    var ret = fn.apply(this, args);
    var cb = args[args.length-1];
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k];
      });
    }
    return ret
  }
}

var onceExports = {};
var once$2 = {
  get exports(){ return onceExports; },
  set exports(v){ onceExports = v; },
};

var wrappy$1 = wrappy_1;
once$2.exports = wrappy$1(once$1);
onceExports.strict = wrappy$1(onceStrict);

once$1.proto = once$1(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once$1(this)
    },
    configurable: true
  });

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  });
});

function once$1 (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  f.called = false;
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  var name = fn.name || 'Function wrapped with `once`';
  f.onceError = name + " shouldn't be called more than once";
  f.called = false;
  return f
}

var wrappy = wrappy_1;
var reqs = Object.create(null);
var once = onceExports;

var inflight_1 = wrappy(inflight);

function inflight (key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb);
    return null
  } else {
    reqs[key] = [cb];
    return makeres(key)
  }
}

function makeres (key) {
  return once(function RES () {
    var cbs = reqs[key];
    var len = cbs.length;
    var args = slice$1(arguments);

    // XXX It's somewhat ambiguous whether a new callback added in this
    // pass should be queued for later execution if something in the
    // list of callbacks throws, or if it should just be discarded.
    // However, it's such an edge case that it hardly matters, and either
    // choice is likely as surprising as the other.
    // As it happens, we do go ahead and schedule it for later execution.
    try {
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args);
      }
    } finally {
      if (cbs.length > len) {
        // added more in the interim.
        // de-zalgo, just in case, but don't call again.
        cbs.splice(0, len);
        process.nextTick(function () {
          RES.apply(null, args);
        });
      } else {
        delete reqs[key];
      }
    }
  })
}

function slice$1 (args) {
  var length = args.length;
  var array = [];

  for (var i = 0; i < length; i++) array[i] = args[i];
  return array
}

var glob_1;
var hasRequiredGlob;

function requireGlob () {
	if (hasRequiredGlob) return glob_1;
	hasRequiredGlob = 1;
	// Approach:
	//
	// 1. Get the minimatch set
	// 2. For each pattern in the set, PROCESS(pattern, false)
	// 3. Store matches per-set, then uniq them
	//
	// PROCESS(pattern, inGlobStar)
	// Get the first [n] items from pattern that are all strings
	// Join these together.  This is PREFIX.
	//   If there is no more remaining, then stat(PREFIX) and
	//   add to matches if it succeeds.  END.
	//
	// If inGlobStar and PREFIX is symlink and points to dir
	//   set ENTRIES = []
	// else readdir(PREFIX) as ENTRIES
	//   If fail, END
	//
	// with ENTRIES
	//   If pattern[n] is GLOBSTAR
	//     // handle the case where the globstar match is empty
	//     // by pruning it out, and testing the resulting pattern
	//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
	//     // handle other cases.
	//     for ENTRY in ENTRIES (not dotfiles)
	//       // attach globstar + tail onto the entry
	//       // Mark that this entry is a globstar match
	//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
	//
	//   else // not globstar
	//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
	//       Test ENTRY against pattern[n]
	//       If fails, continue
	//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
	//
	// Caveat:
	//   Cache all stats and readdirs results to minimize syscall.  Since all
	//   we ever care about is existence and directory-ness, we can just keep
	//   `true` for files, and [children,...] for directories, or `false` for
	//   things that don't exist.

	glob_1 = glob;

	var fs = require$$0$1;
	var rp = fs_realpath;
	var minimatch = minimatch_1;
	minimatch.Minimatch;
	var inherits = inherits_browserExports;
	var EE = require$$1$1.EventEmitter;
	var path = require$$7;
	var assert = require$$6;
	var isAbsolute = pathIsAbsoluteExports;
	var globSync = requireSync();
	var common$1 = common;
	common$1.alphasort;
	common$1.alphasorti;
	var setopts = common$1.setopts;
	var ownProp = common$1.ownProp;
	var inflight = inflight_1;
	var childrenIgnored = common$1.childrenIgnored;
	var isIgnored = common$1.isIgnored;

	var once = onceExports;

	function glob (pattern, options, cb) {
	  if (typeof options === 'function') cb = options, options = {};
	  if (!options) options = {};

	  if (options.sync) {
	    if (cb)
	      throw new TypeError('callback provided to sync glob')
	    return globSync(pattern, options)
	  }

	  return new Glob(pattern, options, cb)
	}

	glob.sync = globSync;
	var GlobSync = glob.GlobSync = globSync.GlobSync;

	// old api surface
	glob.glob = glob;

	function extend (origin, add) {
	  if (add === null || typeof add !== 'object') {
	    return origin
	  }

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin
	}

	glob.hasMagic = function (pattern, options_) {
	  var options = extend({}, options_);
	  options.noprocess = true;

	  var g = new Glob(pattern, options);
	  var set = g.minimatch.set;

	  if (!pattern)
	    return false

	  if (set.length > 1)
	    return true

	  for (var j = 0; j < set[0].length; j++) {
	    if (typeof set[0][j] !== 'string')
	      return true
	  }

	  return false
	};

	glob.Glob = Glob;
	inherits(Glob, EE);
	function Glob (pattern, options, cb) {
	  if (typeof options === 'function') {
	    cb = options;
	    options = null;
	  }

	  if (options && options.sync) {
	    if (cb)
	      throw new TypeError('callback provided to sync glob')
	    return new GlobSync(pattern, options)
	  }

	  if (!(this instanceof Glob))
	    return new Glob(pattern, options, cb)

	  setopts(this, pattern, options);
	  this._didRealPath = false;

	  // process each pattern in the minimatch set
	  var n = this.minimatch.set.length;

	  // The matches are stored as {<filename>: true,...} so that
	  // duplicates are automagically pruned.
	  // Later, we do an Object.keys() on these.
	  // Keep them as a list so we can fill in when nonull is set.
	  this.matches = new Array(n);

	  if (typeof cb === 'function') {
	    cb = once(cb);
	    this.on('error', cb);
	    this.on('end', function (matches) {
	      cb(null, matches);
	    });
	  }

	  var self = this;
	  var n = this.minimatch.set.length;
	  this._processing = 0;
	  this.matches = new Array(n);

	  this._emitQueue = [];
	  this._processQueue = [];
	  this.paused = false;

	  if (this.noprocess)
	    return this

	  if (n === 0)
	    return done()

	  var sync = true;
	  for (var i = 0; i < n; i ++) {
	    this._process(this.minimatch.set[i], i, false, done);
	  }
	  sync = false;

	  function done () {
	    --self._processing;
	    if (self._processing <= 0) {
	      if (sync) {
	        process.nextTick(function () {
	          self._finish();
	        });
	      } else {
	        self._finish();
	      }
	    }
	  }
	}

	Glob.prototype._finish = function () {
	  assert(this instanceof Glob);
	  if (this.aborted)
	    return

	  if (this.realpath && !this._didRealpath)
	    return this._realpath()

	  common$1.finish(this);
	  this.emit('end', this.found);
	};

	Glob.prototype._realpath = function () {
	  if (this._didRealpath)
	    return

	  this._didRealpath = true;

	  var n = this.matches.length;
	  if (n === 0)
	    return this._finish()

	  var self = this;
	  for (var i = 0; i < this.matches.length; i++)
	    this._realpathSet(i, next);

	  function next () {
	    if (--n === 0)
	      self._finish();
	  }
	};

	Glob.prototype._realpathSet = function (index, cb) {
	  var matchset = this.matches[index];
	  if (!matchset)
	    return cb()

	  var found = Object.keys(matchset);
	  var self = this;
	  var n = found.length;

	  if (n === 0)
	    return cb()

	  var set = this.matches[index] = Object.create(null);
	  found.forEach(function (p, i) {
	    // If there's a problem with the stat, then it means that
	    // one or more of the links in the realpath couldn't be
	    // resolved.  just return the abs value in that case.
	    p = self._makeAbs(p);
	    rp.realpath(p, self.realpathCache, function (er, real) {
	      if (!er)
	        set[real] = true;
	      else if (er.syscall === 'stat')
	        set[p] = true;
	      else
	        self.emit('error', er); // srsly wtf right here

	      if (--n === 0) {
	        self.matches[index] = set;
	        cb();
	      }
	    });
	  });
	};

	Glob.prototype._mark = function (p) {
	  return common$1.mark(this, p)
	};

	Glob.prototype._makeAbs = function (f) {
	  return common$1.makeAbs(this, f)
	};

	Glob.prototype.abort = function () {
	  this.aborted = true;
	  this.emit('abort');
	};

	Glob.prototype.pause = function () {
	  if (!this.paused) {
	    this.paused = true;
	    this.emit('pause');
	  }
	};

	Glob.prototype.resume = function () {
	  if (this.paused) {
	    this.emit('resume');
	    this.paused = false;
	    if (this._emitQueue.length) {
	      var eq = this._emitQueue.slice(0);
	      this._emitQueue.length = 0;
	      for (var i = 0; i < eq.length; i ++) {
	        var e = eq[i];
	        this._emitMatch(e[0], e[1]);
	      }
	    }
	    if (this._processQueue.length) {
	      var pq = this._processQueue.slice(0);
	      this._processQueue.length = 0;
	      for (var i = 0; i < pq.length; i ++) {
	        var p = pq[i];
	        this._processing--;
	        this._process(p[0], p[1], p[2], p[3]);
	      }
	    }
	  }
	};

	Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
	  assert(this instanceof Glob);
	  assert(typeof cb === 'function');

	  if (this.aborted)
	    return

	  this._processing++;
	  if (this.paused) {
	    this._processQueue.push([pattern, index, inGlobStar, cb]);
	    return
	  }

	  //console.error('PROCESS %d', this._processing, pattern)

	  // Get the first [n] parts of pattern that are all strings.
	  var n = 0;
	  while (typeof pattern[n] === 'string') {
	    n ++;
	  }
	  // now n is the index of the first one that is *not* a string.

	  // see if there's anything else
	  var prefix;
	  switch (n) {
	    // if not, then this is rather simple
	    case pattern.length:
	      this._processSimple(pattern.join('/'), index, cb);
	      return

	    case 0:
	      // pattern *starts* with some non-trivial item.
	      // going to readdir(cwd), but not include the prefix in matches.
	      prefix = null;
	      break

	    default:
	      // pattern has some string bits in the front.
	      // whatever it starts with, whether that's 'absolute' like /foo/bar,
	      // or 'relative' like '../baz'
	      prefix = pattern.slice(0, n).join('/');
	      break
	  }

	  var remain = pattern.slice(n);

	  // get the list of entries.
	  var read;
	  if (prefix === null)
	    read = '.';
	  else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
	    if (!prefix || !isAbsolute(prefix))
	      prefix = '/' + prefix;
	    read = prefix;
	  } else
	    read = prefix;

	  var abs = this._makeAbs(read);

	  //if ignored, skip _processing
	  if (childrenIgnored(this, read))
	    return cb()

	  var isGlobStar = remain[0] === minimatch.GLOBSTAR;
	  if (isGlobStar)
	    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb);
	  else
	    this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb);
	};

	Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
	  var self = this;
	  this._readdir(abs, inGlobStar, function (er, entries) {
	    return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
	  });
	};

	Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {

	  // if the abs isn't a dir, then nothing can match!
	  if (!entries)
	    return cb()

	  // It will only match dot entries if it starts with a dot, or if
	  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
	  var pn = remain[0];
	  var negate = !!this.minimatch.negate;
	  var rawGlob = pn._glob;
	  var dotOk = this.dot || rawGlob.charAt(0) === '.';

	  var matchedEntries = [];
	  for (var i = 0; i < entries.length; i++) {
	    var e = entries[i];
	    if (e.charAt(0) !== '.' || dotOk) {
	      var m;
	      if (negate && !prefix) {
	        m = !e.match(pn);
	      } else {
	        m = e.match(pn);
	      }
	      if (m)
	        matchedEntries.push(e);
	    }
	  }

	  //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

	  var len = matchedEntries.length;
	  // If there are no matched entries, then nothing matches.
	  if (len === 0)
	    return cb()

	  // if this is the last remaining pattern bit, then no need for
	  // an additional stat *unless* the user has specified mark or
	  // stat explicitly.  We know they exist, since readdir returned
	  // them.

	  if (remain.length === 1 && !this.mark && !this.stat) {
	    if (!this.matches[index])
	      this.matches[index] = Object.create(null);

	    for (var i = 0; i < len; i ++) {
	      var e = matchedEntries[i];
	      if (prefix) {
	        if (prefix !== '/')
	          e = prefix + '/' + e;
	        else
	          e = prefix + e;
	      }

	      if (e.charAt(0) === '/' && !this.nomount) {
	        e = path.join(this.root, e);
	      }
	      this._emitMatch(index, e);
	    }
	    // This was the last one, and no stats were needed
	    return cb()
	  }

	  // now test all matched entries as stand-ins for that part
	  // of the pattern.
	  remain.shift();
	  for (var i = 0; i < len; i ++) {
	    var e = matchedEntries[i];
	    if (prefix) {
	      if (prefix !== '/')
	        e = prefix + '/' + e;
	      else
	        e = prefix + e;
	    }
	    this._process([e].concat(remain), index, inGlobStar, cb);
	  }
	  cb();
	};

	Glob.prototype._emitMatch = function (index, e) {
	  if (this.aborted)
	    return

	  if (this.matches[index][e])
	    return

	  if (isIgnored(this, e))
	    return

	  if (this.paused) {
	    this._emitQueue.push([index, e]);
	    return
	  }

	  var abs = this._makeAbs(e);

	  if (this.nodir) {
	    var c = this.cache[abs];
	    if (c === 'DIR' || Array.isArray(c))
	      return
	  }

	  if (this.mark)
	    e = this._mark(e);

	  this.matches[index][e] = true;

	  var st = this.statCache[abs];
	  if (st)
	    this.emit('stat', e, st);

	  this.emit('match', e);
	};

	Glob.prototype._readdirInGlobStar = function (abs, cb) {
	  if (this.aborted)
	    return

	  // follow all symlinked directories forever
	  // just proceed as if this is a non-globstar situation
	  if (this.follow)
	    return this._readdir(abs, false, cb)

	  var lstatkey = 'lstat\0' + abs;
	  var self = this;
	  var lstatcb = inflight(lstatkey, lstatcb_);

	  if (lstatcb)
	    fs.lstat(abs, lstatcb);

	  function lstatcb_ (er, lstat) {
	    if (er)
	      return cb()

	    var isSym = lstat.isSymbolicLink();
	    self.symlinks[abs] = isSym;

	    // If it's not a symlink or a dir, then it's definitely a regular file.
	    // don't bother doing a readdir in that case.
	    if (!isSym && !lstat.isDirectory()) {
	      self.cache[abs] = 'FILE';
	      cb();
	    } else
	      self._readdir(abs, false, cb);
	  }
	};

	Glob.prototype._readdir = function (abs, inGlobStar, cb) {
	  if (this.aborted)
	    return

	  cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb);
	  if (!cb)
	    return

	  //console.error('RD %j %j', +inGlobStar, abs)
	  if (inGlobStar && !ownProp(this.symlinks, abs))
	    return this._readdirInGlobStar(abs, cb)

	  if (ownProp(this.cache, abs)) {
	    var c = this.cache[abs];
	    if (!c || c === 'FILE')
	      return cb()

	    if (Array.isArray(c))
	      return cb(null, c)
	  }
	  fs.readdir(abs, readdirCb(this, abs, cb));
	};

	function readdirCb (self, abs, cb) {
	  return function (er, entries) {
	    if (er)
	      self._readdirError(abs, er, cb);
	    else
	      self._readdirEntries(abs, entries, cb);
	  }
	}

	Glob.prototype._readdirEntries = function (abs, entries, cb) {
	  if (this.aborted)
	    return

	  // if we haven't asked to stat everything, then just
	  // assume that everything in there exists, so we can avoid
	  // having to stat it a second time.
	  if (!this.mark && !this.stat) {
	    for (var i = 0; i < entries.length; i ++) {
	      var e = entries[i];
	      if (abs === '/')
	        e = abs + e;
	      else
	        e = abs + '/' + e;
	      this.cache[e] = true;
	    }
	  }

	  this.cache[abs] = entries;
	  return cb(null, entries)
	};

	Glob.prototype._readdirError = function (f, er, cb) {
	  if (this.aborted)
	    return

	  // handle errors, and cache the information
	  switch (er.code) {
	    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
	    case 'ENOTDIR': // totally normal. means it *does* exist.
	      var abs = this._makeAbs(f);
	      this.cache[abs] = 'FILE';
	      if (abs === this.cwdAbs) {
	        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
	        error.path = this.cwd;
	        error.code = er.code;
	        this.emit('error', error);
	        this.abort();
	      }
	      break

	    case 'ENOENT': // not terribly unusual
	    case 'ELOOP':
	    case 'ENAMETOOLONG':
	    case 'UNKNOWN':
	      this.cache[this._makeAbs(f)] = false;
	      break

	    default: // some unusual error.  Treat as failure.
	      this.cache[this._makeAbs(f)] = false;
	      if (this.strict) {
	        this.emit('error', er);
	        // If the error is handled, then we abort
	        // if not, we threw out of here
	        this.abort();
	      }
	      if (!this.silent)
	        console.error('glob error', er);
	      break
	  }

	  return cb()
	};

	Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
	  var self = this;
	  this._readdir(abs, inGlobStar, function (er, entries) {
	    self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
	  });
	};


	Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
	  //console.error('pgs2', prefix, remain[0], entries)

	  // no entries means not a dir, so it can never have matches
	  // foo.txt/** doesn't match foo.txt
	  if (!entries)
	    return cb()

	  // test without the globstar, and with every child both below
	  // and replacing the globstar.
	  var remainWithoutGlobStar = remain.slice(1);
	  var gspref = prefix ? [ prefix ] : [];
	  var noGlobStar = gspref.concat(remainWithoutGlobStar);

	  // the noGlobStar pattern exits the inGlobStar state
	  this._process(noGlobStar, index, false, cb);

	  var isSym = this.symlinks[abs];
	  var len = entries.length;

	  // If it's a symlink, and we're in a globstar, then stop
	  if (isSym && inGlobStar)
	    return cb()

	  for (var i = 0; i < len; i++) {
	    var e = entries[i];
	    if (e.charAt(0) === '.' && !this.dot)
	      continue

	    // these two cases enter the inGlobStar state
	    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
	    this._process(instead, index, true, cb);

	    var below = gspref.concat(entries[i], remain);
	    this._process(below, index, true, cb);
	  }

	  cb();
	};

	Glob.prototype._processSimple = function (prefix, index, cb) {
	  // XXX review this.  Shouldn't it be doing the mounting etc
	  // before doing stat?  kinda weird?
	  var self = this;
	  this._stat(prefix, function (er, exists) {
	    self._processSimple2(prefix, index, er, exists, cb);
	  });
	};
	Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {

	  //console.error('ps2', prefix, exists)

	  if (!this.matches[index])
	    this.matches[index] = Object.create(null);

	  // If it doesn't exist, then just mark the lack of results
	  if (!exists)
	    return cb()

	  if (prefix && isAbsolute(prefix) && !this.nomount) {
	    var trail = /[\/\\]$/.test(prefix);
	    if (prefix.charAt(0) === '/') {
	      prefix = path.join(this.root, prefix);
	    } else {
	      prefix = path.resolve(this.root, prefix);
	      if (trail)
	        prefix += '/';
	    }
	  }

	  if (process.platform === 'win32')
	    prefix = prefix.replace(/\\/g, '/');

	  // Mark this as a match
	  this._emitMatch(index, prefix);
	  cb();
	};

	// Returns either 'DIR', 'FILE', or false
	Glob.prototype._stat = function (f, cb) {
	  var abs = this._makeAbs(f);
	  var needDir = f.slice(-1) === '/';

	  if (f.length > this.maxLength)
	    return cb()

	  if (!this.stat && ownProp(this.cache, abs)) {
	    var c = this.cache[abs];

	    if (Array.isArray(c))
	      c = 'DIR';

	    // It exists, but maybe not how we need it
	    if (!needDir || c === 'DIR')
	      return cb(null, c)

	    if (needDir && c === 'FILE')
	      return cb()

	    // otherwise we have to stat, because maybe c=true
	    // if we know it exists, but not what it is.
	  }
	  var stat = this.statCache[abs];
	  if (stat !== undefined) {
	    if (stat === false)
	      return cb(null, stat)
	    else {
	      var type = stat.isDirectory() ? 'DIR' : 'FILE';
	      if (needDir && type === 'FILE')
	        return cb()
	      else
	        return cb(null, type, stat)
	    }
	  }

	  var self = this;
	  var statcb = inflight('stat\0' + abs, lstatcb_);
	  if (statcb)
	    fs.lstat(abs, statcb);

	  function lstatcb_ (er, lstat) {
	    if (lstat && lstat.isSymbolicLink()) {
	      // If it's a symlink, then treat it as the target, unless
	      // the target does not exist, then treat it as a file.
	      return fs.stat(abs, function (er, stat) {
	        if (er)
	          self._stat2(f, abs, null, lstat, cb);
	        else
	          self._stat2(f, abs, er, stat, cb);
	      })
	    } else {
	      self._stat2(f, abs, er, lstat, cb);
	    }
	  }
	};

	Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
	  if (er) {
	    this.statCache[abs] = false;
	    return cb()
	  }

	  var needDir = f.slice(-1) === '/';
	  this.statCache[abs] = stat;

	  if (abs.slice(-1) === '/' && !stat.isDirectory())
	    return cb(null, false, stat)

	  var c = stat.isDirectory() ? 'DIR' : 'FILE';
	  this.cache[abs] = this.cache[abs] || c;

	  if (needDir && c !== 'DIR')
	    return cb()

	  return cb(null, c, stat)
	};
	return glob_1;
}

var selectorParserExports = {};
var selectorParser = {
  get exports(){ return selectorParserExports; },
  set exports(v){ selectorParserExports = v; },
};

/*!
 * Stylus - Selector Parser
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

var hasRequiredSelectorParser;

function requireSelectorParser () {
	if (hasRequiredSelectorParser) return selectorParserExports;
	hasRequiredSelectorParser = 1;
	var COMBINATORS = ['>', '+', '~'];

	/**
	 * Initialize a new `SelectorParser`
	 * with the given `str` and selectors `stack`.
	 *
	 * @param {String} str
	 * @param {Array} stack
	 * @param {Array} parts
	 * @api private
	 */

	var SelectorParser = selectorParser.exports = function SelectorParser(str, stack, parts) {
	  this.str = str;
	  this.stack = stack || [];
	  this.parts = parts || [];
	  this.pos = 0;
	  this.level = 2;
	  this.nested = true;
	  this.ignore = false;
	};

	/**
	 * Consume the given `len` and move current position.
	 *
	 * @param {Number} len
	 * @api private
	 */

	SelectorParser.prototype.skip = function(len) {
	  this.str = this.str.substr(len);
	  this.pos += len;
	};

	/**
	 * Consume spaces.
	 */

	SelectorParser.prototype.skipSpaces = function() {
	  while (' ' == this.str[0]) this.skip(1);
	};

	/**
	 * Fetch next token.
	 *
	 * @return {String}
	 * @api private
	 */

	SelectorParser.prototype.advance = function() {
	  return this.root()
	    || this.relative()
	    || this.initial()
	    || this.escaped()
	    || this.parent()
	    || this.partial()
	    || this.char();
	};

	/**
	 * '/'
	 */

	SelectorParser.prototype.root = function() {
	  if (!this.pos && '/' == this.str[0]
	    && 'deep' != this.str.slice(1, 5)) {
	    this.nested = false;
	    this.skip(1);
	  }
	};

	/**
	 * '../'
	 */

	SelectorParser.prototype.relative = function(multi) {
	  if ((!this.pos || multi) && '../' == this.str.slice(0, 3)) {
	    this.nested = false;
	    this.skip(3);
	    while (this.relative(true)) this.level++;
	    if (!this.raw) {
	      var ret = this.stack[this.stack.length - this.level];
	      if (ret) {
	        return ret;
	      } else {
	        this.ignore = true;
	      }
	    }
	  }
	};

	/**
	 * '~/'
	 */

	SelectorParser.prototype.initial = function() {
	  if (!this.pos && '~' == this.str[0] && '/' == this.str[1]) {
	    this.nested = false;
	    this.skip(2);
	    return this.stack[0];
	  }
	};

	/**
	 * '\' ('&' | '^')
	 */

	SelectorParser.prototype.escaped = function() {
	  if ('\\' == this.str[0]) {
	    var char = this.str[1];
	    if ('&' == char || '^' == char) {
	      this.skip(2);
	      return char;
	    }
	  }
	};

	/**
	 * '&'
	 */

	SelectorParser.prototype.parent = function() {
	  if ('&' == this.str[0]) {
	    this.nested = false;

	    if (!this.pos && (!this.stack.length || this.raw)) {
	      var i = 0;
	      while (' ' == this.str[++i]) ;
	      if (~COMBINATORS.indexOf(this.str[i])) {
	        this.skip(i + 1);
	        return;
	      }
	    }

	    this.skip(1);
	    if (!this.raw)
	      return this.stack[this.stack.length - 1];
	  }
	};

	/**
	 * '^[' range ']'
	 */

	SelectorParser.prototype.partial = function() {
	  if ('^' == this.str[0] && '[' == this.str[1]) {
	    this.skip(2);
	    this.skipSpaces();
	    var ret = this.range();
	    this.skipSpaces();
	    if (']' != this.str[0]) return '^[';
	    this.nested = false;
	    this.skip(1);
	    if (ret) {
	      return ret;
	    } else {
	      this.ignore = true;
	    }
	  }
	};

	/**
	 * '-'? 0-9+
	 */

	SelectorParser.prototype.number = function() {
	  var i =  0, ret = '';
	  if ('-' == this.str[i])
	    ret += this.str[i++];

	  while (this.str.charCodeAt(i) >= 48
	    && this.str.charCodeAt(i) <= 57)
	    ret += this.str[i++];

	  if (ret) {
	    this.skip(i);
	    return Number(ret);
	  }
	};

	/**
	 * number ('..' number)?
	 */

	SelectorParser.prototype.range = function() {
	  var start = this.number()
	    , ret;

	  if ('..' == this.str.slice(0, 2)) {
	    this.skip(2);
	    var end = this.number()
	      , len = this.parts.length;

	    if (start < 0) start = len + start - 1;
	    if (end < 0) end = len + end - 1;

	    if (start > end) {
	      var tmp = start;
	      start = end;
	      end = tmp;
	    }

	    if (end < len - 1) {
	      ret = this.parts.slice(start, end + 1).map(function(part) {
	        var selector = new SelectorParser(part, this.stack, this.parts);
	        selector.raw = true;
	        return selector.parse();
	      }, this).map(function(selector) {
	        return (selector.nested ? ' ' : '') + selector.val;
	      }).join('').trim();
	    }
	  } else {
	    ret = this.stack[
	      start < 0 ? this.stack.length + start - 1 : start
	    ];
	  }

	  if (ret) {
	    return ret;
	  } else {
	    this.ignore = true;
	  }
	};

	/**
	 * .+
	 */

	SelectorParser.prototype.char = function() {
	  var char = this.str[0];
	  this.skip(1);
	  return char;
	};

	/**
	 * Parses the selector.
	 *
	 * @return {Object}
	 * @api private
	 */

	SelectorParser.prototype.parse = function() {
	  var val = '';
	  while (this.str.length) {
	    val += this.advance() || '';
	    if (this.ignore) {
	      val = '';
	      break;
	    }
	  }
	  return { val: val.trimRight(), nested: this.nested };
	};
	return selectorParserExports;
}

var hasRequiredUtils;

function requireUtils () {
	if (hasRequiredUtils) return utils;
	hasRequiredUtils = 1;
	(function (exports) {
		/*!
		 * Stylus - utils
		 * Copyright (c) Automattic <developer.wordpress.com>
		 * MIT Licensed
		 */

		/**
		 * Module dependencies.
		 */

		var nodes = requireNodes()
		  , basename = require$$7.basename
		  , relative = require$$7.relative
		  , join = require$$7.join
		  , isAbsolute = require$$7.isAbsolute
		  , glob = requireGlob()
		  , fs = require$$0$1;

		/**
		 * Check if `path` looks absolute.
		 *
		 * @param {String} path
		 * @return {Boolean}
		 * @api private
		 */

		exports.absolute = isAbsolute || function(path){
		  // On Windows the path could start with a drive letter, i.e. a:\\ or two leading backslashes.
		  // Also on Windows, the path may have been normalized to forward slashes, so check for this too.
		  return path.substr(0, 2) == '\\\\' || '/' === path.charAt(0) || /^[a-z]:[\\\/]/i.test(path);
		};

		/**
		 * Attempt to lookup `path` within `paths` from tail to head.
		 * Optionally a path to `ignore` may be passed.
		 *
		 * @param {String} path
		 * @param {String} paths
		 * @param {String} ignore
		 * @return {String}
		 * @api private
		 */

		exports.lookup = function(path, paths, ignore){
		  var lookup
		    , i = paths.length;

		  // Absolute
		  if (exports.absolute(path)) {
		    try {
		      fs.statSync(path);
		      return path;
		    } catch (err) {
		      // Ignore, continue on
		      // to trying relative lookup.
		      // Needed for url(/images/foo.png)
		      // for example
		    }
		  }

		  // Relative
		  while (i--) {
		    try {
		      lookup = join(paths[i], path);
		      if (ignore == lookup) continue;
		      fs.statSync(lookup);
		      return lookup;
		    } catch (err) {
		      // Ignore
		    }
		  }
		};

		/**
		 * Like `utils.lookup` but uses `glob` to find files.
		 *
		 * @param {String} path
		 * @param {String} paths
		 * @param {String} ignore
		 * @return {Array}
		 * @api private
		 */
		exports.find = function(path, paths, ignore) {
		  var lookup
		    , found
		    , i = paths.length;

		  // Absolute
		  if (exports.absolute(path)) {
		    if ((found = glob.sync(path)).length) {
		      return found;
		    }
		  }

		  // Relative
		  while (i--) {
		    lookup = join(paths[i], path);
		    if (ignore == lookup) continue;
		    if ((found = glob.sync(lookup)).length) {
		      return found;
		    }
		  }
		};

		/**
		 * Lookup index file inside dir with given `name`.
		 *
		 * @param {String} name
		 * @return {Array}
		 * @api private
		 */

		exports.lookupIndex = function(name, paths, filename){
		  // foo/index.styl
		  var found = exports.find(join(name, 'index.styl'), paths, filename);
		  if (!found) {
		    // foo/foo.styl
		    found = exports.find(join(name, basename(name).replace(/\.styl/i, '') + '.styl'), paths, filename);
		  }
		  if (!found && !~name.indexOf('node_modules')) {
		    // node_modules/foo/.. or node_modules/foo.styl/..
		    found = lookupPackage(join('node_modules', name));
		  }
		  return found;

		  function lookupPackage(dir) {
		    var pkg = exports.lookup(join(dir, 'package.json'), paths, filename);
		    if (!pkg) {
		      return /\.styl$/i.test(dir) ? exports.lookupIndex(dir, paths, filename) : lookupPackage(dir + '.styl');
		    }
		    var main = commonjsRequire(relative(__dirname$2, pkg)).main;
		    if (main) {
		      found = exports.find(join(dir, main), paths, filename);
		    } else {
		      found = exports.lookupIndex(dir, paths, filename);
		    }
		    return found;
		  }
		};

		/**
		 * Format the given `err` with the given `options`.
		 *
		 * Options:
		 *
		 *   - `filename`   context filename
		 *   - `context`    context line count [8]
		 *   - `lineno`     context line number
		 *   - `column`     context column number
		 *   - `input`        input string
		 *
		 * @param {Error} err
		 * @param {Object} options
		 * @return {Error}
		 * @api private
		 */

		exports.formatException = function(err, options){
		  var lineno = options.lineno
		    , column = options.column
		    , filename = options.filename
		    , str = options.input
		    , context = options.context || 8
		    , context = context / 2
		    , lines = ('\n' + str).split('\n')
		    , start = Math.max(lineno - context, 1)
		    , end = Math.min(lines.length, lineno + context)
		    , pad = end.toString().length;

		  var context = lines.slice(start, end).map(function(line, i){
		    var curr = i + start;
		    return '   '
		      + Array(pad - curr.toString().length + 1).join(' ')
		      + curr
		      + '| '
		      + line
		      + (curr == lineno
		        ? '\n' + Array(curr.toString().length + 5 + column).join('-') + '^'
		        : '');
		  }).join('\n');

		  err.message = filename
		    + ':' + lineno
		    + ':' + column
		    + '\n' + context
		    + '\n\n' + err.message + '\n'
		    + (err.stylusStack ? err.stylusStack + '\n' : '');

		  // Don't show JS stack trace for Stylus errors
		  if (err.fromStylus) err.stack = 'Error: ' + err.message;

		  return err;
		};

		/**
		 * Assert that `node` is of the given `type`, or throw.
		 *
		 * @param {Node} node
		 * @param {Function} type
		 * @param {String} param
		 * @api public
		 */

		exports.assertType = function(node, type, param){
		  exports.assertPresent(node, param);
		  if (node.nodeName == type) return;
		  var actual = node.nodeName
		    , msg = 'expected '
		      + (param ? '"' + param + '" to be a ' :  '')
		      + type + ', but got '
		      + actual + ':' + node;
		  throw new Error('TypeError: ' + msg);
		};

		/**
		 * Assert that `node` is a `String` or `Ident`.
		 *
		 * @param {Node} node
		 * @param {String} param
		 * @api public
		 */

		exports.assertString = function(node, param){
		  exports.assertPresent(node, param);
		  switch (node.nodeName) {
		    case 'string':
		    case 'ident':
		    case 'literal':
		      return;
		    default:
		      var actual = node.nodeName
		        , msg = 'expected string, ident or literal, but got ' + actual + ':' + node;
		      throw new Error('TypeError: ' + msg);
		  }
		};

		/**
		 * Assert that `node` is a `RGBA` or `HSLA`.
		 *
		 * @param {Node} node
		 * @param {String} param
		 * @api public
		 */

		exports.assertColor = function(node, param){
		  exports.assertPresent(node, param);
		  switch (node.nodeName) {
		    case 'rgba':
		    case 'hsla':
		      return;
		    default:
		      var actual = node.nodeName
		        , msg = 'expected rgba or hsla, but got ' + actual + ':' + node;
		      throw new Error('TypeError: ' + msg);
		  }
		};

		/**
		 * Assert that param `name` is given, aka the `node` is passed.
		 *
		 * @param {Node} node
		 * @param {String} name
		 * @api public
		 */

		exports.assertPresent = function(node, name){
		  if (node) return;
		  if (name) throw new Error('"' + name + '" argument required');
		  throw new Error('argument missing');
		};

		/**
		 * Unwrap `expr`.
		 *
		 * Takes an expressions with length of 1
		 * such as `((1 2 3))` and unwraps it to `(1 2 3)`.
		 *
		 * @param {Expression} expr
		 * @return {Node}
		 * @api public
		 */

		exports.unwrap = function(expr){
		  // explicitly preserve the expression
		  if (expr.preserve) return expr;
		  if ('arguments' != expr.nodeName && 'expression' != expr.nodeName) return expr;
		  if (1 != expr.nodes.length) return expr;
		  if ('arguments' != expr.nodes[0].nodeName && 'expression' != expr.nodes[0].nodeName) return expr;
		  return exports.unwrap(expr.nodes[0]);
		};

		/**
		 * Coerce JavaScript values to their Stylus equivalents.
		 *
		 * @param {Mixed} val
		 * @param {Boolean} [raw]
		 * @return {Node}
		 * @api public
		 */

		exports.coerce = function(val, raw){
		  switch (typeof val) {
		    case 'function':
		      return val;
		    case 'string':
		      return new nodes.String(val);
		    case 'boolean':
		      return new nodes.Boolean(val);
		    case 'number':
		      return new nodes.Unit(val);
		    default:
		      if (null == val) return nodes.null;
		      if (Array.isArray(val)) return exports.coerceArray(val, raw);
		      if (val.nodeName) return val;
		      return exports.coerceObject(val, raw);
		  }
		};

		/**
		 * Coerce a javascript `Array` to a Stylus `Expression`.
		 *
		 * @param {Array} val
		 * @param {Boolean} [raw]
		 * @return {Expression}
		 * @api private
		 */

		exports.coerceArray = function(val, raw){
		  var expr = new nodes.Expression;
		  val.forEach(function(val){
		    expr.push(exports.coerce(val, raw));
		  });
		  return expr;
		};

		/**
		 * Coerce a javascript object to a Stylus `Expression` or `Object`.
		 *
		 * For example `{ foo: 'bar', bar: 'baz' }` would become
		 * the expression `(foo 'bar') (bar 'baz')`. If `raw` is true
		 * given `obj` would become a Stylus hash object.
		 *
		 * @param {Object} obj
		 * @param {Boolean} [raw]
		 * @return {Expression|Object}
		 * @api public
		 */

		exports.coerceObject = function(obj, raw){
		  var node = raw ? new nodes.Object : new nodes.Expression
		    , val;

		  for (var key in obj) {
		    val = exports.coerce(obj[key], raw);
		    key = new nodes.Ident(key);
		    if (raw) {
		      node.set(key, val);
		    } else {
		      node.push(exports.coerceArray([key, val]));
		    }
		  }

		  return node;
		};

		/**
		 * Return param names for `fn`.
		 *
		 * @param {Function} fn
		 * @return {Array}
		 * @api private
		 */

		exports.params = function(fn){
		  return fn
		    .toString()
		    .match(/\(([^)]*)\)/)[1].split(/ *, */);
		};

		/**
		 * Merge object `b` with `a`.
		 *
		 * @param {Object} a
		 * @param {Object} b
		 * @param {Boolean} [deep]
		 * @return {Object} a
		 * @api private
		 */
		exports.merge = function(a, b, deep) {
		  for (var k in b) {
		    if (deep && a[k]) {
		      var nodeA = exports.unwrap(a[k]).first
		        , nodeB = exports.unwrap(b[k]).first;

		      if ('object' == nodeA.nodeName && 'object' == nodeB.nodeName) {
		        a[k].first.vals = exports.merge(nodeA.vals, nodeB.vals, deep);
		      } else {
		        a[k] = b[k];
		      }
		    } else {
		      a[k] = b[k];
		    }
		  }
		  return a;
		};

		/**
		 * Returns an array with unique values.
		 *
		 * @param {Array} arr
		 * @return {Array}
		 * @api private
		 */

		exports.uniq = function(arr){
		  var obj = {}
		    , ret = [];

		  for (var i = 0, len = arr.length; i < len; ++i) {
		    if (arr[i] in obj) continue;

		    obj[arr[i]] = true;
		    ret.push(arr[i]);
		  }
		  return ret;
		};

		/**
		 * Compile selector strings in `arr` from the bottom-up
		 * to produce the selector combinations. For example
		 * the following Stylus:
		 *
		 *    ul
		 *      li
		 *      p
		 *        a
		 *          color: red
		 *
		 * Would return:
		 *
		 *      [ 'ul li a', 'ul p a' ]
		 *
		 * @param {Array} arr
		 * @param {Boolean} leaveHidden
		 * @return {Array}
		 * @api private
		 */

		exports.compileSelectors = function(arr, leaveHidden){
		  var selectors = []
		    , Parser = requireSelectorParser()
		    , indent = (this.indent || '')
		    , buf = [];

		  function parse(selector, buf) {
		    var parts = [selector.val]
		      , str = new Parser(parts[0], parents, parts).parse().val
		      , parents = [];

		    if (buf.length) {
		      for (var i = 0, len = buf.length; i < len; ++i) {
		        parts.push(buf[i]);
		        parents.push(str);
		        var child = new Parser(buf[i], parents, parts).parse();

		        if (child.nested) {
		          str += ' ' + child.val;
		        } else {
		          str = child.val;
		        }
		      }
		    }
		    return str.trim();
		  }

		  function compile(arr, i) {
		    if (i) {
		      arr[i].forEach(function(selector){
		        if (!leaveHidden && selector.isPlaceholder) return;
		        if (selector.inherits) {
		          buf.unshift(selector.val);
		          compile(arr, i - 1);
		          buf.shift();
		        } else {
		          selectors.push(indent + parse(selector, buf));
		        }
		      });
		    } else {
		      arr[0].forEach(function(selector){
		        if (!leaveHidden && selector.isPlaceholder) return;
		        var str = parse(selector, buf);
		        if (str) selectors.push(indent + str);
		      });
		    }
		  }

		  compile(arr, arr.length - 1);

		  // Return the list with unique selectors only
		  return exports.uniq(selectors);
		};

		/**
		 * Attempt to parse string.
		 *
		 * @param {String} str
		 * @return {Node}
		 * @api private
		 */

		exports.parseString = function(str){
		  var Parser = requireParser()
		    , parser
		    , ret;

		  try {
		    parser = new Parser(str);
		    parser.state.push('expression');
		    ret = new nodes.Expression();
		    ret.nodes = parser.parse().nodes;
		  } catch (e) {
		    ret = new nodes.Literal(str);
		  }
		  return ret;
		};
} (utils));
	return utils;
}

var functions = {};

var addPropertyExports = {};
var addProperty = {
  get exports(){ return addPropertyExports; },
  set exports(v){ addPropertyExports = v; },
};

var hasRequiredAddProperty;

function requireAddProperty () {
	if (hasRequiredAddProperty) return addPropertyExports;
	hasRequiredAddProperty = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Add property `name` with the given `expr`
	 * to the mixin-able block.
	 *
	 * @param {String|Ident|Literal} name
	 * @param {Expression} expr
	 * @return {Property}
	 * @api public
	 */

	(addProperty.exports = function addProperty(name, expr){
	  utils.assertType(name, 'expression', 'name');
	  name = utils.unwrap(name).first;
	  utils.assertString(name, 'name');
	  utils.assertType(expr, 'expression', 'expr');
	  var prop = new nodes.Property([name], expr);
	  var block = this.closestBlock;

	  var len = block.nodes.length
	    , head = block.nodes.slice(0, block.index)
	    , tail = block.nodes.slice(block.index++, len);
	  head.push(prop);
	  block.nodes = head.concat(tail);

	  return prop;
	}).raw = true;
	return addPropertyExports;
}

var adjust;
var hasRequiredAdjust;

function requireAdjust () {
	if (hasRequiredAdjust) return adjust;
	hasRequiredAdjust = 1;
	var utils = requireUtils();

	/**
	 * Adjust HSL `color` `prop` by `amount`.
	 *
	 * @param {RGBA|HSLA} color
	 * @param {String} prop
	 * @param {Unit} amount
	 * @return {RGBA}
	 * @api private
	 */

	adjust = function adjust(color, prop, amount){
	  utils.assertColor(color, 'color');
	  utils.assertString(prop, 'prop');
	  utils.assertType(amount, 'unit', 'amount');
	  var hsl = color.hsla.clone();
	  prop = { hue: 'h', saturation: 's', lightness: 'l' }[prop.string];
	  if (!prop) throw new Error('invalid adjustment property');
	  var val = amount.val;
	  if ('%' == amount.type){
	    val = 'l' == prop && val > 0
	      ? (100 - hsl[prop]) * val / 100
	      : hsl[prop] * (val / 100);
	  }
	  hsl[prop] += val;
	  return hsl.rgba;
	};
	return adjust;
}

var rgba$1;
var hasRequiredRgba$1;

function requireRgba$1 () {
	if (hasRequiredRgba$1) return rgba$1;
	hasRequiredRgba$1 = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Return a `RGBA` from the r,g,b,a channels.
	 *
	 * Examples:
	 *
	 *    rgba(255,0,0,0.5)
	 *    // => rgba(255,0,0,0.5)
	 *
	 *    rgba(255,0,0,1)
	 *    // => #ff0000
	 *
	 *    rgba(#ffcc00, 50%)
	 *    // rgba(255,204,0,0.5)
	 *
	 * @param {Unit|RGBA|HSLA} red
	 * @param {Unit} green
	 * @param {Unit} blue
	 * @param {Unit} alpha
	 * @return {RGBA}
	 * @api public
	 */

	rgba$1 = function rgba(red, green, blue, alpha){
	  switch (arguments.length) {
	    case 1:
	      utils.assertColor(red);
	      return red.rgba;
	    case 2:
	      utils.assertColor(red);
	      var color = red.rgba;
	      utils.assertType(green, 'unit', 'alpha');
	      alpha = green.clone();
	      if ('%' == alpha.type) alpha.val /= 100;
	      return new nodes.RGBA(
	          color.r
	        , color.g
	        , color.b
	        , alpha.val);
	    default:
	      utils.assertType(red, 'unit', 'red');
	      utils.assertType(green, 'unit', 'green');
	      utils.assertType(blue, 'unit', 'blue');
	      utils.assertType(alpha, 'unit', 'alpha');
	      var r = '%' == red.type ? Math.round(red.val * 2.55) : red.val
	        , g = '%' == green.type ? Math.round(green.val * 2.55) : green.val
	        , b = '%' == blue.type ? Math.round(blue.val * 2.55) : blue.val;

	      alpha = alpha.clone();
	      if (alpha && '%' == alpha.type) alpha.val /= 100;
	      return new nodes.RGBA(
	          r
	        , g
	        , b
	        , alpha.val);
	  }
	};
	return rgba$1;
}

var alpha;
var hasRequiredAlpha;

function requireAlpha () {
	if (hasRequiredAlpha) return alpha;
	hasRequiredAlpha = 1;
	var nodes = requireNodes()
	  , rgba = requireRgba$1();

	/**
	 * Return the alpha component of the given `color`,
	 * or set the alpha component to the optional second `value` argument.
	 *
	 * Examples:
	 *
	 *    alpha(#fff)
	 *    // => 1
	 *
	 *    alpha(rgba(0,0,0,0.3))
	 *    // => 0.3
	 *
	 *    alpha(#fff, 0.5)
	 *    // => rgba(255,255,255,0.5)
	 *
	 * @param {RGBA|HSLA} color
	 * @param {Unit} [value]
	 * @return {Unit|RGBA}
	 * @api public
	 */

	alpha = function alpha(color, value){
	  color = color.rgba;
	  if (value) {
	    return rgba(
	      new nodes.Unit(color.r),
	      new nodes.Unit(color.g),
	      new nodes.Unit(color.b),
	      value
	    );
	  }
	  return new nodes.Unit(color.a, '');
	};
	return alpha;
}

var baseConvertExports = {};
var baseConvert = {
  get exports(){ return baseConvertExports; },
  set exports(v){ baseConvertExports = v; },
};

var hasRequiredBaseConvert;

function requireBaseConvert () {
	if (hasRequiredBaseConvert) return baseConvertExports;
	hasRequiredBaseConvert = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Return a `Literal` `num` converted to the provided `base`, padded to `width`
	 * with zeroes (default width is 2)
	 *
	 * @param {Number} num
	 * @param {Number} base
	 * @param {Number} width
	 * @return {Literal}
	 * @api public
	 */

	(baseConvert.exports = function(num, base, width) {
	  utils.assertPresent(num, 'number');
	  utils.assertPresent(base, 'base');
	  num = utils.unwrap(num).nodes[0].val;
	  base = utils.unwrap(base).nodes[0].val;
	  width = (width && utils.unwrap(width).nodes[0].val) || 2;
	  var result = Number(num).toString(base);
	  while (result.length < width) {
	    result = '0' + result;
	  }
	  return new nodes.Literal(result);
	}).raw = true;
	return baseConvertExports;
}

var basename;
var hasRequiredBasename;

function requireBasename () {
	if (hasRequiredBasename) return basename;
	hasRequiredBasename = 1;
	var utils = requireUtils()
	  , path = require$$7;

	/**
	 * Return the basename of `path`.
	 *
	 * @param {String} path
	 * @return {String}
	 * @api public
	 */

	basename = function basename(p, ext){
	  utils.assertString(p, 'path');
	  return path.basename(p.val, ext && ext.val);
	};
	return basename;
}

var blend;
var hasRequiredBlend;

function requireBlend () {
	if (hasRequiredBlend) return blend;
	hasRequiredBlend = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Blend the `top` color over the `bottom`
	 *
	 * Examples:
	 *
	 *     blend(rgba(#FFF, 0.5), #000)
	 *     // => #808080
	 * 
	 *     blend(rgba(#FFDE00,.42), #19C261)
	 *     // => #7ace38
	 * 
	 *     blend(rgba(lime, 0.5), rgba(red, 0.25))
	 *     // => rgba(128,128,0,0.625)
	 *
	 * @param {RGBA|HSLA} top
	 * @param {RGBA|HSLA} [bottom=#fff]
	 * @return {RGBA}
	 * @api public
	 */

	blend = function blend(top, bottom){
	  // TODO: different blend modes like overlay etc.
	  utils.assertColor(top);
	  top = top.rgba;
	  bottom = bottom || new nodes.RGBA(255, 255, 255, 1);
	  utils.assertColor(bottom);
	  bottom = bottom.rgba;

	  return new nodes.RGBA(
	    top.r * top.a + bottom.r * (1 - top.a),
	    top.g * top.a + bottom.g * (1 - top.a),
	    top.b * top.a + bottom.b * (1 - top.a),
	    top.a + bottom.a - top.a * bottom.a);
	};
	return blend;
}

var blue;
var hasRequiredBlue;

function requireBlue () {
	if (hasRequiredBlue) return blue;
	hasRequiredBlue = 1;
	var nodes = requireNodes()
	  , rgba = requireRgba$1();

	/**
	 * Return the blue component of the given `color`,
	 * or set the blue component to the optional second `value` argument.
	 *
	 * Examples:
	 *
	 *    blue(#00c)
	 *    // => 204
	 *
	 *    blue(#000, 255)
	 *    // => #00f
	 *
	 * @param {RGBA|HSLA} color
	 * @param {Unit} [value]
	 * @return {Unit|RGBA}
	 * @api public
	 */

	blue = function blue(color, value){
	  color = color.rgba;
	  if (value) {
	    return rgba(
	      new nodes.Unit(color.r),
	      new nodes.Unit(color.g),
	      value,
	      new nodes.Unit(color.a)
	    );
	  }
	  return new nodes.Unit(color.b, '');
	};
	return blue;
}

var cloneExports = {};
var clone = {
  get exports(){ return cloneExports; },
  set exports(v){ cloneExports = v; },
};

var hasRequiredClone;

function requireClone () {
	if (hasRequiredClone) return cloneExports;
	hasRequiredClone = 1;
	var utils = requireUtils();

	/**
	 * Return a clone of the given `expr`.
	 *
	 * @param {Expression} expr
	 * @return {Node}
	 * @api public
	 */

	(clone.exports = function clone(expr){
	  utils.assertPresent(expr, 'expr');
	  return expr.clone();
	}).raw = true;
	return cloneExports;
}

var component;
var hasRequiredComponent;

function requireComponent () {
	if (hasRequiredComponent) return component;
	hasRequiredComponent = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Color component name map.
	 */

	var componentMap = {
	    red: 'r'
	  , green: 'g'
	  , blue: 'b'
	  , alpha: 'a'
	  , hue: 'h'
	  , saturation: 's'
	  , lightness: 'l'
	};

	/**
	 * Color component unit type map.
	 */

	var unitMap = {
	    hue: 'deg'
	  , saturation: '%'
	  , lightness: '%'
	};

	/**
	 * Color type map.
	 */

	var typeMap = {
	    red: 'rgba'
	  , blue: 'rgba'
	  , green: 'rgba'
	  , alpha: 'rgba'
	  , hue: 'hsla'
	  , saturation: 'hsla'
	  , lightness: 'hsla'
	};

	/**
	 * Return component `name` for the given `color`.
	 *
	 * @param {RGBA|HSLA} color
	 * @param {String} name
	 * @return {Unit}
	 * @api public
	 */

	component = function component(color, name) {
	  utils.assertColor(color, 'color');
	  utils.assertString(name, 'name');
	  var name = name.string
	    , unit = unitMap[name]
	    , type = typeMap[name]
	    , name = componentMap[name];
	  if (!name) throw new Error('invalid color component "' + name + '"');
	  return new nodes.Unit(color[type][name], unit);
	};
	return component;
}

var luminosity;
var hasRequiredLuminosity;

function requireLuminosity () {
	if (hasRequiredLuminosity) return luminosity;
	hasRequiredLuminosity = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Returns the relative luminance of the given `color`,
	 * see http://www.w3.org/TR/WCAG20/#relativeluminancedef
	 *
	 * Examples:
	 *
	 *     luminosity(white)
	 *     // => 1
	 * 
	 *     luminosity(#000)
	 *     // => 0
	 * 
	 *     luminosity(red)
	 *     // => 0.2126
	 *
	 * @param {RGBA|HSLA} color
	 * @return {Unit}
	 * @api public
	 */

	luminosity = function luminosity(color){
	  utils.assertColor(color);
	  color = color.rgba;
	  function processChannel(channel) {
	    channel = channel / 255;
	    return (0.03928 > channel)
	      ? channel / 12.92
	      : Math.pow(((channel + 0.055) / 1.055), 2.4);
	  }
	  return new nodes.Unit(
	    0.2126 * processChannel(color.r)
	    + 0.7152 * processChannel(color.g)
	    + 0.0722 * processChannel(color.b)
	  );
	};
	return luminosity;
}

var contrast;
var hasRequiredContrast;

function requireContrast () {
	if (hasRequiredContrast) return contrast;
	hasRequiredContrast = 1;
	var utils = requireUtils()
	  , nodes = requireNodes()
	  , blend = requireBlend()
	  , luminosity = requireLuminosity();

	/**
	 * Returns the contrast ratio object between `top` and `bottom` colors,
	 * based on http://leaverou.github.io/contrast-ratio/
	 * and https://github.com/LeaVerou/contrast-ratio/blob/gh-pages/color.js#L108
	 *
	 * Examples:
	 *
	 *     contrast(#000, #fff).ratio
	 *     => 21
	 *
	 *     contrast(#000, rgba(#FFF, 0.5))
	 *     => { "ratio": "13.15;", "error": "7.85", "min": "5.3", "max": "21" }
	 *
	 * @param {RGBA|HSLA} top
	 * @param {RGBA|HSLA} [bottom=#fff]
	 * @return {Object}
	 * @api public
	 */

	contrast = function contrast(top, bottom){
	  if ('rgba' != top.nodeName && 'hsla' != top.nodeName) {
	    return new nodes.Literal('contrast(' + (top.isNull ? '' : top.toString()) + ')');
	  }
	  var result = new nodes.Object();
	  top = top.rgba;
	  bottom = bottom || new nodes.RGBA(255, 255, 255, 1);
	  utils.assertColor(bottom);
	  bottom = bottom.rgba;
	  function contrast(top, bottom) {
	    if (1 > top.a) {
	      top = blend(top, bottom);
	    }
	    var l1 = luminosity(bottom).val + 0.05
	      , l2 = luminosity(top).val + 0.05
	      , ratio = l1 / l2;

	    if (l2 > l1) {
	      ratio = 1 / ratio;
	    }
	    return Math.round(ratio * 10) / 10;
	  }

	  if (1 <= bottom.a) {
	    var resultRatio = new nodes.Unit(contrast(top, bottom));
	    result.set('ratio', resultRatio);
	    result.set('error', new nodes.Unit(0));
	    result.set('min', resultRatio);
	    result.set('max', resultRatio);
	  } else {
	    var onBlack = contrast(top, blend(bottom, new nodes.RGBA(0, 0, 0, 1)))
	      , onWhite = contrast(top, blend(bottom, new nodes.RGBA(255, 255, 255, 1)))
	      , max = Math.max(onBlack, onWhite);
	    function processChannel(topChannel, bottomChannel) {
	      return Math.min(Math.max(0, (topChannel - bottomChannel * bottom.a) / (1 - bottom.a)), 255);
	    }
	    var closest = new nodes.RGBA(
	      processChannel(top.r, bottom.r),
	      processChannel(top.g, bottom.g),
	      processChannel(top.b, bottom.b),
	      1
	    );
	    var min = contrast(top, blend(bottom, closest));

	    result.set('ratio', new nodes.Unit(Math.round((min + max) * 50) / 100));
	    result.set('error', new nodes.Unit(Math.round((max - min) * 50) / 100));
	    result.set('min', new nodes.Unit(min));
	    result.set('max', new nodes.Unit(max));
	  }
	  return result;
	};
	return contrast;
}

var convert;
var hasRequiredConvert;

function requireConvert () {
	if (hasRequiredConvert) return convert;
	hasRequiredConvert = 1;
	var utils = requireUtils();

	/**
	 * Like `unquote` but tries to convert
	 * the given `str` to a Stylus node.
	 *
	 * @param {String} str
	 * @return {Node}
	 * @api public
	 */

	convert = function convert(str){
	  utils.assertString(str, 'str');
	  return utils.parseString(str.string);
	};
	return convert;
}

var currentMedia;
var hasRequiredCurrentMedia;

function requireCurrentMedia () {
	if (hasRequiredCurrentMedia) return currentMedia;
	hasRequiredCurrentMedia = 1;
	var nodes = requireNodes();

	/**
	 * Returns the @media string for the current block
	 *
	 * @return {String}
	 * @api public
	 */

	currentMedia = function currentMedia(){
	  var self = this;
	  return new nodes.String(lookForMedia(this.closestBlock.node) || '');

	  function lookForMedia(node){
	    if ('media' == node.nodeName) {
	      node.val = self.visit(node.val);
	      return node.toString();
	    } else if (node.block.parent.node) {
	      return lookForMedia(node.block.parent.node);
	    }
	  }
	};
	return currentMedia;
}

var define;
var hasRequiredDefine;

function requireDefine () {
	if (hasRequiredDefine) return define;
	hasRequiredDefine = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Set a variable `name` on current scope.
	 *
	 * @param {String} name
	 * @param {Expression} expr
	 * @param {Boolean} [global]
	 * @api public
	 */

	define = function define(name, expr, global){
	  utils.assertType(name, 'string', 'name');
	  expr = utils.unwrap(expr);
	  var scope = this.currentScope;
	  if (global && global.toBoolean().isTrue) {
	    scope = this.global.scope;
	  }
	  var node = new nodes.Ident(name.val, expr);
	  scope.add(node);
	  return nodes.null;
	};
	return define;
}

var dirname;
var hasRequiredDirname;

function requireDirname () {
	if (hasRequiredDirname) return dirname;
	hasRequiredDirname = 1;
	var utils = requireUtils()
	  , path = require$$7;

	/**
	 * Return the dirname of `path`.
	 *
	 * @param {String} path
	 * @return {String}
	 * @api public
	 */

	dirname = function dirname(p){
	  utils.assertString(p, 'path');
	  return path.dirname(p.val).replace(/\\/g, '/');
	};
	return dirname;
}

var error$1;
var hasRequiredError;

function requireError () {
	if (hasRequiredError) return error$1;
	hasRequiredError = 1;
	var utils = requireUtils();

	/**
	 * Throw an error with the given `msg`.
	 *
	 * @param {String} msg
	 * @api public
	 */

	error$1 = function error(msg){
	  utils.assertType(msg, 'string', 'msg');
	  var err = new Error(msg.val);
	  err.fromStylus = true;
	  throw err;
	};
	return error$1;
}

var extname;
var hasRequiredExtname;

function requireExtname () {
	if (hasRequiredExtname) return extname;
	hasRequiredExtname = 1;
	var utils = requireUtils()
	  , path = require$$7;

	/**
	 * Return the extname of `path`.
	 *
	 * @param {String} path
	 * @return {String}
	 * @api public
	 */

	extname = function extname(p){
	  utils.assertString(p, 'path');
	  return path.extname(p.val);
	};
	return extname;
}

var green;
var hasRequiredGreen;

function requireGreen () {
	if (hasRequiredGreen) return green;
	hasRequiredGreen = 1;
	var nodes = requireNodes()
	  , rgba = requireRgba$1();

	/**
	 * Return the green component of the given `color`,
	 * or set the green component to the optional second `value` argument.
	 *
	 * Examples:
	 *
	 *    green(#0c0)
	 *    // => 204
	 *
	 *    green(#000, 255)
	 *    // => #0f0
	 *
	 * @param {RGBA|HSLA} color
	 * @param {Unit} [value]
	 * @return {Unit|RGBA}
	 * @api public
	 */

	green = function green(color, value){
	  color = color.rgba;
	  if (value) {
	    return rgba(
	      new nodes.Unit(color.r),
	      value,
	      new nodes.Unit(color.b),
	      new nodes.Unit(color.a)
	    );
	  }
	  return new nodes.Unit(color.g, '');
	};
	return green;
}

var hsla$1;
var hasRequiredHsla$1;

function requireHsla$1 () {
	if (hasRequiredHsla$1) return hsla$1;
	hasRequiredHsla$1 = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Convert the given `color` to an `HSLA` node,
	 * or h,s,l,a component values.
	 *
	 * Examples:
	 *
	 *    hsla(10deg, 50%, 30%, 0.5)
	 *    // => HSLA
	 *
	 *    hsla(#ffcc00)
	 *    // => HSLA
	 *
	 * @param {RGBA|HSLA|Unit} hue
	 * @param {Unit} saturation
	 * @param {Unit} lightness
	 * @param {Unit} alpha
	 * @return {HSLA}
	 * @api public
	 */

	hsla$1 = function hsla(hue, saturation, lightness, alpha){
	  switch (arguments.length) {
	    case 1:
	      utils.assertColor(hue);
	      return hue.hsla;
	    case 2:
	      utils.assertColor(hue);
	      var color = hue.hsla;
	      utils.assertType(saturation, 'unit', 'alpha');
	      var alpha = saturation.clone();
	      if ('%' == alpha.type) alpha.val /= 100;
	      return new nodes.HSLA(
	          color.h
	        , color.s
	        , color.l
	        , alpha.val);
	    default:
	      utils.assertType(hue, 'unit', 'hue');
	      utils.assertType(saturation, 'unit', 'saturation');
	      utils.assertType(lightness, 'unit', 'lightness');
	      utils.assertType(alpha, 'unit', 'alpha');
	      var alpha = alpha.clone();
	      if (alpha && '%' == alpha.type) alpha.val /= 100;
	      return new nodes.HSLA(
	          hue.val
	        , saturation.val
	        , lightness.val
	        , alpha.val);
	  }
	};
	return hsla$1;
}

var hsl;
var hasRequiredHsl;

function requireHsl () {
	if (hasRequiredHsl) return hsl;
	hasRequiredHsl = 1;
	var utils = requireUtils()
	  , nodes = requireNodes()
	  , hsla = requireHsla$1();

	/**
	 * Convert the given `color` to an `HSLA` node,
	 * or h,s,l component values.
	 *
	 * Examples:
	 *
	 *    hsl(10, 50, 30)
	 *    // => HSLA
	 *
	 *    hsl(#ffcc00)
	 *    // => HSLA
	 *
	 * @param {Unit|HSLA|RGBA} hue
	 * @param {Unit} saturation
	 * @param {Unit} lightness
	 * @return {HSLA}
	 * @api public
	 */

	hsl = function hsl(hue, saturation, lightness){
	  if (1 == arguments.length) {
	    utils.assertColor(hue, 'color');
	    return hue.hsla;
	  } else {
	    return hsla(
	        hue
	      , saturation
	      , lightness
	      , new nodes.Unit(1));
	  }
	};
	return hsl;
}

var hue;
var hasRequiredHue;

function requireHue () {
	if (hasRequiredHue) return hue;
	hasRequiredHue = 1;
	var nodes = requireNodes()
	  , hsla = requireHsla$1()
	  , component = requireComponent();

	/**
	 * Return the hue component of the given `color`,
	 * or set the hue component to the optional second `value` argument.
	 *
	 * Examples:
	 *
	 *    hue(#00c)
	 *    // => 240deg
	 *
	 *    hue(#00c, 90deg)
	 *    // => #6c0
	 *
	 * @param {RGBA|HSLA} color
	 * @param {Unit} [value]
	 * @return {Unit|RGBA}
	 * @api public
	 */

	hue = function hue(color, value){
	  if (value) {
	    var hslaColor = color.hsla;
	    return hsla(
	      value,
	      new nodes.Unit(hslaColor.s),
	      new nodes.Unit(hslaColor.l),
	      new nodes.Unit(hslaColor.a)
	    )
	  }
	  return component(color, new nodes.String('hue'));
	};
	return hue;
}

var imageExports = {};
var image = {
  get exports(){ return imageExports; },
  set exports(v){ imageExports = v; },
};

var sax = {};

function BufferList() {
  this.head = null;
  this.tail = null;
  this.length = 0;
}

BufferList.prototype.push = function (v) {
  var entry = { data: v, next: null };
  if (this.length > 0) this.tail.next = entry;else this.head = entry;
  this.tail = entry;
  ++this.length;
};

BufferList.prototype.unshift = function (v) {
  var entry = { data: v, next: this.head };
  if (this.length === 0) this.tail = entry;
  this.head = entry;
  ++this.length;
};

BufferList.prototype.shift = function () {
  if (this.length === 0) return;
  var ret = this.head.data;
  if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
  --this.length;
  return ret;
};

BufferList.prototype.clear = function () {
  this.head = this.tail = null;
  this.length = 0;
};

BufferList.prototype.join = function (s) {
  if (this.length === 0) return '';
  var p = this.head;
  var ret = '' + p.data;
  while (p = p.next) {
    ret += s + p.data;
  }return ret;
};

BufferList.prototype.concat = function (n) {
  if (this.length === 0) return Buffer.alloc(0);
  if (this.length === 1) return this.head.data;
  var ret = Buffer.allocUnsafe(n >>> 0);
  var p = this.head;
  var i = 0;
  while (p) {
    p.data.copy(ret, i);
    i += p.data.length;
    p = p.next;
  }
  return ret;
};

// Copyright Joyent, Inc. and other Node contributors.
var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     };


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
function StringDecoder(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
}

// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

var stringDecoder = /*#__PURE__*/Object.freeze({
	__proto__: null,
	StringDecoder: StringDecoder
});

Readable.ReadableState = ReadableState;

var debug$1 = debuglog('stream');
inherits$1(Readable, EventEmitter);

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') {
    return emitter.prependListener(event, fn);
  } else {
    // This is a hack to make sure that our error handler is attached before any
    // userland ones.  NEVER DO THIS. This is here only because this code needs
    // to continue to work with older versions of Node.js that do not include
    // the prependListener() method. The goal is to eventually remove this hack.
    if (!emitter._events || !emitter._events[event])
      emitter.on(event, fn);
    else if (Array.isArray(emitter._events[event]))
      emitter._events[event].unshift(fn);
    else
      emitter._events[event] = [fn, emitter._events[event]];
  }
}
function listenerCount (emitter, type) {
  return emitter.listeners(type).length;
}
function ReadableState(options, stream) {

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}
function Readable(options) {

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  EventEmitter.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = Buffer.from(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var _e = new Error('stream.unshift() after end event');
      stream.emit('error', _e);
    } else {
      var skipAdd;
      if (state.decoder && !addToFront && !encoding) {
        chunk = state.decoder.write(chunk);
        skipAdd = !state.objectMode && chunk.length === 0;
      }

      if (!addToFront) state.reading = false;

      // Don't add to the buffer if we've decoded to an empty string chunk and
      // we're not in object mode
      if (!skipAdd) {
        // if we want the data now, just emit it.
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug$1('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug$1('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug$1('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug$1('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug$1('reading or ended', doRead);
  } else if (doRead) {
    debug$1('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug$1('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug$1('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug$1('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug$1('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false);

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug$1('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug$1('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug$1('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug$1('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug$1('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug$1('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (listenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug$1('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug$1('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug$1('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug$1('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && src.listeners('data').length) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var _i = 0; _i < len; _i++) {
      dests[_i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1) return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = EventEmitter.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug$1('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug$1('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug$1('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug$1('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug$1('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug$1('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug$1('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug$1('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function (ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug$1('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

// A bit simpler than readable streams.
Writable.WritableState = WritableState;
inherits$1(Writable, EventEmitter);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

function WritableState(options, stream) {
  Object.defineProperty(this, 'buffer', {
    get: deprecate(function () {
      return this.getBuffer();
    }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
  });
  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};
function Writable(options) {

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  EventEmitter.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  nextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;
  // Always throw error if a null is written
  // if we are not in object mode then throw
  // if it is not a buffer, string, or undefined.
  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) nextTick(cb, er);else cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
        nextTick(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
        afterWrite(stream, state, finished, cb);
      }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    while (entry) {
      buffer[count] = entry;
      entry = entry.next;
      count += 1;
    }

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function (err) {
    var entry = _this.entry;
    _this.entry = null;
    while (entry) {
      var cb = entry.callback;
      state.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    if (state.corkedRequestsFree) {
      state.corkedRequestsFree.next = _this;
    } else {
      state.corkedRequestsFree = _this;
    }
  };
}

inherits$1(Duplex, Readable);

var keys = Object.keys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}
function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

// a transform stream is a readable/writable stream where you do
inherits$1(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}
function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er) {
      done(stream, er);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('Not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

function done(stream, er) {
  if (er) return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}

inherits$1(PassThrough, Transform);
function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

inherits$1(Stream, EventEmitter);
Stream.Readable = Readable;
Stream.Writable = Writable;
Stream.Duplex = Duplex;
Stream.Transform = Transform;
Stream.PassThrough = PassThrough;

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EventEmitter.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EventEmitter.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

var stream = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': Stream,
	Readable: Readable,
	Writable: Writable,
	Duplex: Duplex,
	Transform: Transform,
	PassThrough: PassThrough,
	Stream: Stream
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(stream);

var require$$1 = /*@__PURE__*/getAugmentedNamespace(stringDecoder);

(function (exports) {
(function (sax) {

	sax.parser = function (strict, opt) { return new SAXParser(strict, opt) };
	sax.SAXParser = SAXParser;
	sax.SAXStream = SAXStream;
	sax.createStream = createStream;

	// When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
	// When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
	// since that's the earliest that a buffer overrun could occur.  This way, checks are
	// as rare as required, but as often as necessary to ensure never crossing this bound.
	// Furthermore, buffers are only tested at most once per write(), so passing a very
	// large string into write() might have undesirable effects, but this is manageable by
	// the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
	// edge case, result in creating at most one complete copy of the string passed in.
	// Set to Infinity to have unlimited buffers.
	sax.MAX_BUFFER_LENGTH = 64 * 1024;

	var buffers = [
	  "comment", "sgmlDecl", "textNode", "tagName", "doctype",
	  "procInstName", "procInstBody", "entity", "attribName",
	  "attribValue", "cdata", "script"
	];

	sax.EVENTS = // for discoverability.
	  [ "text"
	  , "processinginstruction"
	  , "sgmldeclaration"
	  , "doctype"
	  , "comment"
	  , "attribute"
	  , "opentag"
	  , "closetag"
	  , "opencdata"
	  , "cdata"
	  , "closecdata"
	  , "error"
	  , "end"
	  , "ready"
	  , "script"
	  , "opennamespace"
	  , "closenamespace"
	  ];

	function SAXParser (strict, opt) {
	  if (!(this instanceof SAXParser)) return new SAXParser(strict, opt)

	  var parser = this;
	  clearBuffers(parser);
	  parser.q = parser.c = "";
	  parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
	  parser.opt = opt || {};
	  parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
	  parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
	  parser.tags = [];
	  parser.closed = parser.closedRoot = parser.sawRoot = false;
	  parser.tag = parser.error = null;
	  parser.strict = !!strict;
	  parser.noscript = !!(strict || parser.opt.noscript);
	  parser.state = S.BEGIN;
	  parser.ENTITIES = Object.create(sax.ENTITIES);
	  parser.attribList = [];

	  // namespaces form a prototype chain.
	  // it always points at the current tag,
	  // which protos to its parent tag.
	  if (parser.opt.xmlns) parser.ns = Object.create(rootNS);

	  // mostly just for error reporting
	  parser.trackPosition = parser.opt.position !== false;
	  if (parser.trackPosition) {
	    parser.position = parser.line = parser.column = 0;
	  }
	  emit(parser, "onready");
	}

	if (!Object.create) Object.create = function (o) {
	  function f () { this.__proto__ = o; }
	  f.prototype = o;
	  return new f
	};

	if (!Object.getPrototypeOf) Object.getPrototypeOf = function (o) {
	  return o.__proto__
	};

	if (!Object.keys) Object.keys = function (o) {
	  var a = [];
	  for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
	  return a
	};

	function checkBufferLength (parser) {
	  var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
	    , maxActual = 0;
	  for (var i = 0, l = buffers.length; i < l; i ++) {
	    var len = parser[buffers[i]].length;
	    if (len > maxAllowed) {
	      // Text/cdata nodes can get big, and since they're buffered,
	      // we can get here under normal conditions.
	      // Avoid issues by emitting the text node now,
	      // so at least it won't get any bigger.
	      switch (buffers[i]) {
	        case "textNode":
	          closeText(parser);
	        break

	        case "cdata":
	          emitNode(parser, "oncdata", parser.cdata);
	          parser.cdata = "";
	        break

	        case "script":
	          emitNode(parser, "onscript", parser.script);
	          parser.script = "";
	        break

	        default:
	          error(parser, "Max buffer length exceeded: "+buffers[i]);
	      }
	    }
	    maxActual = Math.max(maxActual, len);
	  }
	  // schedule the next check for the earliest possible buffer overrun.
	  parser.bufferCheckPosition = (sax.MAX_BUFFER_LENGTH - maxActual)
	                             + parser.position;
	}

	function clearBuffers (parser) {
	  for (var i = 0, l = buffers.length; i < l; i ++) {
	    parser[buffers[i]] = "";
	  }
	}

	function flushBuffers (parser) {
	  closeText(parser);
	  if (parser.cdata !== "") {
	    emitNode(parser, "oncdata", parser.cdata);
	    parser.cdata = "";
	  }
	  if (parser.script !== "") {
	    emitNode(parser, "onscript", parser.script);
	    parser.script = "";
	  }
	}

	SAXParser.prototype =
	  { end: function () { end(this); }
	  , write: write
	  , resume: function () { this.error = null; return this }
	  , close: function () { return this.write(null) }
	  , flush: function () { flushBuffers(this); }
	  };

	try {
	  var Stream = require$$0.Stream;
	} catch (ex) {
	  var Stream = function () {};
	}


	var streamWraps = sax.EVENTS.filter(function (ev) {
	  return ev !== "error" && ev !== "end"
	});

	function createStream (strict, opt) {
	  return new SAXStream(strict, opt)
	}

	function SAXStream (strict, opt) {
	  if (!(this instanceof SAXStream)) return new SAXStream(strict, opt)

	  Stream.apply(this);

	  this._parser = new SAXParser(strict, opt);
	  this.writable = true;
	  this.readable = true;


	  var me = this;

	  this._parser.onend = function () {
	    me.emit("end");
	  };

	  this._parser.onerror = function (er) {
	    me.emit("error", er);

	    // if didn't throw, then means error was handled.
	    // go ahead and clear error, so we can write again.
	    me._parser.error = null;
	  };

	  this._decoder = null;

	  streamWraps.forEach(function (ev) {
	    Object.defineProperty(me, "on" + ev, {
	      get: function () { return me._parser["on" + ev] },
	      set: function (h) {
	        if (!h) {
	          me.removeAllListeners(ev);
	          return me._parser["on"+ev] = h
	        }
	        me.on(ev, h);
	      },
	      enumerable: true,
	      configurable: false
	    });
	  });
	}

	SAXStream.prototype = Object.create(Stream.prototype,
	  { constructor: { value: SAXStream } });

	SAXStream.prototype.write = function (data) {
	  if (typeof Buffer === 'function' &&
	      typeof Buffer.isBuffer === 'function' &&
	      Buffer.isBuffer(data)) {
	    if (!this._decoder) {
	      var SD = require$$1.StringDecoder;
	      this._decoder = new SD('utf8');
	    }
	    data = this._decoder.write(data);
	  }

	  this._parser.write(data.toString());
	  this.emit("data", data);
	  return true
	};

	SAXStream.prototype.end = function (chunk) {
	  if (chunk && chunk.length) this.write(chunk);
	  this._parser.end();
	  return true
	};

	SAXStream.prototype.on = function (ev, handler) {
	  var me = this;
	  if (!me._parser["on"+ev] && streamWraps.indexOf(ev) !== -1) {
	    me._parser["on"+ev] = function () {
	      var args = arguments.length === 1 ? [arguments[0]]
	               : Array.apply(null, arguments);
	      args.splice(0, 0, ev);
	      me.emit.apply(me, args);
	    };
	  }

	  return Stream.prototype.on.call(me, ev, handler)
	};



	// character classes and tokens
	var whitespace = "\r\n\t "
	  // this really needs to be replaced with character classes.
	  // XML allows all manner of ridiculous numbers and digits.
	  , number = "0124356789"
	  , letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	  // (Letter | "_" | ":")
	  , quote = "'\""
	  , entity = number+letter+"#"
	  , attribEnd = whitespace + ">"
	  , CDATA = "[CDATA["
	  , DOCTYPE = "DOCTYPE"
	  , XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"
	  , XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/"
	  , rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };

	// turn all the string character sets into character class objects.
	whitespace = charClass(whitespace);
	number = charClass(number);
	letter = charClass(letter);

	// http://www.w3.org/TR/REC-xml/#NT-NameStartChar
	// This implementation works on strings, a single character at a time
	// as such, it cannot ever support astral-plane characters (10000-EFFFF)
	// without a significant breaking change to either this  parser, or the
	// JavaScript language.  Implementation of an emoji-capable xml parser
	// is left as an exercise for the reader.
	var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;

	var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/;

	quote = charClass(quote);
	entity = charClass(entity);
	attribEnd = charClass(attribEnd);

	function charClass (str) {
	  return str.split("").reduce(function (s, c) {
	    s[c] = true;
	    return s
	  }, {})
	}

	function isRegExp (c) {
	  return Object.prototype.toString.call(c) === '[object RegExp]'
	}

	function is (charclass, c) {
	  return isRegExp(charclass) ? !!c.match(charclass) : charclass[c]
	}

	function not (charclass, c) {
	  return !is(charclass, c)
	}

	var S = 0;
	sax.STATE =
	{ BEGIN                     : S++
	, TEXT                      : S++ // general stuff
	, TEXT_ENTITY               : S++ // &amp and such.
	, OPEN_WAKA                 : S++ // <
	, SGML_DECL                 : S++ // <!BLARG
	, SGML_DECL_QUOTED          : S++ // <!BLARG foo "bar
	, DOCTYPE                   : S++ // <!DOCTYPE
	, DOCTYPE_QUOTED            : S++ // <!DOCTYPE "//blah
	, DOCTYPE_DTD               : S++ // <!DOCTYPE "//blah" [ ...
	, DOCTYPE_DTD_QUOTED        : S++ // <!DOCTYPE "//blah" [ "foo
	, COMMENT_STARTING          : S++ // <!-
	, COMMENT                   : S++ // <!--
	, COMMENT_ENDING            : S++ // <!-- blah -
	, COMMENT_ENDED             : S++ // <!-- blah --
	, CDATA                     : S++ // <![CDATA[ something
	, CDATA_ENDING              : S++ // ]
	, CDATA_ENDING_2            : S++ // ]]
	, PROC_INST                 : S++ // <?hi
	, PROC_INST_BODY            : S++ // <?hi there
	, PROC_INST_ENDING          : S++ // <?hi "there" ?
	, OPEN_TAG                  : S++ // <strong
	, OPEN_TAG_SLASH            : S++ // <strong /
	, ATTRIB                    : S++ // <a
	, ATTRIB_NAME               : S++ // <a foo
	, ATTRIB_NAME_SAW_WHITE     : S++ // <a foo _
	, ATTRIB_VALUE              : S++ // <a foo=
	, ATTRIB_VALUE_QUOTED       : S++ // <a foo="bar
	, ATTRIB_VALUE_CLOSED       : S++ // <a foo="bar"
	, ATTRIB_VALUE_UNQUOTED     : S++ // <a foo=bar
	, ATTRIB_VALUE_ENTITY_Q     : S++ // <foo bar="&quot;"
	, ATTRIB_VALUE_ENTITY_U     : S++ // <foo bar=&quot;
	, CLOSE_TAG                 : S++ // </a
	, CLOSE_TAG_SAW_WHITE       : S++ // </a   >
	, SCRIPT                    : S++ // <script> ...
	, SCRIPT_ENDING             : S++ // <script> ... <
	};

	sax.ENTITIES =
	{ "amp" : "&"
	, "gt" : ">"
	, "lt" : "<"
	, "quot" : "\""
	, "apos" : "'"
	, "AElig" : 198
	, "Aacute" : 193
	, "Acirc" : 194
	, "Agrave" : 192
	, "Aring" : 197
	, "Atilde" : 195
	, "Auml" : 196
	, "Ccedil" : 199
	, "ETH" : 208
	, "Eacute" : 201
	, "Ecirc" : 202
	, "Egrave" : 200
	, "Euml" : 203
	, "Iacute" : 205
	, "Icirc" : 206
	, "Igrave" : 204
	, "Iuml" : 207
	, "Ntilde" : 209
	, "Oacute" : 211
	, "Ocirc" : 212
	, "Ograve" : 210
	, "Oslash" : 216
	, "Otilde" : 213
	, "Ouml" : 214
	, "THORN" : 222
	, "Uacute" : 218
	, "Ucirc" : 219
	, "Ugrave" : 217
	, "Uuml" : 220
	, "Yacute" : 221
	, "aacute" : 225
	, "acirc" : 226
	, "aelig" : 230
	, "agrave" : 224
	, "aring" : 229
	, "atilde" : 227
	, "auml" : 228
	, "ccedil" : 231
	, "eacute" : 233
	, "ecirc" : 234
	, "egrave" : 232
	, "eth" : 240
	, "euml" : 235
	, "iacute" : 237
	, "icirc" : 238
	, "igrave" : 236
	, "iuml" : 239
	, "ntilde" : 241
	, "oacute" : 243
	, "ocirc" : 244
	, "ograve" : 242
	, "oslash" : 248
	, "otilde" : 245
	, "ouml" : 246
	, "szlig" : 223
	, "thorn" : 254
	, "uacute" : 250
	, "ucirc" : 251
	, "ugrave" : 249
	, "uuml" : 252
	, "yacute" : 253
	, "yuml" : 255
	, "copy" : 169
	, "reg" : 174
	, "nbsp" : 160
	, "iexcl" : 161
	, "cent" : 162
	, "pound" : 163
	, "curren" : 164
	, "yen" : 165
	, "brvbar" : 166
	, "sect" : 167
	, "uml" : 168
	, "ordf" : 170
	, "laquo" : 171
	, "not" : 172
	, "shy" : 173
	, "macr" : 175
	, "deg" : 176
	, "plusmn" : 177
	, "sup1" : 185
	, "sup2" : 178
	, "sup3" : 179
	, "acute" : 180
	, "micro" : 181
	, "para" : 182
	, "middot" : 183
	, "cedil" : 184
	, "ordm" : 186
	, "raquo" : 187
	, "frac14" : 188
	, "frac12" : 189
	, "frac34" : 190
	, "iquest" : 191
	, "times" : 215
	, "divide" : 247
	, "OElig" : 338
	, "oelig" : 339
	, "Scaron" : 352
	, "scaron" : 353
	, "Yuml" : 376
	, "fnof" : 402
	, "circ" : 710
	, "tilde" : 732
	, "Alpha" : 913
	, "Beta" : 914
	, "Gamma" : 915
	, "Delta" : 916
	, "Epsilon" : 917
	, "Zeta" : 918
	, "Eta" : 919
	, "Theta" : 920
	, "Iota" : 921
	, "Kappa" : 922
	, "Lambda" : 923
	, "Mu" : 924
	, "Nu" : 925
	, "Xi" : 926
	, "Omicron" : 927
	, "Pi" : 928
	, "Rho" : 929
	, "Sigma" : 931
	, "Tau" : 932
	, "Upsilon" : 933
	, "Phi" : 934
	, "Chi" : 935
	, "Psi" : 936
	, "Omega" : 937
	, "alpha" : 945
	, "beta" : 946
	, "gamma" : 947
	, "delta" : 948
	, "epsilon" : 949
	, "zeta" : 950
	, "eta" : 951
	, "theta" : 952
	, "iota" : 953
	, "kappa" : 954
	, "lambda" : 955
	, "mu" : 956
	, "nu" : 957
	, "xi" : 958
	, "omicron" : 959
	, "pi" : 960
	, "rho" : 961
	, "sigmaf" : 962
	, "sigma" : 963
	, "tau" : 964
	, "upsilon" : 965
	, "phi" : 966
	, "chi" : 967
	, "psi" : 968
	, "omega" : 969
	, "thetasym" : 977
	, "upsih" : 978
	, "piv" : 982
	, "ensp" : 8194
	, "emsp" : 8195
	, "thinsp" : 8201
	, "zwnj" : 8204
	, "zwj" : 8205
	, "lrm" : 8206
	, "rlm" : 8207
	, "ndash" : 8211
	, "mdash" : 8212
	, "lsquo" : 8216
	, "rsquo" : 8217
	, "sbquo" : 8218
	, "ldquo" : 8220
	, "rdquo" : 8221
	, "bdquo" : 8222
	, "dagger" : 8224
	, "Dagger" : 8225
	, "bull" : 8226
	, "hellip" : 8230
	, "permil" : 8240
	, "prime" : 8242
	, "Prime" : 8243
	, "lsaquo" : 8249
	, "rsaquo" : 8250
	, "oline" : 8254
	, "frasl" : 8260
	, "euro" : 8364
	, "image" : 8465
	, "weierp" : 8472
	, "real" : 8476
	, "trade" : 8482
	, "alefsym" : 8501
	, "larr" : 8592
	, "uarr" : 8593
	, "rarr" : 8594
	, "darr" : 8595
	, "harr" : 8596
	, "crarr" : 8629
	, "lArr" : 8656
	, "uArr" : 8657
	, "rArr" : 8658
	, "dArr" : 8659
	, "hArr" : 8660
	, "forall" : 8704
	, "part" : 8706
	, "exist" : 8707
	, "empty" : 8709
	, "nabla" : 8711
	, "isin" : 8712
	, "notin" : 8713
	, "ni" : 8715
	, "prod" : 8719
	, "sum" : 8721
	, "minus" : 8722
	, "lowast" : 8727
	, "radic" : 8730
	, "prop" : 8733
	, "infin" : 8734
	, "ang" : 8736
	, "and" : 8743
	, "or" : 8744
	, "cap" : 8745
	, "cup" : 8746
	, "int" : 8747
	, "there4" : 8756
	, "sim" : 8764
	, "cong" : 8773
	, "asymp" : 8776
	, "ne" : 8800
	, "equiv" : 8801
	, "le" : 8804
	, "ge" : 8805
	, "sub" : 8834
	, "sup" : 8835
	, "nsub" : 8836
	, "sube" : 8838
	, "supe" : 8839
	, "oplus" : 8853
	, "otimes" : 8855
	, "perp" : 8869
	, "sdot" : 8901
	, "lceil" : 8968
	, "rceil" : 8969
	, "lfloor" : 8970
	, "rfloor" : 8971
	, "lang" : 9001
	, "rang" : 9002
	, "loz" : 9674
	, "spades" : 9824
	, "clubs" : 9827
	, "hearts" : 9829
	, "diams" : 9830
	};

	Object.keys(sax.ENTITIES).forEach(function (key) {
	    var e = sax.ENTITIES[key];
	    var s = typeof e === 'number' ? String.fromCharCode(e) : e;
	    sax.ENTITIES[key] = s;
	});

	for (var S in sax.STATE) sax.STATE[sax.STATE[S]] = S;

	// shorthand
	S = sax.STATE;

	function emit (parser, event, data) {
	  parser[event] && parser[event](data);
	}

	function emitNode (parser, nodeType, data) {
	  if (parser.textNode) closeText(parser);
	  emit(parser, nodeType, data);
	}

	function closeText (parser) {
	  parser.textNode = textopts(parser.opt, parser.textNode);
	  if (parser.textNode) emit(parser, "ontext", parser.textNode);
	  parser.textNode = "";
	}

	function textopts (opt, text) {
	  if (opt.trim) text = text.trim();
	  if (opt.normalize) text = text.replace(/\s+/g, " ");
	  return text
	}

	function error (parser, er) {
	  closeText(parser);
	  if (parser.trackPosition) {
	    er += "\nLine: "+parser.line+
	          "\nColumn: "+parser.column+
	          "\nChar: "+parser.c;
	  }
	  er = new Error(er);
	  parser.error = er;
	  emit(parser, "onerror", er);
	  return parser
	}

	function end (parser) {
	  if (!parser.closedRoot) strictFail(parser, "Unclosed root tag");
	  if ((parser.state !== S.BEGIN) && (parser.state !== S.TEXT)) error(parser, "Unexpected end");
	  closeText(parser);
	  parser.c = "";
	  parser.closed = true;
	  emit(parser, "onend");
	  SAXParser.call(parser, parser.strict, parser.opt);
	  return parser
	}

	function strictFail (parser, message) {
	  if (typeof parser !== 'object' || !(parser instanceof SAXParser))
	    throw new Error('bad call to strictFail');
	  if (parser.strict) error(parser, message);
	}

	function newTag (parser) {
	  if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
	  var parent = parser.tags[parser.tags.length - 1] || parser
	    , tag = parser.tag = { name : parser.tagName, attributes : {} };

	  // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
	  if (parser.opt.xmlns) tag.ns = parent.ns;
	  parser.attribList.length = 0;
	}

	function qname (name, attribute) {
	  var i = name.indexOf(":")
	    , qualName = i < 0 ? [ "", name ] : name.split(":")
	    , prefix = qualName[0]
	    , local = qualName[1];

	  // <x "xmlns"="http://foo">
	  if (attribute && name === "xmlns") {
	    prefix = "xmlns";
	    local = "";
	  }

	  return { prefix: prefix, local: local }
	}

	function attrib (parser) {
	  if (!parser.strict) parser.attribName = parser.attribName[parser.looseCase]();

	  if (parser.attribList.indexOf(parser.attribName) !== -1 ||
	      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
	    return parser.attribName = parser.attribValue = ""
	  }

	  if (parser.opt.xmlns) {
	    var qn = qname(parser.attribName, true)
	      , prefix = qn.prefix
	      , local = qn.local;

	    if (prefix === "xmlns") {
	      // namespace binding attribute; push the binding into scope
	      if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
	        strictFail( parser
	                  , "xml: prefix must be bound to " + XML_NAMESPACE + "\n"
	                  + "Actual: " + parser.attribValue );
	      } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
	        strictFail( parser
	                  , "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\n"
	                  + "Actual: " + parser.attribValue );
	      } else {
	        var tag = parser.tag
	          , parent = parser.tags[parser.tags.length - 1] || parser;
	        if (tag.ns === parent.ns) {
	          tag.ns = Object.create(parent.ns);
	        }
	        tag.ns[local] = parser.attribValue;
	      }
	    }

	    // defer onattribute events until all attributes have been seen
	    // so any new bindings can take effect; preserve attribute order
	    // so deferred events can be emitted in document order
	    parser.attribList.push([parser.attribName, parser.attribValue]);
	  } else {
	    // in non-xmlns mode, we can emit the event right away
	    parser.tag.attributes[parser.attribName] = parser.attribValue;
	    emitNode( parser
	            , "onattribute"
	            , { name: parser.attribName
	              , value: parser.attribValue } );
	  }

	  parser.attribName = parser.attribValue = "";
	}

	function openTag (parser, selfClosing) {
	  if (parser.opt.xmlns) {
	    // emit namespace binding events
	    var tag = parser.tag;

	    // add namespace info to tag
	    var qn = qname(parser.tagName);
	    tag.prefix = qn.prefix;
	    tag.local = qn.local;
	    tag.uri = tag.ns[qn.prefix] || "";

	    if (tag.prefix && !tag.uri) {
	      strictFail(parser, "Unbound namespace prefix: "
	                       + JSON.stringify(parser.tagName));
	      tag.uri = qn.prefix;
	    }

	    var parent = parser.tags[parser.tags.length - 1] || parser;
	    if (tag.ns && parent.ns !== tag.ns) {
	      Object.keys(tag.ns).forEach(function (p) {
	        emitNode( parser
	                , "onopennamespace"
	                , { prefix: p , uri: tag.ns[p] } );
	      });
	    }

	    // handle deferred onattribute events
	    // Note: do not apply default ns to attributes:
	    //   http://www.w3.org/TR/REC-xml-names/#defaulting
	    for (var i = 0, l = parser.attribList.length; i < l; i ++) {
	      var nv = parser.attribList[i];
	      var name = nv[0]
	        , value = nv[1]
	        , qualName = qname(name, true)
	        , prefix = qualName.prefix
	        , local = qualName.local
	        , uri = prefix == "" ? "" : (tag.ns[prefix] || "")
	        , a = { name: name
	              , value: value
	              , prefix: prefix
	              , local: local
	              , uri: uri
	              };

	      // if there's any attributes with an undefined namespace,
	      // then fail on them now.
	      if (prefix && prefix != "xmlns" && !uri) {
	        strictFail(parser, "Unbound namespace prefix: "
	                         + JSON.stringify(prefix));
	        a.uri = prefix;
	      }
	      parser.tag.attributes[name] = a;
	      emitNode(parser, "onattribute", a);
	    }
	    parser.attribList.length = 0;
	  }

	  parser.tag.isSelfClosing = !!selfClosing;

	  // process the tag
	  parser.sawRoot = true;
	  parser.tags.push(parser.tag);
	  emitNode(parser, "onopentag", parser.tag);
	  if (!selfClosing) {
	    // special case for <script> in non-strict mode.
	    if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
	      parser.state = S.SCRIPT;
	    } else {
	      parser.state = S.TEXT;
	    }
	    parser.tag = null;
	    parser.tagName = "";
	  }
	  parser.attribName = parser.attribValue = "";
	  parser.attribList.length = 0;
	}

	function closeTag (parser) {
	  if (!parser.tagName) {
	    strictFail(parser, "Weird empty close tag.");
	    parser.textNode += "</>";
	    parser.state = S.TEXT;
	    return
	  }

	  if (parser.script) {
	    if (parser.tagName !== "script") {
	      parser.script += "</" + parser.tagName + ">";
	      parser.tagName = "";
	      parser.state = S.SCRIPT;
	      return
	    }
	    emitNode(parser, "onscript", parser.script);
	    parser.script = "";
	  }

	  // first make sure that the closing tag actually exists.
	  // <a><b></c></b></a> will close everything, otherwise.
	  var t = parser.tags.length;
	  var tagName = parser.tagName;
	  if (!parser.strict) tagName = tagName[parser.looseCase]();
	  var closeTo = tagName;
	  while (t --) {
	    var close = parser.tags[t];
	    if (close.name !== closeTo) {
	      // fail the first time in strict mode
	      strictFail(parser, "Unexpected close tag");
	    } else break
	  }

	  // didn't find it.  we already failed for strict, so just abort.
	  if (t < 0) {
	    strictFail(parser, "Unmatched closing tag: "+parser.tagName);
	    parser.textNode += "</" + parser.tagName + ">";
	    parser.state = S.TEXT;
	    return
	  }
	  parser.tagName = tagName;
	  var s = parser.tags.length;
	  while (s --> t) {
	    var tag = parser.tag = parser.tags.pop();
	    parser.tagName = parser.tag.name;
	    emitNode(parser, "onclosetag", parser.tagName);

	    var x = {};
	    for (var i in tag.ns) x[i] = tag.ns[i];

	    var parent = parser.tags[parser.tags.length - 1] || parser;
	    if (parser.opt.xmlns && tag.ns !== parent.ns) {
	      // remove namespace bindings introduced by tag
	      Object.keys(tag.ns).forEach(function (p) {
	        var n = tag.ns[p];
	        emitNode(parser, "onclosenamespace", { prefix: p, uri: n });
	      });
	    }
	  }
	  if (t === 0) parser.closedRoot = true;
	  parser.tagName = parser.attribValue = parser.attribName = "";
	  parser.attribList.length = 0;
	  parser.state = S.TEXT;
	}

	function parseEntity (parser) {
	  var entity = parser.entity
	    , entityLC = entity.toLowerCase()
	    , num
	    , numStr = "";
	  if (parser.ENTITIES[entity])
	    return parser.ENTITIES[entity]
	  if (parser.ENTITIES[entityLC])
	    return parser.ENTITIES[entityLC]
	  entity = entityLC;
	  if (entity.charAt(0) === "#") {
	    if (entity.charAt(1) === "x") {
	      entity = entity.slice(2);
	      num = parseInt(entity, 16);
	      numStr = num.toString(16);
	    } else {
	      entity = entity.slice(1);
	      num = parseInt(entity, 10);
	      numStr = num.toString(10);
	    }
	  }
	  entity = entity.replace(/^0+/, "");
	  if (numStr.toLowerCase() !== entity) {
	    strictFail(parser, "Invalid character entity");
	    return "&"+parser.entity + ";"
	  }
	  return String.fromCharCode(num)
	}

	function write (chunk) {
	  var parser = this;
	  if (this.error) throw this.error
	  if (parser.closed) return error(parser,
	    "Cannot write after close. Assign an onready handler.")
	  if (chunk === null) return end(parser)
	  var i = 0, c = "";
	  while (parser.c = c = chunk.charAt(i++)) {
	    if (parser.trackPosition) {
	      parser.position ++;
	      if (c === "\n") {
	        parser.line ++;
	        parser.column = 0;
	      } else parser.column ++;
	    }
	    switch (parser.state) {

	      case S.BEGIN:
	        if (c === "<") {
	          parser.state = S.OPEN_WAKA;
	          parser.startTagPosition = parser.position;
	        } else if (not(whitespace,c)) {
	          // have to process this as a text node.
	          // weird, but happens.
	          strictFail(parser, "Non-whitespace before first tag.");
	          parser.textNode = c;
	          parser.state = S.TEXT;
	        }
	      continue

	      case S.TEXT:
	        if (parser.sawRoot && !parser.closedRoot) {
	          var starti = i-1;
	          while (c && c!=="<" && c!=="&") {
	            c = chunk.charAt(i++);
	            if (c && parser.trackPosition) {
	              parser.position ++;
	              if (c === "\n") {
	                parser.line ++;
	                parser.column = 0;
	              } else parser.column ++;
	            }
	          }
	          parser.textNode += chunk.substring(starti, i-1);
	        }
	        if (c === "<") {
	          parser.state = S.OPEN_WAKA;
	          parser.startTagPosition = parser.position;
	        } else {
	          if (not(whitespace, c) && (!parser.sawRoot || parser.closedRoot))
	            strictFail(parser, "Text data outside of root node.");
	          if (c === "&") parser.state = S.TEXT_ENTITY;
	          else parser.textNode += c;
	        }
	      continue

	      case S.SCRIPT:
	        // only non-strict
	        if (c === "<") {
	          parser.state = S.SCRIPT_ENDING;
	        } else parser.script += c;
	      continue

	      case S.SCRIPT_ENDING:
	        if (c === "/") {
	          parser.state = S.CLOSE_TAG;
	        } else {
	          parser.script += "<" + c;
	          parser.state = S.SCRIPT;
	        }
	      continue

	      case S.OPEN_WAKA:
	        // either a /, ?, !, or text is coming next.
	        if (c === "!") {
	          parser.state = S.SGML_DECL;
	          parser.sgmlDecl = "";
	        } else if (is(whitespace, c)) ; else if (is(nameStart,c)) {
	          parser.state = S.OPEN_TAG;
	          parser.tagName = c;
	        } else if (c === "/") {
	          parser.state = S.CLOSE_TAG;
	          parser.tagName = "";
	        } else if (c === "?") {
	          parser.state = S.PROC_INST;
	          parser.procInstName = parser.procInstBody = "";
	        } else {
	          strictFail(parser, "Unencoded <");
	          // if there was some whitespace, then add that in.
	          if (parser.startTagPosition + 1 < parser.position) {
	            var pad = parser.position - parser.startTagPosition;
	            c = new Array(pad).join(" ") + c;
	          }
	          parser.textNode += "<" + c;
	          parser.state = S.TEXT;
	        }
	      continue

	      case S.SGML_DECL:
	        if ((parser.sgmlDecl+c).toUpperCase() === CDATA) {
	          emitNode(parser, "onopencdata");
	          parser.state = S.CDATA;
	          parser.sgmlDecl = "";
	          parser.cdata = "";
	        } else if (parser.sgmlDecl+c === "--") {
	          parser.state = S.COMMENT;
	          parser.comment = "";
	          parser.sgmlDecl = "";
	        } else if ((parser.sgmlDecl+c).toUpperCase() === DOCTYPE) {
	          parser.state = S.DOCTYPE;
	          if (parser.doctype || parser.sawRoot) strictFail(parser,
	            "Inappropriately located doctype declaration");
	          parser.doctype = "";
	          parser.sgmlDecl = "";
	        } else if (c === ">") {
	          emitNode(parser, "onsgmldeclaration", parser.sgmlDecl);
	          parser.sgmlDecl = "";
	          parser.state = S.TEXT;
	        } else if (is(quote, c)) {
	          parser.state = S.SGML_DECL_QUOTED;
	          parser.sgmlDecl += c;
	        } else parser.sgmlDecl += c;
	      continue

	      case S.SGML_DECL_QUOTED:
	        if (c === parser.q) {
	          parser.state = S.SGML_DECL;
	          parser.q = "";
	        }
	        parser.sgmlDecl += c;
	      continue

	      case S.DOCTYPE:
	        if (c === ">") {
	          parser.state = S.TEXT;
	          emitNode(parser, "ondoctype", parser.doctype);
	          parser.doctype = true; // just remember that we saw it.
	        } else {
	          parser.doctype += c;
	          if (c === "[") parser.state = S.DOCTYPE_DTD;
	          else if (is(quote, c)) {
	            parser.state = S.DOCTYPE_QUOTED;
	            parser.q = c;
	          }
	        }
	      continue

	      case S.DOCTYPE_QUOTED:
	        parser.doctype += c;
	        if (c === parser.q) {
	          parser.q = "";
	          parser.state = S.DOCTYPE;
	        }
	      continue

	      case S.DOCTYPE_DTD:
	        parser.doctype += c;
	        if (c === "]") parser.state = S.DOCTYPE;
	        else if (is(quote,c)) {
	          parser.state = S.DOCTYPE_DTD_QUOTED;
	          parser.q = c;
	        }
	      continue

	      case S.DOCTYPE_DTD_QUOTED:
	        parser.doctype += c;
	        if (c === parser.q) {
	          parser.state = S.DOCTYPE_DTD;
	          parser.q = "";
	        }
	      continue

	      case S.COMMENT:
	        if (c === "-") parser.state = S.COMMENT_ENDING;
	        else parser.comment += c;
	      continue

	      case S.COMMENT_ENDING:
	        if (c === "-") {
	          parser.state = S.COMMENT_ENDED;
	          parser.comment = textopts(parser.opt, parser.comment);
	          if (parser.comment) emitNode(parser, "oncomment", parser.comment);
	          parser.comment = "";
	        } else {
	          parser.comment += "-" + c;
	          parser.state = S.COMMENT;
	        }
	      continue

	      case S.COMMENT_ENDED:
	        if (c !== ">") {
	          strictFail(parser, "Malformed comment");
	          // allow <!-- blah -- bloo --> in non-strict mode,
	          // which is a comment of " blah -- bloo "
	          parser.comment += "--" + c;
	          parser.state = S.COMMENT;
	        } else parser.state = S.TEXT;
	      continue

	      case S.CDATA:
	        if (c === "]") parser.state = S.CDATA_ENDING;
	        else parser.cdata += c;
	      continue

	      case S.CDATA_ENDING:
	        if (c === "]") parser.state = S.CDATA_ENDING_2;
	        else {
	          parser.cdata += "]" + c;
	          parser.state = S.CDATA;
	        }
	      continue

	      case S.CDATA_ENDING_2:
	        if (c === ">") {
	          if (parser.cdata) emitNode(parser, "oncdata", parser.cdata);
	          emitNode(parser, "onclosecdata");
	          parser.cdata = "";
	          parser.state = S.TEXT;
	        } else if (c === "]") {
	          parser.cdata += "]";
	        } else {
	          parser.cdata += "]]" + c;
	          parser.state = S.CDATA;
	        }
	      continue

	      case S.PROC_INST:
	        if (c === "?") parser.state = S.PROC_INST_ENDING;
	        else if (is(whitespace, c)) parser.state = S.PROC_INST_BODY;
	        else parser.procInstName += c;
	      continue

	      case S.PROC_INST_BODY:
	        if (!parser.procInstBody && is(whitespace, c)) continue
	        else if (c === "?") parser.state = S.PROC_INST_ENDING;
	        else parser.procInstBody += c;
	      continue

	      case S.PROC_INST_ENDING:
	        if (c === ">") {
	          emitNode(parser, "onprocessinginstruction", {
	            name : parser.procInstName,
	            body : parser.procInstBody
	          });
	          parser.procInstName = parser.procInstBody = "";
	          parser.state = S.TEXT;
	        } else {
	          parser.procInstBody += "?" + c;
	          parser.state = S.PROC_INST_BODY;
	        }
	      continue

	      case S.OPEN_TAG:
	        if (is(nameBody, c)) parser.tagName += c;
	        else {
	          newTag(parser);
	          if (c === ">") openTag(parser);
	          else if (c === "/") parser.state = S.OPEN_TAG_SLASH;
	          else {
	            if (not(whitespace, c)) strictFail(
	              parser, "Invalid character in tag name");
	            parser.state = S.ATTRIB;
	          }
	        }
	      continue

	      case S.OPEN_TAG_SLASH:
	        if (c === ">") {
	          openTag(parser, true);
	          closeTag(parser);
	        } else {
	          strictFail(parser, "Forward-slash in opening tag not followed by >");
	          parser.state = S.ATTRIB;
	        }
	      continue

	      case S.ATTRIB:
	        // haven't read the attribute name yet.
	        if (is(whitespace, c)) continue
	        else if (c === ">") openTag(parser);
	        else if (c === "/") parser.state = S.OPEN_TAG_SLASH;
	        else if (is(nameStart, c)) {
	          parser.attribName = c;
	          parser.attribValue = "";
	          parser.state = S.ATTRIB_NAME;
	        } else strictFail(parser, "Invalid attribute name");
	      continue

	      case S.ATTRIB_NAME:
	        if (c === "=") parser.state = S.ATTRIB_VALUE;
	        else if (c === ">") {
	          strictFail(parser, "Attribute without value");
	          parser.attribValue = parser.attribName;
	          attrib(parser);
	          openTag(parser);
	        }
	        else if (is(whitespace, c)) parser.state = S.ATTRIB_NAME_SAW_WHITE;
	        else if (is(nameBody, c)) parser.attribName += c;
	        else strictFail(parser, "Invalid attribute name");
	      continue

	      case S.ATTRIB_NAME_SAW_WHITE:
	        if (c === "=") parser.state = S.ATTRIB_VALUE;
	        else if (is(whitespace, c)) continue
	        else {
	          strictFail(parser, "Attribute without value");
	          parser.tag.attributes[parser.attribName] = "";
	          parser.attribValue = "";
	          emitNode(parser, "onattribute",
	                   { name : parser.attribName, value : "" });
	          parser.attribName = "";
	          if (c === ">") openTag(parser);
	          else if (is(nameStart, c)) {
	            parser.attribName = c;
	            parser.state = S.ATTRIB_NAME;
	          } else {
	            strictFail(parser, "Invalid attribute name");
	            parser.state = S.ATTRIB;
	          }
	        }
	      continue

	      case S.ATTRIB_VALUE:
	        if (is(whitespace, c)) continue
	        else if (is(quote, c)) {
	          parser.q = c;
	          parser.state = S.ATTRIB_VALUE_QUOTED;
	        } else {
	          strictFail(parser, "Unquoted attribute value");
	          parser.state = S.ATTRIB_VALUE_UNQUOTED;
	          parser.attribValue = c;
	        }
	      continue

	      case S.ATTRIB_VALUE_QUOTED:
	        if (c !== parser.q) {
	          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_Q;
	          else parser.attribValue += c;
	          continue
	        }
	        attrib(parser);
	        parser.q = "";
	        parser.state = S.ATTRIB_VALUE_CLOSED;
	      continue

	      case S.ATTRIB_VALUE_CLOSED:
	        if (is(whitespace, c)) {
	          parser.state = S.ATTRIB;
	        } else if (c === ">") openTag(parser);
	        else if (c === "/") parser.state = S.OPEN_TAG_SLASH;
	        else if (is(nameStart, c)) {
	          strictFail(parser, "No whitespace between attributes");
	          parser.attribName = c;
	          parser.attribValue = "";
	          parser.state = S.ATTRIB_NAME;
	        } else strictFail(parser, "Invalid attribute name");
	      continue

	      case S.ATTRIB_VALUE_UNQUOTED:
	        if (not(attribEnd,c)) {
	          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_U;
	          else parser.attribValue += c;
	          continue
	        }
	        attrib(parser);
	        if (c === ">") openTag(parser);
	        else parser.state = S.ATTRIB;
	      continue

	      case S.CLOSE_TAG:
	        if (!parser.tagName) {
	          if (is(whitespace, c)) continue
	          else if (not(nameStart, c)) {
	            if (parser.script) {
	              parser.script += "</" + c;
	              parser.state = S.SCRIPT;
	            } else {
	              strictFail(parser, "Invalid tagname in closing tag.");
	            }
	          } else parser.tagName = c;
	        }
	        else if (c === ">") closeTag(parser);
	        else if (is(nameBody, c)) parser.tagName += c;
	        else if (parser.script) {
	          parser.script += "</" + parser.tagName;
	          parser.tagName = "";
	          parser.state = S.SCRIPT;
	        } else {
	          if (not(whitespace, c)) strictFail(parser,
	            "Invalid tagname in closing tag");
	          parser.state = S.CLOSE_TAG_SAW_WHITE;
	        }
	      continue

	      case S.CLOSE_TAG_SAW_WHITE:
	        if (is(whitespace, c)) continue
	        if (c === ">") closeTag(parser);
	        else strictFail(parser, "Invalid characters in closing tag");
	      continue

	      case S.TEXT_ENTITY:
	      case S.ATTRIB_VALUE_ENTITY_Q:
	      case S.ATTRIB_VALUE_ENTITY_U:
	        switch(parser.state) {
	          case S.TEXT_ENTITY:
	            var returnState = S.TEXT, buffer = "textNode";
	          break

	          case S.ATTRIB_VALUE_ENTITY_Q:
	            var returnState = S.ATTRIB_VALUE_QUOTED, buffer = "attribValue";
	          break

	          case S.ATTRIB_VALUE_ENTITY_U:
	            var returnState = S.ATTRIB_VALUE_UNQUOTED, buffer = "attribValue";
	          break
	        }
	        if (c === ";") {
	          parser[buffer] += parseEntity(parser);
	          parser.entity = "";
	          parser.state = returnState;
	        }
	        else if (is(entity, c)) parser.entity += c;
	        else {
	          strictFail(parser, "Invalid character entity");
	          parser[buffer] += "&" + parser.entity + c;
	          parser.entity = "";
	          parser.state = returnState;
	        }
	      continue

	      default:
	        throw new Error(parser, "Unknown state: " + parser.state)
	    }
	  } // while
	  // cdata blocks can get very big under normal conditions. emit and move on.
	  // if (parser.state === S.CDATA && parser.cdata) {
	  //   emitNode(parser, "oncdata", parser.cdata)
	  //   parser.cdata = ""
	  // }
	  if (parser.position >= parser.bufferCheckPosition) checkBufferLength(parser);
	  return parser
	}

	})(exports);
} (sax));

var hasRequiredImage;

function requireImage () {
	if (hasRequiredImage) return imageExports;
	hasRequiredImage = 1;
	/*!
	 * Stylus - plugin - url
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var utils = requireUtils()
	  ; requireNodes()
	  ; var fs = require$$0$1
	  , path = require$$7
	  , sax$1 = sax;

	/**
	 * Initialize a new `Image` with the given `ctx` and `path.
	 *
	 * @param {Evaluator} ctx
	 * @param {String} path
	 * @api private
	 */

	var Image = image.exports = function Image(ctx, path) {
	  this.ctx = ctx;
	  this.path = utils.lookup(path, ctx.paths);
	  if (!this.path) throw new Error('failed to locate file ' + path);
	};

	/**
	 * Open the image for reading.
	 *
	 * @api private
	 */

	Image.prototype.open = function(){
	  this.fd = fs.openSync(this.path, 'r');
	  this.length = fs.fstatSync(this.fd).size;
	  this.extname = path.extname(this.path).slice(1);
	};

	/**
	 * Close the file.
	 *
	 * @api private
	 */

	Image.prototype.close = function(){
	  if (this.fd) fs.closeSync(this.fd);
	};

	/**
	 * Return the type of image, supports:
	 *
	 *  - gif
	 *  - png
	 *  - jpeg
	 *  - svg
	 *
	 * @return {String}
	 * @api private
	 */

	Image.prototype.type = function(){
	  var type
	    , buf = new Buffer(4);
	  
	  fs.readSync(this.fd, buf, 0, 4, 0);

	  // GIF
	  if (0x47 == buf[0] && 0x49 == buf[1] && 0x46 == buf[2]) type = 'gif';

	  // PNG
	  else if (0x50 == buf[1] && 0x4E == buf[2] && 0x47 == buf[3]) type = 'png';

	  // JPEG
	  else if (0xff == buf[0] && 0xd8 == buf[1]) type = 'jpeg';

	  // SVG
	  else if ('svg' == this.extname) type = this.extname;

	  return type;
	};

	/**
	 * Return image dimensions `[width, height]`.
	 *
	 * @return {Array}
	 * @api private
	 */

	Image.prototype.size = function(){
	  var type = this.type()
	    , width
	    , height
	    , buf
	    , offset
	    , blockSize
	    , parser;

	  function uint16(b) { return b[1] << 8 | b[0]; }
	  function uint32(b) { return b[0] << 24 | b[1] << 16 | b[2] << 8 | b[3]; } 

	  // Determine dimensions
	  switch (type) {
	    case 'jpeg':
	      buf = new Buffer(this.length);
	      fs.readSync(this.fd, buf, 0, this.length, 0);
	      offset = 4;
	      blockSize = buf[offset] << 8 | buf[offset + 1];

	      while (offset < this.length) {
	        offset += blockSize;
	        if (offset >= this.length || 0xff != buf[offset]) break;
	        // SOF0 or SOF2 (progressive)
	        if (0xc0 == buf[offset + 1] || 0xc2 == buf[offset + 1]) {
	          height = buf[offset + 5] << 8 | buf[offset + 6];
	          width = buf[offset + 7] << 8 | buf[offset + 8];
	        } else {
	          offset += 2;
	          blockSize = buf[offset] << 8 | buf[offset + 1];
	        }
	      }
	      break;
	    case 'png':
	      buf = new Buffer(8);
	      // IHDR chunk width / height uint32_t big-endian
	      fs.readSync(this.fd, buf, 0, 8, 16);
	      width = uint32(buf);
	      height = uint32(buf.slice(4, 8));
	      break;
	    case 'gif':
	      buf = new Buffer(4);
	      // width / height uint16_t little-endian
	      fs.readSync(this.fd, buf, 0, 4, 6);
	      width = uint16(buf);
	      height = uint16(buf.slice(2, 4));
	      break;
	    case 'svg':
	      offset = Math.min(this.length, 1024);
	      buf = new Buffer(offset);
	      fs.readSync(this.fd, buf, 0, offset, 0);
	      buf = buf.toString('utf8');
	      parser = sax$1.parser(true);
	      parser.onopentag = function(node) {
	        if ('svg' == node.name && node.attributes.width && node.attributes.height) {
	          width = parseInt(node.attributes.width, 10);
	          height = parseInt(node.attributes.height, 10);
	        }
	      };
	      parser.write(buf).close();
	      break;
	  }

	  if ('number' != typeof width) throw new Error('failed to find width of "' + this.path + '"');
	  if ('number' != typeof height) throw new Error('failed to find height of "' + this.path + '"');

	  return [width, height];
	};
	return imageExports;
}

var imageSize;
var hasRequiredImageSize;

function requireImageSize () {
	if (hasRequiredImageSize) return imageSize;
	hasRequiredImageSize = 1;
	var utils = requireUtils()
	  , nodes = requireNodes()
	  , Image = requireImage();

	/**
	 * Return the width and height of the given `img` path.
	 *
	 * Examples:
	 *
	 *    image-size('foo.png')
	 *    // => 200px 100px
	 *
	 *    image-size('foo.png')[0]
	 *    // => 200px
	 *
	 *    image-size('foo.png')[1]
	 *    // => 100px
	 *
	 * Can be used to test if the image exists,
	 * using an optional argument set to `true`
	 * (without this argument this function throws error
	 * if there is no such image).
	 *
	 * Example:
	 *
	 *    image-size('nosuchimage.png', true)[0]
	 *    // => 0
	 *
	 * @param {String} img
	 * @param {Boolean} ignoreErr
	 * @return {Expression}
	 * @api public
	 */

	imageSize = function imageSize(img, ignoreErr) {
	  utils.assertType(img, 'string', 'img');
	  try {
	    var img = new Image(this, img.string);
	  } catch (err) {
	    if (ignoreErr) {
	      return [new nodes.Unit(0), new nodes.Unit(0)];
	    } else {
	      throw err;
	    }
	  }

	  // Read size
	  img.open();
	  var size = img.size();
	  img.close();

	  // Return (w h)
	  var expr = [];
	  expr.push(new nodes.Unit(size[0], 'px'));
	  expr.push(new nodes.Unit(size[1], 'px'));

	  return expr;
	};
	return imageSize;
}

var json;
var hasRequiredJson;

function requireJson () {
	if (hasRequiredJson) return json;
	hasRequiredJson = 1;
	var utils = requireUtils()
	  , nodes = requireNodes()
	  , readFile = require$$0$1.readFileSync;

	/**
	 * Convert a .json file into stylus variables or object.
	 * Nested variable object keys are joined with a dash (-)
	 *
	 * Given this sample media-queries.json file:
	 * {
	 *   "small": "screen and (max-width:400px)",
	 *   "tablet": {
	 *     "landscape": "screen and (min-width:600px) and (orientation:landscape)",
	 *     "portrait": "screen and (min-width:600px) and (orientation:portrait)"
	 *   }
	 * }
	 *
	 * Examples:
	 *
	 *    json('media-queries.json')
	 *
	 *    @media small
	 *    // => @media screen and (max-width:400px)
	 *
	 *    @media tablet-landscape
	 *    // => @media screen and (min-width:600px) and (orientation:landscape)
	 *
	 *    vars = json('vars.json', { hash: true })
	 *    body
	 *      width: vars.width
	 *
	 * @param {String} path
	 * @param {Boolean} [local]
	 * @param {String} [namePrefix]
	 * @api public
	*/

	json = function(path, local, namePrefix){
	  utils.assertString(path, 'path');

	  // lookup
	  path = path.string;
	  var found = utils.lookup(path, this.options.paths, this.options.filename)
	    , options = (local && 'object' == local.nodeName) && local;

	  if (!found) {
	    // optional JSON file
	    if (options && options.get('optional').toBoolean().isTrue) {
	      return nodes.null;
	    }
	    throw new Error('failed to locate .json file ' + path);
	  }

	  // read
	  var json = JSON.parse(readFile(found, 'utf8'));

	  if (options) {
	    return convert(json, options);
	  } else {
	    oldJson.call(this, json, local, namePrefix);
	  }

	  function convert(obj, options){
	    var ret = new nodes.Object()
	      , leaveStrings = options.get('leave-strings').toBoolean();

	    for (var key in obj) {
	      var val = obj[key];
	      if ('object' == typeof val) {
	        ret.set(key, convert(val, options));
	      } else {
	        val = utils.coerce(val);
	        if ('string' == val.nodeName && leaveStrings.isFalse) {
	          val = utils.parseString(val.string);
	        }
	        ret.set(key, val);
	      }
	    }
	    return ret;
	  }
	};

	/**
	 * Old `json` BIF.
	 *
	 * @api private
	 */

	function oldJson(json, local, namePrefix){
	  if (namePrefix) {
	    utils.assertString(namePrefix, 'namePrefix');
	    namePrefix = namePrefix.val;
	  } else {
	    namePrefix = '';
	  }
	  local = local ? local.toBoolean() : new nodes.Boolean(local);
	  var scope = local.isTrue ? this.currentScope : this.global.scope;

	  convert(json);
	  return;

	  function convert(obj, prefix){
	    prefix = prefix ? prefix + '-' : '';
	    for (var key in obj){
	      var val = obj[key];
	      var name = prefix + key;
	      if ('object' == typeof val) {
	        convert(val, name);
	      } else {
	        val = utils.coerce(val);
	        if ('string' == val.nodeName) val = utils.parseString(val.string);
	        scope.add({ name: namePrefix + name, val: val });
	      }
	    }
	  }
	}	return json;
}

var lengthExports = {};
var length = {
  get exports(){ return lengthExports; },
  set exports(v){ lengthExports = v; },
};

var hasRequiredLength;

function requireLength () {
	if (hasRequiredLength) return lengthExports;
	hasRequiredLength = 1;
	var utils = requireUtils();

	/**
	 * Return length of the given `expr`.
	 *
	 * @param {Expression} expr
	 * @return {Unit}
	 * @api public
	 */

	(length.exports = function length(expr){
	  if (expr) {
	    if (expr.nodes) {
	      var nodes = utils.unwrap(expr).nodes;
	      if (1 == nodes.length && 'object' == nodes[0].nodeName) {
	        return nodes[0].length;
	      } else {
	        return nodes.length;
	      }
	    } else {
	      return 1;
	    }
	  }
	  return 0;
	}).raw = true;
	return lengthExports;
}

var lightness;
var hasRequiredLightness;

function requireLightness () {
	if (hasRequiredLightness) return lightness;
	hasRequiredLightness = 1;
	var nodes = requireNodes()
	  , hsla = requireHsla$1()
	  , component = requireComponent();

	/**
	 * Return the lightness component of the given `color`,
	 * or set the lightness component to the optional second `value` argument.
	 *
	 * Examples:
	 *
	 *    lightness(#00c)
	 *    // => 100%
	 *
	 *    lightness(#00c, 80%)
	 *    // => #99f
	 *
	 * @param {RGBA|HSLA} color
	 * @param {Unit} [value]
	 * @return {Unit|RGBA}
	 * @api public
	 */

	lightness = function lightness(color, value){
	  if (value) {
	    var hslaColor = color.hsla;
	    return hsla(
	      new nodes.Unit(hslaColor.h),
	      new nodes.Unit(hslaColor.s),
	      value,
	      new nodes.Unit(hslaColor.a)
	    )
	  }
	  return component(color, new nodes.String('lightness'));
	};
	return lightness;
}

var listSeparatorExports = {};
var listSeparator = {
  get exports(){ return listSeparatorExports; },
  set exports(v){ listSeparatorExports = v; },
};

var hasRequiredListSeparator;

function requireListSeparator () {
	if (hasRequiredListSeparator) return listSeparatorExports;
	hasRequiredListSeparator = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Return the separator of the given `list`.
	 *
	 * Examples:
	 *
	 *    list1 = a b c
	 *    list-separator(list1)
	 *    // => ' '
	 *
	 *    list2 = a, b, c
	 *    list-separator(list2)
	 *    // => ','
	 *
	 * @param {Experssion} list
	 * @return {String}
	 * @api public
	 */

	(listSeparator.exports = function listSeparator(list){
	  list = utils.unwrap(list);
	  return new nodes.String(list.isList ? ',' : ' ');
	}).raw = true;
	return listSeparatorExports;
}

var lookup;
var hasRequiredLookup;

function requireLookup () {
	if (hasRequiredLookup) return lookup;
	hasRequiredLookup = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Lookup variable `name` or return Null.
	 *
	 * @param {String} name
	 * @return {Mixed}
	 * @api public
	 */

	lookup = function lookup(name){
	  utils.assertType(name, 'string', 'name');
	  var node = this.lookup(name.val);
	  if (!node) return nodes.null;
	  return this.visit(node);
	};
	return lookup;
}

var match;
var hasRequiredMatch;

function requireMatch () {
	if (hasRequiredMatch) return match;
	hasRequiredMatch = 1;
	var utils = requireUtils()
	  ; requireNodes();

	var VALID_FLAGS = 'igm';

	/**
	 * retrieves the matches when matching a `val`(string)
	 * against a `pattern`(regular expression).
	 *
	 * Examples:
	 *   $regex = '^(height|width)?([<>=]{1,})(.*)'
	 *
	 *   match($regex,'height>=sm')
	 * 	 // => ('height>=sm' 'height' '>=' 'sm')
	 * 	 // => also truthy
	 *
	 *   match($regex, 'lorem ipsum')
	 *   // => null
	 *
	 * @param {String} pattern
	 * @param {String|Ident} val
	 * @param {String|Ident} [flags='']
	 * @return {String|Null}
	 * @api public
	 */

	match = function match(pattern, val, flags){
	  utils.assertType(pattern, 'string', 'pattern');
	  utils.assertString(val, 'val');
	  var re = new RegExp(pattern.val, validateFlags(flags) ? flags.string : '');
	  return val.string.match(re);
	};

	function validateFlags(flags) {
	  flags = flags && flags.string;

	  if (flags) {
	    return flags.split('').every(function(flag) {
	      return ~VALID_FLAGS.indexOf(flag);
	    });
	  }
	  return false;
	}
	return match;
}

var math;
var hasRequiredMath;

function requireMath () {
	if (hasRequiredMath) return math;
	hasRequiredMath = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Apply Math `fn` to `n`.
	 *
	 * @param {Unit} n
	 * @param {String} fn
	 * @return {Unit}
	 * @api private
	 */

	math = function math(n, fn){
	  utils.assertType(n, 'unit', 'n');
	  utils.assertString(fn, 'fn');
	  return new nodes.Unit(Math[fn.string](n.val), n.type);
	};
	return math;
}

var mergeExports = {};
var merge = {
  get exports(){ return mergeExports; },
  set exports(v){ mergeExports = v; },
};

var hasRequiredMerge;

function requireMerge () {
	if (hasRequiredMerge) return mergeExports;
	hasRequiredMerge = 1;
	var utils = requireUtils();

	/**
	 * Merge the object `dest` with the given args.
	 *
	 * @param {Object} dest
	 * @param {Object} ...
	 * @return {Object} dest
	 * @api public
	 */

	(merge.exports = function merge(dest){
	  utils.assertPresent(dest, 'dest');
	  dest = utils.unwrap(dest).first;
	  utils.assertType(dest, 'object', 'dest');

	  var last = utils.unwrap(arguments[arguments.length - 1]).first
	    , deep = (true === last.val);

	  for (var i = 1, len = arguments.length - deep; i < len; ++i) {
	    utils.merge(dest.vals, utils.unwrap(arguments[i]).first.vals, deep);
	  }
	  return dest;
	}).raw = true;
	return mergeExports;
}

var operate;
var hasRequiredOperate;

function requireOperate () {
	if (hasRequiredOperate) return operate;
	hasRequiredOperate = 1;
	var utils = requireUtils();

	/**
	 * Perform `op` on the `left` and `right` operands.
	 *
	 * @param {String} op
	 * @param {Node} left
	 * @param {Node} right
	 * @return {Node}
	 * @api public
	 */

	operate = function operate(op, left, right){
	  utils.assertType(op, 'string', 'op');
	  utils.assertPresent(left, 'left');
	  utils.assertPresent(right, 'right');
	  return left.operate(op.val, right);
	};
	return operate;
}

var oppositePositionExports = {};
var oppositePosition = {
  get exports(){ return oppositePositionExports; },
  set exports(v){ oppositePositionExports = v; },
};

var hasRequiredOppositePosition;

function requireOppositePosition () {
	if (hasRequiredOppositePosition) return oppositePositionExports;
	hasRequiredOppositePosition = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Return the opposites of the given `positions`.
	 *
	 * Examples:
	 *
	 *    opposite-position(top left)
	 *    // => bottom right
	 *
	 * @param {Expression} positions
	 * @return {Expression}
	 * @api public
	 */

	(oppositePosition.exports = function oppositePosition(positions){
	  var expr = [];
	  utils.unwrap(positions).nodes.forEach(function(pos, i){
	    utils.assertString(pos, 'position ' + i);
	    pos = (function(){ switch (pos.string) {
	      case 'top': return 'bottom';
	      case 'bottom': return 'top';
	      case 'left': return 'right';
	      case 'right': return 'left';
	      case 'center': return 'center';
	      default: throw new Error('invalid position ' + pos);
	    }})();
	    expr.push(new nodes.Literal(pos));
	  });
	  return expr;
	}).raw = true;
	return oppositePositionExports;
}

var pExports = {};
var p = {
  get exports(){ return pExports; },
  set exports(v){ pExports = v; },
};

var hasRequiredP;

function requireP () {
	if (hasRequiredP) return pExports;
	hasRequiredP = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Inspect the given `expr`.
	 *
	 * @param {Expression} expr
	 * @api public
	 */

	(p.exports = function p(){
	  [].slice.call(arguments).forEach(function(expr){
	    expr = utils.unwrap(expr);
	    if (!expr.nodes.length) return;
	    console.log('\u001b[90minspect:\u001b[0m %s', expr.toString().replace(/^\(|\)$/g, ''));
	  });
	  return nodes.null;
	}).raw = true;
	return pExports;
}

var pathjoinExports = {};
var pathjoin = {
  get exports(){ return pathjoinExports; },
  set exports(v){ pathjoinExports = v; },
};

var path = require$$7;

/**
 * Peform a path join.
 *
 * @param {String} path
 * @return {String}
 * @api public
 */

(pathjoin.exports = function pathjoin(){
  var paths = [].slice.call(arguments).map(function(path){
    return path.first.string;
  });
  return path.join.apply(null, paths).replace(/\\/g, '/');
}).raw = true;

var popExports = {};
var pop = {
  get exports(){ return popExports; },
  set exports(v){ popExports = v; },
};

var hasRequiredPop;

function requirePop () {
	if (hasRequiredPop) return popExports;
	hasRequiredPop = 1;
	var utils = requireUtils();

	/**
	 * Pop a value from `expr`.
	 *
	 * @param {Expression} expr
	 * @return {Node}
	 * @api public
	 */

	(pop.exports = function pop(expr) {
	  expr = utils.unwrap(expr);
	  return expr.nodes.pop();
	}).raw = true;
	return popExports;
}

var pushExports = {};
var push = {
  get exports(){ return pushExports; },
  set exports(v){ pushExports = v; },
};

var hasRequiredPush;

function requirePush () {
	if (hasRequiredPush) return pushExports;
	hasRequiredPush = 1;
	var utils = requireUtils();

	/**
	 * Push the given args to `expr`.
	 *
	 * @param {Expression} expr
	 * @param {Node} ...
	 * @return {Unit}
	 * @api public
	 */

	(push.exports = function(expr){
	  expr = utils.unwrap(expr);
	  for (var i = 1, len = arguments.length; i < len; ++i) {
	    expr.nodes.push(utils.unwrap(arguments[i]).clone());
	  }
	  return expr.nodes.length;
	}).raw = true;
	return pushExports;
}

var range;
var hasRequiredRange;

function requireRange () {
	if (hasRequiredRange) return range;
	hasRequiredRange = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Returns a list of units from `start` to `stop`
	 * by `step`. If `step` argument is omitted,
	 * it defaults to 1.
	 *
	 * @param {Unit} start
	 * @param {Unit} stop
	 * @param {Unit} [step]
	 * @return {Expression}
	 * @api public
	 */

	range = function range(start, stop, step){
	  utils.assertType(start, 'unit', 'start');
	  utils.assertType(stop, 'unit', 'stop');
	  if (step) {
	    utils.assertType(step, 'unit', 'step');
	    if (0 == step.val) {
	      throw new Error('ArgumentError: "step" argument must not be zero');
	    }
	  } else {
	    step = new nodes.Unit(1);
	  }
	  var list = new nodes.Expression;
	  for (var i = start.val; i <= stop.val; i += step.val) {
	    list.push(new nodes.Unit(i, start.type));
	  }
	  return list;
	};
	return range;
}

var red;
var hasRequiredRed;

function requireRed () {
	if (hasRequiredRed) return red;
	hasRequiredRed = 1;
	var nodes = requireNodes()
	  , rgba = requireRgba$1();

	/**
	 * Return the red component of the given `color`,
	 * or set the red component to the optional second `value` argument.
	 *
	 * Examples:
	 *
	 *    red(#c00)
	 *    // => 204
	 *
	 *    red(#000, 255)
	 *    // => #f00
	 *
	 * @param {RGBA|HSLA} color
	 * @param {Unit} [value]
	 * @return {Unit|RGBA}
	 * @api public
	 */

	red = function red(color, value){
	  color = color.rgba;
	  if (value) {
	    return rgba(
	      value,
	      new nodes.Unit(color.g),
	      new nodes.Unit(color.b),
	      new nodes.Unit(color.a)
	    );
	  }
	  return new nodes.Unit(color.r, '');
	};
	return red;
}

var remove;
var hasRequiredRemove;

function requireRemove () {
	if (hasRequiredRemove) return remove;
	hasRequiredRemove = 1;
	var utils = requireUtils();

	/**
	 * Remove the given `key` from the `object`.
	 *
	 * @param {Object} object
	 * @param {String} key
	 * @return {Object}
	 * @api public
	 */

	remove = function remove(object, key){
	  utils.assertType(object, 'object', 'object');
	  utils.assertString(key, 'key');
	  delete object.vals[key.string];
	  return object;
	};
	return remove;
}

var replace;
var hasRequiredReplace;

function requireReplace () {
	if (hasRequiredReplace) return replace;
	hasRequiredReplace = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Returns string with all matches of `pattern` replaced by `replacement` in given `val`
	 *
	 * @param {String} pattern
	 * @param {String} replacement
	 * @param {String|Ident} val
	 * @return {String|Ident}
	 * @api public
	 */

	replace = function replace(pattern, replacement, val){
	  utils.assertString(pattern, 'pattern');
	  utils.assertString(replacement, 'replacement');
	  utils.assertString(val, 'val');
	  pattern = new RegExp(pattern.string, 'g');
	  var res = val.string.replace(pattern, replacement.string);
	  return val instanceof nodes.Ident
	    ? new nodes.Ident(res)
	    : new nodes.String(res);
	};
	return replace;
}

var rgb;
var hasRequiredRgb;

function requireRgb () {
	if (hasRequiredRgb) return rgb;
	hasRequiredRgb = 1;
	var utils = requireUtils()
	  , nodes = requireNodes()
	  , rgba = requireRgba$1();

	/**
	 * Return a `RGBA` from the r,g,b channels.
	 *
	 * Examples:
	 *
	 *    rgb(255,204,0)
	 *    // => #ffcc00
	 *
	 *    rgb(#fff)
	 *    // => #fff
	 *
	 * @param {Unit|RGBA|HSLA} red
	 * @param {Unit} green
	 * @param {Unit} blue
	 * @return {RGBA}
	 * @api public
	 */

	rgb = function rgb(red, green, blue){
	  switch (arguments.length) {
	    case 1:
	      utils.assertColor(red);
	      var color = red.rgba;
	      return new nodes.RGBA(
	          color.r
	        , color.g
	        , color.b
	        , 1);
	    default:
	      return rgba(
	          red
	        , green
	        , blue
	        , new nodes.Unit(1));
	  }
	};
	return rgb;
}

var sExports = {};
var s$1 = {
  get exports(){ return sExports; },
  set exports(v){ sExports = v; },
};

var compilerExports = {};
var compiler = {
  get exports(){ return compilerExports; },
  set exports(v){ compilerExports = v; },
};

/*!
 * Stylus - Compiler
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

var hasRequiredCompiler;

function requireCompiler () {
	if (hasRequiredCompiler) return compilerExports;
	hasRequiredCompiler = 1;
	/**
	 * Module dependencies.
	 */

	var Visitor = visitorExports
	  , utils = requireUtils()
	  , fs = require$$0$1;

	/**
	 * Initialize a new `Compiler` with the given `root` Node
	 * and the following `options`.
	 *
	 * Options:
	 *
	 *   - `compress`  Compress the CSS output (default: false)
	 *
	 * @param {Node} root
	 * @api public
	 */

	var Compiler = compiler.exports = function Compiler(root, options) {
	  options = options || {};
	  this.compress = options.compress;
	  this.firebug = options.firebug;
	  this.linenos = options.linenos;
	  this.spaces = options['indent spaces'] || 2;
	  this.indents = 1;
	  Visitor.call(this, root);
	  this.stack = [];
	};

	/**
	 * Inherit from `Visitor.prototype`.
	 */

	Compiler.prototype.__proto__ = Visitor.prototype;

	/**
	 * Compile to css, and return a string of CSS.
	 *
	 * @return {String}
	 * @api private
	 */

	Compiler.prototype.compile = function(){
	  return this.visit(this.root);
	};

	/**
	 * Output `str`
	 *
	 * @param {String} str
	 * @param {Node} node
	 * @return {String}
	 * @api private
	 */

	Compiler.prototype.out = function(str, node){
	  return str;
	};

	/**
	 * Return indentation string.
	 *
	 * @return {String}
	 * @api private
	 */

	Compiler.prototype.__defineGetter__('indent', function(){
	  if (this.compress) return '';
	  return new Array(this.indents).join(Array(this.spaces + 1).join(' '));
	});

	/**
	 * Check if given `node` needs brackets.
	 *
	 * @param {Node} node
	 * @return {Boolean}
	 * @api private
	 */

	Compiler.prototype.needBrackets = function(node){
	  return 1 == this.indents
	    || 'atrule' != node.nodeName
	    || node.hasOnlyProperties;
	};

	/**
	 * Visit Root.
	 */

	Compiler.prototype.visitRoot = function(block){
	  this.buf = '';
	  for (var i = 0, len = block.nodes.length; i < len; ++i) {
	    var node = block.nodes[i];
	    if (this.linenos || this.firebug) this.debugInfo(node);
	    var ret = this.visit(node);
	    if (ret) this.buf += this.out(ret + '\n', node);
	  }
	  return this.buf;
	};

	/**
	 * Visit Block.
	 */

	Compiler.prototype.visitBlock = function(block){
	  var node
	    , separator = this.compress ? '' : '\n'
	    , needBrackets;

	  if (block.hasProperties && !block.lacksRenderedSelectors) {
	    needBrackets = this.needBrackets(block.node);

	    if (needBrackets) {
	      this.buf += this.out(this.compress ? '{' : ' {\n');
	      ++this.indents;
	    }
	    for (var i = 0, len = block.nodes.length; i < len; ++i) {
	      this.last = len - 1 == i;
	      node = block.nodes[i];
	      switch (node.nodeName) {
	        case 'null':
	        case 'expression':
	        case 'function':
	        case 'group':
	        case 'block':
	        case 'unit':
	        case 'media':
	        case 'keyframes':
	        case 'atrule':
	        case 'supports':
	          continue;
	        // inline comments
	        case !this.compress && node.inline && 'comment':
	          this.buf = this.buf.slice(0, -1);
	          this.buf += this.out(' ' + this.visit(node) + '\n', node);
	          break;
	        case 'property':
	          var ret = this.visit(node) + separator;
	          this.buf += this.compress ? ret : this.out(ret, node);
	          break;
	        default:
	          this.buf += this.out(this.visit(node) + separator, node);
	      }
	    }
	    if (needBrackets) {
	      --this.indents;
	      this.buf += this.out(this.indent + '}' + separator);
	    }
	  }

	  // Nesting
	  for (var i = 0, len = block.nodes.length; i < len; ++i) {
	    node = block.nodes[i];
	    switch (node.nodeName) {
	      case 'group':
	      case 'block':
	      case 'keyframes':
	        if (this.linenos || this.firebug) this.debugInfo(node);
	        this.visit(node);
	        break;
	      case 'media':
	      case 'import':
	      case 'atrule':
	      case 'supports':
	        this.visit(node);
	        break;
	      case 'comment':
	        // only show unsuppressed comments
	        if (!node.suppress) {
	          this.buf += this.out(this.indent + this.visit(node) + '\n', node);
	        }
	        break;
	      case 'charset':
	      case 'literal':
	      case 'namespace':
	        this.buf += this.out(this.visit(node) + '\n', node);
	        break;
	    }
	  }
	};

	/**
	 * Visit Keyframes.
	 */

	Compiler.prototype.visitKeyframes = function(node){
	  if (!node.frames) return;

	  var prefix = 'official' == node.prefix
	    ? ''
	    : '-' + node.prefix + '-';

	  this.buf += this.out('@' + prefix + 'keyframes '
	    + this.visit(node.val)
	    + (this.compress ? '{' : ' {\n'), node);

	  this.keyframe = true;
	  ++this.indents;
	  this.visit(node.block);
	  --this.indents;
	  this.keyframe = false;

	  this.buf += this.out('}' + (this.compress ? '' : '\n'));
	};

	/**
	 * Visit Media.
	 */

	Compiler.prototype.visitMedia = function(media){
	  var val = media.val;
	  if (!media.hasOutput || !val.nodes.length) return;

	  this.buf += this.out('@media ', media);
	  this.visit(val);
	  this.buf += this.out(this.compress ? '{' : ' {\n');
	  ++this.indents;
	  this.visit(media.block);
	  --this.indents;
	  this.buf += this.out('}' + (this.compress ? '' : '\n'));
	};

	/**
	 * Visit QueryList.
	 */

	Compiler.prototype.visitQueryList = function(queries){
	  for (var i = 0, len = queries.nodes.length; i < len; ++i) {
	    this.visit(queries.nodes[i]);
	    if (len - 1 != i) this.buf += this.out(',' + (this.compress ? '' : ' '));
	  }
	};

	/**
	 * Visit Query.
	 */

	Compiler.prototype.visitQuery = function(node){
	  var len = node.nodes.length;
	  if (node.predicate) this.buf += this.out(node.predicate + ' ');
	  if (node.type) this.buf += this.out(node.type + (len ? ' and ' : ''));
	  for (var i = 0; i < len; ++i) {
	    this.buf += this.out(this.visit(node.nodes[i]));
	    if (len - 1 != i) this.buf += this.out(' and ');
	  }
	};

	/**
	 * Visit Feature.
	 */

	Compiler.prototype.visitFeature = function(node){
	  if (!node.expr) {
	    return node.name;
	  } else if (node.expr.isEmpty) {
	    return '(' + node.name + ')';
	  } else {
	    return '(' + node.name + ':' + (this.compress ? '' : ' ') + this.visit(node.expr) + ')';
	  }
	};

	/**
	 * Visit Import.
	 */

	Compiler.prototype.visitImport = function(imported){
	  this.buf += this.out('@import ' + this.visit(imported.path) + ';\n', imported);
	};

	/**
	 * Visit Atrule.
	 */

	Compiler.prototype.visitAtrule = function(atrule){
	  var newline = this.compress ? '' : '\n';

	  this.buf += this.out(this.indent + '@' + atrule.type, atrule);

	  if (atrule.val) this.buf += this.out(' ' + atrule.val.trim());

	  if (atrule.block) {
	    if (atrule.hasOnlyProperties) {
	      this.visit(atrule.block);
	    } else {
	      this.buf += this.out(this.compress ? '{' : ' {\n');
	      ++this.indents;
	      this.visit(atrule.block);
	      --this.indents;
	      this.buf += this.out(this.indent + '}' + newline);
	    }
	  } else {
	    this.buf += this.out(';' + newline);
	  }
	};

	/**
	 * Visit Supports.
	 */

	Compiler.prototype.visitSupports = function(node){
	  if (!node.hasOutput) return;

	  this.buf += this.out(this.indent + '@supports ', node);
	  this.isCondition = true;
	  this.buf += this.out(this.visit(node.condition));
	  this.isCondition = false;
	  this.buf += this.out(this.compress ? '{' : ' {\n');
	  ++this.indents;
	  this.visit(node.block);
	  --this.indents;
	  this.buf += this.out(this.indent + '}' + (this.compress ? '' : '\n'));
	},

	/**
	 * Visit Comment.
	 */

	Compiler.prototype.visitComment = function(comment){
	  return this.compress
	    ? comment.suppress
	      ? ''
	      : comment.str
	    : comment.str;
	};

	/**
	 * Visit Function.
	 */

	Compiler.prototype.visitFunction = function(fn){
	  return fn.name;
	};

	/**
	 * Visit Charset.
	 */

	Compiler.prototype.visitCharset = function(charset){
	  return '@charset ' + this.visit(charset.val) + ';';
	};

	/**
	 * Visit Namespace.
	 */

	Compiler.prototype.visitNamespace = function(namespace){
	  return '@namespace '
	    + (namespace.prefix ? this.visit(namespace.prefix) + ' ' : '')
	    + this.visit(namespace.val) + ';';
	};

	/**
	 * Visit Literal.
	 */

	Compiler.prototype.visitLiteral = function(lit){
	  var val = lit.val;
	  if (lit.css) val = val.replace(/^  /gm, '');
	  return val;
	};

	/**
	 * Visit Boolean.
	 */

	Compiler.prototype.visitBoolean = function(bool){
	  return bool.toString();
	};

	/**
	 * Visit RGBA.
	 */

	Compiler.prototype.visitRGBA = function(rgba){
	  return rgba.toString();
	};

	/**
	 * Visit HSLA.
	 */

	Compiler.prototype.visitHSLA = function(hsla){
	  return hsla.rgba.toString();
	};

	/**
	 * Visit Unit.
	 */

	Compiler.prototype.visitUnit = function(unit){
	  var type = unit.type || ''
	    , n = unit.val
	    , float = n != (n | 0);

	  // Compress
	  if (this.compress) {
	    // Always return '0' unless the unit is a percentage or time
	    if ('%' != type && 's' != type && 'ms' != type && 0 == n) return '0';
	    // Omit leading '0' on floats
	    if (float && n < 1 && n > -1) {
	      return n.toString().replace('0.', '.') + type;
	    }
	  }

	  return (float ? parseFloat(n.toFixed(15)) : n).toString() + type;
	};

	/**
	 * Visit Group.
	 */

	Compiler.prototype.visitGroup = function(group){
	  var stack = this.keyframe ? [] : this.stack
	    , comma = this.compress ? ',' : ',\n';

	  stack.push(group.nodes);

	  // selectors
	  if (group.block.hasProperties) {
	    var selectors = utils.compileSelectors.call(this, stack)
	      , len = selectors.length;

	    if (len) {
	      if (this.keyframe) comma = this.compress ? ',' : ', ';

	      for (var i = 0; i < len; ++i) {
	        var selector = selectors[i]
	          , last = (i == len - 1);

	        // keyframe blocks (10%, 20% { ... })
	        if (this.keyframe) selector = i ? selector.trim() : selector;

	        this.buf += this.out(selector + (last ? '' : comma), group.nodes[i]);
	      }
	    } else {
	      group.block.lacksRenderedSelectors = true;
	    }
	  }

	  // output block
	  this.visit(group.block);
	  stack.pop();
	};

	/**
	 * Visit Ident.
	 */

	Compiler.prototype.visitIdent = function(ident){
	  return ident.name;
	};

	/**
	 * Visit String.
	 */

	Compiler.prototype.visitString = function(string){
	  return this.isURL
	    ? string.val
	    : string.toString();
	};

	/**
	 * Visit Null.
	 */

	Compiler.prototype.visitNull = function(node){
	  return '';
	};

	/**
	 * Visit Call.
	 */

	Compiler.prototype.visitCall = function(call){
	  this.isURL = 'url' == call.name;
	  var args = call.args.nodes.map(function(arg){
	    return this.visit(arg);
	  }, this).join(this.compress ? ',' : ', ');
	  if (this.isURL) args = '"' + args + '"';
	  this.isURL = false;
	  return call.name + '(' + args + ')';
	};

	/**
	 * Visit Expression.
	 */

	Compiler.prototype.visitExpression = function(expr){
	  var buf = []
	    , self = this
	    , len = expr.nodes.length
	    , nodes = expr.nodes.map(function(node){ return self.visit(node); });

	  nodes.forEach(function(node, i){
	    var last = i == len - 1;
	    buf.push(node);
	    if ('/' == nodes[i + 1] || '/' == node) return;
	    if (last) return;

	    var space = self.isURL || (self.isCondition
	        && (')' == nodes[i + 1] || '(' == node))
	        ? '' : ' ';

	    buf.push(expr.isList
	      ? (self.compress ? ',' : ', ')
	      : space);
	  });

	  return buf.join('');
	};

	/**
	 * Visit Arguments.
	 */

	Compiler.prototype.visitArguments = Compiler.prototype.visitExpression;

	/**
	 * Visit Property.
	 */

	Compiler.prototype.visitProperty = function(prop){
	  var val = this.visit(prop.expr).trim()
	    , name = (prop.name || prop.segments.join(''))
	    , arr = [];
	  arr.push(
	    this.out(this.indent),
	    this.out(name + (this.compress ? ':' : ': '), prop),
	    this.out(val, prop.expr),
	    this.out(this.compress ? (this.last ? '' : ';') : ';')
	  );
	  return arr.join('');
	};

	/**
	 * Debug info.
	 */

	Compiler.prototype.debugInfo = function(node){

	  var path = node.filename == 'stdin' ? 'stdin' : fs.realpathSync(node.filename)
	    , line = (node.nodes && node.nodes.length ? node.nodes[0].lineno : node.lineno) || 1;

	  if (this.linenos){
	    this.buf += '\n/* ' + 'line ' + line + ' : ' + path + ' */\n';
	  }

	  if (this.firebug){
	    // debug info for firebug, the crazy formatting is needed
	    path = 'file\\\:\\\/\\\/' + path.replace(/([.:/\\])/g, function(m) {
	      return '\\' + (m === '\\' ? '\/' : m)
	    });
	    line = '\\00003' + line;
	    this.buf += '\n@media -stylus-debug-info'
	      + '{filename{font-family:' + path
	      + '}line{font-family:' + line + '}}\n';
	  }
	};
	return compilerExports;
}

var hasRequiredS;

function requireS () {
	if (hasRequiredS) return sExports;
	hasRequiredS = 1;
	var utils = requireUtils()
	  , nodes = requireNodes()
	  , Compiler = requireCompiler();

	/**
	 * Return a `Literal` with the given `fmt`, and
	 * variable number of arguments.
	 *
	 * @param {String} fmt
	 * @param {Node} ...
	 * @return {Literal}
	 * @api public
	 */

	(s$1.exports = function s(fmt){
	  fmt = utils.unwrap(fmt).nodes[0];
	  utils.assertString(fmt);
	  var self = this
	    , str = fmt.string
	    , args = arguments
	    , i = 1;

	  // format
	  str = str.replace(/%(s|d)/g, function(_, specifier){
	    var arg = args[i++] || nodes.null;
	    switch (specifier) {
	      case 's':
	        return new Compiler(arg, self.options).compile();
	      case 'd':
	        arg = utils.unwrap(arg).first;
	        if ('unit' != arg.nodeName) throw new Error('%d requires a unit');
	        return arg.val;
	    }
	  });

	  return new nodes.Literal(str);
	}).raw = true;
	return sExports;
}

var saturation;
var hasRequiredSaturation;

function requireSaturation () {
	if (hasRequiredSaturation) return saturation;
	hasRequiredSaturation = 1;
	var nodes = requireNodes()
	  , hsla = requireHsla$1()
	  , component = requireComponent();

	/**
	 * Return the saturation component of the given `color`,
	 * or set the saturation component to the optional second `value` argument.
	 *
	 * Examples:
	 *
	 *    saturation(#00c)
	 *    // => 100%
	 *
	 *    saturation(#00c, 50%)
	 *    // => #339
	 *
	 * @param {RGBA|HSLA} color
	 * @param {Unit} [value]
	 * @return {Unit|RGBA}
	 * @api public
	 */

	saturation = function saturation(color, value){
	  if (value) {
	    var hslaColor = color.hsla;
	    return hsla(
	      new nodes.Unit(hslaColor.h),
	      value,
	      new nodes.Unit(hslaColor.l),
	      new nodes.Unit(hslaColor.a)
	    )
	  }
	  return component(color, new nodes.String('saturation'));
	};
	return saturation;
}

var normalizerExports = {};
var normalizer = {
  get exports(){ return normalizerExports; },
  set exports(v){ normalizerExports = v; },
};

var hasRequiredNormalizer;

function requireNormalizer () {
	if (hasRequiredNormalizer) return normalizerExports;
	hasRequiredNormalizer = 1;
	/*!
	 * Stylus - Normalizer
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Visitor = visitorExports
	  , nodes = requireNodes()
	  , utils = requireUtils();

	/**
	 * Initialize a new `Normalizer` with the given `root` Node.
	 *
	 * This visitor implements the first stage of the duel-stage
	 * compiler, tasked with stripping the "garbage" from
	 * the evaluated nodes, ditching null rules, resolving
	 * ruleset selectors etc. This step performs the logic
	 * necessary to facilitate the "@extend" functionality,
	 * as these must be resolved _before_ buffering output.
	 *
	 * @param {Node} root
	 * @api public
	 */

	var Normalizer = normalizer.exports = function Normalizer(root, options) {
	  options = options || {};
	  Visitor.call(this, root);
	  this.hoist = options['hoist atrules'];
	  this.stack = [];
	  this.map = {};
	  this.imports = [];
	};

	/**
	 * Inherit from `Visitor.prototype`.
	 */

	Normalizer.prototype.__proto__ = Visitor.prototype;

	/**
	 * Normalize the node tree.
	 *
	 * @return {Node}
	 * @api private
	 */

	Normalizer.prototype.normalize = function(){
	  var ret = this.visit(this.root);

	  if (this.hoist) {
	    // hoist @import
	    if (this.imports.length) ret.nodes = this.imports.concat(ret.nodes);

	    // hoist @charset
	    if (this.charset) ret.nodes = [this.charset].concat(ret.nodes);
	  }

	  return ret;
	};

	/**
	 * Bubble up the given `node`.
	 *
	 * @param {Node} node
	 * @api private
	 */

	Normalizer.prototype.bubble = function(node){
	  var props = []
	    , other = []
	    , self = this;

	  function filterProps(block) {
	    block.nodes.forEach(function(node) {
	      node = self.visit(node);

	      switch (node.nodeName) {
	        case 'property':
	          props.push(node);
	          break;
	        case 'block':
	          filterProps(node);
	          break;
	        default:
	          other.push(node);
	      }
	    });
	  }

	  filterProps(node.block);

	  if (props.length) {
	    var selector = new nodes.Selector([new nodes.Literal('&')]);
	    selector.lineno = node.lineno;
	    selector.column = node.column;
	    selector.filename = node.filename;
	    selector.val = '&';

	    var group = new nodes.Group;
	    group.lineno = node.lineno;
	    group.column = node.column;
	    group.filename = node.filename;

	    var block = new nodes.Block(node.block, group);
	    block.lineno = node.lineno;
	    block.column = node.column;
	    block.filename = node.filename;

	    props.forEach(function(prop){
	      block.push(prop);
	    });

	    group.push(selector);
	    group.block = block;

	    node.block.nodes = [];
	    node.block.push(group);
	    other.forEach(function(n){
	      node.block.push(n);
	    });

	    var group = this.closestGroup(node.block);
	    if (group) node.group = group.clone();

	    node.bubbled = true;
	  }
	};

	/**
	 * Return group closest to the given `block`.
	 *
	 * @param {Block} block
	 * @return {Group}
	 * @api private
	 */

	Normalizer.prototype.closestGroup = function(block){
	  var parent = block.parent
	    , node;
	  while (parent && (node = parent.node)) {
	    if ('group' == node.nodeName) return node;
	    parent = node.block && node.block.parent;
	  }
	};

	/**
	 * Visit Root.
	 */

	Normalizer.prototype.visitRoot = function(block){
	  var ret = new nodes.Root
	    , node;

	  for (var i = 0; i < block.nodes.length; ++i) {
	    node = block.nodes[i];
	    switch (node.nodeName) {
	      case 'null':
	      case 'expression':
	      case 'function':
	      case 'unit':
	      case 'atblock':
	        continue;
	      default:
	        this.rootIndex = i;
	        ret.push(this.visit(node));
	    }
	  }

	  return ret;
	};

	/**
	 * Visit Property.
	 */

	Normalizer.prototype.visitProperty = function(prop){
	  this.visit(prop.expr);
	  return prop;
	};

	/**
	 * Visit Expression.
	 */

	Normalizer.prototype.visitExpression = function(expr){
	  expr.nodes = expr.nodes.map(function(node){
	    // returns `block` literal if mixin's block
	    // is used as part of a property value
	    if ('block' == node.nodeName) {
	      var literal = new nodes.Literal('block');
	      literal.lineno = expr.lineno;
	      literal.column = expr.column;
	      return literal;
	    }
	    return node;
	  });
	  return expr;
	};

	/**
	 * Visit Block.
	 */

	Normalizer.prototype.visitBlock = function(block){
	  var node;

	  if (block.hasProperties) {
	    for (var i = 0, len = block.nodes.length; i < len; ++i) {
	      node = block.nodes[i];
	      switch (node.nodeName) {
	        case 'null':
	        case 'expression':
	        case 'function':
	        case 'group':
	        case 'unit':
	        case 'atblock':
	          continue;
	        default:
	          block.nodes[i] = this.visit(node);
	      }
	    }
	  }

	  // nesting
	  for (var i = 0, len = block.nodes.length; i < len; ++i) {
	    node = block.nodes[i];
	    block.nodes[i] = this.visit(node);
	  }

	  return block;
	};

	/**
	 * Visit Group.
	 */

	Normalizer.prototype.visitGroup = function(group){
	  var stack = this.stack
	    , map = this.map
	    , parts;

	  // normalize interpolated selectors with comma
	  group.nodes.forEach(function(selector, i){
	    if (!~selector.val.indexOf(',')) return;
	    if (~selector.val.indexOf('\\,')) {
	      selector.val = selector.val.replace(/\\,/g, ',');
	      return;
	    }
	    parts = selector.val.split(',');
	    var root = '/' == selector.val.charAt(0)
	      , part, s;
	    for (var k = 0, len = parts.length; k < len; ++k){
	      part = parts[k].trim();
	      if (root && k > 0 && !~part.indexOf('&')) {
	        part = '/' + part;
	      }
	      s = new nodes.Selector([new nodes.Literal(part)]);
	      s.val = part;
	      s.block = group.block;
	      group.nodes[i++] = s;
	    }
	  });
	  stack.push(group.nodes);

	  var selectors = utils.compileSelectors(stack, true);

	  // map for extension lookup
	  selectors.forEach(function(selector){
	    map[selector] = map[selector] || [];
	    map[selector].push(group);
	  });

	  // extensions
	  this.extend(group, selectors);

	  stack.pop();
	  return group;
	};

	/**
	 * Visit Function.
	 */

	Normalizer.prototype.visitFunction = function(){
	  return nodes.null;
	};

	/**
	 * Visit Media.
	 */

	Normalizer.prototype.visitMedia = function(media){
	  var medias = []
	    , group = this.closestGroup(media.block)
	    , parent;

	  function mergeQueries(block) {
	    block.nodes.forEach(function(node, i){
	      switch (node.nodeName) {
	        case 'media':
	          node.val = media.val.merge(node.val);
	          medias.push(node);
	          block.nodes[i] = nodes.null;
	          break;
	        case 'block':
	          mergeQueries(node);
	          break;
	        default:
	          if (node.block && node.block.nodes)
	            mergeQueries(node.block);
	      }
	    });
	  }

	  mergeQueries(media.block);
	  this.bubble(media);

	  if (medias.length) {
	    medias.forEach(function(node){
	      if (group) {
	        group.block.push(node);
	      } else {
	        this.root.nodes.splice(++this.rootIndex, 0, node);
	      }
	      node = this.visit(node);
	      parent = node.block.parent;
	      if (node.bubbled && (!group || 'group' == parent.node.nodeName)) {
	        node.group.block = node.block.nodes[0].block;
	        node.block.nodes[0] = node.group;
	      }
	    }, this);
	  }
	  return media;
	};

	/**
	 * Visit Supports.
	 */

	Normalizer.prototype.visitSupports = function(node){
	  this.bubble(node);
	  return node;
	};

	/**
	 * Visit Atrule.
	 */

	Normalizer.prototype.visitAtrule = function(node){
	  if (node.block) node.block = this.visit(node.block);
	  return node;
	};

	/**
	 * Visit Keyframes.
	 */

	Normalizer.prototype.visitKeyframes = function(node){
	  var frames = node.block.nodes.filter(function(frame){
	    return frame.block && frame.block.hasProperties;
	  });
	  node.frames = frames.length;
	  return node;
	};

	/**
	 * Visit Import.
	 */

	Normalizer.prototype.visitImport = function(node){
	  this.imports.push(node);
	  return this.hoist ? nodes.null : node;
	};

	/**
	 * Visit Charset.
	 */

	Normalizer.prototype.visitCharset = function(node){
	  this.charset = node;
	  return this.hoist ? nodes.null : node;
	};

	/**
	 * Apply `group` extensions.
	 *
	 * @param {Group} group
	 * @param {Array} selectors
	 * @api private
	 */

	Normalizer.prototype.extend = function(group, selectors){
	  var map = this.map
	    , self = this
	    , parent = this.closestGroup(group.block);

	  group.extends.forEach(function(extend){
	    var groups = map[extend.selector];
	    if (!groups) {
	      if (extend.optional) return;
	      var err = new Error('Failed to @extend "' + extend.selector + '"');
	      err.lineno = extend.lineno;
	      err.column = extend.column;
	      throw err;
	    }
	    selectors.forEach(function(selector){
	      var node = new nodes.Selector;
	      node.val = selector;
	      node.inherits = false;
	      groups.forEach(function(group){
	        // prevent recursive extend
	        if (!parent || (parent != group)) self.extend(group, selectors);
	        group.push(node);
	      });
	    });
	  });

	  group.block = this.visit(group.block);
	};
	return normalizerExports;
}

var selectorExists;
var hasRequiredSelectorExists;

function requireSelectorExists () {
	if (hasRequiredSelectorExists) return selectorExists;
	hasRequiredSelectorExists = 1;
	var utils = requireUtils();

	/**
	 * Returns true if the given selector exists.
	 *
	 * @param {String} sel
	 * @return {Boolean}
	 * @api public
	 */

	selectorExists = function selectorExists(sel) {
	  utils.assertString(sel, 'selector');

	  if (!this.__selectorsMap__) {
	    var Normalizer = requireNormalizer()
	      , visitor = new Normalizer(this.root.clone());
	    visitor.visit(visitor.root);

	    this.__selectorsMap__ = visitor.map;
	  }

	  return sel.string in this.__selectorsMap__;
	};
	return selectorExists;
}

var selectorExports$1 = {};
var selector$1 = {
  get exports(){ return selectorExports$1; },
  set exports(v){ selectorExports$1 = v; },
};

var hasRequiredSelector$1;

function requireSelector$1 () {
	if (hasRequiredSelector$1) return selectorExports$1;
	hasRequiredSelector$1 = 1;
	var utils = requireUtils();

	/**
	 * Return the current selector or compile
	 * selector from a string or a list.
	 *
	 * @param {String|Expression}
	 * @return {String}
	 * @api public
	 */

	(selector$1.exports = function selector(){
	  var stack = this.selectorStack
	    , args = [].slice.call(arguments);

	  if (1 == args.length) {
	    var expr = utils.unwrap(args[0])
	      , len = expr.nodes.length;

	    // selector('.a')
	    if (1 == len) {
	      utils.assertString(expr.first, 'selector');
	      var SelectorParser = requireSelectorParser()
	        , val = expr.first.string
	        , parsed = new SelectorParser(val).parse().val;

	      if (parsed == val) return val;

	      stack.push(parse(val));
	    } else if (len > 1) {
	      // selector-list = '.a', '.b', '.c'
	      // selector(selector-list)
	      if (expr.isList) {
	        pushToStack(expr.nodes, stack);
	      // selector('.a' '.b' '.c')
	      } else {
	        stack.push(parse(expr.nodes.map(function(node){
	          utils.assertString(node, 'selector');
	          return node.string;
	        }).join(' ')));
	      }
	    }
	  // selector('.a', '.b', '.c')
	  } else if (args.length > 1) {
	    pushToStack(args, stack);
	  }

	  return stack.length ? utils.compileSelectors(stack).join(',') : '&';
	}).raw = true;

	function pushToStack(selectors, stack) {
	  selectors.forEach(function(sel) {
	    sel = sel.first;
	    utils.assertString(sel, 'selector');
	    stack.push(parse(sel.string));
	  });
	}

	function parse(selector) {
	  var Parser = new commonjsRequire('../parser')
	    , parser = new Parser(selector)
	    , nodes;
	  parser.state.push('selector-parts');
	  nodes = parser.selector();
	  nodes.forEach(function(node) {
	    node.val = node.segments.map(function(seg){
	      return seg.toString();
	    }).join('');
	  });
	  return nodes;
	}
	return selectorExports$1;
}

var selectors;
var hasRequiredSelectors;

function requireSelectors () {
	if (hasRequiredSelectors) return selectors;
	hasRequiredSelectors = 1;
	var nodes = requireNodes()
	  , Parser = requireSelectorParser();

	/**
	 * Return a list with raw selectors parts
	 * of the current group.
	 *
	 * For example:
	 *
	 *    .a, .b
	 *      .c
	 *        .d
	 *          test: selectors() // => '.a,.b', '& .c', '& .d'
	 *
	 * @return {Expression}
	 * @api public
	 */

	selectors = function selectors(){
	  var stack = this.selectorStack
	    , expr = new nodes.Expression(true);

	  if (stack.length) {
	    for (var i = 0; i < stack.length; i++) {
	      var group = stack[i]
	        , nested;

	      if (group.length > 1) {
	        expr.push(new nodes.String(group.map(function(selector) {
	          nested = new Parser(selector.val).parse().nested;
	          return (nested && i ? '& ' : '') + selector.val;
	        }).join(',')));
	      } else {
	        var selector = group[0].val;
	        nested = new Parser(selector).parse().nested;
	        expr.push(new nodes.String((nested && i ? '& ' : '') + selector));
	      }
	    }
	  } else {
	    expr.push(new nodes.String('&'));
	  }
	  return expr;
	};
	return selectors;
}

var shiftExports = {};
var shift = {
  get exports(){ return shiftExports; },
  set exports(v){ shiftExports = v; },
};

var hasRequiredShift;

function requireShift () {
	if (hasRequiredShift) return shiftExports;
	hasRequiredShift = 1;
	var utils = requireUtils();

	/**
	 * Shift an element from `expr`.
	 *
	 * @param {Expression} expr
	 * @return {Node}
	 * @api public
	 */

	 (shift.exports = function(expr){
	   expr = utils.unwrap(expr);
	   return expr.nodes.shift();
	 }).raw = true;
	return shiftExports;
}

var split;
var hasRequiredSplit;

function requireSplit () {
	if (hasRequiredSplit) return split;
	hasRequiredSplit = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Splits the given `val` by `delim`
	 *
	 * @param {String} delim
	 * @param {String|Ident} val
	 * @return {Expression}
	 * @api public
	 */

	split = function split(delim, val){
	  utils.assertString(delim, 'delimiter');
	  utils.assertString(val, 'val');
	  var splitted = val.string.split(delim.string);
	  var expr = new nodes.Expression();
	  var ItemNode = val instanceof nodes.Ident
	    ? nodes.Ident
	    : nodes.String;
	  for (var i = 0, len = splitted.length; i < len; ++i) {
	    expr.nodes.push(new ItemNode(splitted[i]));
	  }
	  return expr;
	};
	return split;
}

var substr;
var hasRequiredSubstr;

function requireSubstr () {
	if (hasRequiredSubstr) return substr;
	hasRequiredSubstr = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Returns substring of the given `val`.
	 *
	 * @param {String|Ident} val
	 * @param {Number} start
	 * @param {Number} [length]
	 * @return {String|Ident}
	 * @api public
	 */

	substr = function substr(val, start, length){
	  utils.assertString(val, 'val');
	  utils.assertType(start, 'unit', 'start');
	  length = length && length.val;
	  var res = val.string.substr(start.val, length);
	  return val instanceof nodes.Ident
	      ? new nodes.Ident(res)
	      : new nodes.String(res);
	};
	return substr;
}

var sliceExports = {};
var slice = {
  get exports(){ return sliceExports; },
  set exports(v){ sliceExports = v; },
};

var hasRequiredSlice;

function requireSlice () {
	if (hasRequiredSlice) return sliceExports;
	hasRequiredSlice = 1;
	var utils = requireUtils(),
	    nodes = requireNodes();

	/**
	 * This is a heler function for the slice method
	 *
	 * @param {String|Ident} vals
	 * @param {Unit} start [0]
	 * @param {Unit} end [vals.length]
	 * @return {String|Literal|Null}
	 * @api public
	*/
	(slice.exports = function slice(val, start, end) {
	  start = start && start.nodes[0].val;
	  end = end && end.nodes[0].val;

	  val = utils.unwrap(val).nodes;

	  if (val.length > 1) {
	    return utils.coerce(val.slice(start, end), true);
	  }

	  var result = val[0].string.slice(start, end);

	  return val[0] instanceof nodes.Ident
	    ? new nodes.Ident(result)
	    : new nodes.String(result);
	}).raw = true;
	return sliceExports;
}

var tan;
var hasRequiredTan;

function requireTan () {
	if (hasRequiredTan) return tan;
	hasRequiredTan = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Return the tangent of the given `angle`.
	 *
	 * @param {Unit} angle
	 * @return {Unit}
	 * @api public
	 */

	tan = function tan(angle) {
	  utils.assertType(angle, 'unit', 'angle');

	  var radians = angle.val;

	  if (angle.type === 'deg') {
	    radians *= Math.PI / 180;
	  }

	  var m = Math.pow(10, 9);

	  var sin = Math.round(Math.sin(radians) * m) / m
	    , cos = Math.round(Math.cos(radians) * m) / m
	    , tan = Math.round(m * sin / cos ) / m;

	  return new nodes.Unit(tan, '');
	};
	return tan;
}

var trace;
var hasRequiredTrace;

function requireTrace () {
	if (hasRequiredTrace) return trace;
	hasRequiredTrace = 1;
	var nodes = requireNodes();

	/**
	 * Output stack trace.
	 *
	 * @api public
	 */

	trace = function trace(){
	  console.log(this.stack);
	  return nodes.null;
	};
	return trace;
}

var transparentify;
var hasRequiredTransparentify;

function requireTransparentify () {
	if (hasRequiredTransparentify) return transparentify;
	hasRequiredTransparentify = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Returns the transparent version of the given `top` color,
	 * as if it was blend over the given `bottom` color.
	 *
	 * Examples:
	 *
	 *     transparentify(#808080)
	 *     => rgba(0,0,0,0.5)
	 *
	 *     transparentify(#414141, #000)
	 *     => rgba(255,255,255,0.25)
	 *
	 *     transparentify(#91974C, #F34949, 0.5)
	 *     => rgba(47,229,79,0.5)
	 *
	 * @param {RGBA|HSLA} top
	 * @param {RGBA|HSLA} [bottom=#fff]
	 * @param {Unit} [alpha]
	 * @return {RGBA}
	 * @api public
	 */

	transparentify = function transparentify(top, bottom, alpha){
	  utils.assertColor(top);
	  top = top.rgba;
	  // Handle default arguments
	  bottom = bottom || new nodes.RGBA(255, 255, 255, 1);
	  if (!alpha && bottom && !bottom.rgba) {
	    alpha = bottom;
	    bottom = new nodes.RGBA(255, 255, 255, 1);
	  }
	  utils.assertColor(bottom);
	  bottom = bottom.rgba;
	  var bestAlpha = ['r', 'g', 'b'].map(function(channel){
	    return (top[channel] - bottom[channel]) / ((0 < (top[channel] - bottom[channel]) ? 255 : 0) - bottom[channel]);
	  }).sort(function(a, b){return a < b;})[0];
	  if (alpha) {
	    utils.assertType(alpha, 'unit', 'alpha');
	    if ('%' == alpha.type) {
	      bestAlpha = alpha.val / 100;
	    } else if (!alpha.type) {
	      bestAlpha = alpha = alpha.val;
	    }
	  }
	  bestAlpha = Math.max(Math.min(bestAlpha, 1), 0);
	  // Calculate the resulting color
	  function processChannel(channel) {
	    if (0 == bestAlpha) {
	      return bottom[channel]
	    } else {
	      return bottom[channel] + (top[channel] - bottom[channel]) / bestAlpha
	    }
	  }
	  return new nodes.RGBA(
	    processChannel('r'),
	    processChannel('g'),
	    processChannel('b'),
	    Math.round(bestAlpha * 100) / 100
	  );
	};
	return transparentify;
}

var type;
var hasRequiredType;

function requireType () {
	if (hasRequiredType) return type;
	hasRequiredType = 1;
	var utils = requireUtils();

	/**
	 * Return type of `node`.
	 *
	 * Examples:
	 * 
	 *    type(12)
	 *    // => 'unit'
	 *
	 *    type(#fff)
	 *    // => 'color'
	 *
	 *    type(type)
	 *    // => 'function'
	 *
	 *    type(unbound)
	 *    typeof(unbound)
	 *    type-of(unbound)
	 *    // => 'ident'
	 *
	 * @param {Node} node
	 * @return {String}
	 * @api public
	 */

	type = function type(node){
	  utils.assertPresent(node, 'expression');
	  return node.nodeName;
	};
	return type;
}

var unit$1;
var hasRequiredUnit$1;

function requireUnit$1 () {
	if (hasRequiredUnit$1) return unit$1;
	hasRequiredUnit$1 = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Assign `type` to the given `unit` or return `unit`'s type.
	 *
	 * @param {Unit} unit
	 * @param {String|Ident} type
	 * @return {Unit}
	 * @api public
	 */

	unit$1 = function unit(unit, type){
	  utils.assertType(unit, 'unit', 'unit');

	  // Assign
	  if (type) {
	    utils.assertString(type, 'type');
	    return new nodes.Unit(unit.val, type.string);
	  } else {
	    return unit.type || '';
	  }
	};
	return unit$1;
}

var unquote;
var hasRequiredUnquote;

function requireUnquote () {
	if (hasRequiredUnquote) return unquote;
	hasRequiredUnquote = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Unquote the given `string`.
	 *
	 * Examples:
	 *
	 *    unquote("sans-serif")
	 *    // => sans-serif
	 *
	 *    unquote(sans-serif)
	 *    // => sans-serif
	 *
	 * @param {String|Ident} string
	 * @return {Literal}
	 * @api public
	 */

	unquote = function unquote(string){
	  utils.assertString(string, 'string');
	  return new nodes.Literal(string.string);
	};
	return unquote;
}

var unshiftExports = {};
var unshift = {
  get exports(){ return unshiftExports; },
  set exports(v){ unshiftExports = v; },
};

var hasRequiredUnshift;

function requireUnshift () {
	if (hasRequiredUnshift) return unshiftExports;
	hasRequiredUnshift = 1;
	var utils = requireUtils();

	/**
	 * Unshift the given args to `expr`.
	 *
	 * @param {Expression} expr
	 * @param {Node} ...
	 * @return {Unit}
	 * @api public
	 */

	(unshift.exports = function(expr){
	  expr = utils.unwrap(expr);
	  for (var i = 1, len = arguments.length; i < len; ++i) {
	    expr.nodes.unshift(utils.unwrap(arguments[i]));
	  }
	  return expr.nodes.length;
	}).raw = true;
	return unshiftExports;
}

var use;
var hasRequiredUse;

function requireUse () {
	if (hasRequiredUse) return use;
	hasRequiredUse = 1;
	var utils = requireUtils()
	  , path = require$$7;

	/**
	*  Use the given `plugin`
	*  
	*  Examples:
	*
	*     use("plugins/add.js")
	*
	*     width add(10, 100)
	*     // => width: 110
	*/

	use = function use(plugin, options){
	  utils.assertString(plugin, 'plugin');

	  if (options) {
	    utils.assertType(options, 'object', 'options');
	    options = parseObject(options);
	  }

	  // lookup
	  plugin = plugin.string;
	  var found = utils.lookup(plugin, this.options.paths, this.options.filename);
	  if (!found) throw new Error('failed to locate plugin file "' + plugin + '"');

	  // use
	  var fn = commonjsRequire(path.resolve(found));
	  if ('function' != typeof fn) {
	    throw new Error('plugin "' + plugin + '" does not export a function');
	  }
	  this.renderer.use(fn(options || this.options));
	};

	/**
	 * Attempt to parse object node to the javascript object.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function parseObject(obj){
	  obj = obj.vals;
	  for (var key in obj) {
	    var nodes = obj[key].nodes[0].nodes;
	    if (nodes && nodes.length) {
	      obj[key] = [];
	      for (var i = 0, len = nodes.length; i < len; ++i) {
	        obj[key].push(convert(nodes[i]));
	      }
	    } else {
	      obj[key] = convert(obj[key].first);
	    }
	  }
	  return obj;

	  function convert(node){
	    switch (node.nodeName) {
	      case 'object':
	        return parseObject(node);
	      case 'boolean':
	        return node.isTrue;
	      case 'unit':
	        return node.type ? node.toString() : +node.val;
	      case 'string':
	      case 'literal':
	        return node.val;
	      default:
	        return node.toString();
	    }
	  }
	}
	return use;
}

var warn;
var hasRequiredWarn;

function requireWarn () {
	if (hasRequiredWarn) return warn;
	hasRequiredWarn = 1;
	var utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Warn with the given `msg` prefixed by "Warning: ".
	 *
	 * @param {String} msg
	 * @api public
	 */

	warn = function warn(msg){
	  utils.assertType(msg, 'string', 'msg');
	  console.warn('Warning: %s', msg.val);
	  return nodes.null;
	};
	return warn;
}

var mathProp;
var hasRequiredMathProp;

function requireMathProp () {
	if (hasRequiredMathProp) return mathProp;
	hasRequiredMathProp = 1;
	var nodes = requireNodes();

	/**
	 * Get Math `prop`.
	 *
	 * @param {String} prop
	 * @return {Unit}
	 * @api private
	 */

	mathProp = function math(prop){
	  return new nodes.Unit(Math[prop.string]);
	};
	return mathProp;
}

var prefixClasses;
var hasRequiredPrefixClasses;

function requirePrefixClasses () {
	if (hasRequiredPrefixClasses) return prefixClasses;
	hasRequiredPrefixClasses = 1;
	var utils = requireUtils();

	/**
	 * Prefix css classes in a block
	 *
	 * @param {String} prefix
	 * @param {Block} block
	 * @return {Block}
	 * @api private
	 */

	prefixClasses = function prefixClasses(prefix, block){
	  utils.assertString(prefix, 'prefix');
	  utils.assertType(block, 'block', 'block');

	  var _prefix = this.prefix;

	  this.options.prefix = this.prefix = prefix.string;
	  block = this.visit(block);
	  this.options.prefix = this.prefix = _prefix;
	  return block;
	};
	return prefixClasses;
}

var hasRequiredFunctions;

function requireFunctions () {
	if (hasRequiredFunctions) return functions;
	hasRequiredFunctions = 1;
	(function (exports) {
		/*!
		 * Stylus - Evaluator - built-in functions
		 * Copyright (c) Automattic <developer.wordpress.com>
		 * MIT Licensed
		 */

		exports['add-property'] = requireAddProperty();
		exports.adjust = requireAdjust();
		exports.alpha = requireAlpha();
		exports['base-convert'] = requireBaseConvert();
		exports.basename = requireBasename();
		exports.blend = requireBlend();
		exports.blue = requireBlue();
		exports.clone = requireClone();
		exports.component = requireComponent();
		exports.contrast = requireContrast();
		exports.convert = requireConvert();
		exports['current-media'] = requireCurrentMedia();
		exports.define = requireDefine();
		exports.dirname = requireDirname();
		exports.error = requireError();
		exports.extname = requireExtname();
		exports.green = requireGreen();
		exports.hsl = requireHsl();
		exports.hsla = requireHsla$1();
		exports.hue = requireHue();
		exports['image-size'] = requireImageSize();
		exports.json = requireJson();
		exports.length = requireLength();
		exports.lightness = requireLightness();
		exports['list-separator'] = requireListSeparator();
		exports.lookup = requireLookup();
		exports.luminosity = requireLuminosity();
		exports.match = requireMatch();
		exports.math = requireMath();
		exports.merge = exports.extend = requireMerge();
		exports.operate = requireOperate();
		exports['opposite-position'] = requireOppositePosition();
		exports.p = requireP();
		exports.pathjoin = pathjoinExports;
		exports.pop = requirePop();
		exports.push = exports.append = requirePush();
		exports.range = requireRange();
		exports.red = requireRed();
		exports.remove = requireRemove();
		exports.replace = requireReplace();
		exports.rgb = requireRgb();
		exports.rgba = requireRgba$1();
		exports.s = requireS();
		exports.saturation = requireSaturation();
		exports['selector-exists'] = requireSelectorExists();
		exports.selector = requireSelector$1();
		exports.selectors = requireSelectors();
		exports.shift = requireShift();
		exports.split = requireSplit();
		exports.substr = requireSubstr();
		exports.slice = requireSlice();
		exports.tan = requireTan();
		exports.trace = requireTrace();
		exports.transparentify = requireTransparentify();
		exports.type = exports.typeof = exports['type-of'] = requireType();
		exports.unit = requireUnit$1();
		exports.unquote = requireUnquote();
		exports.unshift = exports.prepend = requireUnshift();
		exports.use = requireUse();
		exports.warn = requireWarn();
		exports['-math-prop'] = requireMathProp();
		exports['-prefix-classes'] = requirePrefixClasses();
} (functions));
	return functions;
}

/*!
 * Stylus - colors
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

var colors = {
    aliceblue: [240, 248, 255, 1]
  , antiquewhite: [250, 235, 215, 1]
  , aqua: [0, 255, 255, 1]
  , aquamarine: [127, 255, 212, 1]
  , azure: [240, 255, 255, 1]
  , beige: [245, 245, 220, 1]
  , bisque: [255, 228, 196, 1]
  , black: [0, 0, 0, 1]
  , blanchedalmond: [255, 235, 205, 1]
  , blue: [0, 0, 255, 1]
  , blueviolet: [138, 43, 226, 1]
  , brown: [165, 42, 42, 1]
  , burlywood: [222, 184, 135, 1]
  , cadetblue: [95, 158, 160, 1]
  , chartreuse: [127, 255, 0, 1]
  , chocolate: [210, 105, 30, 1]
  , coral: [255, 127, 80, 1]
  , cornflowerblue: [100, 149, 237, 1]
  , cornsilk: [255, 248, 220, 1]
  , crimson: [220, 20, 60, 1]
  , cyan: [0, 255, 255, 1]
  , darkblue: [0, 0, 139, 1]
  , darkcyan: [0, 139, 139, 1]
  , darkgoldenrod: [184, 134, 11, 1]
  , darkgray: [169, 169, 169, 1]
  , darkgreen: [0, 100, 0, 1]
  , darkgrey: [169, 169, 169, 1]
  , darkkhaki: [189, 183, 107, 1]
  , darkmagenta: [139, 0, 139, 1]
  , darkolivegreen: [85, 107, 47, 1]
  , darkorange: [255, 140, 0, 1]
  , darkorchid: [153, 50, 204, 1]
  , darkred: [139, 0, 0, 1]
  , darksalmon: [233, 150, 122, 1]
  , darkseagreen: [143, 188, 143, 1]
  , darkslateblue: [72, 61, 139, 1]
  , darkslategray: [47, 79, 79, 1]
  , darkslategrey: [47, 79, 79, 1]
  , darkturquoise: [0, 206, 209, 1]
  , darkviolet: [148, 0, 211, 1]
  , deeppink: [255, 20, 147, 1]
  , deepskyblue: [0, 191, 255, 1]
  , dimgray: [105, 105, 105, 1]
  , dimgrey: [105, 105, 105, 1]
  , dodgerblue: [30, 144, 255, 1]
  , firebrick: [178, 34, 34, 1]
  , floralwhite: [255, 250, 240, 1]
  , forestgreen: [34, 139, 34, 1]
  , fuchsia: [255, 0, 255, 1]
  , gainsboro: [220, 220, 220, 1]
  , ghostwhite: [248, 248, 255, 1]
  , gold: [255, 215, 0, 1]
  , goldenrod: [218, 165, 32, 1]
  , gray: [128, 128, 128, 1]
  , green: [0, 128, 0, 1]
  , greenyellow: [173, 255, 47, 1]
  , grey: [128, 128, 128, 1]
  , honeydew: [240, 255, 240, 1]
  , hotpink: [255, 105, 180, 1]
  , indianred: [205, 92, 92, 1]
  , indigo: [75, 0, 130, 1]
  , ivory: [255, 255, 240, 1]
  , khaki: [240, 230, 140, 1]
  , lavender: [230, 230, 250, 1]
  , lavenderblush: [255, 240, 245, 1]
  , lawngreen: [124, 252, 0, 1]
  , lemonchiffon: [255, 250, 205, 1]
  , lightblue: [173, 216, 230, 1]
  , lightcoral: [240, 128, 128, 1]
  , lightcyan: [224, 255, 255, 1]
  , lightgoldenrodyellow: [250, 250, 210, 1]
  , lightgray: [211, 211, 211, 1]
  , lightgreen: [144, 238, 144, 1]
  , lightgrey: [211, 211, 211, 1]
  , lightpink: [255, 182, 193, 1]
  , lightsalmon: [255, 160, 122, 1]
  , lightseagreen: [32, 178, 170, 1]
  , lightskyblue: [135, 206, 250, 1]
  , lightslategray: [119, 136, 153, 1]
  , lightslategrey: [119, 136, 153, 1]
  , lightsteelblue: [176, 196, 222, 1]
  , lightyellow: [255, 255, 224, 1]
  , lime: [0, 255, 0, 1]
  , limegreen: [50, 205, 50, 1]
  , linen: [250, 240, 230, 1]
  , magenta: [255, 0, 255, 1]
  , maroon: [128, 0, 0, 1]
  , mediumaquamarine: [102, 205, 170, 1]
  , mediumblue: [0, 0, 205, 1]
  , mediumorchid: [186, 85, 211, 1]
  , mediumpurple: [147, 112, 219, 1]
  , mediumseagreen: [60, 179, 113, 1]
  , mediumslateblue: [123, 104, 238, 1]
  , mediumspringgreen: [0, 250, 154, 1]
  , mediumturquoise: [72, 209, 204, 1]
  , mediumvioletred: [199, 21, 133, 1]
  , midnightblue: [25, 25, 112, 1]
  , mintcream: [245, 255, 250, 1]
  , mistyrose: [255, 228, 225, 1]
  , moccasin: [255, 228, 181, 1]
  , navajowhite: [255, 222, 173, 1]
  , navy: [0, 0, 128, 1]
  , oldlace: [253, 245, 230, 1]
  , olive: [128, 128, 0, 1]
  , olivedrab: [107, 142, 35, 1]
  , orange: [255, 165, 0, 1]
  , orangered: [255, 69, 0, 1]
  , orchid: [218, 112, 214, 1]
  , palegoldenrod: [238, 232, 170, 1]
  , palegreen: [152, 251, 152, 1]
  , paleturquoise: [175, 238, 238, 1]
  , palevioletred: [219, 112, 147, 1]
  , papayawhip: [255, 239, 213, 1]
  , peachpuff: [255, 218, 185, 1]
  , peru: [205, 133, 63, 1]
  , pink: [255, 192, 203, 1]
  , plum: [221, 160, 221, 1]
  , powderblue: [176, 224, 230, 1]
  , purple: [128, 0, 128, 1]
  , red: [255, 0, 0, 1]
  , rosybrown: [188, 143, 143, 1]
  , royalblue: [65, 105, 225, 1]
  , saddlebrown: [139, 69, 19, 1]
  , salmon: [250, 128, 114, 1]
  , sandybrown: [244, 164, 96, 1]
  , seagreen: [46, 139, 87, 1]
  , seashell: [255, 245, 238, 1]
  , sienna: [160, 82, 45, 1]
  , silver: [192, 192, 192, 1]
  , skyblue: [135, 206, 235, 1]
  , slateblue: [106, 90, 205, 1]
  , slategray: [112, 128, 144, 1]
  , slategrey: [112, 128, 144, 1]
  , snow: [255, 250, 250, 1]
  , springgreen: [0, 255, 127, 1]
  , steelblue: [70, 130, 180, 1]
  , tan: [210, 180, 140, 1]
  , teal: [0, 128, 128, 1]
  , thistle: [216, 191, 216, 1]
  , tomato: [255, 99, 71, 1]
  , transparent: [0, 0, 0, 0]
  , turquoise: [64, 224, 208, 1]
  , violet: [238, 130, 238, 1]
  , wheat: [245, 222, 179, 1]
  , white: [255, 255, 255, 1]
  , whitesmoke: [245, 245, 245, 1]
  , yellow: [255, 255, 0, 1]
  , yellowgreen: [154, 205, 50, 1]
  , rebeccapurple: [102, 51, 153, 1]
};

var browserExports = {};
var browser$1 = {
  get exports(){ return browserExports; },
  set exports(v){ browserExports = v; },
};

var debugExports = {};
var debug = {
  get exports(){ return debugExports; },
  set exports(v){ debugExports = v; },
};

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

var ms = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse$3(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse$3(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

(function (module, exports) {
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = ms;

	/**
	 * Active `debug` instances.
	 */
	exports.instances = [];

	/**
	 * The currently active debug mode names, and names to skip.
	 */

	exports.names = [];
	exports.skips = [];

	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	 */

	exports.formatters = {};

	/**
	 * Select a color.
	 * @param {String} namespace
	 * @return {Number}
	 * @api private
	 */

	function selectColor(namespace) {
	  var hash = 0, i;

	  for (i in namespace) {
	    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
	    hash |= 0; // Convert to 32bit integer
	  }

	  return exports.colors[Math.abs(hash) % exports.colors.length];
	}

	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */

	function createDebug(namespace) {

	  var prevTime;

	  function debug() {
	    // disabled?
	    if (!debug.enabled) return;

	    var self = debug;

	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms = curr - (prevTime || curr);
	    self.diff = ms;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;

	    // turn the `arguments` into a proper Array
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }

	    args[0] = exports.coerce(args[0]);

	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %O
	      args.unshift('%O');
	    }

	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);

	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });

	    // apply env-specific formatting (colors, etc.)
	    exports.formatArgs.call(self, args);

	    var logFn = debug.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }

	  debug.namespace = namespace;
	  debug.enabled = exports.enabled(namespace);
	  debug.useColors = exports.useColors();
	  debug.color = selectColor(namespace);
	  debug.destroy = destroy;

	  // env-specific initialization logic for debug instances
	  if ('function' === typeof exports.init) {
	    exports.init(debug);
	  }

	  exports.instances.push(debug);

	  return debug;
	}

	function destroy () {
	  var index = exports.instances.indexOf(this);
	  if (index !== -1) {
	    exports.instances.splice(index, 1);
	    return true;
	  } else {
	    return false;
	  }
	}

	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */

	function enable(namespaces) {
	  exports.save(namespaces);

	  exports.names = [];
	  exports.skips = [];

	  var i;
	  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
	  var len = split.length;

	  for (i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }

	  for (i = 0; i < exports.instances.length; i++) {
	    var instance = exports.instances[i];
	    instance.enabled = exports.enabled(instance.namespace);
	  }
	}

	/**
	 * Disable debug output.
	 *
	 * @api public
	 */

	function disable() {
	  exports.enable('');
	}

	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */

	function enabled(name) {
	  if (name[name.length - 1] === '*') {
	    return true;
	  }
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}
} (debug, debugExports));

(function (module, exports) {
	exports = module.exports = debugExports;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = 'undefined' != typeof chrome
	               && 'undefined' != typeof chrome.storage
	                  ? chrome.storage.local
	                  : localstorage();

	/**
	 * Colors.
	 */

	exports.colors = [
	  '#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC',
	  '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF',
	  '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC',
	  '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF',
	  '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC',
	  '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033',
	  '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366',
	  '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933',
	  '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC',
	  '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',
	  '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'
	];

	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */

	function useColors() {
	  // NB: In an Electron preload script, document will be defined but not fully
	  // initialized. Since we know we're in Chrome, we'll just detect this case
	  // explicitly
	  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
	    return true;
	  }

	  // Internet Explorer and Edge do not support colors.
	  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
	    return false;
	  }

	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
	    // double check webkit in userAgent just in case we are in a worker
	    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
	}

	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */

	exports.formatters.j = function(v) {
	  try {
	    return JSON.stringify(v);
	  } catch (err) {
	    return '[UnexpectedJSONParseError]: ' + err.message;
	  }
	};


	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */

	function formatArgs(args) {
	  var useColors = this.useColors;

	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);

	  if (!useColors) return;

	  var c = 'color: ' + this.color;
	  args.splice(1, 0, c, 'color: inherit');

	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-zA-Z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });

	  args.splice(lastC, 0, c);
	}

	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */

	function log() {
	  // this hackery is required for IE8/9, where
	  // the `console.log` function doesn't have 'apply'
	  return 'object' === typeof console
	    && console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      exports.storage.removeItem('debug');
	    } else {
	      exports.storage.debug = namespaces;
	    }
	  } catch(e) {}
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  var r;
	  try {
	    r = exports.storage.debug;
	  } catch(e) {}

	  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	  if (!r && typeof process !== 'undefined' && 'env' in process) {
	    r = process.env.DEBUG;
	  }

	  return r;
	}

	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */

	exports.enable(load());

	/**
	 * Localstorage attempts to return the localstorage.
	 *
	 * This is necessary because safari throws
	 * when a user disables cookies/localstorage
	 * and you attempt to access it.
	 *
	 * @return {LocalStorage}
	 * @api private
	 */

	function localstorage() {
	  try {
	    return window.localStorage;
	  } catch (e) {}
	}
} (browser$1, browserExports));

var urlExports = {};
var url$2 = {
  get exports(){ return urlExports; },
  set exports(v){ urlExports = v; },
};

var __dirname$1 = '/Node\stylus-converter\node_modules\stylus\lib';

var rendererExports = {};
var renderer = {
  get exports(){ return rendererExports; },
  set exports(v){ rendererExports = v; },
};

var sourcemapperExports = {};
var sourcemapper = {
  get exports(){ return sourcemapperExports; },
  set exports(v){ sourcemapperExports = v; },
};

var sourceMap = {};

var sourceMapGeneratorExports = {};
var sourceMapGenerator = {
  get exports(){ return sourceMapGeneratorExports; },
  set exports(v){ sourceMapGeneratorExports = v; },
};

var __filename$1 = '/Node\stylus-converter\node_modules\amdefine';

var amdefine_1;
var hasRequiredAmdefine;

function requireAmdefine () {
	if (hasRequiredAmdefine) return amdefine_1;
	hasRequiredAmdefine = 1;

	/**
	 * Creates a define for node.
	 * @param {Object} module the "module" object that is defined by Node for the
	 * current module.
	 * @param {Function} [requireFn]. Node's require function for the current module.
	 * It only needs to be passed in Node versions before 0.5, when module.require
	 * did not exist.
	 * @returns {Function} a define function that is usable for the current node
	 * module.
	 */
	function amdefine(module, requireFn) {
	    var defineCache = {},
	        loaderCache = {},
	        alreadyCalled = false,
	        path = require$$7,
	        makeRequire, stringRequire;

	    /**
	     * Trims the . and .. from an array of path segments.
	     * It will keep a leading path segment if a .. will become
	     * the first path segment, to help with module name lookups,
	     * which act like paths, but can be remapped. But the end result,
	     * all paths that use this function should look normalized.
	     * NOTE: this method MODIFIES the input array.
	     * @param {Array} ary the array of path segments.
	     */
	    function trimDots(ary) {
	        var i, part;
	        for (i = 0; ary[i]; i+= 1) {
	            part = ary[i];
	            if (part === '.') {
	                ary.splice(i, 1);
	                i -= 1;
	            } else if (part === '..') {
	                if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
	                    //End of the line. Keep at least one non-dot
	                    //path segment at the front so it can be mapped
	                    //correctly to disk. Otherwise, there is likely
	                    //no path mapping for a path starting with '..'.
	                    //This can still fail, but catches the most reasonable
	                    //uses of ..
	                    break;
	                } else if (i > 0) {
	                    ary.splice(i - 1, 2);
	                    i -= 2;
	                }
	            }
	        }
	    }

	    function normalize(name, baseName) {
	        var baseParts;

	        //Adjust any relative paths.
	        if (name && name.charAt(0) === '.') {
	            //If have a base name, try to normalize against it,
	            //otherwise, assume it is a top-level require that will
	            //be relative to baseUrl in the end.
	            if (baseName) {
	                baseParts = baseName.split('/');
	                baseParts = baseParts.slice(0, baseParts.length - 1);
	                baseParts = baseParts.concat(name.split('/'));
	                trimDots(baseParts);
	                name = baseParts.join('/');
	            }
	        }

	        return name;
	    }

	    /**
	     * Create the normalize() function passed to a loader plugin's
	     * normalize method.
	     */
	    function makeNormalize(relName) {
	        return function (name) {
	            return normalize(name, relName);
	        };
	    }

	    function makeLoad(id) {
	        function load(value) {
	            loaderCache[id] = value;
	        }

	        load.fromText = function (id, text) {
	            //This one is difficult because the text can/probably uses
	            //define, and any relative paths and requires should be relative
	            //to that id was it would be found on disk. But this would require
	            //bootstrapping a module/require fairly deeply from node core.
	            //Not sure how best to go about that yet.
	            throw new Error('amdefine does not implement load.fromText');
	        };

	        return load;
	    }

	    makeRequire = function (systemRequire, exports, module, relId) {
	        function amdRequire(deps, callback) {
	            if (typeof deps === 'string') {
	                //Synchronous, single module require('')
	                return stringRequire(systemRequire, exports, module, deps, relId);
	            } else {
	                //Array of dependencies with a callback.

	                //Convert the dependencies to modules.
	                deps = deps.map(function (depName) {
	                    return stringRequire(systemRequire, exports, module, depName, relId);
	                });

	                //Wait for next tick to call back the require call.
	                if (callback) {
	                    process.nextTick(function () {
	                        callback.apply(null, deps);
	                    });
	                }
	            }
	        }

	        amdRequire.toUrl = function (filePath) {
	            if (filePath.indexOf('.') === 0) {
	                return normalize(filePath, path.dirname(module.filename));
	            } else {
	                return filePath;
	            }
	        };

	        return amdRequire;
	    };

	    //Favor explicit value, passed in if the module wants to support Node 0.4.
	    requireFn = requireFn || function req() {
	        return module.require.apply(module, arguments);
	    };

	    function runFactory(id, deps, factory) {
	        var r, e, m, result;

	        if (id) {
	            e = loaderCache[id] = {};
	            m = {
	                id: id,
	                uri: __filename$1,
	                exports: e
	            };
	            r = makeRequire(requireFn, e, m, id);
	        } else {
	            //Only support one define call per file
	            if (alreadyCalled) {
	                throw new Error('amdefine with no module ID cannot be called more than once per file.');
	            }
	            alreadyCalled = true;

	            //Use the real variables from node
	            //Use module.exports for exports, since
	            //the exports in here is amdefine exports.
	            e = module.exports;
	            m = module;
	            r = makeRequire(requireFn, e, m, module.id);
	        }

	        //If there are dependencies, they are strings, so need
	        //to convert them to dependency values.
	        if (deps) {
	            deps = deps.map(function (depName) {
	                return r(depName);
	            });
	        }

	        //Call the factory with the right dependencies.
	        if (typeof factory === 'function') {
	            result = factory.apply(m.exports, deps);
	        } else {
	            result = factory;
	        }

	        if (result !== undefined) {
	            m.exports = result;
	            if (id) {
	                loaderCache[id] = m.exports;
	            }
	        }
	    }

	    stringRequire = function (systemRequire, exports, module, id, relId) {
	        //Split the ID by a ! so that
	        var index = id.indexOf('!'),
	            originalId = id,
	            prefix, plugin;

	        if (index === -1) {
	            id = normalize(id, relId);

	            //Straight module lookup. If it is one of the special dependencies,
	            //deal with it, otherwise, delegate to node.
	            if (id === 'require') {
	                return makeRequire(systemRequire, exports, module, relId);
	            } else if (id === 'exports') {
	                return exports;
	            } else if (id === 'module') {
	                return module;
	            } else if (loaderCache.hasOwnProperty(id)) {
	                return loaderCache[id];
	            } else if (defineCache[id]) {
	                runFactory.apply(null, defineCache[id]);
	                return loaderCache[id];
	            } else {
	                if(systemRequire) {
	                    return systemRequire(originalId);
	                } else {
	                    throw new Error('No module with ID: ' + id);
	                }
	            }
	        } else {
	            //There is a plugin in play.
	            prefix = id.substring(0, index);
	            id = id.substring(index + 1, id.length);

	            plugin = stringRequire(systemRequire, exports, module, prefix, relId);

	            if (plugin.normalize) {
	                id = plugin.normalize(id, makeNormalize(relId));
	            } else {
	                //Normalize the ID normally.
	                id = normalize(id, relId);
	            }

	            if (loaderCache[id]) {
	                return loaderCache[id];
	            } else {
	                plugin.load(id, makeRequire(systemRequire, exports, module, relId), makeLoad(id), {});

	                return loaderCache[id];
	            }
	        }
	    };

	    //Create a define function specific to the module asking for amdefine.
	    function define(id, deps, factory) {
	        if (Array.isArray(id)) {
	            factory = deps;
	            deps = id;
	            id = undefined;
	        } else if (typeof id !== 'string') {
	            factory = id;
	            id = deps = undefined;
	        }

	        if (deps && !Array.isArray(deps)) {
	            factory = deps;
	            deps = undefined;
	        }

	        if (!deps) {
	            deps = ['require', 'exports', 'module'];
	        }

	        //Set up properties for this module. If an ID, then use
	        //internal cache. If no ID, then use the external variables
	        //for this node module.
	        if (id) {
	            //Put the module in deep freeze until there is a
	            //require call for it.
	            defineCache[id] = [id, deps, factory];
	        } else {
	            runFactory(id, deps, factory);
	        }
	    }

	    //define.require, which has access to all the values in the
	    //cache. Useful for AMD modules that all have IDs in the file,
	    //but need to finally export a value to node based on one of those
	    //IDs.
	    define.require = function (id) {
	        if (loaderCache[id]) {
	            return loaderCache[id];
	        }

	        if (defineCache[id]) {
	            runFactory.apply(null, defineCache[id]);
	            return loaderCache[id];
	        }
	    };

	    define.amd = {};

	    return define;
	}

	amdefine_1 = amdefine;
	return amdefine_1;
}

/* -*- Mode: js; js-indent-level: 2; -*- */

var hasRequiredSourceMapGenerator;

function requireSourceMapGenerator () {
	if (hasRequiredSourceMapGenerator) return sourceMapGeneratorExports;
	hasRequiredSourceMapGenerator = 1;
	(function (module) {
		/*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */
		if (typeof define !== 'function') {
		    var define = requireAmdefine()(module, commonjsRequire);
		}
		define(function (require, exports, module) {

		  var base64VLQ = require('./base64-vlq');
		  var util = require('./util');
		  var ArraySet = require('./array-set').ArraySet;
		  var MappingList = require('./mapping-list').MappingList;

		  /**
		   * An instance of the SourceMapGenerator represents a source map which is
		   * being built incrementally. You may pass an object with the following
		   * properties:
		   *
		   *   - file: The filename of the generated source.
		   *   - sourceRoot: A root for all relative URLs in this source map.
		   */
		  function SourceMapGenerator(aArgs) {
		    if (!aArgs) {
		      aArgs = {};
		    }
		    this._file = util.getArg(aArgs, 'file', null);
		    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
		    this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
		    this._sources = new ArraySet();
		    this._names = new ArraySet();
		    this._mappings = new MappingList();
		    this._sourcesContents = null;
		  }

		  SourceMapGenerator.prototype._version = 3;

		  /**
		   * Creates a new SourceMapGenerator based on a SourceMapConsumer
		   *
		   * @param aSourceMapConsumer The SourceMap.
		   */
		  SourceMapGenerator.fromSourceMap =
		    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
		      var sourceRoot = aSourceMapConsumer.sourceRoot;
		      var generator = new SourceMapGenerator({
		        file: aSourceMapConsumer.file,
		        sourceRoot: sourceRoot
		      });
		      aSourceMapConsumer.eachMapping(function (mapping) {
		        var newMapping = {
		          generated: {
		            line: mapping.generatedLine,
		            column: mapping.generatedColumn
		          }
		        };

		        if (mapping.source != null) {
		          newMapping.source = mapping.source;
		          if (sourceRoot != null) {
		            newMapping.source = util.relative(sourceRoot, newMapping.source);
		          }

		          newMapping.original = {
		            line: mapping.originalLine,
		            column: mapping.originalColumn
		          };

		          if (mapping.name != null) {
		            newMapping.name = mapping.name;
		          }
		        }

		        generator.addMapping(newMapping);
		      });
		      aSourceMapConsumer.sources.forEach(function (sourceFile) {
		        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
		        if (content != null) {
		          generator.setSourceContent(sourceFile, content);
		        }
		      });
		      return generator;
		    };

		  /**
		   * Add a single mapping from original source line and column to the generated
		   * source's line and column for this source map being created. The mapping
		   * object should have the following properties:
		   *
		   *   - generated: An object with the generated line and column positions.
		   *   - original: An object with the original line and column positions.
		   *   - source: The original source file (relative to the sourceRoot).
		   *   - name: An optional original token name for this mapping.
		   */
		  SourceMapGenerator.prototype.addMapping =
		    function SourceMapGenerator_addMapping(aArgs) {
		      var generated = util.getArg(aArgs, 'generated');
		      var original = util.getArg(aArgs, 'original', null);
		      var source = util.getArg(aArgs, 'source', null);
		      var name = util.getArg(aArgs, 'name', null);

		      if (!this._skipValidation) {
		        this._validateMapping(generated, original, source, name);
		      }

		      if (source != null && !this._sources.has(source)) {
		        this._sources.add(source);
		      }

		      if (name != null && !this._names.has(name)) {
		        this._names.add(name);
		      }

		      this._mappings.add({
		        generatedLine: generated.line,
		        generatedColumn: generated.column,
		        originalLine: original != null && original.line,
		        originalColumn: original != null && original.column,
		        source: source,
		        name: name
		      });
		    };

		  /**
		   * Set the source content for a source file.
		   */
		  SourceMapGenerator.prototype.setSourceContent =
		    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
		      var source = aSourceFile;
		      if (this._sourceRoot != null) {
		        source = util.relative(this._sourceRoot, source);
		      }

		      if (aSourceContent != null) {
		        // Add the source content to the _sourcesContents map.
		        // Create a new _sourcesContents map if the property is null.
		        if (!this._sourcesContents) {
		          this._sourcesContents = {};
		        }
		        this._sourcesContents[util.toSetString(source)] = aSourceContent;
		      } else if (this._sourcesContents) {
		        // Remove the source file from the _sourcesContents map.
		        // If the _sourcesContents map is empty, set the property to null.
		        delete this._sourcesContents[util.toSetString(source)];
		        if (Object.keys(this._sourcesContents).length === 0) {
		          this._sourcesContents = null;
		        }
		      }
		    };

		  /**
		   * Applies the mappings of a sub-source-map for a specific source file to the
		   * source map being generated. Each mapping to the supplied source file is
		   * rewritten using the supplied source map. Note: The resolution for the
		   * resulting mappings is the minimium of this map and the supplied map.
		   *
		   * @param aSourceMapConsumer The source map to be applied.
		   * @param aSourceFile Optional. The filename of the source file.
		   *        If omitted, SourceMapConsumer's file property will be used.
		   * @param aSourceMapPath Optional. The dirname of the path to the source map
		   *        to be applied. If relative, it is relative to the SourceMapConsumer.
		   *        This parameter is needed when the two source maps aren't in the same
		   *        directory, and the source map to be applied contains relative source
		   *        paths. If so, those relative source paths need to be rewritten
		   *        relative to the SourceMapGenerator.
		   */
		  SourceMapGenerator.prototype.applySourceMap =
		    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
		      var sourceFile = aSourceFile;
		      // If aSourceFile is omitted, we will use the file property of the SourceMap
		      if (aSourceFile == null) {
		        if (aSourceMapConsumer.file == null) {
		          throw new Error(
		            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
		            'or the source map\'s "file" property. Both were omitted.'
		          );
		        }
		        sourceFile = aSourceMapConsumer.file;
		      }
		      var sourceRoot = this._sourceRoot;
		      // Make "sourceFile" relative if an absolute Url is passed.
		      if (sourceRoot != null) {
		        sourceFile = util.relative(sourceRoot, sourceFile);
		      }
		      // Applying the SourceMap can add and remove items from the sources and
		      // the names array.
		      var newSources = new ArraySet();
		      var newNames = new ArraySet();

		      // Find mappings for the "sourceFile"
		      this._mappings.unsortedForEach(function (mapping) {
		        if (mapping.source === sourceFile && mapping.originalLine != null) {
		          // Check if it can be mapped by the source map, then update the mapping.
		          var original = aSourceMapConsumer.originalPositionFor({
		            line: mapping.originalLine,
		            column: mapping.originalColumn
		          });
		          if (original.source != null) {
		            // Copy mapping
		            mapping.source = original.source;
		            if (aSourceMapPath != null) {
		              mapping.source = util.join(aSourceMapPath, mapping.source);
		            }
		            if (sourceRoot != null) {
		              mapping.source = util.relative(sourceRoot, mapping.source);
		            }
		            mapping.originalLine = original.line;
		            mapping.originalColumn = original.column;
		            if (original.name != null) {
		              mapping.name = original.name;
		            }
		          }
		        }

		        var source = mapping.source;
		        if (source != null && !newSources.has(source)) {
		          newSources.add(source);
		        }

		        var name = mapping.name;
		        if (name != null && !newNames.has(name)) {
		          newNames.add(name);
		        }

		      }, this);
		      this._sources = newSources;
		      this._names = newNames;

		      // Copy sourcesContents of applied map.
		      aSourceMapConsumer.sources.forEach(function (sourceFile) {
		        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
		        if (content != null) {
		          if (aSourceMapPath != null) {
		            sourceFile = util.join(aSourceMapPath, sourceFile);
		          }
		          if (sourceRoot != null) {
		            sourceFile = util.relative(sourceRoot, sourceFile);
		          }
		          this.setSourceContent(sourceFile, content);
		        }
		      }, this);
		    };

		  /**
		   * A mapping can have one of the three levels of data:
		   *
		   *   1. Just the generated position.
		   *   2. The Generated position, original position, and original source.
		   *   3. Generated and original position, original source, as well as a name
		   *      token.
		   *
		   * To maintain consistency, we validate that any new mapping being added falls
		   * in to one of these categories.
		   */
		  SourceMapGenerator.prototype._validateMapping =
		    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
		                                                aName) {
		      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
		          && aGenerated.line > 0 && aGenerated.column >= 0
		          && !aOriginal && !aSource && !aName) {
		        // Case 1.
		        return;
		      }
		      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
		               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
		               && aGenerated.line > 0 && aGenerated.column >= 0
		               && aOriginal.line > 0 && aOriginal.column >= 0
		               && aSource) {
		        // Cases 2 and 3.
		        return;
		      }
		      else {
		        throw new Error('Invalid mapping: ' + JSON.stringify({
		          generated: aGenerated,
		          source: aSource,
		          original: aOriginal,
		          name: aName
		        }));
		      }
		    };

		  /**
		   * Serialize the accumulated mappings in to the stream of base 64 VLQs
		   * specified by the source map format.
		   */
		  SourceMapGenerator.prototype._serializeMappings =
		    function SourceMapGenerator_serializeMappings() {
		      var previousGeneratedColumn = 0;
		      var previousGeneratedLine = 1;
		      var previousOriginalColumn = 0;
		      var previousOriginalLine = 0;
		      var previousName = 0;
		      var previousSource = 0;
		      var result = '';
		      var mapping;

		      var mappings = this._mappings.toArray();

		      for (var i = 0, len = mappings.length; i < len; i++) {
		        mapping = mappings[i];

		        if (mapping.generatedLine !== previousGeneratedLine) {
		          previousGeneratedColumn = 0;
		          while (mapping.generatedLine !== previousGeneratedLine) {
		            result += ';';
		            previousGeneratedLine++;
		          }
		        }
		        else {
		          if (i > 0) {
		            if (!util.compareByGeneratedPositions(mapping, mappings[i - 1])) {
		              continue;
		            }
		            result += ',';
		          }
		        }

		        result += base64VLQ.encode(mapping.generatedColumn
		                                   - previousGeneratedColumn);
		        previousGeneratedColumn = mapping.generatedColumn;

		        if (mapping.source != null) {
		          result += base64VLQ.encode(this._sources.indexOf(mapping.source)
		                                     - previousSource);
		          previousSource = this._sources.indexOf(mapping.source);

		          // lines are stored 0-based in SourceMap spec version 3
		          result += base64VLQ.encode(mapping.originalLine - 1
		                                     - previousOriginalLine);
		          previousOriginalLine = mapping.originalLine - 1;

		          result += base64VLQ.encode(mapping.originalColumn
		                                     - previousOriginalColumn);
		          previousOriginalColumn = mapping.originalColumn;

		          if (mapping.name != null) {
		            result += base64VLQ.encode(this._names.indexOf(mapping.name)
		                                       - previousName);
		            previousName = this._names.indexOf(mapping.name);
		          }
		        }
		      }

		      return result;
		    };

		  SourceMapGenerator.prototype._generateSourcesContent =
		    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
		      return aSources.map(function (source) {
		        if (!this._sourcesContents) {
		          return null;
		        }
		        if (aSourceRoot != null) {
		          source = util.relative(aSourceRoot, source);
		        }
		        var key = util.toSetString(source);
		        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
		                                                    key)
		          ? this._sourcesContents[key]
		          : null;
		      }, this);
		    };

		  /**
		   * Externalize the source map.
		   */
		  SourceMapGenerator.prototype.toJSON =
		    function SourceMapGenerator_toJSON() {
		      var map = {
		        version: this._version,
		        sources: this._sources.toArray(),
		        names: this._names.toArray(),
		        mappings: this._serializeMappings()
		      };
		      if (this._file != null) {
		        map.file = this._file;
		      }
		      if (this._sourceRoot != null) {
		        map.sourceRoot = this._sourceRoot;
		      }
		      if (this._sourcesContents) {
		        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
		      }

		      return map;
		    };

		  /**
		   * Render the source map being generated to a string.
		   */
		  SourceMapGenerator.prototype.toString =
		    function SourceMapGenerator_toString() {
		      return JSON.stringify(this);
		    };

		  exports.SourceMapGenerator = SourceMapGenerator;

		});
} (sourceMapGenerator));
	return sourceMapGeneratorExports;
}

var sourceMapConsumerExports = {};
var sourceMapConsumer = {
  get exports(){ return sourceMapConsumerExports; },
  set exports(v){ sourceMapConsumerExports = v; },
};

/* -*- Mode: js; js-indent-level: 2; -*- */

var hasRequiredSourceMapConsumer;

function requireSourceMapConsumer () {
	if (hasRequiredSourceMapConsumer) return sourceMapConsumerExports;
	hasRequiredSourceMapConsumer = 1;
	(function (module) {
		/*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */
		if (typeof define !== 'function') {
		    var define = requireAmdefine()(module, commonjsRequire);
		}
		define(function (require, exports, module) {

		  var util = require('./util');
		  var binarySearch = require('./binary-search');
		  var ArraySet = require('./array-set').ArraySet;
		  var base64VLQ = require('./base64-vlq');

		  /**
		   * A SourceMapConsumer instance represents a parsed source map which we can
		   * query for information about the original file positions by giving it a file
		   * position in the generated source.
		   *
		   * The only parameter is the raw source map (either as a JSON string, or
		   * already parsed to an object). According to the spec, source maps have the
		   * following attributes:
		   *
		   *   - version: Which version of the source map spec this map is following.
		   *   - sources: An array of URLs to the original source files.
		   *   - names: An array of identifiers which can be referrenced by individual mappings.
		   *   - sourceRoot: Optional. The URL root from which all sources are relative.
		   *   - sourcesContent: Optional. An array of contents of the original source files.
		   *   - mappings: A string of base64 VLQs which contain the actual mappings.
		   *   - file: Optional. The generated file this source map is associated with.
		   *
		   * Here is an example source map, taken from the source map spec[0]:
		   *
		   *     {
		   *       version : 3,
		   *       file: "out.js",
		   *       sourceRoot : "",
		   *       sources: ["foo.js", "bar.js"],
		   *       names: ["src", "maps", "are", "fun"],
		   *       mappings: "AA,AB;;ABCDE;"
		   *     }
		   *
		   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
		   */
		  function SourceMapConsumer(aSourceMap) {
		    var sourceMap = aSourceMap;
		    if (typeof aSourceMap === 'string') {
		      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
		    }

		    var version = util.getArg(sourceMap, 'version');
		    var sources = util.getArg(sourceMap, 'sources');
		    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
		    // requires the array) to play nice here.
		    var names = util.getArg(sourceMap, 'names', []);
		    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
		    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
		    var mappings = util.getArg(sourceMap, 'mappings');
		    var file = util.getArg(sourceMap, 'file', null);

		    // Once again, Sass deviates from the spec and supplies the version as a
		    // string rather than a number, so we use loose equality checking here.
		    if (version != this._version) {
		      throw new Error('Unsupported version: ' + version);
		    }

		    // Some source maps produce relative source paths like "./foo.js" instead of
		    // "foo.js".  Normalize these first so that future comparisons will succeed.
		    // See bugzil.la/1090768.
		    sources = sources.map(util.normalize);

		    // Pass `true` below to allow duplicate names and sources. While source maps
		    // are intended to be compressed and deduplicated, the TypeScript compiler
		    // sometimes generates source maps with duplicates in them. See Github issue
		    // #72 and bugzil.la/889492.
		    this._names = ArraySet.fromArray(names, true);
		    this._sources = ArraySet.fromArray(sources, true);

		    this.sourceRoot = sourceRoot;
		    this.sourcesContent = sourcesContent;
		    this._mappings = mappings;
		    this.file = file;
		  }

		  /**
		   * Create a SourceMapConsumer from a SourceMapGenerator.
		   *
		   * @param SourceMapGenerator aSourceMap
		   *        The source map that will be consumed.
		   * @returns SourceMapConsumer
		   */
		  SourceMapConsumer.fromSourceMap =
		    function SourceMapConsumer_fromSourceMap(aSourceMap) {
		      var smc = Object.create(SourceMapConsumer.prototype);

		      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
		      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
		      smc.sourceRoot = aSourceMap._sourceRoot;
		      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
		                                                              smc.sourceRoot);
		      smc.file = aSourceMap._file;

		      smc.__generatedMappings = aSourceMap._mappings.toArray().slice();
		      smc.__originalMappings = aSourceMap._mappings.toArray().slice()
		        .sort(util.compareByOriginalPositions);

		      return smc;
		    };

		  /**
		   * The version of the source mapping spec that we are consuming.
		   */
		  SourceMapConsumer.prototype._version = 3;

		  /**
		   * The list of original sources.
		   */
		  Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
		    get: function () {
		      return this._sources.toArray().map(function (s) {
		        return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
		      }, this);
		    }
		  });

		  // `__generatedMappings` and `__originalMappings` are arrays that hold the
		  // parsed mapping coordinates from the source map's "mappings" attribute. They
		  // are lazily instantiated, accessed via the `_generatedMappings` and
		  // `_originalMappings` getters respectively, and we only parse the mappings
		  // and create these arrays once queried for a source location. We jump through
		  // these hoops because there can be many thousands of mappings, and parsing
		  // them is expensive, so we only want to do it if we must.
		  //
		  // Each object in the arrays is of the form:
		  //
		  //     {
		  //       generatedLine: The line number in the generated code,
		  //       generatedColumn: The column number in the generated code,
		  //       source: The path to the original source file that generated this
		  //               chunk of code,
		  //       originalLine: The line number in the original source that
		  //                     corresponds to this chunk of generated code,
		  //       originalColumn: The column number in the original source that
		  //                       corresponds to this chunk of generated code,
		  //       name: The name of the original symbol which generated this chunk of
		  //             code.
		  //     }
		  //
		  // All properties except for `generatedLine` and `generatedColumn` can be
		  // `null`.
		  //
		  // `_generatedMappings` is ordered by the generated positions.
		  //
		  // `_originalMappings` is ordered by the original positions.

		  SourceMapConsumer.prototype.__generatedMappings = null;
		  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
		    get: function () {
		      if (!this.__generatedMappings) {
		        this.__generatedMappings = [];
		        this.__originalMappings = [];
		        this._parseMappings(this._mappings, this.sourceRoot);
		      }

		      return this.__generatedMappings;
		    }
		  });

		  SourceMapConsumer.prototype.__originalMappings = null;
		  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
		    get: function () {
		      if (!this.__originalMappings) {
		        this.__generatedMappings = [];
		        this.__originalMappings = [];
		        this._parseMappings(this._mappings, this.sourceRoot);
		      }

		      return this.__originalMappings;
		    }
		  });

		  SourceMapConsumer.prototype._nextCharIsMappingSeparator =
		    function SourceMapConsumer_nextCharIsMappingSeparator(aStr) {
		      var c = aStr.charAt(0);
		      return c === ";" || c === ",";
		    };

		  /**
		   * Parse the mappings in a string in to a data structure which we can easily
		   * query (the ordered arrays in the `this.__generatedMappings` and
		   * `this.__originalMappings` properties).
		   */
		  SourceMapConsumer.prototype._parseMappings =
		    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
		      var generatedLine = 1;
		      var previousGeneratedColumn = 0;
		      var previousOriginalLine = 0;
		      var previousOriginalColumn = 0;
		      var previousSource = 0;
		      var previousName = 0;
		      var str = aStr;
		      var temp = {};
		      var mapping;

		      while (str.length > 0) {
		        if (str.charAt(0) === ';') {
		          generatedLine++;
		          str = str.slice(1);
		          previousGeneratedColumn = 0;
		        }
		        else if (str.charAt(0) === ',') {
		          str = str.slice(1);
		        }
		        else {
		          mapping = {};
		          mapping.generatedLine = generatedLine;

		          // Generated column.
		          base64VLQ.decode(str, temp);
		          mapping.generatedColumn = previousGeneratedColumn + temp.value;
		          previousGeneratedColumn = mapping.generatedColumn;
		          str = temp.rest;

		          if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
		            // Original source.
		            base64VLQ.decode(str, temp);
		            mapping.source = this._sources.at(previousSource + temp.value);
		            previousSource += temp.value;
		            str = temp.rest;
		            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
		              throw new Error('Found a source, but no line and column');
		            }

		            // Original line.
		            base64VLQ.decode(str, temp);
		            mapping.originalLine = previousOriginalLine + temp.value;
		            previousOriginalLine = mapping.originalLine;
		            // Lines are stored 0-based
		            mapping.originalLine += 1;
		            str = temp.rest;
		            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
		              throw new Error('Found a source and line, but no column');
		            }

		            // Original column.
		            base64VLQ.decode(str, temp);
		            mapping.originalColumn = previousOriginalColumn + temp.value;
		            previousOriginalColumn = mapping.originalColumn;
		            str = temp.rest;

		            if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
		              // Original name.
		              base64VLQ.decode(str, temp);
		              mapping.name = this._names.at(previousName + temp.value);
		              previousName += temp.value;
		              str = temp.rest;
		            }
		          }

		          this.__generatedMappings.push(mapping);
		          if (typeof mapping.originalLine === 'number') {
		            this.__originalMappings.push(mapping);
		          }
		        }
		      }

		      this.__generatedMappings.sort(util.compareByGeneratedPositions);
		      this.__originalMappings.sort(util.compareByOriginalPositions);
		    };

		  /**
		   * Find the mapping that best matches the hypothetical "needle" mapping that
		   * we are searching for in the given "haystack" of mappings.
		   */
		  SourceMapConsumer.prototype._findMapping =
		    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
		                                           aColumnName, aComparator) {
		      // To return the position we are searching for, we must first find the
		      // mapping for the given position and then return the opposite position it
		      // points to. Because the mappings are sorted, we can use binary search to
		      // find the best mapping.

		      if (aNeedle[aLineName] <= 0) {
		        throw new TypeError('Line must be greater than or equal to 1, got '
		                            + aNeedle[aLineName]);
		      }
		      if (aNeedle[aColumnName] < 0) {
		        throw new TypeError('Column must be greater than or equal to 0, got '
		                            + aNeedle[aColumnName]);
		      }

		      return binarySearch.search(aNeedle, aMappings, aComparator);
		    };

		  /**
		   * Compute the last column for each generated mapping. The last column is
		   * inclusive.
		   */
		  SourceMapConsumer.prototype.computeColumnSpans =
		    function SourceMapConsumer_computeColumnSpans() {
		      for (var index = 0; index < this._generatedMappings.length; ++index) {
		        var mapping = this._generatedMappings[index];

		        // Mappings do not contain a field for the last generated columnt. We
		        // can come up with an optimistic estimate, however, by assuming that
		        // mappings are contiguous (i.e. given two consecutive mappings, the
		        // first mapping ends where the second one starts).
		        if (index + 1 < this._generatedMappings.length) {
		          var nextMapping = this._generatedMappings[index + 1];

		          if (mapping.generatedLine === nextMapping.generatedLine) {
		            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
		            continue;
		          }
		        }

		        // The last mapping for each line spans the entire line.
		        mapping.lastGeneratedColumn = Infinity;
		      }
		    };

		  /**
		   * Returns the original source, line, and column information for the generated
		   * source's line and column positions provided. The only argument is an object
		   * with the following properties:
		   *
		   *   - line: The line number in the generated source.
		   *   - column: The column number in the generated source.
		   *
		   * and an object is returned with the following properties:
		   *
		   *   - source: The original source file, or null.
		   *   - line: The line number in the original source, or null.
		   *   - column: The column number in the original source, or null.
		   *   - name: The original identifier, or null.
		   */
		  SourceMapConsumer.prototype.originalPositionFor =
		    function SourceMapConsumer_originalPositionFor(aArgs) {
		      var needle = {
		        generatedLine: util.getArg(aArgs, 'line'),
		        generatedColumn: util.getArg(aArgs, 'column')
		      };

		      var index = this._findMapping(needle,
		                                    this._generatedMappings,
		                                    "generatedLine",
		                                    "generatedColumn",
		                                    util.compareByGeneratedPositions);

		      if (index >= 0) {
		        var mapping = this._generatedMappings[index];

		        if (mapping.generatedLine === needle.generatedLine) {
		          var source = util.getArg(mapping, 'source', null);
		          if (source != null && this.sourceRoot != null) {
		            source = util.join(this.sourceRoot, source);
		          }
		          return {
		            source: source,
		            line: util.getArg(mapping, 'originalLine', null),
		            column: util.getArg(mapping, 'originalColumn', null),
		            name: util.getArg(mapping, 'name', null)
		          };
		        }
		      }

		      return {
		        source: null,
		        line: null,
		        column: null,
		        name: null
		      };
		    };

		  /**
		   * Returns the original source content. The only argument is the url of the
		   * original source file. Returns null if no original source content is
		   * availible.
		   */
		  SourceMapConsumer.prototype.sourceContentFor =
		    function SourceMapConsumer_sourceContentFor(aSource) {
		      if (!this.sourcesContent) {
		        return null;
		      }

		      if (this.sourceRoot != null) {
		        aSource = util.relative(this.sourceRoot, aSource);
		      }

		      if (this._sources.has(aSource)) {
		        return this.sourcesContent[this._sources.indexOf(aSource)];
		      }

		      var url;
		      if (this.sourceRoot != null
		          && (url = util.urlParse(this.sourceRoot))) {
		        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
		        // many users. We can help them out when they expect file:// URIs to
		        // behave like it would if they were running a local HTTP server. See
		        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
		        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
		        if (url.scheme == "file"
		            && this._sources.has(fileUriAbsPath)) {
		          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
		        }

		        if ((!url.path || url.path == "/")
		            && this._sources.has("/" + aSource)) {
		          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
		        }
		      }

		      throw new Error('"' + aSource + '" is not in the SourceMap.');
		    };

		  /**
		   * Returns the generated line and column information for the original source,
		   * line, and column positions provided. The only argument is an object with
		   * the following properties:
		   *
		   *   - source: The filename of the original source.
		   *   - line: The line number in the original source.
		   *   - column: The column number in the original source.
		   *
		   * and an object is returned with the following properties:
		   *
		   *   - line: The line number in the generated source, or null.
		   *   - column: The column number in the generated source, or null.
		   */
		  SourceMapConsumer.prototype.generatedPositionFor =
		    function SourceMapConsumer_generatedPositionFor(aArgs) {
		      var needle = {
		        source: util.getArg(aArgs, 'source'),
		        originalLine: util.getArg(aArgs, 'line'),
		        originalColumn: util.getArg(aArgs, 'column')
		      };

		      if (this.sourceRoot != null) {
		        needle.source = util.relative(this.sourceRoot, needle.source);
		      }

		      var index = this._findMapping(needle,
		                                    this._originalMappings,
		                                    "originalLine",
		                                    "originalColumn",
		                                    util.compareByOriginalPositions);

		      if (index >= 0) {
		        var mapping = this._originalMappings[index];

		        return {
		          line: util.getArg(mapping, 'generatedLine', null),
		          column: util.getArg(mapping, 'generatedColumn', null),
		          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
		        };
		      }

		      return {
		        line: null,
		        column: null,
		        lastColumn: null
		      };
		    };

		  /**
		   * Returns all generated line and column information for the original source
		   * and line provided. The only argument is an object with the following
		   * properties:
		   *
		   *   - source: The filename of the original source.
		   *   - line: The line number in the original source.
		   *
		   * and an array of objects is returned, each with the following properties:
		   *
		   *   - line: The line number in the generated source, or null.
		   *   - column: The column number in the generated source, or null.
		   */
		  SourceMapConsumer.prototype.allGeneratedPositionsFor =
		    function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
		      // When there is no exact match, SourceMapConsumer.prototype._findMapping
		      // returns the index of the closest mapping less than the needle. By
		      // setting needle.originalColumn to Infinity, we thus find the last
		      // mapping for the given line, provided such a mapping exists.
		      var needle = {
		        source: util.getArg(aArgs, 'source'),
		        originalLine: util.getArg(aArgs, 'line'),
		        originalColumn: Infinity
		      };

		      if (this.sourceRoot != null) {
		        needle.source = util.relative(this.sourceRoot, needle.source);
		      }

		      var mappings = [];

		      var index = this._findMapping(needle,
		                                    this._originalMappings,
		                                    "originalLine",
		                                    "originalColumn",
		                                    util.compareByOriginalPositions);
		      if (index >= 0) {
		        var mapping = this._originalMappings[index];

		        while (mapping && mapping.originalLine === needle.originalLine) {
		          mappings.push({
		            line: util.getArg(mapping, 'generatedLine', null),
		            column: util.getArg(mapping, 'generatedColumn', null),
		            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
		          });

		          mapping = this._originalMappings[--index];
		        }
		      }

		      return mappings.reverse();
		    };

		  SourceMapConsumer.GENERATED_ORDER = 1;
		  SourceMapConsumer.ORIGINAL_ORDER = 2;

		  /**
		   * Iterate over each mapping between an original source/line/column and a
		   * generated line/column in this source map.
		   *
		   * @param Function aCallback
		   *        The function that is called with each mapping.
		   * @param Object aContext
		   *        Optional. If specified, this object will be the value of `this` every
		   *        time that `aCallback` is called.
		   * @param aOrder
		   *        Either `SourceMapConsumer.GENERATED_ORDER` or
		   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
		   *        iterate over the mappings sorted by the generated file's line/column
		   *        order or the original's source/line/column order, respectively. Defaults to
		   *        `SourceMapConsumer.GENERATED_ORDER`.
		   */
		  SourceMapConsumer.prototype.eachMapping =
		    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
		      var context = aContext || null;
		      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

		      var mappings;
		      switch (order) {
		      case SourceMapConsumer.GENERATED_ORDER:
		        mappings = this._generatedMappings;
		        break;
		      case SourceMapConsumer.ORIGINAL_ORDER:
		        mappings = this._originalMappings;
		        break;
		      default:
		        throw new Error("Unknown order of iteration.");
		      }

		      var sourceRoot = this.sourceRoot;
		      mappings.map(function (mapping) {
		        var source = mapping.source;
		        if (source != null && sourceRoot != null) {
		          source = util.join(sourceRoot, source);
		        }
		        return {
		          source: source,
		          generatedLine: mapping.generatedLine,
		          generatedColumn: mapping.generatedColumn,
		          originalLine: mapping.originalLine,
		          originalColumn: mapping.originalColumn,
		          name: mapping.name
		        };
		      }).forEach(aCallback, context);
		    };

		  exports.SourceMapConsumer = SourceMapConsumer;

		});
} (sourceMapConsumer));
	return sourceMapConsumerExports;
}

var sourceNodeExports = {};
var sourceNode = {
  get exports(){ return sourceNodeExports; },
  set exports(v){ sourceNodeExports = v; },
};

/* -*- Mode: js; js-indent-level: 2; -*- */

var hasRequiredSourceNode;

function requireSourceNode () {
	if (hasRequiredSourceNode) return sourceNodeExports;
	hasRequiredSourceNode = 1;
	(function (module) {
		/*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */
		if (typeof define !== 'function') {
		    var define = requireAmdefine()(module, commonjsRequire);
		}
		define(function (require, exports, module) {

		  var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
		  var util = require('./util');

		  // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
		  // operating systems these days (capturing the result).
		  var REGEX_NEWLINE = /(\r?\n)/;

		  // Newline character code for charCodeAt() comparisons
		  var NEWLINE_CODE = 10;

		  // Private symbol for identifying `SourceNode`s when multiple versions of
		  // the source-map library are loaded. This MUST NOT CHANGE across
		  // versions!
		  var isSourceNode = "$$$isSourceNode$$$";

		  /**
		   * SourceNodes provide a way to abstract over interpolating/concatenating
		   * snippets of generated JavaScript source code while maintaining the line and
		   * column information associated with the original source code.
		   *
		   * @param aLine The original line number.
		   * @param aColumn The original column number.
		   * @param aSource The original source's filename.
		   * @param aChunks Optional. An array of strings which are snippets of
		   *        generated JS, or other SourceNodes.
		   * @param aName The original identifier.
		   */
		  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
		    this.children = [];
		    this.sourceContents = {};
		    this.line = aLine == null ? null : aLine;
		    this.column = aColumn == null ? null : aColumn;
		    this.source = aSource == null ? null : aSource;
		    this.name = aName == null ? null : aName;
		    this[isSourceNode] = true;
		    if (aChunks != null) this.add(aChunks);
		  }

		  /**
		   * Creates a SourceNode from generated code and a SourceMapConsumer.
		   *
		   * @param aGeneratedCode The generated code
		   * @param aSourceMapConsumer The SourceMap for the generated code
		   * @param aRelativePath Optional. The path that relative sources in the
		   *        SourceMapConsumer should be relative to.
		   */
		  SourceNode.fromStringWithSourceMap =
		    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
		      // The SourceNode we want to fill with the generated code
		      // and the SourceMap
		      var node = new SourceNode();

		      // All even indices of this array are one line of the generated code,
		      // while all odd indices are the newlines between two adjacent lines
		      // (since `REGEX_NEWLINE` captures its match).
		      // Processed fragments are removed from this array, by calling `shiftNextLine`.
		      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
		      var shiftNextLine = function() {
		        var lineContents = remainingLines.shift();
		        // The last line of a file might not have a newline.
		        var newLine = remainingLines.shift() || "";
		        return lineContents + newLine;
		      };

		      // We need to remember the position of "remainingLines"
		      var lastGeneratedLine = 1, lastGeneratedColumn = 0;

		      // The generate SourceNodes we need a code range.
		      // To extract it current and last mapping is used.
		      // Here we store the last mapping.
		      var lastMapping = null;

		      aSourceMapConsumer.eachMapping(function (mapping) {
		        if (lastMapping !== null) {
		          // We add the code from "lastMapping" to "mapping":
		          // First check if there is a new line in between.
		          if (lastGeneratedLine < mapping.generatedLine) {
		            var code = "";
		            // Associate first line with "lastMapping"
		            addMappingWithCode(lastMapping, shiftNextLine());
		            lastGeneratedLine++;
		            lastGeneratedColumn = 0;
		            // The remaining code is added without mapping
		          } else {
		            // There is no new line in between.
		            // Associate the code between "lastGeneratedColumn" and
		            // "mapping.generatedColumn" with "lastMapping"
		            var nextLine = remainingLines[0];
		            var code = nextLine.substr(0, mapping.generatedColumn -
		                                          lastGeneratedColumn);
		            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
		                                                lastGeneratedColumn);
		            lastGeneratedColumn = mapping.generatedColumn;
		            addMappingWithCode(lastMapping, code);
		            // No more remaining code, continue
		            lastMapping = mapping;
		            return;
		          }
		        }
		        // We add the generated code until the first mapping
		        // to the SourceNode without any mapping.
		        // Each line is added as separate string.
		        while (lastGeneratedLine < mapping.generatedLine) {
		          node.add(shiftNextLine());
		          lastGeneratedLine++;
		        }
		        if (lastGeneratedColumn < mapping.generatedColumn) {
		          var nextLine = remainingLines[0];
		          node.add(nextLine.substr(0, mapping.generatedColumn));
		          remainingLines[0] = nextLine.substr(mapping.generatedColumn);
		          lastGeneratedColumn = mapping.generatedColumn;
		        }
		        lastMapping = mapping;
		      }, this);
		      // We have processed all mappings.
		      if (remainingLines.length > 0) {
		        if (lastMapping) {
		          // Associate the remaining code in the current line with "lastMapping"
		          addMappingWithCode(lastMapping, shiftNextLine());
		        }
		        // and add the remaining lines without any mapping
		        node.add(remainingLines.join(""));
		      }

		      // Copy sourcesContent into SourceNode
		      aSourceMapConsumer.sources.forEach(function (sourceFile) {
		        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
		        if (content != null) {
		          if (aRelativePath != null) {
		            sourceFile = util.join(aRelativePath, sourceFile);
		          }
		          node.setSourceContent(sourceFile, content);
		        }
		      });

		      return node;

		      function addMappingWithCode(mapping, code) {
		        if (mapping === null || mapping.source === undefined) {
		          node.add(code);
		        } else {
		          var source = aRelativePath
		            ? util.join(aRelativePath, mapping.source)
		            : mapping.source;
		          node.add(new SourceNode(mapping.originalLine,
		                                  mapping.originalColumn,
		                                  source,
		                                  code,
		                                  mapping.name));
		        }
		      }
		    };

		  /**
		   * Add a chunk of generated JS to this source node.
		   *
		   * @param aChunk A string snippet of generated JS code, another instance of
		   *        SourceNode, or an array where each member is one of those things.
		   */
		  SourceNode.prototype.add = function SourceNode_add(aChunk) {
		    if (Array.isArray(aChunk)) {
		      aChunk.forEach(function (chunk) {
		        this.add(chunk);
		      }, this);
		    }
		    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
		      if (aChunk) {
		        this.children.push(aChunk);
		      }
		    }
		    else {
		      throw new TypeError(
		        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
		      );
		    }
		    return this;
		  };

		  /**
		   * Add a chunk of generated JS to the beginning of this source node.
		   *
		   * @param aChunk A string snippet of generated JS code, another instance of
		   *        SourceNode, or an array where each member is one of those things.
		   */
		  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
		    if (Array.isArray(aChunk)) {
		      for (var i = aChunk.length-1; i >= 0; i--) {
		        this.prepend(aChunk[i]);
		      }
		    }
		    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
		      this.children.unshift(aChunk);
		    }
		    else {
		      throw new TypeError(
		        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
		      );
		    }
		    return this;
		  };

		  /**
		   * Walk over the tree of JS snippets in this node and its children. The
		   * walking function is called once for each snippet of JS and is passed that
		   * snippet and the its original associated source's line/column location.
		   *
		   * @param aFn The traversal function.
		   */
		  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
		    var chunk;
		    for (var i = 0, len = this.children.length; i < len; i++) {
		      chunk = this.children[i];
		      if (chunk[isSourceNode]) {
		        chunk.walk(aFn);
		      }
		      else {
		        if (chunk !== '') {
		          aFn(chunk, { source: this.source,
		                       line: this.line,
		                       column: this.column,
		                       name: this.name });
		        }
		      }
		    }
		  };

		  /**
		   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
		   * each of `this.children`.
		   *
		   * @param aSep The separator.
		   */
		  SourceNode.prototype.join = function SourceNode_join(aSep) {
		    var newChildren;
		    var i;
		    var len = this.children.length;
		    if (len > 0) {
		      newChildren = [];
		      for (i = 0; i < len-1; i++) {
		        newChildren.push(this.children[i]);
		        newChildren.push(aSep);
		      }
		      newChildren.push(this.children[i]);
		      this.children = newChildren;
		    }
		    return this;
		  };

		  /**
		   * Call String.prototype.replace on the very right-most source snippet. Useful
		   * for trimming whitespace from the end of a source node, etc.
		   *
		   * @param aPattern The pattern to replace.
		   * @param aReplacement The thing to replace the pattern with.
		   */
		  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
		    var lastChild = this.children[this.children.length - 1];
		    if (lastChild[isSourceNode]) {
		      lastChild.replaceRight(aPattern, aReplacement);
		    }
		    else if (typeof lastChild === 'string') {
		      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
		    }
		    else {
		      this.children.push(''.replace(aPattern, aReplacement));
		    }
		    return this;
		  };

		  /**
		   * Set the source content for a source file. This will be added to the SourceMapGenerator
		   * in the sourcesContent field.
		   *
		   * @param aSourceFile The filename of the source file
		   * @param aSourceContent The content of the source file
		   */
		  SourceNode.prototype.setSourceContent =
		    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
		      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
		    };

		  /**
		   * Walk over the tree of SourceNodes. The walking function is called for each
		   * source file content and is passed the filename and source content.
		   *
		   * @param aFn The traversal function.
		   */
		  SourceNode.prototype.walkSourceContents =
		    function SourceNode_walkSourceContents(aFn) {
		      for (var i = 0, len = this.children.length; i < len; i++) {
		        if (this.children[i][isSourceNode]) {
		          this.children[i].walkSourceContents(aFn);
		        }
		      }

		      var sources = Object.keys(this.sourceContents);
		      for (var i = 0, len = sources.length; i < len; i++) {
		        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
		      }
		    };

		  /**
		   * Return the string representation of this source node. Walks over the tree
		   * and concatenates all the various snippets together to one string.
		   */
		  SourceNode.prototype.toString = function SourceNode_toString() {
		    var str = "";
		    this.walk(function (chunk) {
		      str += chunk;
		    });
		    return str;
		  };

		  /**
		   * Returns the string representation of this source node along with a source
		   * map.
		   */
		  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
		    var generated = {
		      code: "",
		      line: 1,
		      column: 0
		    };
		    var map = new SourceMapGenerator(aArgs);
		    var sourceMappingActive = false;
		    var lastOriginalSource = null;
		    var lastOriginalLine = null;
		    var lastOriginalColumn = null;
		    var lastOriginalName = null;
		    this.walk(function (chunk, original) {
		      generated.code += chunk;
		      if (original.source !== null
		          && original.line !== null
		          && original.column !== null) {
		        if(lastOriginalSource !== original.source
		           || lastOriginalLine !== original.line
		           || lastOriginalColumn !== original.column
		           || lastOriginalName !== original.name) {
		          map.addMapping({
		            source: original.source,
		            original: {
		              line: original.line,
		              column: original.column
		            },
		            generated: {
		              line: generated.line,
		              column: generated.column
		            },
		            name: original.name
		          });
		        }
		        lastOriginalSource = original.source;
		        lastOriginalLine = original.line;
		        lastOriginalColumn = original.column;
		        lastOriginalName = original.name;
		        sourceMappingActive = true;
		      } else if (sourceMappingActive) {
		        map.addMapping({
		          generated: {
		            line: generated.line,
		            column: generated.column
		          }
		        });
		        lastOriginalSource = null;
		        sourceMappingActive = false;
		      }
		      for (var idx = 0, length = chunk.length; idx < length; idx++) {
		        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
		          generated.line++;
		          generated.column = 0;
		          // Mappings end at eol
		          if (idx + 1 === length) {
		            lastOriginalSource = null;
		            sourceMappingActive = false;
		          } else if (sourceMappingActive) {
		            map.addMapping({
		              source: original.source,
		              original: {
		                line: original.line,
		                column: original.column
		              },
		              generated: {
		                line: generated.line,
		                column: generated.column
		              },
		              name: original.name
		            });
		          }
		        } else {
		          generated.column++;
		        }
		      }
		    });
		    this.walkSourceContents(function (sourceFile, sourceContent) {
		      map.setSourceContent(sourceFile, sourceContent);
		    });

		    return { code: generated.code, map: map };
		  };

		  exports.SourceNode = SourceNode;

		});
} (sourceNode));
	return sourceNodeExports;
}

/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var hasRequiredSourceMap;

function requireSourceMap () {
	if (hasRequiredSourceMap) return sourceMap;
	hasRequiredSourceMap = 1;
	sourceMap.SourceMapGenerator = requireSourceMapGenerator().SourceMapGenerator;
	sourceMap.SourceMapConsumer = requireSourceMapConsumer().SourceMapConsumer;
	sourceMap.SourceNode = requireSourceNode().SourceNode;
	return sourceMap;
}

var hasRequiredSourcemapper;

function requireSourcemapper () {
	if (hasRequiredSourcemapper) return sourcemapperExports;
	hasRequiredSourcemapper = 1;
	/**
	 * Module dependencies.
	 */

	var Compiler = requireCompiler()
	  , SourceMapGenerator = requireSourceMap().SourceMapGenerator
	  , basename = require$$7.basename
	  , extname = require$$7.extname
	  , dirname = require$$7.dirname
	  , join = require$$7.join
	  , relative = require$$7.relative
	  , sep = require$$7.sep
	  , fs = require$$0$1;

	/**
	 * Initialize a new `SourceMapper` generator with the given `root` Node
	 * and the following `options`.
	 *
	 * @param {Node} root
	 * @api public
	 */

	var SourceMapper = sourcemapper.exports = function SourceMapper(root, options){
	  options = options || {};
	  this.column = 1;
	  this.lineno = 1;
	  this.contents = {};
	  this.filename = options.filename;
	  this.dest = options.dest;

	  var sourcemap = options.sourcemap;
	  this.basePath = sourcemap.basePath || '.';
	  this.inline = sourcemap.inline;
	  this.comment = sourcemap.comment;
	  if (this.dest && extname(this.dest) === '.css') {
	    this.basename = basename(this.dest);
	    this.dest = dirname(this.dest);
	  } else {
	    this.basename = basename(this.filename, extname(this.filename)) + '.css';
	  }
	  this.utf8 = false;

	  this.map = new SourceMapGenerator({
	    file: this.basename,
	    sourceRoot: sourcemap.sourceRoot || null
	  });
	  Compiler.call(this, root, options);
	};

	/**
	 * Inherit from `Compiler.prototype`.
	 */

	SourceMapper.prototype.__proto__ = Compiler.prototype;

	/**
	 * Generate and write source map.
	 *
	 * @return {String}
	 * @api private
	 */

	var compile = Compiler.prototype.compile;
	SourceMapper.prototype.compile = function(){
	  var css = compile.call(this)
	    , out = this.basename + '.map'
	    , url = this.normalizePath(this.dest
	      ? join(this.dest, out)
	      : join(dirname(this.filename), out))
	    , map;

	  if (this.inline) {
	    map = this.map.toString();
	    url = 'data:application/json;'
	      + (this.utf8 ?  'charset=utf-8;' : '') + 'base64,'
	      + new Buffer(map).toString('base64');
	  }
	  if (this.inline || false !== this.comment)
	    css += '/*# sourceMappingURL=' + url + ' */';
	  return css;
	};

	/**
	 * Add mapping information.
	 *
	 * @param {String} str
	 * @param {Node} node
	 * @return {String}
	 * @api private
	 */

	SourceMapper.prototype.out = function(str, node){
	  if (node && node.lineno) {
	    var filename = this.normalizePath(node.filename);

	    this.map.addMapping({
	      original: {
	        line: node.lineno,
	        column: node.column - 1
	      },
	      generated: {
	        line: this.lineno,
	        column: this.column - 1
	      },
	      source: filename
	    });

	    if (this.inline && !this.contents[filename]) {
	      this.map.setSourceContent(filename, fs.readFileSync(node.filename, 'utf-8'));
	      this.contents[filename] = true;
	    }
	  }

	  this.move(str);
	  return str;
	};

	/**
	 * Move current line and column position.
	 *
	 * @param {String} str
	 * @api private
	 */

	SourceMapper.prototype.move = function(str){
	  var lines = str.match(/\n/g)
	    , idx = str.lastIndexOf('\n');

	  if (lines) this.lineno += lines.length;
	  this.column = ~idx
	    ? str.length - idx
	    : this.column + str.length;
	};

	/**
	 * Normalize the given `path`.
	 *
	 * @param {String} path
	 * @return {String}
	 * @api private
	 */

	SourceMapper.prototype.normalizePath = function(path){
	  path = relative(this.dest || this.basePath, path);
	  if ('\\' == sep) {
	    path = path.replace(/^[a-z]:\\/i, '/')
	      .replace(/\\/g, '/');
	  }
	  return path;
	};

	/**
	 * Visit Literal.
	 */

	var literal = Compiler.prototype.visitLiteral;
	SourceMapper.prototype.visitLiteral = function(lit){
	  var val = literal.call(this, lit)
	    , filename = this.normalizePath(lit.filename)
	    , indentsRe = /^\s+/
	    , lines = val.split('\n');

	  // add mappings for multiline literals
	  if (lines.length > 1) {
	    lines.forEach(function(line, i) {
	      var indents = line.match(indentsRe)
	        , column = indents && indents[0]
	            ? indents[0].length
	            : 0;

	      if (lit.css) column += 2;

	      this.map.addMapping({
	        original: {
	          line: lit.lineno + i,
	          column: column
	        },
	        generated: {
	          line: this.lineno + i,
	          column: 0
	        },
	        source: filename
	      });
	    }, this);
	  }
	  return val;
	};

	/**
	 * Visit Charset.
	 */

	var charset = Compiler.prototype.visitCharset;
	SourceMapper.prototype.visitCharset = function(node){
	  this.utf8 = ('utf-8' == node.val.string.toLowerCase());
	  return charset.call(this, node);
	};
	return sourcemapperExports;
}

var depsResolverExports = {};
var depsResolver = {
  get exports(){ return depsResolverExports; },
  set exports(v){ depsResolverExports = v; },
};

var hasRequiredDepsResolver;

function requireDepsResolver () {
	if (hasRequiredDepsResolver) return depsResolverExports;
	hasRequiredDepsResolver = 1;
	/**
	 * Module dependencies.
	 */

	var Visitor = visitorExports
	  , Parser = requireParser()
	  , nodes = requireNodes()
	  , utils = requireUtils()
	  , dirname = require$$7.dirname
	  , fs = require$$0$1;

	/**
	 * Initialize a new `DepsResolver` with the given `root` Node
	 * and the `options`.
	 *
	 * @param {Node} root
	 * @param {Object} options
	 * @api private
	 */

	var DepsResolver = depsResolver.exports = function DepsResolver(root, options) {
	  this.root = root;
	  this.filename = options.filename;
	  this.paths = options.paths || [];
	  this.paths.push(dirname(options.filename || '.'));
	  this.options = options;
	  this.functions = {};
	  this.deps = [];
	};

	/**
	 * Inherit from `Visitor.prototype`.
	 */

	DepsResolver.prototype.__proto__ = Visitor.prototype;

	var visit = DepsResolver.prototype.visit;

	DepsResolver.prototype.visit = function(node) {
	  switch (node.nodeName) {
	    case 'root':
	    case 'block':
	    case 'expression':
	      this.visitRoot(node);
	      break;
	    case 'group':
	    case 'media':
	    case 'atblock':
	    case 'atrule':
	    case 'keyframes':
	    case 'each':
	    case 'supports':
	      this.visit(node.block);
	      break;
	    default:
	      visit.call(this, node);
	  }
	};

	/**
	 * Visit Root.
	 */

	DepsResolver.prototype.visitRoot = function(block) {
	  for (var i = 0, len = block.nodes.length; i < len; ++i) {
	    this.visit(block.nodes[i]);
	  }
	};

	/**
	 * Visit Ident.
	 */

	DepsResolver.prototype.visitIdent = function(ident) {
	  this.visit(ident.val);
	};

	/**
	 * Visit If.
	 */

	DepsResolver.prototype.visitIf = function(node) {
	  this.visit(node.block);
	  this.visit(node.cond);
	  for (var i = 0, len = node.elses.length; i < len; ++i) {
	    this.visit(node.elses[i]);
	  }
	};

	/**
	 * Visit Function.
	 */

	DepsResolver.prototype.visitFunction = function(fn) {
	  this.functions[fn.name] = fn.block;
	};

	/**
	 * Visit Call.
	 */

	DepsResolver.prototype.visitCall = function(call) {
	  if (call.name in this.functions) this.visit(this.functions[call.name]);
	  if (call.block) this.visit(call.block);
	};

	/**
	 * Visit Import.
	 */

	DepsResolver.prototype.visitImport = function(node) {
	  var path = node.path.first.val
	    , literal, found, oldPath;

	  if (!path) return;

	  literal = /\.css(?:"|$)/.test(path);

	  // support optional .styl
	  if (!literal && !/\.styl$/i.test(path)) {
	    oldPath = path;
	    path += '.styl';
	  }

	  // Lookup
	  found = utils.find(path, this.paths, this.filename);

	  // support optional index
	  if (!found && oldPath) found = utils.lookupIndex(oldPath, this.paths, this.filename);

	  if (!found) return;

	  this.deps = this.deps.concat(found);

	  if (literal) return;

	  // nested imports
	  for (var i = 0, len = found.length; i < len; ++i) {
	    var file = found[i]
	      , dir = dirname(file)
	      , str = fs.readFileSync(file, 'utf-8')
	      , block = new nodes.Block
	      , parser = new Parser(str, utils.merge({ root: block }, this.options));

	    if (!~this.paths.indexOf(dir)) this.paths.push(dir);

	    try {
	      block = parser.parse();
	    } catch (err) {
	      err.filename = file;
	      err.lineno = parser.lexer.lineno;
	      err.column = parser.lexer.column;
	      err.input = str;
	      throw err;
	    }

	    this.visit(block);
	  }
	};

	/**
	 * Get dependencies.
	 */

	DepsResolver.prototype.resolve = function() {
	  this.visit(this.root);
	  return utils.uniq(this.deps);
	};
	return depsResolverExports;
}

var hasRequiredRenderer;

function requireRenderer () {
	if (hasRequiredRenderer) return rendererExports;
	hasRequiredRenderer = 1;
	/*!
	 * Stylus - Renderer
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Parser = requireParser()
	  , EventEmitter = require$$1$1.EventEmitter
	  , Evaluator = requireEvaluator()
	  , Normalizer = requireNormalizer()
	  , events = new EventEmitter
	  , utils = requireUtils()
	  , nodes = requireNodes()
	  , join = require$$7.join;

	/**
	 * Expose `Renderer`.
	 */

	renderer.exports = Renderer;

	/**
	 * Initialize a new `Renderer` with the given `str` and `options`.
	 *
	 * @param {String} str
	 * @param {Object} options
	 * @api public
	 */

	function Renderer(str, options) {
	  options = options || {};
	  options.globals = options.globals || {};
	  options.functions = options.functions || {};
	  options.use = options.use || [];
	  options.use = Array.isArray(options.use) ? options.use : [options.use];
	  options.imports = [join(__dirname$1, 'functions')];
	  options.paths = options.paths || [];
	  options.filename = options.filename || 'stylus';
	  options.Evaluator = options.Evaluator || Evaluator;
	  this.options = options;
	  this.str = str;
	  this.events = events;
	}
	/**
	 * Inherit from `EventEmitter.prototype`.
	 */

	Renderer.prototype.__proto__ = EventEmitter.prototype;

	/**
	 * Expose events explicitly.
	 */

	rendererExports.events = events;

	/**
	 * Parse and evaluate AST, then callback `fn(err, css, js)`.
	 *
	 * @param {Function} fn
	 * @api public
	 */

	Renderer.prototype.render = function(fn){
	  var parser = this.parser = new Parser(this.str, this.options);

	  // use plugin(s)
	  for (var i = 0, len = this.options.use.length; i < len; i++) {
	    this.use(this.options.use[i]);
	  }

	  try {
	    nodes.filename = this.options.filename;
	    // parse
	    var ast = parser.parse();

	    // evaluate
	    this.evaluator = new this.options.Evaluator(ast, this.options);
	    this.nodes = nodes;
	    this.evaluator.renderer = this;
	    ast = this.evaluator.evaluate();

	    // normalize
	    var normalizer = new Normalizer(ast, this.options);
	    ast = normalizer.normalize();

	    // compile
	    var compiler = this.options.sourcemap
	      ? new (requireSourcemapper())(ast, this.options)
	      : new (requireCompiler())(ast, this.options)
	      , css = compiler.compile();

	    // expose sourcemap
	    if (this.options.sourcemap) this.sourcemap = compiler.map.toJSON();
	  } catch (err) {
	    var options = {};
	    options.input = err.input || this.str;
	    options.filename = err.filename || this.options.filename;
	    options.lineno = err.lineno || parser.lexer.lineno;
	    options.column = err.column || parser.lexer.column;
	    if (!fn) throw utils.formatException(err, options);
	    return fn(utils.formatException(err, options));
	  }

	  // fire `end` event
	  var listeners = this.listeners('end');
	  if (fn) listeners.push(fn);
	  for (var i = 0, len = listeners.length; i < len; i++) {
	    var ret = listeners[i](null, css);
	    if (ret) css = ret;
	  }
	  if (!fn) return css;
	};

	/**
	 * Get dependencies of the compiled file.
	 *
	 * @param {String} [filename]
	 * @return {Array}
	 * @api public
	 */

	Renderer.prototype.deps = function(filename){
	  var opts = utils.merge({ cache: false }, this.options);
	  if (filename) opts.filename = filename;

	  var DepsResolver = requireDepsResolver()
	    , parser = new Parser(this.str, opts);

	  try {
	    nodes.filename = opts.filename;
	    // parse
	    var ast = parser.parse()
	      , resolver = new DepsResolver(ast, opts);

	    // resolve dependencies
	    return resolver.resolve();
	  } catch (err) {
	    var options = {};
	    options.input = err.input || this.str;
	    options.filename = err.filename || opts.filename;
	    options.lineno = err.lineno || parser.lexer.lineno;
	    options.column = err.column || parser.lexer.column;
	    throw utils.formatException(err, options);
	  }
	};

	/**
	 * Set option `key` to `val`.
	 *
	 * @param {String} key
	 * @param {Mixed} val
	 * @return {Renderer} for chaining
	 * @api public
	 */

	Renderer.prototype.set = function(key, val){
	  this.options[key] = val;
	  return this;
	};

	/**
	 * Get option `key`.
	 *
	 * @param {String} key
	 * @return {Mixed} val
	 * @api public
	 */

	Renderer.prototype.get = function(key){
	  return this.options[key];
	};

	/**
	 * Include the given `path` to the lookup paths array.
	 *
	 * @param {String} path
	 * @return {Renderer} for chaining
	 * @api public
	 */

	Renderer.prototype.include = function(path){
	  this.options.paths.push(path);
	  return this;
	};

	/**
	 * Use the given `fn`.
	 *
	 * This allows for plugins to alter the renderer in
	 * any way they wish, exposing paths etc.
	 *
	 * @param {Function}
	 * @return {Renderer} for chaining
	 * @api public
	 */

	Renderer.prototype.use = function(fn){
	  fn.call(this, this);
	  return this;
	};

	/**
	 * Define function or global var with the given `name`. Optionally
	 * the function may accept full expressions, by setting `raw`
	 * to `true`.
	 *
	 * @param {String} name
	 * @param {Function|Node} fn
	 * @return {Renderer} for chaining
	 * @api public
	 */

	Renderer.prototype.define = function(name, fn, raw){
	  fn = utils.coerce(fn, raw);

	  if (fn.nodeName) {
	    this.options.globals[name] = fn;
	    return this;
	  }

	  // function
	  this.options.functions[name] = fn;
	  if (undefined != raw) fn.raw = raw;
	  return this;
	};

	/**
	 * Import the given `file`.
	 *
	 * @param {String} file
	 * @return {Renderer} for chaining
	 * @api public
	 */

	Renderer.prototype.import = function(file){
	  this.options.imports.push(file);
	  return this;
	};
	return rendererExports;
}

/*! https://mths.be/punycode v1.4.1 by @mathias */


/** Highest positive signed 32-bit float value */
var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

/** Bootstring parameters */
var base = 36;
var tMin = 1;
var tMax = 26;
var skew = 38;
var damp = 700;
var initialBias = 72;
var initialN = 128; // 0x80
var delimiter = '-'; // '\x2D'
var regexNonASCII = /[^\x20-\x7E]/; // unprintable ASCII chars + non-ASCII chars
var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

/** Error messages */
var errors$1 = {
  'overflow': 'Overflow: input needs wider integers to process',
  'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
  'invalid-input': 'Invalid input'
};

/** Convenience shortcuts */
var baseMinusTMin = base - tMin;
var floor = Math.floor;
var stringFromCharCode = String.fromCharCode;

/*--------------------------------------------------------------------------*/

/**
 * A generic error utility function.
 * @private
 * @param {String} type The error type.
 * @returns {Error} Throws a `RangeError` with the applicable error message.
 */
function error(type) {
  throw new RangeError(errors$1[type]);
}

/**
 * A generic `Array#map` utility function.
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} callback The function that gets called for every array
 * item.
 * @returns {Array} A new array of values returned by the callback function.
 */
function map$1(array, fn) {
  var length = array.length;
  var result = [];
  while (length--) {
    result[length] = fn(array[length]);
  }
  return result;
}

/**
 * A simple `Array#map`-like wrapper to work with domain name strings or email
 * addresses.
 * @private
 * @param {String} domain The domain name or email address.
 * @param {Function} callback The function that gets called for every
 * character.
 * @returns {Array} A new string of characters returned by the callback
 * function.
 */
function mapDomain(string, fn) {
  var parts = string.split('@');
  var result = '';
  if (parts.length > 1) {
    // In email addresses, only the domain name should be punycoded. Leave
    // the local part (i.e. everything up to `@`) intact.
    result = parts[0] + '@';
    string = parts[1];
  }
  // Avoid `split(regex)` for IE8 compatibility. See #17.
  string = string.replace(regexSeparators, '\x2E');
  var labels = string.split('.');
  var encoded = map$1(labels, fn).join('.');
  return result + encoded;
}

/**
 * Creates an array containing the numeric code points of each Unicode
 * character in the string. While JavaScript uses UCS-2 internally,
 * this function will convert a pair of surrogate halves (each of which
 * UCS-2 exposes as separate characters) into a single code point,
 * matching UTF-16.
 * @see `punycode.ucs2.encode`
 * @see <https://mathiasbynens.be/notes/javascript-encoding>
 * @memberOf punycode.ucs2
 * @name decode
 * @param {String} string The Unicode input string (UCS-2).
 * @returns {Array} The new array of code points.
 */
function ucs2decode(string) {
  var output = [],
    counter = 0,
    length = string.length,
    value,
    extra;
  while (counter < length) {
    value = string.charCodeAt(counter++);
    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
      // high surrogate, and there is a next character
      extra = string.charCodeAt(counter++);
      if ((extra & 0xFC00) == 0xDC00) { // low surrogate
        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
      } else {
        // unmatched surrogate; only append this code unit, in case the next
        // code unit is the high surrogate of a surrogate pair
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }
  return output;
}

/**
 * Converts a digit/integer into a basic code point.
 * @see `basicToDigit()`
 * @private
 * @param {Number} digit The numeric value of a basic code point.
 * @returns {Number} The basic code point whose value (when used for
 * representing integers) is `digit`, which needs to be in the range
 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
 * used; else, the lowercase form is used. The behavior is undefined
 * if `flag` is non-zero and `digit` has no uppercase form.
 */
function digitToBasic(digit, flag) {
  //  0..25 map to ASCII a..z or A..Z
  // 26..35 map to ASCII 0..9
  return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
}

/**
 * Bias adaptation function as per section 3.4 of RFC 3492.
 * https://tools.ietf.org/html/rfc3492#section-3.4
 * @private
 */
function adapt(delta, numPoints, firstTime) {
  var k = 0;
  delta = firstTime ? floor(delta / damp) : delta >> 1;
  delta += floor(delta / numPoints);
  for ( /* no initialization */ ; delta > baseMinusTMin * tMax >> 1; k += base) {
    delta = floor(delta / baseMinusTMin);
  }
  return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
}

/**
 * Converts a string of Unicode symbols (e.g. a domain name label) to a
 * Punycode string of ASCII-only symbols.
 * @memberOf punycode
 * @param {String} input The string of Unicode symbols.
 * @returns {String} The resulting Punycode string of ASCII-only symbols.
 */
function encode(input) {
  var n,
    delta,
    handledCPCount,
    basicLength,
    bias,
    j,
    m,
    q,
    k,
    t,
    currentValue,
    output = [],
    /** `inputLength` will hold the number of code points in `input`. */
    inputLength,
    /** Cached calculation results */
    handledCPCountPlusOne,
    baseMinusT,
    qMinusT;

  // Convert the input in UCS-2 to Unicode
  input = ucs2decode(input);

  // Cache the length
  inputLength = input.length;

  // Initialize the state
  n = initialN;
  delta = 0;
  bias = initialBias;

  // Handle the basic code points
  for (j = 0; j < inputLength; ++j) {
    currentValue = input[j];
    if (currentValue < 0x80) {
      output.push(stringFromCharCode(currentValue));
    }
  }

  handledCPCount = basicLength = output.length;

  // `handledCPCount` is the number of code points that have been handled;
  // `basicLength` is the number of basic code points.

  // Finish the basic string - if it is not empty - with a delimiter
  if (basicLength) {
    output.push(delimiter);
  }

  // Main encoding loop:
  while (handledCPCount < inputLength) {

    // All non-basic code points < n have been handled already. Find the next
    // larger one:
    for (m = maxInt, j = 0; j < inputLength; ++j) {
      currentValue = input[j];
      if (currentValue >= n && currentValue < m) {
        m = currentValue;
      }
    }

    // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
    // but guard against overflow
    handledCPCountPlusOne = handledCPCount + 1;
    if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
      error('overflow');
    }

    delta += (m - n) * handledCPCountPlusOne;
    n = m;

    for (j = 0; j < inputLength; ++j) {
      currentValue = input[j];

      if (currentValue < n && ++delta > maxInt) {
        error('overflow');
      }

      if (currentValue == n) {
        // Represent delta as a generalized variable-length integer
        for (q = delta, k = base; /* no condition */ ; k += base) {
          t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
          if (q < t) {
            break;
          }
          qMinusT = q - t;
          baseMinusT = base - t;
          output.push(
            stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
          );
          q = floor(qMinusT / baseMinusT);
        }

        output.push(stringFromCharCode(digitToBasic(q, 0)));
        bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
        delta = 0;
        ++handledCPCount;
      }
    }

    ++delta;
    ++n;

  }
  return output.join('');
}

/**
 * Converts a Unicode string representing a domain name or an email address to
 * Punycode. Only the non-ASCII parts of the domain name will be converted,
 * i.e. it doesn't matter if you call it with a domain that's already in
 * ASCII.
 * @memberOf punycode
 * @param {String} input The domain name or email address to convert, as a
 * Unicode string.
 * @returns {String} The Punycode representation of the given domain name or
 * email address.
 */
function toASCII(input) {
  return mapDomain(input, function(string) {
    return regexNonASCII.test(string) ?
      'xn--' + encode(string) :
      string;
  });
}

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};
function stringifyPrimitive(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
}

function stringify (obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
}
function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

function parse$2(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
}

// Copyright Joyent, Inc. and other Node contributors.
var url = {
  parse: urlParse,
  resolve: urlResolve,
  resolveObject: urlResolveObject,
  format: urlFormat,
  Url: Url
};
function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
  portPattern = /:[0-9]*$/,

  // Special case for a simple path URL
  simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

  // RFC 2396: characters reserved for delimiting URLs.
  // We actually just auto-escape these.
  delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

  // RFC 2396: characters not allowed for various reasons.
  unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

  // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
  autoEscape = ['\''].concat(unwise),
  // Characters that are never ever allowed in a hostname.
  // Note that any invalid chars are also handled, but these
  // are the ones that are *expected* to be seen, so we fast-path
  // them.
  nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
  hostEndingChars = ['/', '?', '#'],
  hostnameMaxLen = 255,
  hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
  hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
  // protocols that can allow "unsafe" and "unwise" chars.
  unsafeProtocol = {
    'javascript': true,
    'javascript:': true
  },
  // protocols that never have a hostname.
  hostlessProtocol = {
    'javascript': true,
    'javascript:': true
  },
  // protocols that always contain a // bit.
  slashedProtocol = {
    'http': true,
    'https': true,
    'ftp': true,
    'gopher': true,
    'file': true,
    'http:': true,
    'https:': true,
    'ftp:': true,
    'gopher:': true,
    'file:': true
  };

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject$1(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}
Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  return parse$1(this, url, parseQueryString, slashesDenoteHost);
};

function parse$1(self, url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError('Parameter \'url\' must be a string, not ' + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
    splitter =
    (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
    uSplit = url.split(splitter),
    slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      self.path = rest;
      self.href = rest;
      self.pathname = simplePath[1];
      if (simplePath[2]) {
        self.search = simplePath[2];
        if (parseQueryString) {
          self.query = parse$2(self.search.substr(1));
        } else {
          self.query = self.search.substr(1);
        }
      } else if (parseQueryString) {
        self.search = '';
        self.query = {};
      }
      return self;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    self.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      self.slashes = true;
    }
  }
  var i, hec, l, p;
  if (!hostlessProtocol[proto] &&
    (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (i = 0; i < hostEndingChars.length; i++) {
      hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      self.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (i = 0; i < nonHostChars.length; i++) {
      hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    self.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    parseHost(self);

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    self.hostname = self.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = self.hostname[0] === '[' &&
      self.hostname[self.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = self.hostname.split(/\./);
      for (i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            self.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (self.hostname.length > hostnameMaxLen) {
      self.hostname = '';
    } else {
      // hostnames are always lower case.
      self.hostname = self.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      self.hostname = toASCII(self.hostname);
    }

    p = self.port ? ':' + self.port : '';
    var h = self.hostname || '';
    self.host = h + p;
    self.href += self.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      self.hostname = self.hostname.substr(1, self.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    self.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    self.search = rest.substr(qm);
    self.query = rest.substr(qm + 1);
    if (parseQueryString) {
      self.query = parse$2(self.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    self.search = '';
    self.query = {};
  }
  if (rest) self.pathname = rest;
  if (slashedProtocol[lowerProto] &&
    self.hostname && !self.pathname) {
    self.pathname = '/';
  }

  //to support http.request
  if (self.pathname || self.search) {
    p = self.pathname || '';
    var s = self.search || '';
    self.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  self.href = format(self);
  return self;
}

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = parse$1({}, obj);
  return format(obj);
}

function format(self) {
  var auth = self.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = self.protocol || '',
    pathname = self.pathname || '',
    hash = self.hash || '',
    host = false,
    query = '';

  if (self.host) {
    host = auth + self.host;
  } else if (self.hostname) {
    host = auth + (self.hostname.indexOf(':') === -1 ?
      self.hostname :
      '[' + this.hostname + ']');
    if (self.port) {
      host += ':' + self.port;
    }
  }

  if (self.query &&
    isObject$1(self.query) &&
    Object.keys(self.query).length) {
    query = stringify(self.query);
  }

  var search = self.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (self.slashes ||
    (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
}

Url.prototype.format = function() {
  return format(this);
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
      result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }
  var relPath;
  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
    isRelAbs = (
      relative.host ||
      relative.pathname && relative.pathname.charAt(0) === '/'
    ),
    mustEndAbs = (isRelAbs || isSourceAbs ||
      (result.host && relative.pathname)),
    removeAllDots = mustEndAbs,
    srcPath = result.pathname && result.pathname.split('/') || [],
    psychotic = result.protocol && !slashedProtocol[result.protocol];
  relPath = relative.pathname && relative.pathname.split('/') || [];
  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }
  var authInHost;
  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
      relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      authInHost = result.host && result.host.indexOf('@') > 0 ?
        result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
        (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
    (result.host || relative.host || srcPath.length > 1) &&
    (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
    (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
    (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
      srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    authInHost = result.host && result.host.indexOf('@') > 0 ?
      result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
      (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  return parseHost(this);
};

function parseHost(self) {
  var host = self.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      self.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) self.hostname = host;
}

var url$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	parse: urlParse,
	resolve: urlResolve,
	resolveObject: urlResolveObject,
	format: urlFormat,
	'default': url,
	Url: Url
});

var require$$3 = /*@__PURE__*/getAugmentedNamespace(url$1);

var hasRequiredUrl;

function requireUrl () {
	if (hasRequiredUrl) return urlExports;
	hasRequiredUrl = 1;
	/*!
	 * Stylus - plugin - url
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Compiler = requireCompiler()
	  , events = requireRenderer().events
	  , nodes = requireNodes()
	  , parse = require$$3.parse
	  , extname = require$$7.extname
	  , utils = requireUtils()
	  , fs = require$$0$1;

	/**
	 * Mime table.
	 */

	var defaultMimes = {
	    '.gif': 'image/gif'
	  , '.png': 'image/png'
	  , '.jpg': 'image/jpeg'
	  , '.jpeg': 'image/jpeg'
	  , '.svg': 'image/svg+xml'
	  , '.webp': 'image/webp'
	  , '.ttf': 'application/x-font-ttf'
	  , '.eot': 'application/vnd.ms-fontobject'
	  , '.woff': 'application/font-woff'
	  , '.woff2': 'application/font-woff2'
	};

	/**
	 * Supported encoding types
	 */
	var encodingTypes = {
	  BASE_64: 'base64',
	  UTF8: 'charset=utf-8'
	};

	/**
	 * Return a url() function with the given `options`.
	 *
	 * Options:
	 *
	 *    - `limit` bytesize limit defaulting to 30Kb
	 *    - `paths` image resolution path(s), merged with general lookup paths
	 *
	 * Examples:
	 *
	 *    stylus(str)
	 *      .set('filename', __dirname + '/css/test.styl')
	 *      .define('url', stylus.url({ paths: [__dirname + '/public'] }))
	 *      .render(function(err, css){ ... })
	 *
	 * @param {Object} options
	 * @return {Function}
	 * @api public
	 */

	url$2.exports = function(options) {
	  options = options || {};

	  var _paths = options.paths || [];
	  var sizeLimit = null != options.limit ? options.limit : 30000;
	  var mimes = options.mimes || defaultMimes;

	  /**
	   * @param {object} url - The path to the image you want to encode.
	   * @param {object} enc - The encoding for the image. Defaults to base64, the 
	   * other valid option is `utf8`.
	   */
	  function fn(url, enc){
	    // Compile the url
	    var compiler = new Compiler(url)
	      , encoding = encodingTypes.BASE_64;

	    compiler.isURL = true;
	    url = url.nodes.map(function(node){
	      return compiler.visit(node);
	    }).join('');

	    // Parse literal
	    url = parse(url);
	    var ext = extname(url.pathname)
	      , mime = mimes[ext]
	      , hash = url.hash || ''
	      , literal = new nodes.Literal('url("' + url.href + '")')
	      , paths = _paths.concat(this.paths)
	      , buf
	      , result;

	    // Not supported
	    if (!mime) return literal;

	    // Absolute
	    if (url.protocol) return literal;

	    // Lookup
	    var found = utils.lookup(url.pathname, paths);

	    // Failed to lookup
	    if (!found) {
	      events.emit(
	          'file not found'
	        , 'File ' + literal + ' could not be found, literal url retained!'
	      );

	      return literal;
	    }

	    // Read data
	    buf = fs.readFileSync(found);

	    // Too large
	    if (false !== sizeLimit && buf.length > sizeLimit) return literal;

	    if (enc && 'utf8' == enc.first.val.toLowerCase()) {
	      encoding = encodingTypes.UTF8;
	      result = buf.toString('utf8').replace(/\s+/g, ' ')
	        .replace(/[{}\|\\\^~\[\]`"<>#%]/g, function(match) {
	          return '%' + match[0].charCodeAt(0).toString(16).toUpperCase();
	        }).trim();
	    } else {
	      result = buf.toString(encoding) + hash;
	    }

	    // Encode
	    return new nodes.Literal('url("data:' + mime + ';' +  encoding + ',' + result + '")');
	  }
	  fn.raw = true;
	  return fn;
	};

	// Exporting default mimes so we could easily access them
	urlExports.mimes = defaultMimes;
	return urlExports;
}

var hasRequiredEvaluator;

function requireEvaluator () {
	if (hasRequiredEvaluator) return evaluatorExports;
	hasRequiredEvaluator = 1;
	/*!
	 * Stylus - Evaluator
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Visitor = visitorExports
	  , units$1 = units
	  , nodes = requireNodes()
	  , Stack = stackExports
	  , Frame = frameExports
	  , utils = requireUtils()
	  , bifs = requireFunctions()
	  , dirname = require$$7.dirname
	  , colors$1 = colors
	  , debug = browserExports('stylus:evaluator')
	  , fs = require$$0$1;

	/**
	 * Import `file` and return Block node.
	 *
	 * @api private
	 */
	function importFile(node, file, literal) {
	  var importStack = this.importStack
	    , Parser = requireParser()
	    , stat;

	  // Handling the `require`
	  if (node.once) {
	    if (this.requireHistory[file]) return nodes.null;
	    this.requireHistory[file] = true;

	    if (literal && !this.includeCSS) {
	      return node;
	    }
	  }

	  // Avoid overflows from importing the same file over again
	  if (~importStack.indexOf(file))
	    throw new Error('import loop has been found');

	  var str = fs.readFileSync(file, 'utf8');

	  // shortcut for empty files
	  if (!str.trim()) return nodes.null;

	  // Expose imports
	  node.path = file;
	  node.dirname = dirname(file);
	  // Store the modified time
	  stat = fs.statSync(file);
	  node.mtime = stat.mtime;
	  this.paths.push(node.dirname);

	  if (this.options._imports) this.options._imports.push(node.clone());

	  // Parse the file
	  importStack.push(file);
	  nodes.filename = file;

	  if (literal) {
	    literal = new nodes.Literal(str.replace(/\r\n?/g, '\n'));
	    literal.lineno = literal.column = 1;
	    if (!this.resolveURL) return literal;
	  }

	  // parse
	  var block = new nodes.Block
	    , parser = new Parser(str, utils.merge({ root: block }, this.options));

	  try {
	    block = parser.parse();
	  } catch (err) {
	    var line = parser.lexer.lineno
	      , column = parser.lexer.column;

	    if (literal && this.includeCSS && this.resolveURL) {
	      this.warn('ParseError: ' + file + ':' + line + ':' + column + '. This file included as-is');
	      return literal;
	    } else {
	      err.filename = file;
	      err.lineno = line;
	      err.column = column;
	      err.input = str;
	      throw err;
	    }
	  }

	  // Evaluate imported "root"
	  block = block.clone(this.currentBlock);
	  block.parent = this.currentBlock;
	  block.scope = false;
	  var ret = this.visit(block);
	  importStack.pop();
	  if (!this.resolveURL || this.resolveURL.nocheck) this.paths.pop();

	  return ret;
	}

	/**
	 * Initialize a new `Evaluator` with the given `root` Node
	 * and the following `options`.
	 *
	 * Options:
	 *
	 *   - `compress`  Compress the css output, defaults to false
	 *   - `warn`  Warn the user of duplicate function definitions etc
	 *
	 * @param {Node} root
	 * @api private
	 */

	var Evaluator = evaluator.exports = function Evaluator(root, options) {
	  options = options || {};
	  Visitor.call(this, root);
	  var functions = this.functions = options.functions || {};
	  this.stack = new Stack;
	  this.imports = options.imports || [];
	  this.globals = options.globals || {};
	  this.paths = options.paths || [];
	  this.prefix = options.prefix || '';
	  this.filename = options.filename;
	  this.includeCSS = options['include css'];
	  this.resolveURL = functions.url
	    && 'resolver' == functions.url.name
	    && functions.url.options;
	  this.paths.push(dirname(options.filename || '.'));
	  this.stack.push(this.global = new Frame(root));
	  this.warnings = options.warn;
	  this.options = options;
	  this.calling = []; // TODO: remove, use stack
	  this.importStack = [];
	  this.requireHistory = {};
	  this.return = 0;
	};

	/**
	 * Inherit from `Visitor.prototype`.
	 */

	Evaluator.prototype.__proto__ = Visitor.prototype;

	/**
	 * Proxy visit to expose node line numbers.
	 *
	 * @param {Node} node
	 * @return {Node}
	 * @api private
	 */

	var visit = Visitor.prototype.visit;
	Evaluator.prototype.visit = function(node){
	  try {
	    return visit.call(this, node);
	  } catch (err) {
	    if (err.filename) throw err;
	    err.lineno = node.lineno;
	    err.column = node.column;
	    err.filename = node.filename;
	    err.stylusStack = this.stack.toString();
	    try {
	      err.input = fs.readFileSync(err.filename, 'utf8');
	    } catch (err) {
	      // ignore
	    }
	    throw err;
	  }
	};

	/**
	 * Perform evaluation setup:
	 *
	 *   - populate global scope
	 *   - iterate imports
	 *
	 * @api private
	 */

	Evaluator.prototype.setup = function(){
	  var root = this.root;
	  var imports = [];

	  this.populateGlobalScope();
	  this.imports.forEach(function(file){
	    var expr = new nodes.Expression;
	    expr.push(new nodes.String(file));
	    imports.push(new nodes.Import(expr));
	  }, this);

	  root.nodes = imports.concat(root.nodes);
	};

	/**
	 * Populate the global scope with:
	 *
	 *   - css colors
	 *   - user-defined globals
	 *
	 * @api private
	 */

	Evaluator.prototype.populateGlobalScope = function(){
	  var scope = this.global.scope;

	  // colors
	  Object.keys(colors$1).forEach(function(name){
	    var color = colors$1[name]
	      , rgba = new nodes.RGBA(color[0], color[1], color[2], color[3])
	      , node = new nodes.Ident(name, rgba);
	    rgba.name = name;
	    scope.add(node);
	  });

	  // expose url function
	  scope.add(new nodes.Ident(
	    'embedurl',
	    new nodes.Function('embedurl', requireUrl()({
	      limit: false
	    }))
	  ));

	  // user-defined globals
	  var globals = this.globals;
	  Object.keys(globals).forEach(function(name){
	    var val = globals[name];
	    if (!val.nodeName) val = new nodes.Literal(val);
	    scope.add(new nodes.Ident(name, val));
	  });
	};

	/**
	 * Evaluate the tree.
	 *
	 * @return {Node}
	 * @api private
	 */

	Evaluator.prototype.evaluate = function(){
	  debug('eval %s', this.filename);
	  this.setup();
	  return this.visit(this.root);
	};

	/**
	 * Visit Group.
	 */

	Evaluator.prototype.visitGroup = function(group){
	  group.nodes = group.nodes.map(function(selector){
	    selector.val = this.interpolate(selector);
	    debug('ruleset %s', selector.val);
	    return selector;
	  }, this);

	  group.block = this.visit(group.block);
	  return group;
	};

	/**
	 * Visit Return.
	 */

	Evaluator.prototype.visitReturn = function(ret){
	  ret.expr = this.visit(ret.expr);
	  throw ret;
	};

	/**
	 * Visit Media.
	 */

	Evaluator.prototype.visitMedia = function(media){
	  media.block = this.visit(media.block);
	  media.val = this.visit(media.val);
	  return media;
	};

	/**
	 * Visit QueryList.
	 */

	Evaluator.prototype.visitQueryList = function(queries){
	  var val, query;
	  queries.nodes.forEach(this.visit, this);

	  if (1 == queries.nodes.length) {
	    query = queries.nodes[0];
	    if (val = this.lookup(query.type)) {
	      val = val.first.string;
	      if (!val) return queries;
	      var Parser = requireParser()
	        , parser = new Parser(val, this.options);
	      queries = this.visit(parser.queries());
	    }
	  }
	  return queries;
	};

	/**
	 * Visit Query.
	 */

	Evaluator.prototype.visitQuery = function(node){
	  node.predicate = this.visit(node.predicate);
	  node.type = this.visit(node.type);
	  node.nodes.forEach(this.visit, this);
	  return node;
	};

	/**
	 * Visit Feature.
	 */

	Evaluator.prototype.visitFeature = function(node){
	  node.name = this.interpolate(node);
	  if (node.expr) {
	    this.return++;
	    node.expr = this.visit(node.expr);
	    this.return--;
	  }
	  return node;
	};

	/**
	 * Visit Object.
	 */

	Evaluator.prototype.visitObject = function(obj){
	  for (var key in obj.vals) {
	    obj.vals[key] = this.visit(obj.vals[key]);
	  }
	  return obj;
	};

	/**
	 * Visit Member.
	 */

	Evaluator.prototype.visitMember = function(node){
	  var left = node.left
	    , right = node.right
	    , obj = this.visit(left).first;

	  if ('object' != obj.nodeName) {
	    throw new Error(left.toString() + ' has no property .' + right);
	  }
	  if (node.val) {
	    this.return++;
	    obj.set(right.name, this.visit(node.val));
	    this.return--;
	  }
	  return obj.get(right.name);
	};

	/**
	 * Visit Keyframes.
	 */

	Evaluator.prototype.visitKeyframes = function(keyframes){
	  var val;
	  if (keyframes.fabricated) return keyframes;
	  keyframes.val = this.interpolate(keyframes).trim();
	  if (val = this.lookup(keyframes.val)) {
	    keyframes.val = val.first.string || val.first.name;
	  }
	  keyframes.block = this.visit(keyframes.block);

	  if ('official' != keyframes.prefix) return keyframes;

	  this.vendors.forEach(function(prefix){
	    // IE never had prefixes for keyframes
	    if ('ms' == prefix) return;
	    var node = keyframes.clone();
	    node.val = keyframes.val;
	    node.prefix = prefix;
	    node.block = keyframes.block;
	    node.fabricated = true;
	    this.currentBlock.push(node);
	  }, this);

	  return nodes.null;
	};

	/**
	 * Visit Function.
	 */

	Evaluator.prototype.visitFunction = function(fn){
	  // check local
	  var local = this.stack.currentFrame.scope.lookup(fn.name);
	  if (local) this.warn('local ' + local.nodeName + ' "' + fn.name + '" previously defined in this scope');

	  // user-defined
	  var user = this.functions[fn.name];
	  if (user) this.warn('user-defined function "' + fn.name + '" is already defined');

	  // BIF
	  var bif = bifs[fn.name];
	  if (bif) this.warn('built-in function "' + fn.name + '" is already defined');

	  return fn;
	};

	/**
	 * Visit Each.
	 */

	Evaluator.prototype.visitEach = function(each){
	  this.return++;
	  var expr = utils.unwrap(this.visit(each.expr))
	    , len = expr.nodes.length
	    , val = new nodes.Ident(each.val)
	    , key = new nodes.Ident(each.key || '__index__')
	    , scope = this.currentScope
	    , block = this.currentBlock
	    , vals = []
	    , self = this
	    , body
	    , obj;
	  this.return--;

	  each.block.scope = false;

	  function visitBody(key, val) {
	    scope.add(val);
	    scope.add(key);
	    body = self.visit(each.block.clone());
	    vals = vals.concat(body.nodes);
	  }

	  // for prop in obj
	  if (1 == len && 'object' == expr.nodes[0].nodeName) {
	    obj = expr.nodes[0];
	    for (var prop in obj.vals) {
	      val.val = new nodes.String(prop);
	      key.val = obj.get(prop);
	      visitBody(key, val);
	    }
	  } else {
	    for (var i = 0; i < len; ++i) {
	      val.val = expr.nodes[i];
	      key.val = new nodes.Unit(i);
	      visitBody(key, val);
	    }
	  }

	  this.mixin(vals, block);
	  return vals[vals.length - 1] || nodes.null;
	};

	/**
	 * Visit Call.
	 */

	Evaluator.prototype.visitCall = function(call){
	  debug('call %s', call);
	  var fn = this.lookup(call.name)
	    , literal
	    , ret;

	  // url()
	  this.ignoreColors = 'url' == call.name;

	  // Variable function
	  if (fn && 'expression' == fn.nodeName) {
	    fn = fn.nodes[0];
	  }

	  // Not a function? try user-defined or built-ins
	  if (fn && 'function' != fn.nodeName) {
	    fn = this.lookupFunction(call.name);
	  }

	  // Undefined function? render literal CSS
	  if (!fn || fn.nodeName != 'function') {
	    debug('%s is undefined', call);
	    // Special case for `calc`
	    if ('calc' == this.unvendorize(call.name)) {
	      literal = call.args.nodes && call.args.nodes[0];
	      if (literal) ret = new nodes.Literal(call.name + literal);
	    } else {
	      ret = this.literalCall(call);
	    }
	    this.ignoreColors = false;
	    return ret;
	  }

	  this.calling.push(call.name);

	  // Massive stack
	  if (this.calling.length > 200) {
	    throw new RangeError('Maximum stylus call stack size exceeded');
	  }

	  // First node in expression
	  if ('expression' == fn.nodeName) fn = fn.first;

	  // Evaluate arguments
	  this.return++;
	  var args = this.visit(call.args);

	  for (var key in args.map) {
	    args.map[key] = this.visit(args.map[key].clone());
	  }
	  this.return--;

	  // Built-in
	  if (fn.fn) {
	    debug('%s is built-in', call);
	    ret = this.invokeBuiltin(fn.fn, args);
	  // User-defined
	  } else if ('function' == fn.nodeName) {
	    debug('%s is user-defined', call);
	    // Evaluate mixin block
	    if (call.block) call.block = this.visit(call.block);
	    ret = this.invokeFunction(fn, args, call.block);
	  }

	  this.calling.pop();
	  this.ignoreColors = false;
	  return ret;
	};

	/**
	 * Visit Ident.
	 */

	Evaluator.prototype.visitIdent = function(ident){
	  var prop;
	  // Property lookup
	  if (ident.property) {
	    if (prop = this.lookupProperty(ident.name)) {
	      return this.visit(prop.expr.clone());
	    }
	    return nodes.null;
	  // Lookup
	  } else if (ident.val.isNull) {
	    var val = this.lookup(ident.name);
	    // Object or Block mixin
	    if (val && ident.mixin) this.mixinNode(val);
	    return val ? this.visit(val) : ident;
	  // Assign
	  } else {
	    this.return++;
	    ident.val = this.visit(ident.val);
	    this.return--;
	    this.currentScope.add(ident);
	    return ident.val;
	  }
	};

	/**
	 * Visit BinOp.
	 */

	Evaluator.prototype.visitBinOp = function(binop){
	  // Special-case "is defined" pseudo binop
	  if ('is defined' == binop.op) return this.isDefined(binop.left);

	  this.return++;
	  // Visit operands
	  var op = binop.op
	    , left = this.visit(binop.left)
	    , right = ('||' == op || '&&' == op)
	      ? binop.right : this.visit(binop.right);

	  // HACK: ternary
	  var val = binop.val
	    ? this.visit(binop.val)
	    : null;
	  this.return--;

	  // Operate
	  try {
	    return this.visit(left.operate(op, right, val));
	  } catch (err) {
	    // disregard coercion issues in equality
	    // checks, and simply return false
	    if ('CoercionError' == err.name) {
	      switch (op) {
	        case '==':
	          return nodes.false;
	        case '!=':
	          return nodes.true;
	      }
	    }
	    throw err;
	  }
	};

	/**
	 * Visit UnaryOp.
	 */

	Evaluator.prototype.visitUnaryOp = function(unary){
	  var op = unary.op
	    , node = this.visit(unary.expr);

	  if ('!' != op) {
	    node = node.first.clone();
	    utils.assertType(node, 'unit');
	  }

	  switch (op) {
	    case '-':
	      node.val = -node.val;
	      break;
	    case '+':
	      node.val = +node.val;
	      break;
	    case '~':
	      node.val = ~node.val;
	      break;
	    case '!':
	      return node.toBoolean().negate();
	  }

	  return node;
	};

	/**
	 * Visit TernaryOp.
	 */

	Evaluator.prototype.visitTernary = function(ternary){
	  var ok = this.visit(ternary.cond).toBoolean();
	  return ok.isTrue
	    ? this.visit(ternary.trueExpr)
	    : this.visit(ternary.falseExpr);
	};

	/**
	 * Visit Expression.
	 */

	Evaluator.prototype.visitExpression = function(expr){
	  for (var i = 0, len = expr.nodes.length; i < len; ++i) {
	    expr.nodes[i] = this.visit(expr.nodes[i]);
	  }

	  // support (n * 5)px etc
	  if (this.castable(expr)) expr = this.cast(expr);

	  return expr;
	};

	/**
	 * Visit Arguments.
	 */

	Evaluator.prototype.visitArguments = Evaluator.prototype.visitExpression;

	/**
	 * Visit Property.
	 */

	Evaluator.prototype.visitProperty = function(prop){
	  var name = this.interpolate(prop)
	    , fn = this.lookup(name)
	    , call = fn && 'function' == fn.first.nodeName
	    , literal = ~this.calling.indexOf(name)
	    , _prop = this.property;

	  // Function of the same name
	  if (call && !literal && !prop.literal) {
	    var args = nodes.Arguments.fromExpression(utils.unwrap(prop.expr.clone()));
	    prop.name = name;
	    this.property = prop;
	    this.return++;
	    this.property.expr = this.visit(prop.expr);
	    this.return--;
	    var ret = this.visit(new nodes.Call(name, args));
	    this.property = _prop;
	    return ret;
	  // Regular property
	  } else {
	    this.return++;
	    prop.name = name;
	    prop.literal = true;
	    this.property = prop;
	    prop.expr = this.visit(prop.expr);
	    this.property = _prop;
	    this.return--;
	    return prop;
	  }
	};

	/**
	 * Visit Root.
	 */

	Evaluator.prototype.visitRoot = function(block){
	  // normalize cached imports
	  if (block != this.root) {
	    block.constructor = nodes.Block;
	    return this.visit(block);
	  }

	  for (var i = 0; i < block.nodes.length; ++i) {
	    block.index = i;
	    block.nodes[i] = this.visit(block.nodes[i]);
	  }
	  return block;
	};

	/**
	 * Visit Block.
	 */

	Evaluator.prototype.visitBlock = function(block){
	  this.stack.push(new Frame(block));
	  for (block.index = 0; block.index < block.nodes.length; ++block.index) {
	    try {
	      block.nodes[block.index] = this.visit(block.nodes[block.index]);
	    } catch (err) {
	      if ('return' == err.nodeName) {
	        if (this.return) {
	          this.stack.pop();
	          throw err;
	        } else {
	          block.nodes[block.index] = err;
	          break;
	        }
	      } else {
	        throw err;
	      }
	    }
	  }
	  this.stack.pop();
	  return block;
	};

	/**
	 * Visit Atblock.
	 */

	Evaluator.prototype.visitAtblock = function(atblock){
	  atblock.block = this.visit(atblock.block);
	  return atblock;
	};

	/**
	 * Visit Atrule.
	 */

	Evaluator.prototype.visitAtrule = function(atrule){
	  atrule.val = this.interpolate(atrule);
	  if (atrule.block) atrule.block = this.visit(atrule.block);
	  return atrule;
	};

	/**
	 * Visit Supports.
	 */

	Evaluator.prototype.visitSupports = function(node){
	  var condition = node.condition
	    , val;

	  this.return++;
	  node.condition = this.visit(condition);
	  this.return--;

	  val = condition.first;
	  if (1 == condition.nodes.length
	    && 'string' == val.nodeName) {
	    node.condition = val.string;
	  }
	  node.block = this.visit(node.block);
	  return node;
	};

	/**
	 * Visit If.
	 */

	Evaluator.prototype.visitIf = function(node){
	  var ret
	    , block = this.currentBlock
	    , negate = node.negate;

	  this.return++;
	  var ok = this.visit(node.cond).first.toBoolean();
	  this.return--;

	  node.block.scope = node.block.hasMedia;

	  // Evaluate body
	  if (negate) {
	    // unless
	    if (ok.isFalse) {
	      ret = this.visit(node.block);
	    }
	  } else {
	    // if
	    if (ok.isTrue) {
	      ret = this.visit(node.block);
	    // else
	    } else if (node.elses.length) {
	      var elses = node.elses
	        , len = elses.length
	        , cond;
	      for (var i = 0; i < len; ++i) {
	        // else if
	        if (elses[i].cond) {
	          elses[i].block.scope = elses[i].block.hasMedia;
	          this.return++;
	          cond = this.visit(elses[i].cond).first.toBoolean();
	          this.return--;
	          if (cond.isTrue) {
	            ret = this.visit(elses[i].block);
	            break;
	          }
	        // else
	        } else {
	          elses[i].scope = elses[i].hasMedia;
	          ret = this.visit(elses[i]);
	        }
	      }
	    }
	  }

	  // mixin conditional statements within
	  // a selector group or at-rule
	  if (ret && !node.postfix && block.node
	    && ~['group'
	       , 'atrule'
	       , 'media'
	       , 'supports'
	       , 'keyframes'].indexOf(block.node.nodeName)) {
	    this.mixin(ret.nodes, block);
	    return nodes.null;
	  }

	  return ret || nodes.null;
	};

	/**
	 * Visit Extend.
	 */

	Evaluator.prototype.visitExtend = function(extend){
	  var block = this.currentBlock;
	  if ('group' != block.node.nodeName) block = this.closestGroup;
	  extend.selectors.forEach(function(selector){
	    block.node.extends.push({
	      // Cloning the selector for when we are in a loop and don't want it to affect
	      // the selector nodes and cause the values to be different to expected
	      selector: this.interpolate(selector.clone()).trim(),
	      optional: selector.optional,
	      lineno: selector.lineno,
	      column: selector.column
	    });
	  }, this);
	  return nodes.null;
	};

	/**
	 * Visit Import.
	 */

	Evaluator.prototype.visitImport = function(imported){
	  this.return++;

	  var path = this.visit(imported.path).first
	    , nodeName = imported.once ? 'require' : 'import'
	    , found
	    , literal;

	  this.return--;
	  debug('import %s', path);

	  // url() passed
	  if ('url' == path.name) {
	    if (imported.once) throw new Error('You cannot @require a url');

	    return imported;
	  }

	  // Ensure string
	  if (!path.string) throw new Error('@' + nodeName + ' string expected');

	  var name = path = path.string;

	  // Absolute URL or hash
	  if (/(?:url\s*\(\s*)?['"]?(?:#|(?:https?:)?\/\/)/i.test(path)) {
	    if (imported.once) throw new Error('You cannot @require a url');
	    return imported;
	  }

	  // Literal
	  if (/\.css(?:"|$)/.test(path)) {
	    literal = true;
	    if (!imported.once && !this.includeCSS) {
	      return imported;
	    }
	  }

	  // support optional .styl
	  if (!literal && !/\.styl$/i.test(path)) path += '.styl';

	  // Lookup
	  found = utils.find(path, this.paths, this.filename);
	  if (!found) {
	    found = utils.lookupIndex(name, this.paths, this.filename);
	  }

	  // Throw if import failed
	  if (!found) throw new Error('failed to locate @' + nodeName + ' file ' + path);
	  
	  var block = new nodes.Block;

	  for (var i = 0, len = found.length; i < len; ++i) {
	    block.push(importFile.call(this, imported, found[i], literal));
	  }

	  return block;
	};

	/**
	 * Invoke `fn` with `args`.
	 *
	 * @param {Function} fn
	 * @param {Array} args
	 * @return {Node}
	 * @api private
	 */

	Evaluator.prototype.invokeFunction = function(fn, args, content){
	  var block = new nodes.Block(fn.block.parent);

	  // Clone the function body
	  // to prevent mutation of subsequent calls
	  var body = fn.block.clone(block);

	  // mixin block
	  var mixinBlock = this.stack.currentFrame.block;

	  // new block scope
	  this.stack.push(new Frame(block));
	  var scope = this.currentScope;

	  // normalize arguments
	  if ('arguments' != args.nodeName) {
	    var expr = new nodes.Expression;
	    expr.push(args);
	    args = nodes.Arguments.fromExpression(expr);
	  }

	  // arguments local
	  scope.add(new nodes.Ident('arguments', args));

	  // mixin scope introspection
	  scope.add(new nodes.Ident('mixin', this.return
	    ? nodes.false
	    : new nodes.String(mixinBlock.nodeName)));

	  // current property
	  if (this.property) {
	    var prop = this.propertyExpression(this.property, fn.name);
	    scope.add(new nodes.Ident('current-property', prop));
	  } else {
	    scope.add(new nodes.Ident('current-property', nodes.null));
	  }

	  // current call stack
	  var expr = new nodes.Expression;
	  for (var i = this.calling.length - 1; i-- ; ) {
	    expr.push(new nodes.Literal(this.calling[i]));
	  }	  scope.add(new nodes.Ident('called-from', expr));

	  // inject arguments as locals
	  var i = 0
	    , len = args.nodes.length;
	  fn.params.nodes.forEach(function(node){
	    // rest param support
	    if (node.rest) {
	      node.val = new nodes.Expression;
	      for (; i < len; ++i) node.val.push(args.nodes[i]);
	      node.val.preserve = true;
	      node.val.isList = args.isList;
	    // argument default support
	    } else {
	      var arg = args.map[node.name] || args.nodes[i++];
	      node = node.clone();
	      if (arg) {
	        arg.isEmpty ? args.nodes[i - 1] = this.visit(node) : node.val = arg;
	      } else {
	        args.push(node.val);
	      }

	      // required argument not satisfied
	      if (node.val.isNull) {
	        throw new Error('argument "' + node + '" required for ' + fn);
	      }
	    }

	    scope.add(node);
	  }, this);

	  // mixin block
	  if (content) scope.add(new nodes.Ident('block', content, true));

	  // invoke
	  return this.invoke(body, true, fn.filename);
	};

	/**
	 * Invoke built-in `fn` with `args`.
	 *
	 * @param {Function} fn
	 * @param {Array} args
	 * @return {Node}
	 * @api private
	 */

	Evaluator.prototype.invokeBuiltin = function(fn, args){
	  // Map arguments to first node
	  // providing a nicer js api for
	  // BIFs. Functions may specify that
	  // they wish to accept full expressions
	  // via .raw
	  if (fn.raw) {
	    args = args.nodes;
	  } else {
	    args = utils.params(fn).reduce(function(ret, param){
	      var arg = args.map[param] || args.nodes.shift();
	      if (arg) {
	        arg = utils.unwrap(arg);
	        var len = arg.nodes.length;
	        if (len > 1) {
	          for (var i = 0; i < len; ++i) {
	            ret.push(utils.unwrap(arg.nodes[i].first));
	          }
	        } else {
	          ret.push(arg.first);
	        }
	      }
	      return ret;
	    }, []);
	  }

	  // Invoke the BIF
	  var body = utils.coerce(fn.apply(this, args));

	  // Always wrapping allows js functions
	  // to return several values with a single
	  // Expression node
	  var expr = new nodes.Expression;
	  expr.push(body);
	  body = expr;

	  // Invoke
	  return this.invoke(body);
	};

	/**
	 * Invoke the given function `body`.
	 *
	 * @param {Block} body
	 * @return {Node}
	 * @api private
	 */

	Evaluator.prototype.invoke = function(body, stack, filename){
	  var ret;

	  if (filename) this.paths.push(dirname(filename));

	  // Return
	  if (this.return) {
	    ret = this.eval(body.nodes);
	    if (stack) this.stack.pop();
	  // Mixin
	  } else {
	    body = this.visit(body);
	    if (stack) this.stack.pop();
	    this.mixin(body.nodes, this.currentBlock);
	    ret = nodes.null;
	  }

	  if (filename) this.paths.pop();

	  return ret;
	};

	/**
	 * Mixin the given `nodes` to the given `block`.
	 *
	 * @param {Array} nodes
	 * @param {Block} block
	 * @api private
	 */

	Evaluator.prototype.mixin = function(nodes, block){
	  if (!nodes.length) return;
	  var len = block.nodes.length
	    , head = block.nodes.slice(0, block.index)
	    , tail = block.nodes.slice(block.index + 1, len);
	  this._mixin(nodes, head, block);
	  block.index = 0;
	  block.nodes = head.concat(tail);
	};

	/**
	 * Mixin the given `items` to the `dest` array.
	 *
	 * @param {Array} items
	 * @param {Array} dest
	 * @param {Block} block
	 * @api private
	 */

	Evaluator.prototype._mixin = function(items, dest, block){
	  var node
	    , len = items.length;
	  for (var i = 0; i < len; ++i) {
	    switch ((node = items[i]).nodeName) {
	      case 'return':
	        return;
	      case 'block':
	        this._mixin(node.nodes, dest, block);
	        break;
	      case 'media':
	        // fix link to the parent block
	        var parentNode = node.block.parent.node;
	        if (parentNode && 'call' != parentNode.nodeName) {
	          node.block.parent = block;
	        }
	      case 'property':
	        var val = node.expr;
	        // prevent `block` mixin recursion
	        if (node.literal && 'block' == val.first.name) {
	          val = utils.unwrap(val);
	          val.nodes[0] = new nodes.Literal('block');
	        }
	      default:
	        dest.push(node);
	    }
	  }
	};

	/**
	 * Mixin the given `node` to the current block.
	 *
	 * @param {Node} node
	 * @api private
	 */

	Evaluator.prototype.mixinNode = function(node){
	  node = this.visit(node.first);
	  switch (node.nodeName) {
	    case 'object':
	      this.mixinObject(node);
	      return nodes.null;
	    case 'block':
	    case 'atblock':
	      this.mixin(node.nodes, this.currentBlock);
	      return nodes.null;
	  }
	};

	/**
	 * Mixin the given `object` to the current block.
	 *
	 * @param {Object} object
	 * @api private
	 */

	Evaluator.prototype.mixinObject = function(object){
	  var Parser = requireParser()
	    , root = this.root
	    , str = '$block ' + object.toBlock()
	    , parser = new Parser(str, utils.merge({ root: block }, this.options))
	    , block;

	  try {
	    block = parser.parse();
	  } catch (err) {
	    err.filename = this.filename;
	    err.lineno = parser.lexer.lineno;
	    err.column = parser.lexer.column;
	    err.input = str;
	    throw err;
	  }

	  block.parent = root;
	  block.scope = false;
	  var ret = this.visit(block)
	    , vals = ret.first.nodes;
	  for (var i = 0, len = vals.length; i < len; ++i) {
	    if (vals[i].block) {
	      this.mixin(vals[i].block.nodes, this.currentBlock);
	      break;
	    }
	  }
	};

	/**
	 * Evaluate the given `vals`.
	 *
	 * @param {Array} vals
	 * @return {Node}
	 * @api private
	 */

	Evaluator.prototype.eval = function(vals){
	  if (!vals) return nodes.null;
	  var len = vals.length
	    , node = nodes.null;

	  try {
	    for (var i = 0; i < len; ++i) {
	      node = vals[i];
	      switch (node.nodeName) {
	        case 'if':
	          if ('block' != node.block.nodeName) {
	            node = this.visit(node);
	            break;
	          }
	        case 'each':
	        case 'block':
	          node = this.visit(node);
	          if (node.nodes) node = this.eval(node.nodes);
	          break;
	        default:
	          node = this.visit(node);
	      }
	    }
	  } catch (err) {
	    if ('return' == err.nodeName) {
	      return err.expr;
	    } else {
	      throw err;
	    }
	  }

	  return node;
	};

	/**
	 * Literal function `call`.
	 *
	 * @param {Call} call
	 * @return {call}
	 * @api private
	 */

	Evaluator.prototype.literalCall = function(call){
	  call.args = this.visit(call.args);
	  return call;
	};

	/**
	 * Lookup property `name`.
	 *
	 * @param {String} name
	 * @return {Property}
	 * @api private
	 */

	Evaluator.prototype.lookupProperty = function(name){
	  var i = this.stack.length
	    , index = this.currentBlock.index
	    , top = i
	    , nodes
	    , block
	    , len
	    , other;

	  while (i--) {
	    block = this.stack[i].block;
	    if (!block.node) continue;
	    switch (block.node.nodeName) {
	      case 'group':
	      case 'function':
	      case 'if':
	      case 'each':
	      case 'atrule':
	      case 'media':
	      case 'atblock':
	      case 'call':
	        nodes = block.nodes;
	        // scan siblings from the property index up
	        if (i + 1 == top) {
	          while (index--) {
	            // ignore current property
	            if (this.property == nodes[index]) continue;
	            other = this.interpolate(nodes[index]);
	            if (name == other) return nodes[index].clone();
	          }
	        // sequential lookup for non-siblings (for now)
	        } else {
	          len = nodes.length;
	          while (len--) {
	            if ('property' != nodes[len].nodeName
	              || this.property == nodes[len]) continue;
	            other = this.interpolate(nodes[len]);
	            if (name == other) return nodes[len].clone();
	          }
	        }
	        break;
	    }
	  }

	  return nodes.null;
	};

	/**
	 * Return the closest mixin-able `Block`.
	 *
	 * @return {Block}
	 * @api private
	 */

	Evaluator.prototype.__defineGetter__('closestBlock', function(){
	  var i = this.stack.length
	    , block;
	  while (i--) {
	    block = this.stack[i].block;
	    if (block.node) {
	      switch (block.node.nodeName) {
	        case 'group':
	        case 'keyframes':
	        case 'atrule':
	        case 'atblock':
	        case 'media':
	        case 'call':
	          return block;
	      }
	    }
	  }
	});

	/**
	 * Return the closest group block.
	 *
	 * @return {Block}
	 * @api private
	 */

	Evaluator.prototype.__defineGetter__('closestGroup', function(){
	  var i = this.stack.length
	    , block;
	  while (i--) {
	    block = this.stack[i].block;
	    if (block.node && 'group' == block.node.nodeName) {
	      return block;
	    }
	  }
	});

	/**
	 * Return the current selectors stack.
	 *
	 * @return {Array}
	 * @api private
	 */

	Evaluator.prototype.__defineGetter__('selectorStack', function(){
	  var block
	    , stack = [];
	  for (var i = 0, len = this.stack.length; i < len; ++i) {
	    block = this.stack[i].block;
	    if (block.node && 'group' == block.node.nodeName) {
	      block.node.nodes.forEach(function(selector) {
	        if (!selector.val) selector.val = this.interpolate(selector);
	      }, this);
	      stack.push(block.node.nodes);
	    }
	  }
	  return stack;
	});

	/**
	 * Lookup `name`, with support for JavaScript
	 * functions, and BIFs.
	 *
	 * @param {String} name
	 * @return {Node}
	 * @api private
	 */

	Evaluator.prototype.lookup = function(name){
	  var val;
	  if (this.ignoreColors && name in colors$1) return;
	  if (val = this.stack.lookup(name)) {
	    return utils.unwrap(val);
	  } else {
	    return this.lookupFunction(name);
	  }
	};

	/**
	 * Map segments in `node` returning a string.
	 *
	 * @param {Node} node
	 * @return {String}
	 * @api private
	 */

	Evaluator.prototype.interpolate = function(node){
	  var self = this
	    , isSelector = ('selector' == node.nodeName);
	  function toString(node) {
	    switch (node.nodeName) {
	      case 'function':
	      case 'ident':
	        return node.name;
	      case 'literal':
	      case 'string':
	        if (self.prefix && !node.prefixed && !node.val.nodeName) {
	          node.val = node.val.replace(/\./g, '.' + self.prefix);
	          node.prefixed = true;
	        }
	        return node.val;
	      case 'unit':
	        // Interpolation inside keyframes
	        return '%' == node.type ? node.val + '%' : node.val;
	      case 'member':
	        return toString(self.visit(node));
	      case 'expression':
	        // Prevent cyclic `selector()` calls.
	        if (self.calling && ~self.calling.indexOf('selector') && self._selector) return self._selector;
	        self.return++;
	        var ret = toString(self.visit(node).first);
	        self.return--;
	        if (isSelector) self._selector = ret;
	        return ret;
	    }
	  }

	  if (node.segments) {
	    return node.segments.map(toString).join('');
	  } else {
	    return toString(node);
	  }
	};

	/**
	 * Lookup JavaScript user-defined or built-in function.
	 *
	 * @param {String} name
	 * @return {Function}
	 * @api private
	 */

	Evaluator.prototype.lookupFunction = function(name){
	  var fn = this.functions[name] || bifs[name];
	  if (fn) return new nodes.Function(name, fn);
	};

	/**
	 * Check if the given `node` is an ident, and if it is defined.
	 *
	 * @param {Node} node
	 * @return {Boolean}
	 * @api private
	 */

	Evaluator.prototype.isDefined = function(node){
	  if ('ident' == node.nodeName) {
	    return nodes.Boolean(this.lookup(node.name));
	  } else {
	    throw new Error('invalid "is defined" check on non-variable ' + node);
	  }
	};

	/**
	 * Return `Expression` based on the given `prop`,
	 * replacing cyclic calls to the given function `name`
	 * with "__CALL__".
	 *
	 * @param {Property} prop
	 * @param {String} name
	 * @return {Expression}
	 * @api private
	 */

	Evaluator.prototype.propertyExpression = function(prop, name){
	  var expr = new nodes.Expression
	    , val = prop.expr.clone();

	  // name
	  expr.push(new nodes.String(prop.name));

	  // replace cyclic call with __CALL__
	  function replace(node) {
	    if ('call' == node.nodeName && name == node.name) {
	      return new nodes.Literal('__CALL__');
	    }

	    if (node.nodes) node.nodes = node.nodes.map(replace);
	    return node;
	  }

	  replace(val);
	  expr.push(val);
	  return expr;
	};

	/**
	 * Cast `expr` to the trailing ident.
	 *
	 * @param {Expression} expr
	 * @return {Unit}
	 * @api private
	 */

	Evaluator.prototype.cast = function(expr){
	  return new nodes.Unit(expr.first.val, expr.nodes[1].name);
	};

	/**
	 * Check if `expr` is castable.
	 *
	 * @param {Expression} expr
	 * @return {Boolean}
	 * @api private
	 */

	Evaluator.prototype.castable = function(expr){
	  return 2 == expr.nodes.length
	    && 'unit' == expr.first.nodeName
	    && ~units$1.indexOf(expr.nodes[1].name);
	};

	/**
	 * Warn with the given `msg`.
	 *
	 * @param {String} msg
	 * @api private
	 */

	Evaluator.prototype.warn = function(msg){
	  if (!this.warnings) return;
	  console.warn('\u001b[33mWarning:\u001b[0m ' + msg);
	};

	/**
	 * Return the current `Block`.
	 *
	 * @return {Block}
	 * @api private
	 */

	Evaluator.prototype.__defineGetter__('currentBlock', function(){
	  return this.stack.currentFrame.block;
	});

	/**
	 * Return an array of vendor names.
	 *
	 * @return {Array}
	 * @api private
	 */

	Evaluator.prototype.__defineGetter__('vendors', function(){
	  return this.lookup('vendors').nodes.map(function(node){
	    return node.string;
	  });
	});

	/**
	 * Return the property name without vendor prefix.
	 *
	 * @param {String} prop
	 * @return {String}
	 * @api public
	 */

	Evaluator.prototype.unvendorize = function(prop){
	  for (var i = 0, len = this.vendors.length; i < len; i++) {
	    if ('official' != this.vendors[i]) {
	      var vendor = '-' + this.vendors[i] + '-';
	      if (~prop.indexOf(vendor)) return prop.replace(vendor, '');
	    }
	  }
	  return prop;
	};

	/**
	 * Return the current frame `Scope`.
	 *
	 * @return {Scope}
	 * @api private
	 */

	Evaluator.prototype.__defineGetter__('currentScope', function(){
	  return this.stack.currentFrame.scope;
	});

	/**
	 * Return the current `Frame`.
	 *
	 * @return {Frame}
	 * @api private
	 */

	Evaluator.prototype.__defineGetter__('currentFrame', function(){
	  return this.stack.currentFrame;
	});
	return evaluatorExports;
}

var hasRequiredNode;

function requireNode () {
	if (hasRequiredNode) return nodeExports;
	hasRequiredNode = 1;
	/*!
	 * Stylus - Node
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Evaluator = requireEvaluator()
	  , utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Initialize a new `CoercionError` with the given `msg`.
	 *
	 * @param {String} msg
	 * @api private
	 */

	function CoercionError(msg) {
	  this.name = 'CoercionError';
	  this.message = msg;
	  Error.captureStackTrace(this, CoercionError);
	}

	/**
	 * Inherit from `Error.prototype`.
	 */

	CoercionError.prototype.__proto__ = Error.prototype;

	/**
	 * Node constructor.
	 *
	 * @api public
	 */

	var Node = node.exports = function Node(){
	  this.lineno = nodes.lineno || 1;
	  this.column = nodes.column || 1;
	  this.filename = nodes.filename;
	};

	Node.prototype = {
	  constructor: Node,

	  /**
	   * Return this node.
	   *
	   * @return {Node}
	   * @api public
	   */

	  get first() {
	    return this;
	  },

	  /**
	   * Return hash.
	   *
	   * @return {String}
	   * @api public
	   */

	  get hash() {
	    return this.val;
	  },

	  /**
	   * Return node name.
	   *
	   * @return {String}
	   * @api public
	   */

	  get nodeName() {
	    return this.constructor.name.toLowerCase();
	  },

	  /**
	   * Return this node.
	   * 
	   * @return {Node}
	   * @api public
	   */

	  clone: function(){
	    return this;
	  },

	  /**
	   * Return a JSON representation of this node.
	   *
	   * @return {Object}
	   * @api public
	   */

	  toJSON: function(){
	    return {
	      lineno: this.lineno,
	      column: this.column,
	      filename: this.filename
	    };
	  },

	  /**
	   * Nodes by default evaluate to themselves.
	   *
	   * @return {Node}
	   * @api public
	   */

	  eval: function(){
	    return new Evaluator(this).evaluate();
	  },

	  /**
	   * Return true.
	   *
	   * @return {Boolean}
	   * @api public
	   */

	  toBoolean: function(){
	    return nodes.true;
	  },

	  /**
	   * Return the expression, or wrap this node in an expression.
	   *
	   * @return {Expression}
	   * @api public
	   */

	  toExpression: function(){
	    if ('expression' == this.nodeName) return this;
	    var expr = new nodes.Expression;
	    expr.push(this);
	    return expr;
	  },

	  /**
	   * Return false if `op` is generally not coerced.
	   *
	   * @param {String} op
	   * @return {Boolean}
	   * @api private
	   */

	  shouldCoerce: function(op){
	    switch (op) {
	      case 'is a':
	      case 'in':
	      case '||':
	      case '&&':
	        return false;
	      default:
	        return true;
	    }
	  },

	  /**
	   * Operate on `right` with the given `op`.
	   *
	   * @param {String} op
	   * @param {Node} right
	   * @return {Node}
	   * @api public
	   */

	  operate: function(op, right){
	    switch (op) {
	      case 'is a':
	        if ('string' == right.first.nodeName) {
	          return nodes.Boolean(this.nodeName == right.val);
	        } else {
	          throw new Error('"is a" expects a string, got ' + right.toString());
	        }
	      case '==':
	        return nodes.Boolean(this.hash == right.hash);
	      case '!=':
	        return nodes.Boolean(this.hash != right.hash);
	      case '>=':
	        return nodes.Boolean(this.hash >= right.hash);
	      case '<=':
	        return nodes.Boolean(this.hash <= right.hash);
	      case '>':
	        return nodes.Boolean(this.hash > right.hash);
	      case '<':
	        return nodes.Boolean(this.hash < right.hash);
	      case '||':
	        return this.toBoolean().isTrue
	          ? this
	          : right;
	      case 'in':
	        var vals = utils.unwrap(right).nodes
	          , len = vals && vals.length
	          , hash = this.hash;
	        if (!vals) throw new Error('"in" given invalid right-hand operand, expecting an expression');

	        // 'prop' in obj
	        if (1 == len && 'object' == vals[0].nodeName) {
	          return nodes.Boolean(vals[0].has(this.hash));
	        }

	        for (var i = 0; i < len; ++i) {
	          if (hash == vals[i].hash) {
	            return nodes.true;
	          }
	        }
	        return nodes.false;
	      case '&&':
	        var a = this.toBoolean()
	          , b = right.toBoolean();
	        return a.isTrue && b.isTrue
	          ? right
	          : a.isFalse
	            ? this
	            : right;
	      default:
	        if ('[]' == op) {
	          var msg = 'cannot perform '
	            + this
	            + '[' + right + ']';
	        } else {
	          var msg = 'cannot perform'
	            + ' ' + this
	            + ' ' + op
	            + ' ' + right;
	        }
	        throw new Error(msg);
	    }
	  },

	  /**
	   * Default coercion throws.
	   *
	   * @param {Node} other
	   * @return {Node}
	   * @api public
	   */

	  coerce: function(other){
	    if (other.nodeName == this.nodeName) return other;
	    throw new CoercionError('cannot coerce ' + other + ' to ' + this.nodeName);
	  }
	};
	return nodeExports;
}

var rootExports = {};
var root = {
  get exports(){ return rootExports; },
  set exports(v){ rootExports = v; },
};

var hasRequiredRoot;

function requireRoot () {
	if (hasRequiredRoot) return rootExports;
	hasRequiredRoot = 1;
	/*!
	 * Stylus - Root
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Root` node.
	 *
	 * @api public
	 */

	var Root = root.exports = function Root(){
	  this.nodes = [];
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Root.prototype.__proto__ = Node.prototype;

	/**
	 * Push a `node` to this block.
	 *
	 * @param {Node} node
	 * @api public
	 */

	Root.prototype.push = function(node){
	  this.nodes.push(node);
	};

	/**
	 * Unshift a `node` to this block.
	 *
	 * @param {Node} node
	 * @api public
	 */

	Root.prototype.unshift = function(node){
	  this.nodes.unshift(node);
	};

	/**
	 * Return a clone of this node.
	 *
	 * @return {Node}
	 * @api public
	 */

	Root.prototype.clone = function(){
	  var clone = new Root();
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  this.nodes.forEach(function(node){
	    clone.push(node.clone(clone, clone));
	  });
	  return clone;
	};

	/**
	 * Return "root".
	 *
	 * @return {String}
	 * @api public
	 */

	Root.prototype.toString = function(){
	  return '[Root]';
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Root.prototype.toJSON = function(){
	  return {
	    __type: 'Root',
	    nodes: this.nodes,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return rootExports;
}

var _nullExports$1 = {};
var _null$1 = {
  get exports(){ return _nullExports$1; },
  set exports(v){ _nullExports$1 = v; },
};

var hasRequired_null$1;

function require_null$1 () {
	if (hasRequired_null$1) return _nullExports$1;
	hasRequired_null$1 = 1;
	/*!
	 * Stylus - Null
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  , nodes = requireNodes();

	/**
	 * Initialize a new `Null` node.
	 *
	 * @api public
	 */

	var Null = _null$1.exports = function Null(){};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Null.prototype.__proto__ = Node.prototype;

	/**
	 * Return 'Null'.
	 *
	 * @return {String}
	 * @api public
	 */

	Null.prototype.inspect = 
	Null.prototype.toString = function(){
	  return 'null';
	};

	/**
	 * Return false.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Null.prototype.toBoolean = function(){
	  return nodes.false;
	};

	/**
	 * Check if the node is a null node.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Null.prototype.__defineGetter__('isNull', function(){
	  return true;
	});

	/**
	 * Return hash.
	 *
	 * @return {String}
	 * @api public
	 */

	Null.prototype.__defineGetter__('hash', function(){
	  return null;
	});

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Null.prototype.toJSON = function(){
	  return {
	    __type: 'Null',
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return _nullExports$1;
}

var eachExports = {};
var each = {
  get exports(){ return eachExports; },
  set exports(v){ eachExports = v; },
};

var hasRequiredEach;

function requireEach () {
	if (hasRequiredEach) return eachExports;
	hasRequiredEach = 1;
	/*!
	 * Stylus - Each
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  ; requireNodes();

	/**
	 * Initialize a new `Each` node with the given `val` name,
	 * `key` name, `expr`, and `block`.
	 *
	 * @param {String} val
	 * @param {String} key
	 * @param {Expression} expr
	 * @param {Block} block
	 * @api public
	 */

	var Each = each.exports = function Each(val, key, expr, block){
	  Node.call(this);
	  this.val = val;
	  this.key = key;
	  this.expr = expr;
	  this.block = block;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Each.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Each.prototype.clone = function(parent){
	  var clone = new Each(this.val, this.key);
	  clone.expr = this.expr.clone(parent, clone);
	  clone.block = this.block.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Each.prototype.toJSON = function(){
	  return {
	    __type: 'Each',
	    val: this.val,
	    key: this.key,
	    expr: this.expr,
	    block: this.block,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return eachExports;
}

var _ifExports = {};
var _if = {
  get exports(){ return _ifExports; },
  set exports(v){ _ifExports = v; },
};

var hasRequired_if;

function require_if () {
	if (hasRequired_if) return _ifExports;
	hasRequired_if = 1;
	/*!
	 * Stylus - If
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `If` with the given `cond`.
	 *
	 * @param {Expression} cond
	 * @param {Boolean|Block} negate, block
	 * @api public
	 */

	var If = _if.exports = function If(cond, negate){
	  Node.call(this);
	  this.cond = cond;
	  this.elses = [];
	  if (negate && negate.nodeName) {
	    this.block = negate;
	  } else {
	    this.negate = negate;
	  }
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	If.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	If.prototype.clone = function(parent){
	  var clone = new If();
	  clone.cond = this.cond.clone(parent, clone);
	  clone.block = this.block.clone(parent, clone);
	  clone.elses = this.elses.map(function(node){ return node.clone(parent, clone); });
	  clone.negate = this.negate;
	  clone.postfix = this.postfix;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	If.prototype.toJSON = function(){
	  return {
	    __type: 'If',
	    cond: this.cond,
	    block: this.block,
	    elses: this.elses,
	    negate: this.negate,
	    postfix: this.postfix,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return _ifExports;
}

var callExports = {};
var call = {
  get exports(){ return callExports; },
  set exports(v){ callExports = v; },
};

var hasRequiredCall;

function requireCall () {
	if (hasRequiredCall) return callExports;
	hasRequiredCall = 1;
	/*!
	 * Stylus - Call
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Call` with `name` and `args`.
	 *
	 * @param {String} name
	 * @param {Expression} args
	 * @api public
	 */

	var Call = call.exports = function Call(name, args){
	  Node.call(this);
	  this.name = name;
	  this.args = args;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Call.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Call.prototype.clone = function(parent){
	  var clone = new Call(this.name);
	  clone.args = this.args.clone(parent, clone);
	  if (this.block) clone.block = this.block.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return <name>(param1, param2, ...).
	 *
	 * @return {String}
	 * @api public
	 */

	Call.prototype.toString = function(){
	  var args = this.args.nodes.map(function(node) {
	    var str = node.toString();
	    return str.slice(1, str.length - 1);
	  }).join(', ');

	  return this.name + '(' + args + ')';
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Call.prototype.toJSON = function(){
	  var json = {
	    __type: 'Call',
	    name: this.name,
	    args: this.args,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	  if (this.block) json.block = this.block;
	  return json;
	};
	return callExports;
}

var unaryopExports = {};
var unaryop = {
  get exports(){ return unaryopExports; },
  set exports(v){ unaryopExports = v; },
};

var hasRequiredUnaryop;

function requireUnaryop () {
	if (hasRequiredUnaryop) return unaryopExports;
	hasRequiredUnaryop = 1;
	/*!
	 * Stylus - UnaryOp
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `UnaryOp` with `op`, and `expr`.
	 *
	 * @param {String} op
	 * @param {Node} expr
	 * @api public
	 */

	var UnaryOp = unaryop.exports = function UnaryOp(op, expr){
	  Node.call(this);
	  this.op = op;
	  this.expr = expr;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	UnaryOp.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	UnaryOp.prototype.clone = function(parent){
	  var clone = new UnaryOp(this.op);
	  clone.expr = this.expr.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	UnaryOp.prototype.toJSON = function(){
	  return {
	    __type: 'UnaryOp',
	    op: this.op,
	    expr: this.expr,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return unaryopExports;
}

var binopExports = {};
var binop = {
  get exports(){ return binopExports; },
  set exports(v){ binopExports = v; },
};

var hasRequiredBinop;

function requireBinop () {
	if (hasRequiredBinop) return binopExports;
	hasRequiredBinop = 1;
	/*!
	 * Stylus - BinOp
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `BinOp` with `op`, `left` and `right`.
	 *
	 * @param {String} op
	 * @param {Node} left
	 * @param {Node} right
	 * @api public
	 */

	var BinOp = binop.exports = function BinOp(op, left, right){
	  Node.call(this);
	  this.op = op;
	  this.left = left;
	  this.right = right;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	BinOp.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	BinOp.prototype.clone = function(parent){
	  var clone = new BinOp(this.op);
	  clone.left = this.left.clone(parent, clone);
	  clone.right = this.right && this.right.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  if (this.val) clone.val = this.val.clone(parent, clone);
	  return clone;
	};

	/**
	 * Return <left> <op> <right>
	 *
	 * @return {String}
	 * @api public
	 */
	BinOp.prototype.toString = function() {
	  return this.left.toString() + ' ' + this.op + ' ' + this.right.toString();
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	BinOp.prototype.toJSON = function(){
	  var json = {
	    __type: 'BinOp',
	    left: this.left,
	    right: this.right,
	    op: this.op,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	  if (this.val) json.val = this.val;
	  return json;
	};
	return binopExports;
}

var ternaryExports = {};
var ternary = {
  get exports(){ return ternaryExports; },
  set exports(v){ ternaryExports = v; },
};

var hasRequiredTernary;

function requireTernary () {
	if (hasRequiredTernary) return ternaryExports;
	hasRequiredTernary = 1;
	/*!
	 * Stylus - Ternary
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Ternary` with `cond`, `trueExpr` and `falseExpr`.
	 *
	 * @param {Expression} cond
	 * @param {Expression} trueExpr
	 * @param {Expression} falseExpr
	 * @api public
	 */

	var Ternary = ternary.exports = function Ternary(cond, trueExpr, falseExpr){
	  Node.call(this);
	  this.cond = cond;
	  this.trueExpr = trueExpr;
	  this.falseExpr = falseExpr;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Ternary.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Ternary.prototype.clone = function(parent){
	  var clone = new Ternary();
	  clone.cond = this.cond.clone(parent, clone);
	  clone.trueExpr = this.trueExpr.clone(parent, clone);
	  clone.falseExpr = this.falseExpr.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Ternary.prototype.toJSON = function(){
	  return {
	    __type: 'Ternary',
	    cond: this.cond,
	    trueExpr: this.trueExpr,
	    falseExpr: this.falseExpr,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return ternaryExports;
}

var blockExports = {};
var block = {
  get exports(){ return blockExports; },
  set exports(v){ blockExports = v; },
};

var hasRequiredBlock;

function requireBlock () {
	if (hasRequiredBlock) return blockExports;
	hasRequiredBlock = 1;
	/*!
	 * Stylus - Block
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Block` node with `parent` Block.
	 *
	 * @param {Block} parent
	 * @api public
	 */

	var Block = block.exports = function Block(parent, node){
	  Node.call(this);
	  this.nodes = [];
	  this.parent = parent;
	  this.node = node;
	  this.scope = true;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Block.prototype.__proto__ = Node.prototype;

	/**
	 * Check if this block has properties..
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Block.prototype.__defineGetter__('hasProperties', function(){
	  for (var i = 0, len = this.nodes.length; i < len; ++i) {
	    if ('property' == this.nodes[i].nodeName) {
	      return true;
	    }
	  }
	});

	/**
	 * Check if this block has @media nodes.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Block.prototype.__defineGetter__('hasMedia', function(){
	  for (var i = 0, len = this.nodes.length; i < len; ++i) {
	    var nodeName = this.nodes[i].nodeName;
	    if ('media' == nodeName) {
	      return true;
	    }
	  }
	  return false;
	});

	/**
	 * Check if this block is empty.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Block.prototype.__defineGetter__('isEmpty', function(){
	  return !this.nodes.length;
	});

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Block.prototype.clone = function(parent, node){
	  parent = parent || this.parent;
	  var clone = new Block(parent, node || this.node);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  clone.scope = this.scope;
	  this.nodes.forEach(function(node){
	    clone.push(node.clone(clone, clone));
	  });
	  return clone;
	};

	/**
	 * Push a `node` to this block.
	 *
	 * @param {Node} node
	 * @api public
	 */

	Block.prototype.push = function(node){
	  this.nodes.push(node);
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Block.prototype.toJSON = function(){
	  return {
	    __type: 'Block',
	    // parent: this.parent,
	    // node: this.node,
	    scope: this.scope,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename,
	    nodes: this.nodes
	  };
	};
	return blockExports;
}

var unitExports = {};
var unit = {
  get exports(){ return unitExports; },
  set exports(v){ unitExports = v; },
};

var hasRequiredUnit;

function requireUnit () {
	if (hasRequiredUnit) return unitExports;
	hasRequiredUnit = 1;
	/*!
	 * Stylus - Unit
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  , nodes = requireNodes();

	/**
	 * Unit conversion table.
	 */

	var FACTOR_TABLE = {
	  'mm': {val: 1, label: 'mm'},
	  'cm': {val: 10, label: 'mm'},
	  'in': {val: 25.4, label: 'mm'},
	  'pt': {val: 25.4/72, label: 'mm'},
	  'ms': {val: 1, label: 'ms'},
	  's': {val: 1000, label: 'ms'},
	  'Hz': {val: 1, label: 'Hz'},
	  'kHz': {val: 1000, label: 'Hz'}
	};

	/**
	 * Initialize a new `Unit` with the given `val` and unit `type`
	 * such as "px", "pt", "in", etc.
	 *
	 * @param {String} val
	 * @param {String} type
	 * @api public
	 */

	var Unit = unit.exports = function Unit(val, type){
	  Node.call(this);
	  this.val = val;
	  this.type = type;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Unit.prototype.__proto__ = Node.prototype;

	/**
	 * Return Boolean based on the unit value.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Unit.prototype.toBoolean = function(){
	  return nodes.Boolean(this.type
	      ? true
	      : this.val);
	};

	/**
	 * Return unit string.
	 *
	 * @return {String}
	 * @api public
	 */

	Unit.prototype.toString = function(){
	  return this.val + (this.type || '');
	};

	/**
	 * Return a clone of this node.
	 *
	 * @return {Node}
	 * @api public
	 */

	Unit.prototype.clone = function(){
	  var clone = new Unit(this.val, this.type);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Unit.prototype.toJSON = function(){
	  return {
	    __type: 'Unit',
	    val: this.val,
	    type: this.type,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};

	/**
	 * Operate on `right` with the given `op`.
	 *
	 * @param {String} op
	 * @param {Node} right
	 * @return {Node}
	 * @api public
	 */

	Unit.prototype.operate = function(op, right){
	  var type = this.type || right.first.type;

	  // swap color
	  if ('rgba' == right.nodeName || 'hsla' == right.nodeName) {
	    return right.operate(op, this);
	  }

	  // operate
	  if (this.shouldCoerce(op)) {
	    right = right.first;
	    // percentages
	    if ('%' != this.type && ('-' == op || '+' == op) && '%' == right.type) {
	      right = new Unit(this.val * (right.val / 100), '%');
	    } else {
	      right = this.coerce(right);
	    }

	    switch (op) {
	      case '-':
	        return new Unit(this.val - right.val, type);
	      case '+':
	        // keyframes interpolation
	        type = type || (right.type == '%' && right.type);
	        return new Unit(this.val + right.val, type);
	      case '/':
	        return new Unit(this.val / right.val, type);
	      case '*':
	        return new Unit(this.val * right.val, type);
	      case '%':
	        return new Unit(this.val % right.val, type);
	      case '**':
	        return new Unit(Math.pow(this.val, right.val), type);
	      case '..':
	      case '...':
	        var start = this.val
	          , end = right.val
	          , expr = new nodes.Expression
	          , inclusive = '..' == op;
	        if (start < end) {
	          do {
	            expr.push(new nodes.Unit(start));
	          } while (inclusive ? ++start <= end : ++start < end);
	        } else {
	          do {
	            expr.push(new nodes.Unit(start));
	          } while (inclusive ? --start >= end : --start > end);
	        }
	        return expr;
	    }
	  }

	  return Node.prototype.operate.call(this, op, right);
	};

	/**
	 * Coerce `other` unit to the same type as `this` unit.
	 *
	 * Supports:
	 *
	 *    mm -> cm | in
	 *    cm -> mm | in
	 *    in -> mm | cm
	 *
	 *    ms -> s
	 *    s  -> ms
	 *
	 *    Hz  -> kHz
	 *    kHz -> Hz
	 *
	 * @param {Unit} other
	 * @return {Unit}
	 * @api public
	 */

	Unit.prototype.coerce = function(other){
	  if ('unit' == other.nodeName) {
	    var a = this
	      , b = other
	      , factorA = FACTOR_TABLE[a.type]
	      , factorB = FACTOR_TABLE[b.type];

	    if (factorA && factorB && (factorA.label == factorB.label)) {
	      var bVal = b.val * (factorB.val / factorA.val);
	      return new nodes.Unit(bVal, a.type);
	    } else {
	      return new nodes.Unit(b.val, a.type);
	    }
	  } else if ('string' == other.nodeName) {
	    // keyframes interpolation
	    if ('%' == other.val) return new nodes.Unit(0, '%');
	    var val = parseFloat(other.val);
	    if (isNaN(val)) Node.prototype.coerce.call(this, other);
	    return new nodes.Unit(val);
	  } else {
	    return Node.prototype.coerce.call(this, other);
	  }
	};
	return unitExports;
}

var stringExports = {};
var string = {
  get exports(){ return stringExports; },
  set exports(v){ stringExports = v; },
};

/*!
 * Stylus - String
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

var hasRequiredString;

function requireString () {
	if (hasRequiredString) return stringExports;
	hasRequiredString = 1;
	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  , sprintf = requireFunctions().s
	  , utils = requireUtils()
	  , nodes = requireNodes();

	/**
	 * Initialize a new `String` with the given `val`.
	 *
	 * @param {String} val
	 * @param {String} quote
	 * @api public
	 */

	var String = string.exports = function String(val, quote){
	  Node.call(this);
	  this.val = val;
	  this.string = val;
	  this.prefixed = false;
	  if (typeof quote !== 'string') {
	    this.quote = "'";
	  } else {
	    this.quote = quote;
	  }
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	String.prototype.__proto__ = Node.prototype;

	/**
	 * Return quoted string.
	 *
	 * @return {String}
	 * @api public
	 */

	String.prototype.toString = function(){
	  return this.quote + this.val + this.quote;
	};

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	String.prototype.clone = function(){
	  var clone = new String(this.val, this.quote);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	String.prototype.toJSON = function(){
	  return {
	    __type: 'String',
	    val: this.val,
	    quote: this.quote,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};

	/**
	 * Return Boolean based on the length of this string.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	String.prototype.toBoolean = function(){
	  return nodes.Boolean(this.val.length);
	};

	/**
	 * Coerce `other` to a string.
	 *
	 * @param {Node} other
	 * @return {String}
	 * @api public
	 */

	String.prototype.coerce = function(other){
	  switch (other.nodeName) {
	    case 'string':
	      return other;
	    case 'expression':
	      return new String(other.nodes.map(function(node){
	        return this.coerce(node).val;
	      }, this).join(' '));
	    default:
	      return new String(other.toString());
	  }
	};

	/**
	 * Operate on `right` with the given `op`.
	 *
	 * @param {String} op
	 * @param {Node} right
	 * @return {Node}
	 * @api public
	 */

	String.prototype.operate = function(op, right){
	  switch (op) {
	    case '%':
	      var expr = new nodes.Expression;
	      expr.push(this);

	      // constructargs
	      var args = 'expression' == right.nodeName
	        ? utils.unwrap(right).nodes
	        : [right];

	      // apply
	      return sprintf.apply(null, [expr].concat(args));
	    case '+':
	      var expr = new nodes.Expression;
	      expr.push(new String(this.val + this.coerce(right).val));
	      return expr;
	    default:
	      return Node.prototype.operate.call(this, op, right);
	  }
	};
	return stringExports;
}

var hslaExports = {};
var hsla = {
  get exports(){ return hslaExports; },
  set exports(v){ hslaExports = v; },
};

var hasRequiredHsla;

function requireHsla () {
	if (hasRequiredHsla) return hslaExports;
	hasRequiredHsla = 1;
	(function (module, exports) {
		/*!
		 * Stylus - HSLA
		 * Copyright (c) Automattic <developer.wordpress.com>
		 * MIT Licensed
		 */

		/**
		 * Module dependencies.
		 */

		var Node = requireNode()
		  , nodes = requireNodes();

		/**
		 * Initialize a new `HSLA` with the given h,s,l,a component values.
		 *
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @param {Number} a
		 * @api public
		 */

		var HSLA = exports = module.exports = function HSLA(h,s,l,a){
		  Node.call(this);
		  this.h = clampDegrees(h);
		  this.s = clampPercentage(s);
		  this.l = clampPercentage(l);
		  this.a = clampAlpha(a);
		  this.hsla = this;
		};

		/**
		 * Inherit from `Node.prototype`.
		 */

		HSLA.prototype.__proto__ = Node.prototype;

		/**
		 * Return hsla(n,n,n,n).
		 *
		 * @return {String}
		 * @api public
		 */

		HSLA.prototype.toString = function(){
		  return 'hsla('
		    + this.h + ','
		    + this.s.toFixed(0) + '%,'
		    + this.l.toFixed(0) + '%,'
		    + this.a + ')';
		};

		/**
		 * Return a clone of this node.
		 * 
		 * @return {Node}
		 * @api public
		 */

		HSLA.prototype.clone = function(parent){
		  var clone = new HSLA(
		      this.h
		    , this.s
		    , this.l
		    , this.a);
		  clone.lineno = this.lineno;
		  clone.column = this.column;
		  clone.filename = this.filename;
		  return clone;
		};

		/**
		 * Return a JSON representation of this node.
		 *
		 * @return {Object}
		 * @api public
		 */

		HSLA.prototype.toJSON = function(){
		  return {
		    __type: 'HSLA',
		    h: this.h,
		    s: this.s,
		    l: this.l,
		    a: this.a,
		    lineno: this.lineno,
		    column: this.column,
		    filename: this.filename
		  };
		};

		/**
		 * Return rgba `RGBA` representation.
		 *
		 * @return {RGBA}
		 * @api public
		 */

		HSLA.prototype.__defineGetter__('rgba', function(){
		  return nodes.RGBA.fromHSLA(this);
		});

		/**
		 * Return hash.
		 *
		 * @return {String}
		 * @api public
		 */

		HSLA.prototype.__defineGetter__('hash', function(){
		  return this.rgba.toString();
		});

		/**
		 * Add h,s,l to the current component values.
		 *
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {HSLA} new node
		 * @api public
		 */

		HSLA.prototype.add = function(h,s,l){
		  return new HSLA(
		      this.h + h
		    , this.s + s
		    , this.l + l
		    , this.a);
		};

		/**
		 * Subtract h,s,l from the current component values.
		 *
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {HSLA} new node
		 * @api public
		 */

		HSLA.prototype.sub = function(h,s,l){
		  return this.add(-h, -s, -l);
		};

		/**
		 * Operate on `right` with the given `op`.
		 *
		 * @param {String} op
		 * @param {Node} right
		 * @return {Node}
		 * @api public
		 */

		HSLA.prototype.operate = function(op, right){
		  switch (op) {
		    case '==':
		    case '!=':
		    case '<=':
		    case '>=':
		    case '<':
		    case '>':
		    case 'is a':
		    case '||':
		    case '&&':
		      return this.rgba.operate(op, right);
		    default:
		      return this.rgba.operate(op, right).hsla;
		  }
		};

		/**
		 * Return `HSLA` representation of the given `color`.
		 *
		 * @param {RGBA} color
		 * @return {HSLA}
		 * @api public
		 */

		exports.fromRGBA = function(rgba){
		  var r = rgba.r / 255
		    , g = rgba.g / 255
		    , b = rgba.b / 255
		    , a = rgba.a;

		  var min = Math.min(r,g,b)
		    , max = Math.max(r,g,b)
		    , l = (max + min) / 2
		    , d = max - min
		    , h, s;

		  switch (max) {
		    case min: h = 0; break;
		    case r: h = 60 * (g-b) / d; break;
		    case g: h = 60 * (b-r) / d + 120; break;
		    case b: h = 60 * (r-g) / d + 240; break;
		  }

		  if (max == min) {
		    s = 0;
		  } else if (l < .5) {
		    s = d / (2 * l);
		  } else {
		    s = d / (2 - 2 * l);
		  }

		  h %= 360;
		  s *= 100;
		  l *= 100;

		  return new HSLA(h,s,l,a);
		};

		/**
		 * Adjust lightness by `percent`.
		 *
		 * @param {Number} percent
		 * @return {HSLA} for chaining
		 * @api public
		 */

		HSLA.prototype.adjustLightness = function(percent){
		  this.l = clampPercentage(this.l + this.l * (percent / 100));
		  return this;
		};

		/**
		 * Adjust hue by `deg`.
		 *
		 * @param {Number} deg
		 * @return {HSLA} for chaining
		 * @api public
		 */

		HSLA.prototype.adjustHue = function(deg){
		  this.h = clampDegrees(this.h + deg);
		  return this;
		};

		/**
		 * Clamp degree `n` >= 0 and <= 360.
		 *
		 * @param {Number} n
		 * @return {Number}
		 * @api private
		 */

		function clampDegrees(n) {
		  n = n % 360;
		  return n >= 0 ? n : 360 + n;
		}

		/**
		 * Clamp percentage `n` >= 0 and <= 100.
		 *
		 * @param {Number} n
		 * @return {Number}
		 * @api private
		 */

		function clampPercentage(n) {
		  return Math.max(0, Math.min(n, 100));
		}

		/**
		 * Clamp alpha `n` >= 0 and <= 1.
		 *
		 * @param {Number} n
		 * @return {Number}
		 * @api private
		 */

		function clampAlpha(n) {
		  return Math.max(0, Math.min(n, 1));
		}
} (hsla, hslaExports));
	return hslaExports;
}

var rgbaExports = {};
var rgba = {
  get exports(){ return rgbaExports; },
  set exports(v){ rgbaExports = v; },
};

var hasRequiredRgba;

function requireRgba () {
	if (hasRequiredRgba) return rgbaExports;
	hasRequiredRgba = 1;
	(function (module, exports) {
		/*!
		 * Stylus - RGBA
		 * Copyright (c) Automattic <developer.wordpress.com>
		 * MIT Licensed
		 */

		/**
		 * Module dependencies.
		 */

		var Node = requireNode()
		  , HSLA = requireHsla()
		  , functions = requireFunctions()
		  , adjust = functions.adjust
		  , nodes = requireNodes();

		/**
		 * Initialize a new `RGBA` with the given r,g,b,a component values.
		 *
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @param {Number} a
		 * @api public
		 */

		var RGBA = exports = module.exports = function RGBA(r,g,b,a){
		  Node.call(this);
		  this.r = clamp(r);
		  this.g = clamp(g);
		  this.b = clamp(b);
		  this.a = clampAlpha(a);
		  this.name = '';
		  this.rgba = this;
		};

		/**
		 * Inherit from `Node.prototype`.
		 */

		RGBA.prototype.__proto__ = Node.prototype;

		/**
		 * Return an `RGBA` without clamping values.
		 * 
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @param {Number} a
		 * @return {RGBA}
		 * @api public
		 */

		RGBA.withoutClamping = function(r,g,b,a){
		  var rgba = new RGBA(0,0,0,0);
		  rgba.r = r;
		  rgba.g = g;
		  rgba.b = b;
		  rgba.a = a;
		  return rgba;
		};

		/**
		 * Return a clone of this node.
		 * 
		 * @return {Node}
		 * @api public
		 */

		RGBA.prototype.clone = function(){
		  var clone = new RGBA(
		      this.r
		    , this.g
		    , this.b
		    , this.a);
		  clone.raw = this.raw;
		  clone.name = this.name;
		  clone.lineno = this.lineno;
		  clone.column = this.column;
		  clone.filename = this.filename;
		  return clone;
		};

		/**
		 * Return a JSON representation of this node.
		 *
		 * @return {Object}
		 * @api public
		 */

		RGBA.prototype.toJSON = function(){
		  return {
		    __type: 'RGBA',
		    r: this.r,
		    g: this.g,
		    b: this.b,
		    a: this.a,
		    raw: this.raw,
		    name: this.name,
		    lineno: this.lineno,
		    column: this.column,
		    filename: this.filename
		  };
		};

		/**
		 * Return true.
		 *
		 * @return {Boolean}
		 * @api public
		 */

		RGBA.prototype.toBoolean = function(){
		  return nodes.true;
		};

		/**
		 * Return `HSLA` representation.
		 *
		 * @return {HSLA}
		 * @api public
		 */

		RGBA.prototype.__defineGetter__('hsla', function(){
		  return HSLA.fromRGBA(this);
		});

		/**
		 * Return hash.
		 *
		 * @return {String}
		 * @api public
		 */

		RGBA.prototype.__defineGetter__('hash', function(){
		  return this.toString();
		});

		/**
		 * Add r,g,b,a to the current component values.
		 *
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @param {Number} a
		 * @return {RGBA} new node
		 * @api public
		 */

		RGBA.prototype.add = function(r,g,b,a){
		  return new RGBA(
		      this.r + r
		    , this.g + g
		    , this.b + b
		    , this.a + a);
		};

		/**
		 * Subtract r,g,b,a from the current component values.
		 *
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @param {Number} a
		 * @return {RGBA} new node
		 * @api public
		 */

		RGBA.prototype.sub = function(r,g,b,a){
		  return new RGBA(
		      this.r - r
		    , this.g - g
		    , this.b - b
		    , a == 1 ? this.a : this.a - a);
		};

		/**
		 * Multiply rgb components by `n`.
		 *
		 * @param {String} n
		 * @return {RGBA} new node
		 * @api public
		 */

		RGBA.prototype.multiply = function(n){
		  return new RGBA(
		      this.r * n
		    , this.g * n
		    , this.b * n
		    , this.a); 
		};

		/**
		 * Divide rgb components by `n`.
		 *
		 * @param {String} n
		 * @return {RGBA} new node
		 * @api public
		 */

		RGBA.prototype.divide = function(n){
		  return new RGBA(
		      this.r / n
		    , this.g / n
		    , this.b / n
		    , this.a); 
		};

		/**
		 * Operate on `right` with the given `op`.
		 *
		 * @param {String} op
		 * @param {Node} right
		 * @return {Node}
		 * @api public
		 */

		RGBA.prototype.operate = function(op, right){
		  if ('in' != op) right = right.first;

		  switch (op) {
		    case 'is a':
		      if ('string' == right.nodeName && 'color' == right.string) {
		        return nodes.true;
		      }
		      break;
		    case '+':
		      switch (right.nodeName) {
		        case 'unit':
		          var n = right.val;
		          switch (right.type) {
		            case '%': return adjust(this, new nodes.String('lightness'), right);
		            case 'deg': return this.hsla.adjustHue(n).rgba;
		            default: return this.add(n,n,n,0);
		          }
		        case 'rgba':
		          return this.add(right.r, right.g, right.b, right.a);
		        case 'hsla':
		          return this.hsla.add(right.h, right.s, right.l);
		      }
		      break;
		    case '-':
		      switch (right.nodeName) {
		        case 'unit':
		          var n = right.val;
		          switch (right.type) {
		            case '%': return adjust(this, new nodes.String('lightness'), new nodes.Unit(-n, '%'));
		            case 'deg': return this.hsla.adjustHue(-n).rgba;
		            default: return this.sub(n,n,n,0);
		          }
		        case 'rgba':
		          return this.sub(right.r, right.g, right.b, right.a);
		        case 'hsla':
		          return this.hsla.sub(right.h, right.s, right.l);
		      }
		      break;
		    case '*':
		      switch (right.nodeName) {
		        case 'unit':
		          return this.multiply(right.val);
		      }
		      break;
		    case '/':
		      switch (right.nodeName) {
		        case 'unit':
		          return this.divide(right.val);
		      }
		      break;
		  }
		  return Node.prototype.operate.call(this, op, right);
		};

		/**
		 * Return #nnnnnn, #nnn, or rgba(n,n,n,n) string representation of the color.
		 *
		 * @return {String}
		 * @api public
		 */

		RGBA.prototype.toString = function(){
		  function pad(n) {
		    return n < 16
		      ? '0' + n.toString(16)
		      : n.toString(16);
		  }

		  // special case for transparent named color
		  if ('transparent' == this.name)
		    return this.name;

		  if (1 == this.a) {
		    var r = pad(this.r)
		      , g = pad(this.g)
		      , b = pad(this.b);

		    // Compress
		    if (r[0] == r[1] && g[0] == g[1] && b[0] == b[1]) {
		      return '#' + r[0] + g[0] + b[0];
		    } else {
		      return '#' + r + g + b;
		    }
		  } else {
		    return 'rgba('
		      + this.r + ','
		      + this.g + ','
		      + this.b + ','
		      + (+this.a.toFixed(3)) + ')';
		  }
		};

		/**
		 * Return a `RGBA` from the given `hsla`.
		 *
		 * @param {HSLA} hsla
		 * @return {RGBA}
		 * @api public
		 */

		exports.fromHSLA = function(hsla){
		  var h = hsla.h / 360
		    , s = hsla.s / 100
		    , l = hsla.l / 100
		    , a = hsla.a;

		  var m2 = l <= .5 ? l * (s + 1) : l + s - l * s
		    , m1 = l * 2 - m2;

		  var r = hue(h + 1/3) * 0xff
		    , g = hue(h) * 0xff
		    , b = hue(h - 1/3) * 0xff;

		  function hue(h) {
		    if (h < 0) ++h;
		    if (h > 1) --h;
		    if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
		    if (h * 2 < 1) return m2;
		    if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
		    return m1;
		  }
		  
		  return new RGBA(r,g,b,a);
		};

		/**
		 * Clamp `n` >= 0 and <= 255.
		 *
		 * @param {Number} n
		 * @return {Number}
		 * @api private
		 */

		function clamp(n) {
		  return Math.max(0, Math.min(n.toFixed(0), 255));
		}

		/**
		 * Clamp alpha `n` >= 0 and <= 1.
		 *
		 * @param {Number} n
		 * @return {Number}
		 * @api private
		 */

		function clampAlpha(n) {
		  return Math.max(0, Math.min(n, 1));
		}
} (rgba, rgbaExports));
	return rgbaExports;
}

var identExports = {};
var ident = {
  get exports(){ return identExports; },
  set exports(v){ identExports = v; },
};

var hasRequiredIdent;

function requireIdent () {
	if (hasRequiredIdent) return identExports;
	hasRequiredIdent = 1;
	/*!
	 * Stylus - Ident
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  , nodes = requireNodes();

	/**
	 * Initialize a new `Ident` by `name` with the given `val` node.
	 *
	 * @param {String} name
	 * @param {Node} val
	 * @api public
	 */

	var Ident = ident.exports = function Ident(name, val, mixin){
	  Node.call(this);
	  this.name = name;
	  this.string = name;
	  this.val = val || nodes.null;
	  this.mixin = !!mixin;
	};

	/**
	 * Check if the variable has a value.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Ident.prototype.__defineGetter__('isEmpty', function(){
	  return undefined == this.val;
	});

	/**
	 * Return hash.
	 *
	 * @return {String}
	 * @api public
	 */

	Ident.prototype.__defineGetter__('hash', function(){
	  return this.name;
	});

	/**
	 * Inherit from `Node.prototype`.
	 */

	Ident.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Ident.prototype.clone = function(parent){
	  var clone = new Ident(this.name);
	  clone.val = this.val.clone(parent, clone);
	  clone.mixin = this.mixin;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  clone.property = this.property;
	  clone.rest = this.rest;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Ident.prototype.toJSON = function(){
	  return {
	    __type: 'Ident',
	    name: this.name,
	    val: this.val,
	    mixin: this.mixin,
	    property: this.property,
	    rest: this.rest,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};

	/**
	 * Return <name>.
	 *
	 * @return {String}
	 * @api public
	 */

	Ident.prototype.toString = function(){
	  return this.name;
	};

	/**
	 * Coerce `other` to an ident.
	 *
	 * @param {Node} other
	 * @return {String}
	 * @api public
	 */

	Ident.prototype.coerce = function(other){
	  switch (other.nodeName) {
	    case 'ident':
	    case 'string':
	    case 'literal':
	      return new Ident(other.string);
	    case 'unit':
	      return new Ident(other.toString());
	    default:
	      return Node.prototype.coerce.call(this, other);
	  }
	};

	/**
	 * Operate on `right` with the given `op`.
	 *
	 * @param {String} op
	 * @param {Node} right
	 * @return {Node}
	 * @api public
	 */

	Ident.prototype.operate = function(op, right){
	  var val = right.first;
	  switch (op) {
	    case '-':
	      if ('unit' == val.nodeName) {
	        var expr = new nodes.Expression;
	        val = val.clone();
	        val.val = -val.val;
	        expr.push(this);
	        expr.push(val);
	        return expr;
	      }
	    case '+':
	      return new nodes.Ident(this.string + this.coerce(val).string);
	  }
	  return Node.prototype.operate.call(this, op, right);
	};
	return identExports;
}

var groupExports = {};
var group = {
  get exports(){ return groupExports; },
  set exports(v){ groupExports = v; },
};

var hasRequiredGroup;

function requireGroup () {
	if (hasRequiredGroup) return groupExports;
	hasRequiredGroup = 1;
	/*!
	 * Stylus - Group
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Group`.
	 *
	 * @api public
	 */

	var Group = group.exports = function Group(){
	  Node.call(this);
	  this.nodes = [];
	  this.extends = [];
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Group.prototype.__proto__ = Node.prototype;

	/**
	 * Push the given `selector` node.
	 *
	 * @param {Selector} selector
	 * @api public
	 */

	Group.prototype.push = function(selector){
	  this.nodes.push(selector);
	};

	/**
	 * Return this set's `Block`.
	 */

	Group.prototype.__defineGetter__('block', function(){
	  return this.nodes[0].block;
	});

	/**
	 * Assign `block` to each selector in this set.
	 *
	 * @param {Block} block
	 * @api public
	 */

	Group.prototype.__defineSetter__('block', function(block){
	  for (var i = 0, len = this.nodes.length; i < len; ++i) {
	    this.nodes[i].block = block;
	  }
	});

	/**
	 * Check if this set has only placeholders.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Group.prototype.__defineGetter__('hasOnlyPlaceholders', function(){
	  return this.nodes.every(function(selector) { return selector.isPlaceholder; });
	});

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Group.prototype.clone = function(parent){
	  var clone = new Group;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  this.nodes.forEach(function(node){
	    clone.push(node.clone(parent, clone));
	  });
	  clone.filename = this.filename;
	  clone.block = this.block.clone(parent, clone);
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Group.prototype.toJSON = function(){
	  return {
	    __type: 'Group',
	    nodes: this.nodes,
	    block: this.block,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return groupExports;
}

var literalExports = {};
var literal = {
  get exports(){ return literalExports; },
  set exports(v){ literalExports = v; },
};

var hasRequiredLiteral;

function requireLiteral () {
	if (hasRequiredLiteral) return literalExports;
	hasRequiredLiteral = 1;
	/*!
	 * Stylus - Literal
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  , nodes = requireNodes();

	/**
	 * Initialize a new `Literal` with the given `str`.
	 *
	 * @param {String} str
	 * @api public
	 */

	var Literal = literal.exports = function Literal(str){
	  Node.call(this);
	  this.val = str;
	  this.string = str;
	  this.prefixed = false;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Literal.prototype.__proto__ = Node.prototype;

	/**
	 * Return hash.
	 *
	 * @return {String}
	 * @api public
	 */

	Literal.prototype.__defineGetter__('hash', function(){
	  return this.val;
	});

	/**
	 * Return literal value.
	 *
	 * @return {String}
	 * @api public
	 */

	Literal.prototype.toString = function(){
	  return this.val;
	};

	/**
	 * Coerce `other` to a literal.
	 *
	 * @param {Node} other
	 * @return {String}
	 * @api public
	 */

	Literal.prototype.coerce = function(other){
	  switch (other.nodeName) {
	    case 'ident':
	    case 'string':
	    case 'literal':
	      return new Literal(other.string);
	    default:
	      return Node.prototype.coerce.call(this, other);
	  }
	};

	/**
	 * Operate on `right` with the given `op`.
	 *
	 * @param {String} op
	 * @param {Node} right
	 * @return {Node}
	 * @api public
	 */

	Literal.prototype.operate = function(op, right){
	  var val = right.first;
	  switch (op) {
	    case '+':
	      return new nodes.Literal(this.string + this.coerce(val).string);
	    default:
	      return Node.prototype.operate.call(this, op, right);
	  }
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Literal.prototype.toJSON = function(){
	  return {
	    __type: 'Literal',
	    val: this.val,
	    string: this.string,
	    prefixed: this.prefixed,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return literalExports;
}

var booleanExports = {};
var boolean = {
  get exports(){ return booleanExports; },
  set exports(v){ booleanExports = v; },
};

var hasRequiredBoolean;

function requireBoolean () {
	if (hasRequiredBoolean) return booleanExports;
	hasRequiredBoolean = 1;
	/*!
	 * Stylus - Boolean
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  ; requireNodes();

	/**
	 * Initialize a new `Boolean` node with the given `val`.
	 *
	 * @param {Boolean} val
	 * @api public
	 */

	var Boolean = boolean.exports = function Boolean(val){
	  Node.call(this);
	  if (this.nodeName) {
	    this.val = !!val;
	  } else {
	    return new Boolean(val);
	  }
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Boolean.prototype.__proto__ = Node.prototype;

	/**
	 * Return `this` node.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Boolean.prototype.toBoolean = function(){
	  return this;
	};

	/**
	 * Return `true` if this node represents `true`.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Boolean.prototype.__defineGetter__('isTrue', function(){
	  return this.val;
	});

	/**
	 * Return `true` if this node represents `false`.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Boolean.prototype.__defineGetter__('isFalse', function(){
	  return ! this.val;
	});

	/**
	 * Negate the value.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Boolean.prototype.negate = function(){
	  return new Boolean(!this.val);
	};

	/**
	 * Return 'Boolean'.
	 *
	 * @return {String}
	 * @api public
	 */

	Boolean.prototype.inspect = function(){
	  return '[Boolean ' + this.val + ']';
	};

	/**
	 * Return 'true' or 'false'.
	 *
	 * @return {String}
	 * @api public
	 */

	Boolean.prototype.toString = function(){
	  return this.val
	    ? 'true'
	    : 'false';
	};

	/**
	 * Return a JSON representaiton of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Boolean.prototype.toJSON = function(){
	  return {
	    __type: 'Boolean',
	    val: this.val
	  };
	};
	return booleanExports;
}

var _returnExports = {};
var _return = {
  get exports(){ return _returnExports; },
  set exports(v){ _returnExports = v; },
};

var hasRequired_return;

function require_return () {
	if (hasRequired_return) return _returnExports;
	hasRequired_return = 1;
	/*!
	 * Stylus - Return
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  , nodes = requireNodes();

	/**
	 * Initialize a new `Return` node with the given `expr`.
	 *
	 * @param {Expression} expr
	 * @api public
	 */

	var Return = _return.exports = function Return(expr){
	  this.expr = expr || nodes.null;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Return.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Return.prototype.clone = function(parent){
	  var clone = new Return();
	  clone.expr = this.expr.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Return.prototype.toJSON = function(){
	  return {
	    __type: 'Return',
	    expr: this.expr,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return _returnExports;
}

var mediaExports = {};
var media = {
  get exports(){ return mediaExports; },
  set exports(v){ mediaExports = v; },
};

var atruleExports = {};
var atrule = {
  get exports(){ return atruleExports; },
  set exports(v){ atruleExports = v; },
};

/*!
 * Stylus - at-rule
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

var hasRequiredAtrule;

function requireAtrule () {
	if (hasRequiredAtrule) return atruleExports;
	hasRequiredAtrule = 1;
	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new at-rule node.
	 *
	 * @param {String} type
	 * @api public
	 */

	var Atrule = atrule.exports = function Atrule(type){
	  Node.call(this);
	  this.type = type;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Atrule.prototype.__proto__ = Node.prototype;

	/**
	 * Check if at-rule's block has only properties.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Atrule.prototype.__defineGetter__('hasOnlyProperties', function(){
	  if (!this.block) return false;

	  var nodes = this.block.nodes;
	  for (var i = 0, len = nodes.length; i < len; ++i) {
	    nodes[i].nodeName;
	    switch(nodes[i].nodeName) {
	      case 'property':
	      case 'expression':
	      case 'comment':
	        continue;
	      default:
	        return false;
	    }
	  }
	  return true;
	});

	/**
	 * Return a clone of this node.
	 *
	 * @return {Node}
	 * @api public
	 */

	Atrule.prototype.clone = function(parent){
	  var clone = new Atrule(this.type);
	  if (this.block) clone.block = this.block.clone(parent, clone);
	  clone.segments = this.segments.map(function(node){ return node.clone(parent, clone); });
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Atrule.prototype.toJSON = function(){
	  var json = {
	    __type: 'Atrule',
	    type: this.type,
	    segments: this.segments,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	  if (this.block) json.block = this.block;
	  return json;
	};

	/**
	 * Return @<type>.
	 *
	 * @return {String}
	 * @api public
	 */

	Atrule.prototype.toString = function(){
	  return '@' + this.type;
	};

	/**
	 * Check if the at-rule's block has output nodes.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Atrule.prototype.__defineGetter__('hasOutput', function(){
	  return !!this.block && hasOutput(this.block);
	});

	function hasOutput(block) {
	  var nodes = block.nodes;

	  // only placeholder selectors
	  if (nodes.every(function(node){
	    return 'group' == node.nodeName && node.hasOnlyPlaceholders;
	  })) return false;

	  // something visible
	  return nodes.some(function(node) {
	    switch (node.nodeName) {
	      case 'property':
	      case 'literal':
	      case 'import':
	        return true;
	      case 'block':
	        return hasOutput(node);
	      default:
	        if (node.block) return hasOutput(node.block);
	    }
	  });
	}
	return atruleExports;
}

var hasRequiredMedia;

function requireMedia () {
	if (hasRequiredMedia) return mediaExports;
	hasRequiredMedia = 1;
	/*!
	 * Stylus - Media
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Atrule = requireAtrule();

	/**
	 * Initialize a new `Media` with the given `val`
	 *
	 * @param {String} val
	 * @api public
	 */

	var Media = media.exports = function Media(val){
	  Atrule.call(this, 'media');
	  this.val = val;
	};

	/**
	 * Inherit from `Atrule.prototype`.
	 */

	Media.prototype.__proto__ = Atrule.prototype;

	/**
	 * Clone this node.
	 *
	 * @return {Media}
	 * @api public
	 */

	Media.prototype.clone = function(parent){
	  var clone = new Media;
	  clone.val = this.val.clone(parent, clone);
	  clone.block = this.block.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Media.prototype.toJSON = function(){
	  return {
	    __type: 'Media',
	    val: this.val,
	    block: this.block,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};

	/**
	 * Return @media "val".
	 *
	 * @return {String}
	 * @api public
	 */

	Media.prototype.toString = function(){
	  return '@media ' + this.val;
	};
	return mediaExports;
}

var queryListExports = {};
var queryList = {
  get exports(){ return queryListExports; },
  set exports(v){ queryListExports = v; },
};

var hasRequiredQueryList;

function requireQueryList () {
	if (hasRequiredQueryList) return queryListExports;
	hasRequiredQueryList = 1;
	/*!
	 * Stylus - QueryList
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `QueryList`.
	 *
	 * @api public
	 */

	var QueryList = queryList.exports = function QueryList(){
	  Node.call(this);
	  this.nodes = [];
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	QueryList.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	QueryList.prototype.clone = function(parent){
	  var clone = new QueryList;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  for (var i = 0; i < this.nodes.length; ++i) {
	    clone.push(this.nodes[i].clone(parent, clone));
	  }
	  return clone;
	};

	/**
	 * Push the given `node`.
	 *
	 * @param {Node} node
	 * @api public
	 */

	QueryList.prototype.push = function(node){
	  this.nodes.push(node);
	};

	/**
	 * Merges this query list with the `other`.
	 *
	 * @param {QueryList} other
	 * @return {QueryList}
	 * @api private
	 */

	QueryList.prototype.merge = function(other){
	  var list = new QueryList
	    , merged;
	  this.nodes.forEach(function(query){
	    for (var i = 0, len = other.nodes.length; i < len; ++i){
	      merged = query.merge(other.nodes[i]);
	      if (merged) list.push(merged);
	    }
	  });
	  return list;
	};

	/**
	 * Return "<a>, <b>, <c>"
	 *
	 * @return {String}
	 * @api public
	 */

	QueryList.prototype.toString = function(){
	  return '(' + this.nodes.map(function(node){
	    return node.toString();
	  }).join(', ') + ')';
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	QueryList.prototype.toJSON = function(){
	  return {
	    __type: 'QueryList',
	    nodes: this.nodes,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return queryListExports;
}

var queryExports = {};
var query = {
  get exports(){ return queryExports; },
  set exports(v){ queryExports = v; },
};

var hasRequiredQuery;

function requireQuery () {
	if (hasRequiredQuery) return queryExports;
	hasRequiredQuery = 1;
	/*!
	 * Stylus - Query
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Query`.
	 *
	 * @api public
	 */

	var Query = query.exports = function Query(){
	  Node.call(this);
	  this.nodes = [];
	  this.type = '';
	  this.predicate = '';
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Query.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Query.prototype.clone = function(parent){
	  var clone = new Query;
	  clone.predicate = this.predicate;
	  clone.type = this.type;
	  for (var i = 0, len = this.nodes.length; i < len; ++i) {
	    clone.push(this.nodes[i].clone(parent, clone));
	  }
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Push the given `feature`.
	 *
	 * @param {Feature} feature
	 * @api public
	 */

	Query.prototype.push = function(feature){
	  this.nodes.push(feature);
	};

	/**
	 * Return resolved type of this query.
	 *
	 * @return {String}
	 * @api private
	 */

	Query.prototype.__defineGetter__('resolvedType', function(){
	  if (this.type) {
	    return this.type.nodeName
	      ? this.type.string
	      : this.type;
	  }
	});

	/**
	 * Return resolved predicate of this query.
	 *
	 * @return {String}
	 * @api private
	 */

	Query.prototype.__defineGetter__('resolvedPredicate', function(){
	  if (this.predicate) {
	    return this.predicate.nodeName
	      ? this.predicate.string
	      : this.predicate;
	  }
	});

	/**
	 * Merges this query with the `other`.
	 *
	 * @param {Query} other
	 * @return {Query}
	 * @api private
	 */

	Query.prototype.merge = function(other){
	  var query = new Query
	    , p1 = this.resolvedPredicate
	    , p2 = other.resolvedPredicate
	    , t1 = this.resolvedType
	    , t2 = other.resolvedType
	    , type, pred;

	  // Stolen from Sass :D
	  t1 = t1 || t2;
	  t2 = t2 || t1;
	  if (('not' == p1) ^ ('not' == p2)) {
	    if (t1 == t2) return;
	    type = ('not' == p1) ? t2 : t1;
	    pred = ('not' == p1) ? p2 : p1;
	  } else if (('not' == p1) && ('not' == p2)) {
	    if (t1 != t2) return;
	    type = t1;
	    pred = 'not';
	  } else if (t1 != t2) {
	    return;
	  } else {
	    type = t1;
	    pred = p1 || p2;
	  }
	  query.predicate = pred;
	  query.type = type;
	  query.nodes = this.nodes.concat(other.nodes);
	  return query;
	};

	/**
	 * Return "<a> and <b> and <c>"
	 *
	 * @return {String}
	 * @api public
	 */

	Query.prototype.toString = function(){
	  var pred = this.predicate ? this.predicate + ' ' : ''
	    , type = this.type || ''
	    , len = this.nodes.length
	    , str = pred + type;
	  if (len) {
	    str += (type && ' and ') + this.nodes.map(function(expr){
	      return expr.toString();
	    }).join(' and ');
	  }
	  return str;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Query.prototype.toJSON = function(){
	  return {
	    __type: 'Query',
	    predicate: this.predicate,
	    type: this.type,
	    nodes: this.nodes,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return queryExports;
}

var featureExports = {};
var feature = {
  get exports(){ return featureExports; },
  set exports(v){ featureExports = v; },
};

var hasRequiredFeature;

function requireFeature () {
	if (hasRequiredFeature) return featureExports;
	hasRequiredFeature = 1;
	/*!
	 * Stylus - Feature
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Feature` with the given `segs`.
	 *
	 * @param {Array} segs
	 * @api public
	 */

	var Feature = feature.exports = function Feature(segs){
	  Node.call(this);
	  this.segments = segs;
	  this.expr = null;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Feature.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Feature.prototype.clone = function(parent){
	  var clone = new Feature;
	  clone.segments = this.segments.map(function(node){ return node.clone(parent, clone); });
	  if (this.expr) clone.expr = this.expr.clone(parent, clone);
	  if (this.name) clone.name = this.name;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return "<ident>" or "(<ident>: <expr>)"
	 *
	 * @return {String}
	 * @api public
	 */

	Feature.prototype.toString = function(){
	  if (this.expr) {
	    return '(' + this.segments.join('') + ': ' + this.expr.toString() + ')';
	  } else {
	    return this.segments.join('');
	  }
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Feature.prototype.toJSON = function(){
	  var json = {
	    __type: 'Feature',
	    segments: this.segments,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	  if (this.expr) json.expr = this.expr;
	  if (this.name) json.name = this.name;
	  return json;
	};
	return featureExports;
}

var paramsExports = {};
var params = {
  get exports(){ return paramsExports; },
  set exports(v){ paramsExports = v; },
};

var hasRequiredParams;

function requireParams () {
	if (hasRequiredParams) return paramsExports;
	hasRequiredParams = 1;
	/*!
	 * Stylus - Params
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Params` with `name`, `params`, and `body`.
	 *
	 * @param {String} name
	 * @param {Params} params
	 * @param {Expression} body
	 * @api public
	 */

	var Params = params.exports = function Params(){
	  Node.call(this);
	  this.nodes = [];
	};

	/**
	 * Check function arity.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Params.prototype.__defineGetter__('length', function(){
	  return this.nodes.length;
	});

	/**
	 * Inherit from `Node.prototype`.
	 */

	Params.prototype.__proto__ = Node.prototype;

	/**
	 * Push the given `node`.
	 *
	 * @param {Node} node
	 * @api public
	 */

	Params.prototype.push = function(node){
	  this.nodes.push(node);
	};

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Params.prototype.clone = function(parent){
	  var clone = new Params;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  this.nodes.forEach(function(node){
	    clone.push(node.clone(parent, clone));
	  });
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Params.prototype.toJSON = function(){
	  return {
	    __type: 'Params',
	    nodes: this.nodes,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return paramsExports;
}

var commentExports = {};
var comment = {
  get exports(){ return commentExports; },
  set exports(v){ commentExports = v; },
};

var hasRequiredComment;

function requireComment () {
	if (hasRequiredComment) return commentExports;
	hasRequiredComment = 1;
	/*!
	 * Stylus - Comment
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Comment` with the given `str`.
	 *
	 * @param {String} str
	 * @param {Boolean} suppress
	 * @param {Boolean} inline
	 * @api public
	 */

	var Comment = comment.exports = function Comment(str, suppress, inline){
	  Node.call(this);
	  this.str = str;
	  this.suppress = suppress;
	  this.inline = inline;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Comment.prototype.__proto__ = Node.prototype;

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Comment.prototype.toJSON = function(){
	  return {
	    __type: 'Comment',
	    str: this.str,
	    suppress: this.suppress,
	    inline: this.inline,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};

	/**
	 * Return comment.
	 *
	 * @return {String}
	 * @api public
	 */

	Comment.prototype.toString = function(){
	  return this.str;
	};
	return commentExports;
}

var keyframesExports = {};
var keyframes = {
  get exports(){ return keyframesExports; },
  set exports(v){ keyframesExports = v; },
};

var hasRequiredKeyframes;

function requireKeyframes () {
	if (hasRequiredKeyframes) return keyframesExports;
	hasRequiredKeyframes = 1;
	/*!
	 * Stylus - Keyframes
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Atrule = requireAtrule();

	/**
	 * Initialize a new `Keyframes` with the given `segs`,
	 * and optional vendor `prefix`.
	 *
	 * @param {Array} segs
	 * @param {String} prefix
	 * @api public
	 */

	var Keyframes = keyframes.exports = function Keyframes(segs, prefix){
	  Atrule.call(this, 'keyframes');
	  this.segments = segs;
	  this.prefix = prefix || 'official';
	};

	/**
	 * Inherit from `Atrule.prototype`.
	 */

	Keyframes.prototype.__proto__ = Atrule.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Keyframes.prototype.clone = function(parent){
	  var clone = new Keyframes;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  clone.segments = this.segments.map(function(node) { return node.clone(parent, clone); });
	  clone.prefix = this.prefix;
	  clone.block = this.block.clone(parent, clone);
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Keyframes.prototype.toJSON = function(){
	  return {
	    __type: 'Keyframes',
	    segments: this.segments,
	    prefix: this.prefix,
	    block: this.block,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};

	/**
	 * Return `@keyframes name`.
	 *
	 * @return {String}
	 * @api public
	 */

	Keyframes.prototype.toString = function(){
	  return '@keyframes ' + this.segments.join('');
	};
	return keyframesExports;
}

var memberExports = {};
var member = {
  get exports(){ return memberExports; },
  set exports(v){ memberExports = v; },
};

var hasRequiredMember;

function requireMember () {
	if (hasRequiredMember) return memberExports;
	hasRequiredMember = 1;
	/*!
	 * Stylus - Member
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Member` with `left` and `right`.
	 *
	 * @param {Node} left
	 * @param {Node} right
	 * @api public
	 */

	var Member = member.exports = function Member(left, right){
	  Node.call(this);
	  this.left = left;
	  this.right = right;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Member.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 *
	 * @return {Node}
	 * @api public
	 */

	Member.prototype.clone = function(parent){
	  var clone = new Member;
	  clone.left = this.left.clone(parent, clone);
	  clone.right = this.right.clone(parent, clone);
	  if (this.val) clone.val = this.val.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Member.prototype.toJSON = function(){
	  var json = {
	    __type: 'Member',
	    left: this.left,
	    right: this.right,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	  if (this.val) json.val = this.val;
	  return json;
	};

	/**
	 * Return a string representation of this node.
	 *
	 * @return {String}
	 * @api public
	 */

	Member.prototype.toString = function(){
	  return this.left.toString()
	    + '.' + this.right.toString();
	};
	return memberExports;
}

var charsetExports = {};
var charset = {
  get exports(){ return charsetExports; },
  set exports(v){ charsetExports = v; },
};

var hasRequiredCharset;

function requireCharset () {
	if (hasRequiredCharset) return charsetExports;
	hasRequiredCharset = 1;
	/*!
	 * Stylus - Charset
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Charset` with the given `val`
	 *
	 * @param {String} val
	 * @api public
	 */

	var Charset = charset.exports = function Charset(val){
	  Node.call(this);
	  this.val = val;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Charset.prototype.__proto__ = Node.prototype;

	/**
	 * Return @charset "val".
	 *
	 * @return {String}
	 * @api public
	 */

	Charset.prototype.toString = function(){
	  return '@charset ' + this.val;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Charset.prototype.toJSON = function(){
	  return {
	    __type: 'Charset',
	    val: this.val,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return charsetExports;
}

var namespaceExports = {};
var namespace = {
  get exports(){ return namespaceExports; },
  set exports(v){ namespaceExports = v; },
};

/*!
 * Stylus - Namespace
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

var hasRequiredNamespace;

function requireNamespace () {
	if (hasRequiredNamespace) return namespaceExports;
	hasRequiredNamespace = 1;
	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Namespace` with the given `val` and `prefix`
	 *
	 * @param {String|Call} val
	 * @param {String} [prefix]
	 * @api public
	 */

	var Namespace = namespace.exports = function Namespace(val, prefix){
	  Node.call(this);
	  this.val = val;
	  this.prefix = prefix;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Namespace.prototype.__proto__ = Node.prototype;

	/**
	 * Return @namespace "val".
	 *
	 * @return {String}
	 * @api public
	 */

	Namespace.prototype.toString = function(){
	  return '@namespace ' + (this.prefix ? this.prefix + ' ' : '') + this.val;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Namespace.prototype.toJSON = function(){
	  return {
	    __type: 'Namespace',
	    val: this.val,
	    prefix: this.prefix,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return namespaceExports;
}

var _importExports = {};
var _import = {
  get exports(){ return _importExports; },
  set exports(v){ _importExports = v; },
};

var hasRequired_import;

function require_import () {
	if (hasRequired_import) return _importExports;
	hasRequired_import = 1;
	/*!
	 * Stylus - Import
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Import` with the given `expr`.
	 *
	 * @param {Expression} expr
	 * @api public
	 */

	var Import = _import.exports = function Import(expr, once){
	  Node.call(this);
	  this.path = expr;
	  this.once = once || false;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Import.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 *
	 * @return {Node}
	 * @api public
	 */

	Import.prototype.clone = function(parent){
	  var clone = new Import();
	  clone.path = this.path.nodeName ? this.path.clone(parent, clone) : this.path;
	  clone.once = this.once;
	  clone.mtime = this.mtime;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Import.prototype.toJSON = function(){
	  return {
	    __type: 'Import',
	    path: this.path,
	    once: this.once,
	    mtime: this.mtime,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return _importExports;
}

var extendExports = {};
var extend = {
  get exports(){ return extendExports; },
  set exports(v){ extendExports = v; },
};

var hasRequiredExtend;

function requireExtend () {
	if (hasRequiredExtend) return extendExports;
	hasRequiredExtend = 1;
	/*!
	 * Stylus - Extend
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Extend` with the given `selectors` array.
	 *
	 * @param {Array} selectors array of the selectors
	 * @api public
	 */

	var Extend = extend.exports = function Extend(selectors){
	  Node.call(this);
	  this.selectors = selectors;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Extend.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Extend.prototype.clone = function(){
	  return new Extend(this.selectors);
	};

	/**
	 * Return `@extend selectors`.
	 *
	 * @return {String}
	 * @api public
	 */

	Extend.prototype.toString = function(){
	  return '@extend ' + this.selectors.join(', ');
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Extend.prototype.toJSON = function(){
	  return {
	    __type: 'Extend',
	    selectors: this.selectors,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return extendExports;
}

var objectExports = {};
var object = {
  get exports(){ return objectExports; },
  set exports(v){ objectExports = v; },
};

var hasRequiredObject;

function requireObject () {
	if (hasRequiredObject) return objectExports;
	hasRequiredObject = 1;
	/*!
	 * Stylus - Object
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  , nodes = requireNodes()
	  , nativeObj = {}.constructor;

	/**
	 * Initialize a new `Object`.
	 *
	 * @api public
	 */

	var Object = object.exports = function Object(){
	  Node.call(this);
	  this.vals = {};
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Object.prototype.__proto__ = Node.prototype;

	/**
	 * Set `key` to `val`.
	 *
	 * @param {String} key
	 * @param {Node} val
	 * @return {Object} for chaining
	 * @api public
	 */

	Object.prototype.set = function(key, val){
	  this.vals[key] = val;
	  return this;
	};

	/**
	 * Return length.
	 *
	 * @return {Number}
	 * @api public
	 */

	Object.prototype.__defineGetter__('length', function() {
	  return nativeObj.keys(this.vals).length;
	});

	/**
	 * Get `key`.
	 *
	 * @param {String} key
	 * @return {Node}
	 * @api public
	 */

	Object.prototype.get = function(key){
	  return this.vals[key] || nodes.null;
	};

	/**
	 * Has `key`?
	 *
	 * @param {String} key
	 * @return {Boolean}
	 * @api public
	 */

	Object.prototype.has = function(key){
	  return key in this.vals;
	};

	/**
	 * Operate on `right` with the given `op`.
	 *
	 * @param {String} op
	 * @param {Node} right
	 * @return {Node}
	 * @api public
	 */

	Object.prototype.operate = function(op, right){
	  switch (op) {
	    case '.':
	    case '[]':
	      return this.get(right.hash);
	    case '==':
	      var vals = this.vals
	        , a
	        , b;
	      if ('object' != right.nodeName || this.length != right.length)
	        return nodes.false;
	      for (var key in vals) {
	        a = vals[key];
	        b = right.vals[key];
	        if (a.operate(op, b).isFalse)
	          return nodes.false;
	      }
	      return nodes.true;
	    case '!=':
	      return this.operate('==', right).negate();
	    default:
	      return Node.prototype.operate.call(this, op, right);
	  }
	};

	/**
	 * Return Boolean based on the length of this object.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Object.prototype.toBoolean = function(){
	  return nodes.Boolean(this.length);
	};

	/**
	 * Convert object to string with properties.
	 *
	 * @return {String}
	 * @api private
	 */

	Object.prototype.toBlock = function(){
	  var str = '{'
	    , key
	    , val;
	  for (key in this.vals) {
	    val = this.get(key);
	    if ('object' == val.first.nodeName) {
	      str += key + ' ' + val.first.toBlock();
	    } else {
	      switch (key) {
	        case '@charset':
	          str += key + ' ' + val.first.toString() + ';';
	          break;
	        default:
	          str += key + ':' + toString(val) + ';';
	      }
	    }
	  }
	  str += '}';
	  return str;

	  function toString(node) {
	    if (node.nodes) {
	      return node.nodes.map(toString).join(node.isList ? ',' : ' ');
	    } else if ('literal' == node.nodeName && ',' == node.val) {
	      return '\\,';
	    }
	    return node.toString();
	  }
	};

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Object.prototype.clone = function(parent){
	  var clone = new Object;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  for (var key in this.vals) {
	    clone.vals[key] = this.vals[key].clone(parent, clone);
	  }
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Object.prototype.toJSON = function(){
	  return {
	    __type: 'Object',
	    vals: this.vals,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};

	/**
	 * Return "{ <prop>: <val> }"
	 *
	 * @return {String}
	 * @api public
	 */

	Object.prototype.toString = function(){
	  var obj = {};
	  for (var prop in this.vals) {
	    obj[prop] = this.vals[prop].toString();
	  }
	  return JSON.stringify(obj);
	};
	return objectExports;
}

var _functionExports = {};
var _function = {
  get exports(){ return _functionExports; },
  set exports(v){ _functionExports = v; },
};

var hasRequired_function;

function require_function () {
	if (hasRequired_function) return _functionExports;
	hasRequired_function = 1;
	/*!
	 * Stylus - Function
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Function` with `name`, `params`, and `body`.
	 *
	 * @param {String} name
	 * @param {Params|Function} params
	 * @param {Block} body
	 * @api public
	 */

	var Function = _function.exports = function Function(name, params, body){
	  Node.call(this);
	  this.name = name;
	  this.params = params;
	  this.block = body;
	  if ('function' == typeof params) this.fn = params;
	};

	/**
	 * Check function arity.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Function.prototype.__defineGetter__('arity', function(){
	  return this.params.length;
	});

	/**
	 * Inherit from `Node.prototype`.
	 */

	Function.prototype.__proto__ = Node.prototype;

	/**
	 * Return hash.
	 *
	 * @return {String}
	 * @api public
	 */

	Function.prototype.__defineGetter__('hash', function(){
	  return 'function ' + this.name;
	});

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Function.prototype.clone = function(parent){
	  if (this.fn) {
	    var clone = new Function(
	        this.name
	      , this.fn);
	  } else {
	    var clone = new Function(this.name);
	    clone.params = this.params.clone(parent, clone);
	    clone.block = this.block.clone(parent, clone);
	  }
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return <name>(param1, param2, ...).
	 *
	 * @return {String}
	 * @api public
	 */

	Function.prototype.toString = function(){
	  if (this.fn) {
	    return this.name
	      + '('
	      + this.fn.toString()
	        .match(/^function *\w*\((.*?)\)/)
	        .slice(1)
	        .join(', ')
	      + ')';
	  } else {
	    return this.name
	      + '('
	      + this.params.nodes.join(', ')
	      + ')';
	  }
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Function.prototype.toJSON = function(){
	  var json = {
	    __type: 'Function',
	    name: this.name,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	  if (this.fn) {
	    json.fn = this.fn;
	  } else {
	    json.params = this.params;
	    json.block = this.block;
	  }
	  return json;
	};
	return _functionExports;
}

var propertyExports = {};
var property = {
  get exports(){ return propertyExports; },
  set exports(v){ propertyExports = v; },
};

var hasRequiredProperty;

function requireProperty () {
	if (hasRequiredProperty) return propertyExports;
	hasRequiredProperty = 1;
	/*!
	 * Stylus - Property
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `Property` with the given `segs` and optional `expr`.
	 *
	 * @param {Array} segs
	 * @param {Expression} expr
	 * @api public
	 */

	var Property = property.exports = function Property(segs, expr){
	  Node.call(this);
	  this.segments = segs;
	  this.expr = expr;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Property.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Property.prototype.clone = function(parent){
	  var clone = new Property(this.segments);
	  clone.name = this.name;
	  if (this.literal) clone.literal = this.literal;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  clone.segments = this.segments.map(function(node){ return node.clone(parent, clone); });
	  if (this.expr) clone.expr = this.expr.clone(parent, clone);
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Property.prototype.toJSON = function(){
	  var json = {
	    __type: 'Property',
	    segments: this.segments,
	    name: this.name,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	  if (this.expr) json.expr = this.expr;
	  if (this.literal) json.literal = this.literal;
	  return json;
	};

	/**
	 * Return string representation of this node.
	 *
	 * @return {String}
	 * @api public
	 */

	Property.prototype.toString = function(){
	  return 'property(' + this.segments.join('') + ', ' + this.expr + ')';
	};

	/**
	 * Operate on the property expression.
	 *
	 * @param {String} op
	 * @param {Node} right
	 * @return {Node}
	 * @api public
	 */

	Property.prototype.operate = function(op, right, val){
	  return this.expr.operate(op, right, val);
	};
	return propertyExports;
}

var selectorExports = {};
var selector = {
  get exports(){ return selectorExports; },
  set exports(v){ selectorExports = v; },
};

var hasRequiredSelector;

function requireSelector () {
	if (hasRequiredSelector) return selectorExports;
	hasRequiredSelector = 1;
	/*!
	 * Stylus - Selector
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	requireBlock()
	  ; var Node = requireNode();

	/**
	 * Initialize a new `Selector` with the given `segs`.
	 *
	 * @param {Array} segs
	 * @api public
	 */

	var Selector = selector.exports = function Selector(segs){
	  Node.call(this);
	  this.inherits = true;
	  this.segments = segs;
	  this.optional = false;
	};

	/**
	 * Inherit from `Node.prototype`.
	 */

	Selector.prototype.__proto__ = Node.prototype;

	/**
	 * Return the selector string.
	 *
	 * @return {String}
	 * @api public
	 */

	Selector.prototype.toString = function(){
	  return this.segments.join('') + (this.optional ? ' !optional' : '');
	};

	/**
	 * Check if this is placeholder selector.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Selector.prototype.__defineGetter__('isPlaceholder', function(){
	  return this.val && ~this.val.substr(0, 2).indexOf('$');
	});

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Selector.prototype.clone = function(parent){
	  var clone = new Selector;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  clone.inherits = this.inherits;
	  clone.val = this.val;
	  clone.segments = this.segments.map(function(node){ return node.clone(parent, clone); });
	  clone.optional = this.optional;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Selector.prototype.toJSON = function(){
	  return {
	    __type: 'Selector',
	    inherits: this.inherits,
	    segments: this.segments,
	    optional: this.optional,
	    val: this.val,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};
	return selectorExports;
}

var expressionExports = {};
var expression = {
  get exports(){ return expressionExports; },
  set exports(v){ expressionExports = v; },
};

var hasRequiredExpression;

function requireExpression () {
	if (hasRequiredExpression) return expressionExports;
	hasRequiredExpression = 1;
	/*!
	 * Stylus - Expression
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	var Node = requireNode()
	  , nodes = requireNodes()
	  , utils = requireUtils();

	/**
	 * Initialize a new `Expression`.
	 *
	 * @param {Boolean} isList
	 * @api public
	 */

	var Expression = expression.exports = function Expression(isList){
	  Node.call(this);
	  this.nodes = [];
	  this.isList = isList;
	};

	/**
	 * Check if the variable has a value.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Expression.prototype.__defineGetter__('isEmpty', function(){
	  return !this.nodes.length;
	});

	/**
	 * Return the first node in this expression.
	 *
	 * @return {Node}
	 * @api public
	 */

	Expression.prototype.__defineGetter__('first', function(){
	  return this.nodes[0]
	    ? this.nodes[0].first
	    : nodes.null;
	});

	/**
	 * Hash all the nodes in order.
	 *
	 * @return {String}
	 * @api public
	 */

	Expression.prototype.__defineGetter__('hash', function(){
	  return this.nodes.map(function(node){
	    return node.hash;
	  }).join('::');
	});

	/**
	 * Inherit from `Node.prototype`.
	 */

	Expression.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 * 
	 * @return {Node}
	 * @api public
	 */

	Expression.prototype.clone = function(parent){
	  var clone = new this.constructor(this.isList);
	  clone.preserve = this.preserve;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  clone.nodes = this.nodes.map(function(node) {
	    return node.clone(parent, clone);
	  });
	  return clone;
	};

	/**
	 * Push the given `node`.
	 *
	 * @param {Node} node
	 * @api public
	 */

	Expression.prototype.push = function(node){
	  this.nodes.push(node);
	};

	/**
	 * Operate on `right` with the given `op`.
	 *
	 * @param {String} op
	 * @param {Node} right
	 * @return {Node}
	 * @api public
	 */

	Expression.prototype.operate = function(op, right, val){
	  switch (op) {
	    case '[]=':
	      var self = this
	        , range = utils.unwrap(right).nodes
	        , val = utils.unwrap(val)
	        , len
	        , node;
	      range.forEach(function(unit){
	        len = self.nodes.length;
	        if ('unit' == unit.nodeName) {
	          var i = unit.val < 0 ? len + unit.val : unit.val
	            , n = i;
	          while (i-- > len) self.nodes[i] = nodes.null;
	          self.nodes[n] = val;
	        } else if (unit.string) {
	          node = self.nodes[0];
	          if (node && 'object' == node.nodeName) node.set(unit.string, val.clone());
	        }
	      });
	      return val;
	    case '[]':
	      var expr = new nodes.Expression
	        , vals = utils.unwrap(this).nodes
	        , range = utils.unwrap(right).nodes
	        , node;
	      range.forEach(function(unit){
	        if ('unit' == unit.nodeName) {
	          node = vals[unit.val < 0 ? vals.length + unit.val : unit.val];
	        } else if ('object' == vals[0].nodeName) {
	          node = vals[0].get(unit.string);
	        }
	        if (node) expr.push(node);
	      });
	      return expr.isEmpty
	        ? nodes.null
	        : utils.unwrap(expr);
	    case '||':
	      return this.toBoolean().isTrue
	        ? this
	        : right;
	    case 'in':
	      return Node.prototype.operate.call(this, op, right);
	    case '!=':
	      return this.operate('==', right, val).negate();
	    case '==':
	      var len = this.nodes.length
	        , right = right.toExpression()
	        , a
	        , b;
	      if (len != right.nodes.length) return nodes.false;
	      for (var i = 0; i < len; ++i) {
	        a = this.nodes[i];
	        b = right.nodes[i];
	        if (a.operate(op, b).isTrue) continue;
	        return nodes.false;
	      }
	      return nodes.true;
	    default:
	      return this.first.operate(op, right, val);
	  }
	};

	/**
	 * Expressions with length > 1 are truthy,
	 * otherwise the first value's toBoolean()
	 * method is invoked.
	 *
	 * @return {Boolean}
	 * @api public
	 */

	Expression.prototype.toBoolean = function(){
	  if (this.nodes.length > 1) return nodes.true;
	  return this.first.toBoolean();
	};

	/**
	 * Return "<a> <b> <c>" or "<a>, <b>, <c>" if
	 * the expression represents a list.
	 *
	 * @return {String}
	 * @api public
	 */

	Expression.prototype.toString = function(){
	  return '(' + this.nodes.map(function(node){
	    return node.toString();
	  }).join(this.isList ? ', ' : ' ') + ')';
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Expression.prototype.toJSON = function(){
	  return {
	    __type: 'Expression',
	    isList: this.isList,
	    preserve: this.preserve,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename,
	    nodes: this.nodes
	  };
	};
	return expressionExports;
}

var _argumentsExports = {};
var _arguments = {
  get exports(){ return _argumentsExports; },
  set exports(v){ _argumentsExports = v; },
};

var hasRequired_arguments;

function require_arguments () {
	if (hasRequired_arguments) return _argumentsExports;
	hasRequired_arguments = 1;
	/*!
	 * Stylus - Arguments
	 * Copyright (c) Automattic <developer.wordpress.com>
	 * MIT Licensed
	 */

	/**
	 * Module dependencies.
	 */

	requireNode()
	  ; var nodes = requireNodes()
	  ; requireUtils();

	/**
	 * Initialize a new `Arguments`.
	 *
	 * @api public
	 */

	var Arguments = _arguments.exports = function Arguments(){
	  nodes.Expression.call(this);
	  this.map = {};
	};

	/**
	 * Inherit from `nodes.Expression.prototype`.
	 */

	Arguments.prototype.__proto__ = nodes.Expression.prototype;

	/**
	 * Initialize an `Arguments` object with the nodes
	 * from the given `expr`.
	 *
	 * @param {Expression} expr
	 * @return {Arguments}
	 * @api public
	 */

	Arguments.fromExpression = function(expr){
	  var args = new Arguments
	    , len = expr.nodes.length;
	  args.lineno = expr.lineno;
	  args.column = expr.column;
	  args.isList = expr.isList;
	  for (var i = 0; i < len; ++i) {
	    args.push(expr.nodes[i]);
	  }
	  return args;
	};

	/**
	 * Return a clone of this node.
	 *
	 * @return {Node}
	 * @api public
	 */

	Arguments.prototype.clone = function(parent){
	  var clone = nodes.Expression.prototype.clone.call(this, parent);
	  clone.map = {};
	  for (var key in this.map) {
	    clone.map[key] = this.map[key].clone(parent, clone);
	  }
	  clone.isList = this.isList;
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Arguments.prototype.toJSON = function(){
	  return {
	    __type: 'Arguments',
	    map: this.map,
	    isList: this.isList,
	    preserve: this.preserve,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename,
	    nodes: this.nodes
	  };
	};
	return _argumentsExports;
}

var atblockExports = {};
var atblock = {
  get exports(){ return atblockExports; },
  set exports(v){ atblockExports = v; },
};

/*!
 * Stylus - @block
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

var hasRequiredAtblock;

function requireAtblock () {
	if (hasRequiredAtblock) return atblockExports;
	hasRequiredAtblock = 1;
	/**
	 * Module dependencies.
	 */

	var Node = requireNode();

	/**
	 * Initialize a new `@block` node.
	 *
	 * @api public
	 */

	var Atblock = atblock.exports = function Atblock(){
	  Node.call(this);
	};

	/**
	 * Return `block` nodes.
	 */

	Atblock.prototype.__defineGetter__('nodes', function(){
	  return this.block.nodes;
	});

	/**
	 * Inherit from `Node.prototype`.
	 */

	Atblock.prototype.__proto__ = Node.prototype;

	/**
	 * Return a clone of this node.
	 *
	 * @return {Node}
	 * @api public
	 */

	Atblock.prototype.clone = function(parent){
	  var clone = new Atblock;
	  clone.block = this.block.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return @block.
	 *
	 * @return {String}
	 * @api public
	 */

	Atblock.prototype.toString = function(){
	  return '@block';
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Atblock.prototype.toJSON = function(){
	  return {
	    __type: 'Atblock',
	    block: this.block,
	    lineno: this.lineno,
	    column: this.column,
	    fileno: this.fileno
	  };
	};
	return atblockExports;
}

var supportsExports = {};
var supports = {
  get exports(){ return supportsExports; },
  set exports(v){ supportsExports = v; },
};

/*!
 * Stylus - supports
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

var hasRequiredSupports;

function requireSupports () {
	if (hasRequiredSupports) return supportsExports;
	hasRequiredSupports = 1;
	/**
	 * Module dependencies.
	 */

	var Atrule = requireAtrule();

	/**
	 * Initialize a new supports node.
	 *
	 * @param {Expression} condition
	 * @api public
	 */

	var Supports = supports.exports = function Supports(condition){
	  Atrule.call(this, 'supports');
	  this.condition = condition;
	};

	/**
	 * Inherit from `Atrule.prototype`.
	 */

	Supports.prototype.__proto__ = Atrule.prototype;

	/**
	 * Return a clone of this node.
	 *
	 * @return {Node}
	 * @api public
	 */

	Supports.prototype.clone = function(parent){
	  var clone = new Supports;
	  clone.condition = this.condition.clone(parent, clone);
	  clone.block = this.block.clone(parent, clone);
	  clone.lineno = this.lineno;
	  clone.column = this.column;
	  clone.filename = this.filename;
	  return clone;
	};

	/**
	 * Return a JSON representation of this node.
	 *
	 * @return {Object}
	 * @api public
	 */

	Supports.prototype.toJSON = function(){
	  return {
	    __type: 'Supports',
	    condition: this.condition,
	    block: this.block,
	    lineno: this.lineno,
	    column: this.column,
	    filename: this.filename
	  };
	};

	/**
	 * Return @supports
	 *
	 * @return {String}
	 * @api public
	 */

	Supports.prototype.toString = function(){
	  return '@supports ' + this.condition;
	};
	return supportsExports;
}

var hasRequiredNodes;

function requireNodes () {
	if (hasRequiredNodes) return nodes;
	hasRequiredNodes = 1;
	(function (exports) {
		/*!
		 * Stylus - nodes
		 * Copyright (c) Automattic <developer.wordpress.com>
		 * MIT Licensed
		 */

		/**
		 * Constructors
		 */

		exports.Node = requireNode();
		exports.Root = requireRoot();
		exports.Null = require_null$1();
		exports.Each = requireEach();
		exports.If = require_if();
		exports.Call = requireCall();
		exports.UnaryOp = requireUnaryop();
		exports.BinOp = requireBinop();
		exports.Ternary = requireTernary();
		exports.Block = requireBlock();
		exports.Unit = requireUnit();
		exports.String = requireString();
		exports.HSLA = requireHsla();
		exports.RGBA = requireRgba();
		exports.Ident = requireIdent();
		exports.Group = requireGroup();
		exports.Literal = requireLiteral();
		exports.Boolean = requireBoolean();
		exports.Return = require_return();
		exports.Media = requireMedia();
		exports.QueryList = requireQueryList();
		exports.Query = requireQuery();
		exports.Feature = requireFeature();
		exports.Params = requireParams();
		exports.Comment = requireComment();
		exports.Keyframes = requireKeyframes();
		exports.Member = requireMember();
		exports.Charset = requireCharset();
		exports.Namespace = requireNamespace();
		exports.Import = require_import();
		exports.Extend = requireExtend();
		exports.Object = requireObject();
		exports.Function = require_function();
		exports.Property = requireProperty();
		exports.Selector = requireSelector();
		exports.Expression = requireExpression();
		exports.Arguments = require_arguments();
		exports.Atblock = requireAtblock();
		exports.Atrule = requireAtrule();
		exports.Supports = requireSupports();

		/**
		 * Singletons.
		 */

		exports.true = new exports.Boolean(true);
		exports.false = new exports.Boolean(false);
		exports.null = new exports.Null;
} (nodes));
	return nodes;
}

var errors = {};

/*!
 * Stylus - errors
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

/**
 * Expose constructors.
 */

errors.ParseError = ParseError;
errors.SyntaxError = SyntaxError;

/**
 * Inherit from `Error.prototype`.
 */

SyntaxError.prototype.__proto__ = Error.prototype;

/**
 * Initialize a new `ParseError` with the given `msg`.
 *
 * @param {String} msg
 * @api private
 */

function ParseError(msg) {
  this.name = 'ParseError';
  this.message = msg;
  Error.captureStackTrace(this, ParseError);
}

/**
 * Inherit from `Error.prototype`.
 */

ParseError.prototype.__proto__ = Error.prototype;

/**
 * Initialize a new `SyntaxError` with the given `msg`.
 *
 * @param {String} msg
 * @api private
 */

function SyntaxError(msg) {
  this.name = 'SyntaxError';
  this.message = msg;
  Error.captureStackTrace(this, ParseError);
}

/**
 * Inherit from `Error.prototype`.
 */

SyntaxError.prototype.__proto__ = Error.prototype;

var hasRequiredLexer;

function requireLexer () {
	if (hasRequiredLexer) return lexerExports;
	hasRequiredLexer = 1;
	(function (module, exports) {
		/*!
		 * Stylus - Lexer
		 * Copyright (c) Automattic <developer.wordpress.com>
		 * MIT Licensed
		 */

		/**
		 * Module dependencies.
		 */

		var Token = tokenExports
		  , nodes = requireNodes()
		  , errors$1 = errors;

		/**
		 * Expose `Lexer`.
		 */

		module.exports = Lexer;

		/**
		 * Operator aliases.
		 */

		var alias = {
		    'and': '&&'
		  , 'or': '||'
		  , 'is': '=='
		  , 'isnt': '!='
		  , 'is not': '!='
		  , ':=': '?='
		};

		/**
		 * Initialize a new `Lexer` with the given `str` and `options`.
		 *
		 * @param {String} str
		 * @param {Object} options
		 * @api private
		 */

		function Lexer(str, options) {
		  this.stash = [];
		  this.indentStack = [];
		  this.indentRe = null;
		  this.lineno = 1;
		  this.column = 1;

		  // HACK!
		  function comment(str, val, offset, s) {
		    var inComment = s.lastIndexOf('/*', offset) > s.lastIndexOf('*/', offset)
		      , commentIdx = s.lastIndexOf('//', offset)
		      , i = s.lastIndexOf('\n', offset)
		      , double = 0
		      , single = 0;

		    if (~commentIdx && commentIdx > i) {
		      while (i != offset) {
		        if ("'" == s[i]) single ? single-- : single++;
		        if ('"' == s[i]) double ? double-- : double++;

		        if ('/' == s[i] && '/' == s[i + 1]) {
		          inComment = !single && !double;
		          break;
		        }
		        ++i;
		      }
		    }

		    return inComment
		      ? str
		      : val + '\r';
		  }
		  // Remove UTF-8 BOM.
		  if ('\uFEFF' == str.charAt(0)) str = str.slice(1);

		  this.str = str
		    .replace(/\s+$/, '\n')
		    .replace(/\r\n?/g, '\n')
		    .replace(/\\ *\n/g, '\r')
		    .replace(/([,(:](?!\/\/[^ ])) *(?:\/\/[^\n]*|\/\*.*?\*\/)?\n\s*/g, comment)
		    .replace(/\s*\n[ \t]*([,)])/g, comment);
		}
		/**
		 * Lexer prototype.
		 */

		Lexer.prototype = {
		  
		  /**
		   * Custom inspect.
		   */
		  
		  inspect: function(){
		    var tok
		      , tmp = this.str
		      , buf = [];
		    while ('eos' != (tok = this.next()).type) {
		      buf.push(tok.inspect());
		    }
		    this.str = tmp;
		    return buf.concat(tok.inspect()).join('\n');
		  },

		  /**
		   * Lookahead `n` tokens.
		   *
		   * @param {Number} n
		   * @return {Object}
		   * @api private
		   */
		  
		  lookahead: function(n){
		    var fetch = n - this.stash.length;
		    while (fetch-- > 0) this.stash.push(this.advance());
		    return this.stash[--n];
		  },
		  
		  /**
		   * Consume the given `len`.
		   *
		   * @param {Number|Array} len
		   * @api private
		   */

		  skip: function(len){
		    var chunk = len[0];
		    len = chunk ? chunk.length : len;
		    this.str = this.str.substr(len);
		    if (chunk) {
		      this.move(chunk);
		    } else {
		      this.column += len;
		    }
		  },

		  /**
		   * Move current line and column position.
		   *
		   * @param {String} str
		   * @api private
		   */

		  move: function(str){
		    var lines = str.match(/\n/g)
		      , idx = str.lastIndexOf('\n');

		    if (lines) this.lineno += lines.length;
		    this.column = ~idx
		      ? str.length - idx
		      : this.column + str.length;
		  },

		  /**
		   * Fetch next token including those stashed by peek.
		   *
		   * @return {Token}
		   * @api private
		   */

		  next: function() {
		    var tok = this.stashed() || this.advance();
		    this.prev = tok;
		    return tok;
		  },

		  /**
		   * Check if the current token is a part of selector.
		   *
		   * @return {Boolean}
		   * @api private
		   */

		  isPartOfSelector: function() {
		    var tok = this.stash[this.stash.length - 1] || this.prev;
		    switch (tok && tok.type) {
		      // #for
		      case 'color':
		        return 2 == tok.val.raw.length;
		      // .or
		      case '.':
		      // [is]
		      case '[':
		        return true;
		    }
		    return false;
		  },

		  /**
		   * Fetch next token.
		   *
		   * @return {Token}
		   * @api private
		   */

		  advance: function() {
		    var column = this.column
		      , line = this.lineno
		      , tok = this.eos()
		      || this.null()
		      || this.sep()
		      || this.keyword()
		      || this.urlchars()
		      || this.comment()
		      || this.newline()
		      || this.escaped()
		      || this.important()
		      || this.literal()
		      || this.anonFunc()
		      || this.atrule()
		      || this.function()
		      || this.brace()
		      || this.paren()
		      || this.color()
		      || this.string()
		      || this.unit()
		      || this.namedop()
		      || this.boolean()
		      || this.unicode()
		      || this.ident()
		      || this.op()
		      || this.eol()
		      || this.space()
		      || this.selector();
		    tok.lineno = line;
		    tok.column = column;
		    return tok;
		  },

		  /**
		   * Lookahead a single token.
		   *
		   * @return {Token}
		   * @api private
		   */
		  
		  peek: function() {
		    return this.lookahead(1);
		  },
		  
		  /**
		   * Return the next possibly stashed token.
		   *
		   * @return {Token}
		   * @api private
		   */

		  stashed: function() {
		    return this.stash.shift();
		  },

		  /**
		   * EOS | trailing outdents.
		   */

		  eos: function() {
		    if (this.str.length) return;
		    if (this.indentStack.length) {
		      this.indentStack.shift();
		      return new Token('outdent');
		    } else {
		      return new Token('eos');
		    }
		  },

		  /**
		   * url char
		   */

		  urlchars: function() {
		    var captures;
		    if (!this.isURL) return;
		    if (captures = /^[\/:@.;?&=*!,<>#%0-9]+/.exec(this.str)) {
		      this.skip(captures);
		      return new Token('literal', new nodes.Literal(captures[0]));
		    }
		  },

		  /**
		   * ';' [ \t]*
		   */

		  sep: function() {
		    var captures;
		    if (captures = /^;[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      return new Token(';');
		    }
		  },

		  /**
		   * '\r'
		   */

		  eol: function() {
		    if ('\r' == this.str[0]) {
		      ++this.lineno;
		      this.skip(1);
		      return this.advance();
		    }
		  },
		  
		  /**
		   * ' '+
		   */

		  space: function() {
		    var captures;
		    if (captures = /^([ \t]+)/.exec(this.str)) {
		      this.skip(captures);
		      return new Token('space');
		    }
		  },
		  
		  /**
		   * '\\' . ' '*
		   */
		   
		  escaped: function() {
		    var captures;
		    if (captures = /^\\(.)[ \t]*/.exec(this.str)) {
		      var c = captures[1];
		      this.skip(captures);
		      return new Token('ident', new nodes.Literal(c));
		    }
		  },
		  
		  /**
		   * '@css' ' '* '{' .* '}' ' '*
		   */
		  
		  literal: function() {
		    // HACK attack !!!
		    var captures;
		    if (captures = /^@css[ \t]*\{/.exec(this.str)) {
		      this.skip(captures);
		      var c
		        , braces = 1
		        , css = ''
		        , node;
		      while (c = this.str[0]) {
		        this.str = this.str.substr(1);
		        switch (c) {
		          case '{': ++braces; break;
		          case '}': --braces; break;
		          case '\n':
		          case '\r':
		            ++this.lineno;
		            break;
		        }
		        css += c;
		        if (!braces) break;
		      }
		      css = css.replace(/\s*}$/, '');
		      node = new nodes.Literal(css);
		      node.css = true;
		      return new Token('literal', node);
		    }
		  },
		  
		  /**
		   * '!important' ' '*
		   */
		  
		  important: function() {
		    var captures;
		    if (captures = /^!important[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      return new Token('ident', new nodes.Literal('!important'));
		    }
		  },
		  
		  /**
		   * '{' | '}'
		   */
		  
		  brace: function() {
		    var captures;
		    if (captures = /^([{}])/.exec(this.str)) {
		      this.skip(1);
		      var brace = captures[1];
		      return new Token(brace, brace);
		    }
		  },
		  
		  /**
		   * '(' | ')' ' '*
		   */
		  
		  paren: function() {
		    var captures;
		    if (captures = /^([()])([ \t]*)/.exec(this.str)) {
		      var paren = captures[1];
		      this.skip(captures);
		      if (')' == paren) this.isURL = false;
		      var tok = new Token(paren, paren);
		      tok.space = captures[2];
		      return tok;
		    }
		  },
		  
		  /**
		   * 'null'
		   */
		  
		  null: function() {
		    var captures
		      , tok;
		    if (captures = /^(null)\b[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      if (this.isPartOfSelector()) {
		        tok = new Token('ident', new nodes.Ident(captures[0]));
		      } else {
		        tok = new Token('null', nodes.null);
		      }
		      return tok;
		    }
		  },
		  
		  /**
		   *   'if'
		   * | 'else'
		   * | 'unless'
		   * | 'return'
		   * | 'for'
		   * | 'in'
		   */
		  
		  keyword: function() {
		    var captures
		      , tok;
		    if (captures = /^(return|if|else|unless|for|in)\b[ \t]*/.exec(this.str)) {
		      var keyword = captures[1];
		      this.skip(captures);
		      if (this.isPartOfSelector()) {
		        tok = new Token('ident', new nodes.Ident(captures[0]));
		      } else {
		        tok = new Token(keyword, keyword);
		      }
		      return tok;
		    }
		  },
		  
		  /**
		   *   'not'
		   * | 'and'
		   * | 'or'
		   * | 'is'
		   * | 'is not'
		   * | 'isnt'
		   * | 'is a'
		   * | 'is defined'
		   */
		  
		  namedop: function() {
		    var captures
		      , tok;
		    if (captures = /^(not|and|or|is a|is defined|isnt|is not|is)(?!-)\b([ \t]*)/.exec(this.str)) {
		      var op = captures[1];
		      this.skip(captures);
		      if (this.isPartOfSelector()) {
		        tok = new Token('ident', new nodes.Ident(captures[0]));
		      } else {
		        op = alias[op] || op;
		        tok = new Token(op, op);
		      }
		      tok.space = captures[2];
		      return tok;
		    }
		  },

		  /**
		   *   ','
		   * | '+'
		   * | '+='
		   * | '-'
		   * | '-='
		   * | '*'
		   * | '*='
		   * | '/'
		   * | '/='
		   * | '%'
		   * | '%='
		   * | '**'
		   * | '!'
		   * | '&'
		   * | '&&'
		   * | '||'
		   * | '>'
		   * | '>='
		   * | '<'
		   * | '<='
		   * | '='
		   * | '=='
		   * | '!='
		   * | '!'
		   * | '~'
		   * | '?='
		   * | ':='
		   * | '?'
		   * | ':'
		   * | '['
		   * | ']'
		   * | '.'
		   * | '..'
		   * | '...'
		   */
		  
		  op: function() {
		    var captures;
		    if (captures = /^([.]{1,3}|&&|\|\||[!<>=?:]=|\*\*|[-+*\/%]=?|[,=?:!~<>&\[\]])([ \t]*)/.exec(this.str)) {
		      var op = captures[1];
		      this.skip(captures);
		      op = alias[op] || op;
		      var tok = new Token(op, op);
		      tok.space = captures[2];
		      this.isURL = false;
		      return tok;
		    }
		  },

		  /**
		   * '@('
		   */

		  anonFunc: function() {
		    var tok;
		    if ('@' == this.str[0] && '(' == this.str[1]) {
		      this.skip(2);
		      tok = new Token('function', new nodes.Ident('anonymous'));
		      tok.anonymous = true;
		      return tok;
		    }
		  },

		  /**
		   * '@' (-(\w+)-)?[a-zA-Z0-9-_]+
		   */

		  atrule: function() {
		    var captures;
		    if (captures = /^@(?:-(\w+)-)?([a-zA-Z0-9-_]+)[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      var vendor = captures[1]
		        , type = captures[2]
		        ;
		      switch (type) {
		        case 'require':
		        case 'import':
		        case 'charset':
		        case 'namespace':
		        case 'media':
		        case 'scope':
		        case 'supports':
		          return new Token(type);
		        case 'document':
		          return new Token('-moz-document');
		        case 'block':
		          return new Token('atblock');
		        case 'extend':
		        case 'extends':
		          return new Token('extend');
		        case 'keyframes':
		          return new Token(type, vendor);
		        default:
		          return new Token('atrule', (vendor ? '-' + vendor + '-' + type : type));
		      }
		    }
		  },

		  /**
		   * '//' *
		   */
		  
		  comment: function() {
		    // Single line
		    if ('/' == this.str[0] && '/' == this.str[1]) {
		      var end = this.str.indexOf('\n');
		      if (-1 == end) end = this.str.length;
		      this.skip(end);
		      return this.advance();
		    }

		    // Multi-line
		    if ('/' == this.str[0] && '*' == this.str[1]) {
		      var end = this.str.indexOf('*/');
		      if (-1 == end) end = this.str.length;
		      var str = this.str.substr(0, end + 2)
		        , lines = str.split(/\n|\r/).length - 1
		        , suppress = true
		        , inline = false;
		      this.lineno += lines;
		      this.skip(end + 2);
		      // output
		      if ('!' == str[2]) {
		        str = str.replace('*!', '*');
		        suppress = false;
		      }
		      if (this.prev && ';' == this.prev.type) inline = true;
		      return new Token('comment', new nodes.Comment(str, suppress, inline));
		    }
		  },

		  /**
		   * 'true' | 'false'
		   */
		  
		  boolean: function() {
		    var captures;
		    if (captures = /^(true|false)\b([ \t]*)/.exec(this.str)) {
		      var val = nodes.Boolean('true' == captures[1]);
		      this.skip(captures);
		      var tok = new Token('boolean', val);
		      tok.space = captures[2];
		      return tok;
		    }
		  },

		  /**
		   * 'U+' [0-9A-Fa-f?]{1,6}(?:-[0-9A-Fa-f]{1,6})?
		   */

		  unicode: function() {
		    var captures;
		    if (captures = /^u\+[0-9a-f?]{1,6}(?:-[0-9a-f]{1,6})?/i.exec(this.str)) {
		      this.skip(captures);
		      return new Token('literal', new nodes.Literal(captures[0]));
		    }
		  },

		  /**
		   * -*[_a-zA-Z$] [-\w\d$]* '('
		   */
		  
		  function: function() {
		    var captures;
		    if (captures = /^(-*[_a-zA-Z$][-\w\d$]*)\(([ \t]*)/.exec(this.str)) {
		      var name = captures[1];
		      this.skip(captures);
		      this.isURL = 'url' == name;
		      var tok = new Token('function', new nodes.Ident(name));
		      tok.space = captures[2];
		      return tok;
		    } 
		  },

		  /**
		   * -*[_a-zA-Z$] [-\w\d$]*
		   */
		  
		  ident: function() {
		    var captures;
		    if (captures = /^-*[_a-zA-Z$][-\w\d$]*/.exec(this.str)) {
		      this.skip(captures);
		      return new Token('ident', new nodes.Ident(captures[0]));
		    }
		  },

		  /**
		   * '\n' ' '+
		   */

		  newline: function() {
		    var captures, re;

		    // we have established the indentation regexp
		    if (this.indentRe){
		      captures = this.indentRe.exec(this.str);
		    // figure out if we are using tabs or spaces
		    } else {
		      // try tabs
		      re = /^\n([\t]*)[ \t]*/;
		      captures = re.exec(this.str);

		      // nope, try spaces
		      if (captures && !captures[1].length) {
		        re = /^\n([ \t]*)/;
		        captures = re.exec(this.str);
		      }

		      // established
		      if (captures && captures[1].length) this.indentRe = re;
		    }


		    if (captures) {
		      var tok
		        , indents = captures[1].length;

		      this.skip(captures);
		      if (this.str[0] === ' ' || this.str[0] === '\t') {
		        throw new errors$1.SyntaxError('Invalid indentation. You can use tabs or spaces to indent, but not both.');
		      }

		      // Blank line
		      if ('\n' == this.str[0]) return this.advance();

		      // Outdent
		      if (this.indentStack.length && indents < this.indentStack[0]) {
		        while (this.indentStack.length && this.indentStack[0] > indents) {
		          this.stash.push(new Token('outdent'));
		          this.indentStack.shift();
		        }
		        tok = this.stash.pop();
		      // Indent
		      } else if (indents && indents != this.indentStack[0]) {
		        this.indentStack.unshift(indents);
		        tok = new Token('indent');
		      // Newline
		      } else {
		        tok = new Token('newline');
		      }

		      return tok;
		    }
		  },

		  /**
		   * '-'? (digit+ | digit* '.' digit+) unit
		   */

		  unit: function() {
		    var captures;
		    if (captures = /^(-)?(\d+\.\d+|\d+|\.\d+)(%|[a-zA-Z]+)?[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      var n = parseFloat(captures[2]);
		      if ('-' == captures[1]) n = -n;
		      var node = new nodes.Unit(n, captures[3]);
		      node.raw = captures[0];
		      return new Token('unit', node);
		    }
		  },

		  /**
		   * '"' [^"]+ '"' | "'"" [^']+ "'"
		   */

		  string: function() {
		    var captures;
		    if (captures = /^("[^"]*"|'[^']*')[ \t]*/.exec(this.str)) {
		      var str = captures[1]
		        , quote = captures[0][0];
		      this.skip(captures);
		      str = str.slice(1,-1).replace(/\\n/g, '\n');
		      return new Token('string', new nodes.String(str, quote));
		    }
		  },

		  /**
		   * #rrggbbaa | #rrggbb | #rgba | #rgb | #nn | #n
		   */

		  color: function() {
		    return this.rrggbbaa()
		      || this.rrggbb()
		      || this.rgba()
		      || this.rgb()
		      || this.nn()
		      || this.n()
		  },

		  /**
		   * #n
		   */
		  
		  n: function() {
		    var captures;
		    if (captures = /^#([a-fA-F0-9]{1})[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      var n = parseInt(captures[1] + captures[1], 16)
		        , color = new nodes.RGBA(n, n, n, 1);
		      color.raw = captures[0];
		      return new Token('color', color); 
		    }
		  },

		  /**
		   * #nn
		   */
		  
		  nn: function() {
		    var captures;
		    if (captures = /^#([a-fA-F0-9]{2})[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      var n = parseInt(captures[1], 16)
		        , color = new nodes.RGBA(n, n, n, 1);
		      color.raw = captures[0];
		      return new Token('color', color); 
		    }
		  },

		  /**
		   * #rgb
		   */
		  
		  rgb: function() {
		    var captures;
		    if (captures = /^#([a-fA-F0-9]{3})[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      var rgb = captures[1]
		        , r = parseInt(rgb[0] + rgb[0], 16)
		        , g = parseInt(rgb[1] + rgb[1], 16)
		        , b = parseInt(rgb[2] + rgb[2], 16)
		        , color = new nodes.RGBA(r, g, b, 1);
		      color.raw = captures[0];
		      return new Token('color', color); 
		    }
		  },
		  
		  /**
		   * #rgba
		   */
		  
		  rgba: function() {
		    var captures;
		    if (captures = /^#([a-fA-F0-9]{4})[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      var rgb = captures[1]
		        , r = parseInt(rgb[0] + rgb[0], 16)
		        , g = parseInt(rgb[1] + rgb[1], 16)
		        , b = parseInt(rgb[2] + rgb[2], 16)
		        , a = parseInt(rgb[3] + rgb[3], 16)
		        , color = new nodes.RGBA(r, g, b, a/255);
		      color.raw = captures[0];
		      return new Token('color', color); 
		    }
		  },
		  
		  /**
		   * #rrggbb
		   */
		  
		  rrggbb: function() {
		    var captures;
		    if (captures = /^#([a-fA-F0-9]{6})[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      var rgb = captures[1]
		        , r = parseInt(rgb.substr(0, 2), 16)
		        , g = parseInt(rgb.substr(2, 2), 16)
		        , b = parseInt(rgb.substr(4, 2), 16)
		        , color = new nodes.RGBA(r, g, b, 1);
		      color.raw = captures[0];
		      return new Token('color', color); 
		    }
		  },
		  
		  /**
		   * #rrggbbaa
		   */
		  
		  rrggbbaa: function() {
		    var captures;
		    if (captures = /^#([a-fA-F0-9]{8})[ \t]*/.exec(this.str)) {
		      this.skip(captures);
		      var rgb = captures[1]
		        , r = parseInt(rgb.substr(0, 2), 16)
		        , g = parseInt(rgb.substr(2, 2), 16)
		        , b = parseInt(rgb.substr(4, 2), 16)
		        , a = parseInt(rgb.substr(6, 2), 16)
		        , color = new nodes.RGBA(r, g, b, a/255);
		      color.raw = captures[0];
		      return new Token('color', color); 
		    }
		  },
		  
		  /**
		   * ^|[^\n,;]+
		   */
		  
		  selector: function() {
		    var captures;
		    if (captures = /^\^|.*?(?=\/\/(?![^\[]*\])|[,\n{])/.exec(this.str)) {
		      var selector = captures[0];
		      this.skip(captures);
		      return new Token('selector', selector);
		    }
		  }
		};
} (lexer));
	return lexerExports;
}

var cacheExports = {};
var cache = {
  get exports(){ return cacheExports; },
  set exports(v){ cacheExports = v; },
};

var memoryExports = {};
var memory = {
  get exports(){ return memoryExports; },
  set exports(v){ memoryExports = v; },
};

var sha1Exports = {};
var sha1 = {
  get exports(){ return sha1Exports; },
  set exports(v){ sha1Exports = v; },
};

var coreExports = {};
var core = {
  get exports(){ return coreExports; },
  set exports(v){ coreExports = v; },
};

var hasRequiredCore;

function requireCore () {
	if (hasRequiredCore) return coreExports;
	hasRequiredCore = 1;
	(function (module, exports) {
(function (root, factory) {
			{
				// CommonJS
				module.exports = factory();
			}
		}(commonjsGlobal, function () {

			/*globals window, global, require*/

			/**
			 * CryptoJS core components.
			 */
			var CryptoJS = CryptoJS || (function (Math, undefined$1) {

			    var crypto;

			    // Native crypto from window (Browser)
			    if (typeof window !== 'undefined' && window.crypto) {
			        crypto = window.crypto;
			    }

			    // Native crypto in web worker (Browser)
			    if (typeof self !== 'undefined' && self.crypto) {
			        crypto = self.crypto;
			    }

			    // Native crypto from worker
			    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
			        crypto = globalThis.crypto;
			    }

			    // Native (experimental IE 11) crypto from window (Browser)
			    if (!crypto && typeof window !== 'undefined' && window.msCrypto) {
			        crypto = window.msCrypto;
			    }

			    // Native crypto from global (NodeJS)
			    if (!crypto && typeof commonjsGlobal !== 'undefined' && commonjsGlobal.crypto) {
			        crypto = commonjsGlobal.crypto;
			    }

			    // Native crypto import via require (NodeJS)
			    if (!crypto && typeof commonjsRequire === 'function') {
			        try {
			            crypto = require$$0$1;
			        } catch (err) {}
			    }

			    /*
			     * Cryptographically secure pseudorandom number generator
			     *
			     * As Math.random() is cryptographically not safe to use
			     */
			    var cryptoSecureRandomInt = function () {
			        if (crypto) {
			            // Use getRandomValues method (Browser)
			            if (typeof crypto.getRandomValues === 'function') {
			                try {
			                    return crypto.getRandomValues(new Uint32Array(1))[0];
			                } catch (err) {}
			            }

			            // Use randomBytes method (NodeJS)
			            if (typeof crypto.randomBytes === 'function') {
			                try {
			                    return crypto.randomBytes(4).readInt32LE();
			                } catch (err) {}
			            }
			        }

			        throw new Error('Native crypto module could not be used to get secure random number.');
			    };

			    /*
			     * Local polyfill of Object.create

			     */
			    var create = Object.create || (function () {
			        function F() {}

			        return function (obj) {
			            var subtype;

			            F.prototype = obj;

			            subtype = new F();

			            F.prototype = null;

			            return subtype;
			        };
			    }());

			    /**
			     * CryptoJS namespace.
			     */
			    var C = {};

			    /**
			     * Library namespace.
			     */
			    var C_lib = C.lib = {};

			    /**
			     * Base object for prototypal inheritance.
			     */
			    var Base = C_lib.Base = (function () {


			        return {
			            /**
			             * Creates a new object that inherits from this object.
			             *
			             * @param {Object} overrides Properties to copy into the new object.
			             *
			             * @return {Object} The new object.
			             *
			             * @static
			             *
			             * @example
			             *
			             *     var MyType = CryptoJS.lib.Base.extend({
			             *         field: 'value',
			             *
			             *         method: function () {
			             *         }
			             *     });
			             */
			            extend: function (overrides) {
			                // Spawn
			                var subtype = create(this);

			                // Augment
			                if (overrides) {
			                    subtype.mixIn(overrides);
			                }

			                // Create default initializer
			                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
			                    subtype.init = function () {
			                        subtype.$super.init.apply(this, arguments);
			                    };
			                }

			                // Initializer's prototype is the subtype object
			                subtype.init.prototype = subtype;

			                // Reference supertype
			                subtype.$super = this;

			                return subtype;
			            },

			            /**
			             * Extends this object and runs the init method.
			             * Arguments to create() will be passed to init().
			             *
			             * @return {Object} The new object.
			             *
			             * @static
			             *
			             * @example
			             *
			             *     var instance = MyType.create();
			             */
			            create: function () {
			                var instance = this.extend();
			                instance.init.apply(instance, arguments);

			                return instance;
			            },

			            /**
			             * Initializes a newly created object.
			             * Override this method to add some logic when your objects are created.
			             *
			             * @example
			             *
			             *     var MyType = CryptoJS.lib.Base.extend({
			             *         init: function () {
			             *             // ...
			             *         }
			             *     });
			             */
			            init: function () {
			            },

			            /**
			             * Copies properties into this object.
			             *
			             * @param {Object} properties The properties to mix in.
			             *
			             * @example
			             *
			             *     MyType.mixIn({
			             *         field: 'value'
			             *     });
			             */
			            mixIn: function (properties) {
			                for (var propertyName in properties) {
			                    if (properties.hasOwnProperty(propertyName)) {
			                        this[propertyName] = properties[propertyName];
			                    }
			                }

			                // IE won't copy toString using the loop above
			                if (properties.hasOwnProperty('toString')) {
			                    this.toString = properties.toString;
			                }
			            },

			            /**
			             * Creates a copy of this object.
			             *
			             * @return {Object} The clone.
			             *
			             * @example
			             *
			             *     var clone = instance.clone();
			             */
			            clone: function () {
			                return this.init.prototype.extend(this);
			            }
			        };
			    }());

			    /**
			     * An array of 32-bit words.
			     *
			     * @property {Array} words The array of 32-bit words.
			     * @property {number} sigBytes The number of significant bytes in this word array.
			     */
			    var WordArray = C_lib.WordArray = Base.extend({
			        /**
			         * Initializes a newly created word array.
			         *
			         * @param {Array} words (Optional) An array of 32-bit words.
			         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
			         *
			         * @example
			         *
			         *     var wordArray = CryptoJS.lib.WordArray.create();
			         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
			         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
			         */
			        init: function (words, sigBytes) {
			            words = this.words = words || [];

			            if (sigBytes != undefined$1) {
			                this.sigBytes = sigBytes;
			            } else {
			                this.sigBytes = words.length * 4;
			            }
			        },

			        /**
			         * Converts this word array to a string.
			         *
			         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
			         *
			         * @return {string} The stringified word array.
			         *
			         * @example
			         *
			         *     var string = wordArray + '';
			         *     var string = wordArray.toString();
			         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
			         */
			        toString: function (encoder) {
			            return (encoder || Hex).stringify(this);
			        },

			        /**
			         * Concatenates a word array to this word array.
			         *
			         * @param {WordArray} wordArray The word array to append.
			         *
			         * @return {WordArray} This word array.
			         *
			         * @example
			         *
			         *     wordArray1.concat(wordArray2);
			         */
			        concat: function (wordArray) {
			            // Shortcuts
			            var thisWords = this.words;
			            var thatWords = wordArray.words;
			            var thisSigBytes = this.sigBytes;
			            var thatSigBytes = wordArray.sigBytes;

			            // Clamp excess bits
			            this.clamp();

			            // Concat
			            if (thisSigBytes % 4) {
			                // Copy one byte at a time
			                for (var i = 0; i < thatSigBytes; i++) {
			                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
			                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
			                }
			            } else {
			                // Copy one word at a time
			                for (var j = 0; j < thatSigBytes; j += 4) {
			                    thisWords[(thisSigBytes + j) >>> 2] = thatWords[j >>> 2];
			                }
			            }
			            this.sigBytes += thatSigBytes;

			            // Chainable
			            return this;
			        },

			        /**
			         * Removes insignificant bits.
			         *
			         * @example
			         *
			         *     wordArray.clamp();
			         */
			        clamp: function () {
			            // Shortcuts
			            var words = this.words;
			            var sigBytes = this.sigBytes;

			            // Clamp
			            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
			            words.length = Math.ceil(sigBytes / 4);
			        },

			        /**
			         * Creates a copy of this word array.
			         *
			         * @return {WordArray} The clone.
			         *
			         * @example
			         *
			         *     var clone = wordArray.clone();
			         */
			        clone: function () {
			            var clone = Base.clone.call(this);
			            clone.words = this.words.slice(0);

			            return clone;
			        },

			        /**
			         * Creates a word array filled with random bytes.
			         *
			         * @param {number} nBytes The number of random bytes to generate.
			         *
			         * @return {WordArray} The random word array.
			         *
			         * @static
			         *
			         * @example
			         *
			         *     var wordArray = CryptoJS.lib.WordArray.random(16);
			         */
			        random: function (nBytes) {
			            var words = [];

			            for (var i = 0; i < nBytes; i += 4) {
			                words.push(cryptoSecureRandomInt());
			            }

			            return new WordArray.init(words, nBytes);
			        }
			    });

			    /**
			     * Encoder namespace.
			     */
			    var C_enc = C.enc = {};

			    /**
			     * Hex encoding strategy.
			     */
			    var Hex = C_enc.Hex = {
			        /**
			         * Converts a word array to a hex string.
			         *
			         * @param {WordArray} wordArray The word array.
			         *
			         * @return {string} The hex string.
			         *
			         * @static
			         *
			         * @example
			         *
			         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
			         */
			        stringify: function (wordArray) {
			            // Shortcuts
			            var words = wordArray.words;
			            var sigBytes = wordArray.sigBytes;

			            // Convert
			            var hexChars = [];
			            for (var i = 0; i < sigBytes; i++) {
			                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
			                hexChars.push((bite >>> 4).toString(16));
			                hexChars.push((bite & 0x0f).toString(16));
			            }

			            return hexChars.join('');
			        },

			        /**
			         * Converts a hex string to a word array.
			         *
			         * @param {string} hexStr The hex string.
			         *
			         * @return {WordArray} The word array.
			         *
			         * @static
			         *
			         * @example
			         *
			         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
			         */
			        parse: function (hexStr) {
			            // Shortcut
			            var hexStrLength = hexStr.length;

			            // Convert
			            var words = [];
			            for (var i = 0; i < hexStrLength; i += 2) {
			                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
			            }

			            return new WordArray.init(words, hexStrLength / 2);
			        }
			    };

			    /**
			     * Latin1 encoding strategy.
			     */
			    var Latin1 = C_enc.Latin1 = {
			        /**
			         * Converts a word array to a Latin1 string.
			         *
			         * @param {WordArray} wordArray The word array.
			         *
			         * @return {string} The Latin1 string.
			         *
			         * @static
			         *
			         * @example
			         *
			         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
			         */
			        stringify: function (wordArray) {
			            // Shortcuts
			            var words = wordArray.words;
			            var sigBytes = wordArray.sigBytes;

			            // Convert
			            var latin1Chars = [];
			            for (var i = 0; i < sigBytes; i++) {
			                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
			                latin1Chars.push(String.fromCharCode(bite));
			            }

			            return latin1Chars.join('');
			        },

			        /**
			         * Converts a Latin1 string to a word array.
			         *
			         * @param {string} latin1Str The Latin1 string.
			         *
			         * @return {WordArray} The word array.
			         *
			         * @static
			         *
			         * @example
			         *
			         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
			         */
			        parse: function (latin1Str) {
			            // Shortcut
			            var latin1StrLength = latin1Str.length;

			            // Convert
			            var words = [];
			            for (var i = 0; i < latin1StrLength; i++) {
			                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
			            }

			            return new WordArray.init(words, latin1StrLength);
			        }
			    };

			    /**
			     * UTF-8 encoding strategy.
			     */
			    var Utf8 = C_enc.Utf8 = {
			        /**
			         * Converts a word array to a UTF-8 string.
			         *
			         * @param {WordArray} wordArray The word array.
			         *
			         * @return {string} The UTF-8 string.
			         *
			         * @static
			         *
			         * @example
			         *
			         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
			         */
			        stringify: function (wordArray) {
			            try {
			                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
			            } catch (e) {
			                throw new Error('Malformed UTF-8 data');
			            }
			        },

			        /**
			         * Converts a UTF-8 string to a word array.
			         *
			         * @param {string} utf8Str The UTF-8 string.
			         *
			         * @return {WordArray} The word array.
			         *
			         * @static
			         *
			         * @example
			         *
			         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
			         */
			        parse: function (utf8Str) {
			            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
			        }
			    };

			    /**
			     * Abstract buffered block algorithm template.
			     *
			     * The property blockSize must be implemented in a concrete subtype.
			     *
			     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
			     */
			    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
			        /**
			         * Resets this block algorithm's data buffer to its initial state.
			         *
			         * @example
			         *
			         *     bufferedBlockAlgorithm.reset();
			         */
			        reset: function () {
			            // Initial values
			            this._data = new WordArray.init();
			            this._nDataBytes = 0;
			        },

			        /**
			         * Adds new data to this block algorithm's buffer.
			         *
			         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
			         *
			         * @example
			         *
			         *     bufferedBlockAlgorithm._append('data');
			         *     bufferedBlockAlgorithm._append(wordArray);
			         */
			        _append: function (data) {
			            // Convert string to WordArray, else assume WordArray already
			            if (typeof data == 'string') {
			                data = Utf8.parse(data);
			            }

			            // Append
			            this._data.concat(data);
			            this._nDataBytes += data.sigBytes;
			        },

			        /**
			         * Processes available data blocks.
			         *
			         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
			         *
			         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
			         *
			         * @return {WordArray} The processed data.
			         *
			         * @example
			         *
			         *     var processedData = bufferedBlockAlgorithm._process();
			         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
			         */
			        _process: function (doFlush) {
			            var processedWords;

			            // Shortcuts
			            var data = this._data;
			            var dataWords = data.words;
			            var dataSigBytes = data.sigBytes;
			            var blockSize = this.blockSize;
			            var blockSizeBytes = blockSize * 4;

			            // Count blocks ready
			            var nBlocksReady = dataSigBytes / blockSizeBytes;
			            if (doFlush) {
			                // Round up to include partial blocks
			                nBlocksReady = Math.ceil(nBlocksReady);
			            } else {
			                // Round down to include only full blocks,
			                // less the number of blocks that must remain in the buffer
			                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
			            }

			            // Count words ready
			            var nWordsReady = nBlocksReady * blockSize;

			            // Count bytes ready
			            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

			            // Process blocks
			            if (nWordsReady) {
			                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
			                    // Perform concrete-algorithm logic
			                    this._doProcessBlock(dataWords, offset);
			                }

			                // Remove processed words
			                processedWords = dataWords.splice(0, nWordsReady);
			                data.sigBytes -= nBytesReady;
			            }

			            // Return processed words
			            return new WordArray.init(processedWords, nBytesReady);
			        },

			        /**
			         * Creates a copy of this object.
			         *
			         * @return {Object} The clone.
			         *
			         * @example
			         *
			         *     var clone = bufferedBlockAlgorithm.clone();
			         */
			        clone: function () {
			            var clone = Base.clone.call(this);
			            clone._data = this._data.clone();

			            return clone;
			        },

			        _minBufferSize: 0
			    });

			    /**
			     * Abstract hasher template.
			     *
			     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
			     */
			    C_lib.Hasher = BufferedBlockAlgorithm.extend({
			        /**
			         * Configuration options.
			         */
			        cfg: Base.extend(),

			        /**
			         * Initializes a newly created hasher.
			         *
			         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
			         *
			         * @example
			         *
			         *     var hasher = CryptoJS.algo.SHA256.create();
			         */
			        init: function (cfg) {
			            // Apply config defaults
			            this.cfg = this.cfg.extend(cfg);

			            // Set initial values
			            this.reset();
			        },

			        /**
			         * Resets this hasher to its initial state.
			         *
			         * @example
			         *
			         *     hasher.reset();
			         */
			        reset: function () {
			            // Reset data buffer
			            BufferedBlockAlgorithm.reset.call(this);

			            // Perform concrete-hasher logic
			            this._doReset();
			        },

			        /**
			         * Updates this hasher with a message.
			         *
			         * @param {WordArray|string} messageUpdate The message to append.
			         *
			         * @return {Hasher} This hasher.
			         *
			         * @example
			         *
			         *     hasher.update('message');
			         *     hasher.update(wordArray);
			         */
			        update: function (messageUpdate) {
			            // Append
			            this._append(messageUpdate);

			            // Update the hash
			            this._process();

			            // Chainable
			            return this;
			        },

			        /**
			         * Finalizes the hash computation.
			         * Note that the finalize operation is effectively a destructive, read-once operation.
			         *
			         * @param {WordArray|string} messageUpdate (Optional) A final message update.
			         *
			         * @return {WordArray} The hash.
			         *
			         * @example
			         *
			         *     var hash = hasher.finalize();
			         *     var hash = hasher.finalize('message');
			         *     var hash = hasher.finalize(wordArray);
			         */
			        finalize: function (messageUpdate) {
			            // Final message update
			            if (messageUpdate) {
			                this._append(messageUpdate);
			            }

			            // Perform concrete-hasher logic
			            var hash = this._doFinalize();

			            return hash;
			        },

			        blockSize: 512/32,

			        /**
			         * Creates a shortcut function to a hasher's object interface.
			         *
			         * @param {Hasher} hasher The hasher to create a helper for.
			         *
			         * @return {Function} The shortcut function.
			         *
			         * @static
			         *
			         * @example
			         *
			         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
			         */
			        _createHelper: function (hasher) {
			            return function (message, cfg) {
			                return new hasher.init(cfg).finalize(message);
			            };
			        },

			        /**
			         * Creates a shortcut function to the HMAC's object interface.
			         *
			         * @param {Hasher} hasher The hasher to use in this HMAC helper.
			         *
			         * @return {Function} The shortcut function.
			         *
			         * @static
			         *
			         * @example
			         *
			         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
			         */
			        _createHmacHelper: function (hasher) {
			            return function (message, key) {
			                return new C_algo.HMAC.init(hasher, key).finalize(message);
			            };
			        }
			    });

			    /**
			     * Algorithm namespace.
			     */
			    var C_algo = C.algo = {};

			    return C;
			}(Math));


			return CryptoJS;

		}));
} (core));
	return coreExports;
}

var hasRequiredSha1;

function requireSha1 () {
	if (hasRequiredSha1) return sha1Exports;
	hasRequiredSha1 = 1;
	(function (module, exports) {
(function (root, factory) {
			{
				// CommonJS
				module.exports = factory(requireCore());
			}
		}(commonjsGlobal, function (CryptoJS) {

			(function () {
			    // Shortcuts
			    var C = CryptoJS;
			    var C_lib = C.lib;
			    var WordArray = C_lib.WordArray;
			    var Hasher = C_lib.Hasher;
			    var C_algo = C.algo;

			    // Reusable object
			    var W = [];

			    /**
			     * SHA-1 hash algorithm.
			     */
			    var SHA1 = C_algo.SHA1 = Hasher.extend({
			        _doReset: function () {
			            this._hash = new WordArray.init([
			                0x67452301, 0xefcdab89,
			                0x98badcfe, 0x10325476,
			                0xc3d2e1f0
			            ]);
			        },

			        _doProcessBlock: function (M, offset) {
			            // Shortcut
			            var H = this._hash.words;

			            // Working variables
			            var a = H[0];
			            var b = H[1];
			            var c = H[2];
			            var d = H[3];
			            var e = H[4];

			            // Computation
			            for (var i = 0; i < 80; i++) {
			                if (i < 16) {
			                    W[i] = M[offset + i] | 0;
			                } else {
			                    var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
			                    W[i] = (n << 1) | (n >>> 31);
			                }

			                var t = ((a << 5) | (a >>> 27)) + e + W[i];
			                if (i < 20) {
			                    t += ((b & c) | (~b & d)) + 0x5a827999;
			                } else if (i < 40) {
			                    t += (b ^ c ^ d) + 0x6ed9eba1;
			                } else if (i < 60) {
			                    t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
			                } else /* if (i < 80) */ {
			                    t += (b ^ c ^ d) - 0x359d3e2a;
			                }

			                e = d;
			                d = c;
			                c = (b << 30) | (b >>> 2);
			                b = a;
			                a = t;
			            }

			            // Intermediate hash value
			            H[0] = (H[0] + a) | 0;
			            H[1] = (H[1] + b) | 0;
			            H[2] = (H[2] + c) | 0;
			            H[3] = (H[3] + d) | 0;
			            H[4] = (H[4] + e) | 0;
			        },

			        _doFinalize: function () {
			            // Shortcuts
			            var data = this._data;
			            var dataWords = data.words;

			            var nBitsTotal = this._nDataBytes * 8;
			            var nBitsLeft = data.sigBytes * 8;

			            // Add padding
			            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
			            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
			            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
			            data.sigBytes = dataWords.length * 4;

			            // Hash final blocks
			            this._process();

			            // Return final computed hash
			            return this._hash;
			        },

			        clone: function () {
			            var clone = Hasher.clone.call(this);
			            clone._hash = this._hash.clone();

			            return clone;
			        }
			    });

			    /**
			     * Shortcut function to the hasher's object interface.
			     *
			     * @param {WordArray|string} message The message to hash.
			     *
			     * @return {WordArray} The hash.
			     *
			     * @static
			     *
			     * @example
			     *
			     *     var hash = CryptoJS.SHA1('message');
			     *     var hash = CryptoJS.SHA1(wordArray);
			     */
			    C.SHA1 = Hasher._createHelper(SHA1);

			    /**
			     * Shortcut function to the HMAC's object interface.
			     *
			     * @param {WordArray|string} message The message to hash.
			     * @param {WordArray|string} key The secret key.
			     *
			     * @return {WordArray} The HMAC.
			     *
			     * @static
			     *
			     * @example
			     *
			     *     var hmac = CryptoJS.HmacSHA1(message, key);
			     */
			    C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
			}());


			return CryptoJS.SHA1;

		}));
} (sha1));
	return sha1Exports;
}

/**
 * Module dependencies.
 */

var hasRequiredMemory;

function requireMemory () {
	if (hasRequiredMemory) return memoryExports;
	hasRequiredMemory = 1;
	var nodes = requireNodes();

	var MemoryCache = memory.exports = function(options) {
	  options = options || {};
	  this.limit = options['cache limit'] || 256;
	  this._cache = {};
	  this.length = 0;
	  this.head = this.tail = null;
	};

	/**
	 * Set cache item with given `key` to `value`.
	 *
	 * @param {String} key
	 * @param {Object} value
	 * @api private
	 */

	MemoryCache.prototype.set = function(key, value) {
	  var clone = value.clone()
	    , item;

	  clone.filename = nodes.filename;
	  clone.lineno = nodes.lineno;
	  clone.column = nodes.column;
	  item = { key: key, value: clone };
	  this._cache[key] = item;

	  if (this.tail) {
	    this.tail.next = item;
	    item.prev = this.tail;
	  } else {
	    this.head = item;
	  }

	  this.tail = item;
	  if (this.length++ == this.limit) this.purge();
	};

	/**
	 * Get cache item with given `key`.
	 *
	 * @param {String} key
	 * @return {Object}
	 * @api private
	 */

	MemoryCache.prototype.get = function(key) {
	  var item = this._cache[key]
	    , val = item.value.clone();

	  if (item == this.tail) return val;
	  if (item.next) {
	    if (item == this.head) this.head = item.next;
	    item.next.prev = item.prev;
	  }
	  if (item.prev) item.prev.next = item.next;

	  item.next = null;
	  item.prev = this.tail;

	  if (this.tail) this.tail.next = item;
	  this.tail = item;

	  return val;
	};

	/**
	 * Check if cache has given `key`.
	 *
	 * @param {String} key
	 * @return {Boolean}
	 * @api private
	 */

	MemoryCache.prototype.has = function(key) {
	  return !!this._cache[key];
	};

	/**
	 * Generate key for the source `str` with `options`.
	 *
	 * @param {String} str
	 * @param {Object} options
	 * @return {String}
	 * @api private
	 */

	MemoryCache.prototype.key = function(str, options) {
	  var sha1 = requireSha1();
	  
	  return sha1(str + options.prefix);
	};

	/**
	 * Remove the oldest item from the cache.
	 *
	 * @api private
	 */

	MemoryCache.prototype.purge = function() {
	  var item = this.head;

	  if (this.head.next) {
	    this.head = this.head.next;
	    this.head.prev = null;
	  }

	  this._cache[item.key] = item.prev = item.next = null;
	  this.length--;
	};
	return memoryExports;
}

var _nullExports = {};
var _null = {
  get exports(){ return _nullExports; },
  set exports(v){ _nullExports = v; },
};

/**
 * Module dependencies.
 */

var hasRequired_null;

function require_null () {
	if (hasRequired_null) return _nullExports;
	hasRequired_null = 1;
	var NullCache = _null.exports = function() {};

	/**
	 * Set cache item with given `key` to `value`.
	 *
	 * @param {String} key
	 * @param {Object} value
	 * @api private
	 */

	NullCache.prototype.set = function(key, value) {};

	/**
	 * Get cache item with given `key`.
	 *
	 * @param {String} key
	 * @return {Object}
	 * @api private
	 */

	NullCache.prototype.get = function(key) {};

	/**
	 * Check if cache has given `key`.
	 *
	 * @param {String} key
	 * @return {Boolean}
	 * @api private
	 */

	NullCache.prototype.has = function(key) {
	  return false;
	};

	/**
	 * Generate key for the source `str` with `options`.
	 *
	 * @param {String} str
	 * @param {Object} options
	 * @return {String}
	 * @api private
	 */

	NullCache.prototype.key = function(str, options) {
	  return '';
	};
	return _nullExports;
}

/**
 * Get cache object by `name`.
 *
 * @param {String|Function} name
 * @param {Object} options
 * @return {Object}
 * @api private
 */

var hasRequiredCache;

function requireCache () {
	if (hasRequiredCache) return cacheExports;
	hasRequiredCache = 1;
	cache.exports = function(name, options){
	  if ('function' == typeof name) return new name(options);

	  var cache;
	  switch (name){
	    // case 'fs':
	    //   cache = require('./fs')
	    //   break;
	    case 'memory':
	      cache = requireMemory();
	      break;
	    default:
	      cache = require_null();
	  }
	  return new cache(options);
	};
	return cacheExports;
}

/*!
 * Stylus - Parser
 * Copyright (c) Automattic <developer.wordpress.com>
 * MIT Licensed
 */

var hasRequiredParser;

function requireParser () {
	if (hasRequiredParser) return parserExports$1;
	hasRequiredParser = 1;
	/**
	 * Module dependencies.
	 */

	var Lexer = requireLexer()
	  , nodes = requireNodes()
	  , Token = tokenExports
	  , units$1 = units
	  , errors$1 = errors
	  , cache = requireCache();

	// debuggers

	var debug = {
	    lexer: browserExports('stylus:lexer')
	  , selector: browserExports('stylus:parser:selector')
	};

	/**
	 * Selector composite tokens.
	 */

	var selectorTokens = [
	    'ident'
	  , 'string'
	  , 'selector'
	  , 'function'
	  , 'comment'
	  , 'boolean'
	  , 'space'
	  , 'color'
	  , 'unit'
	  , 'for'
	  , 'in'
	  , '['
	  , ']'
	  , '('
	  , ')'
	  , '+'
	  , '-'
	  , '*'
	  , '*='
	  , '<'
	  , '>'
	  , '='
	  , ':'
	  , '&'
	  , '&&'
	  , '~'
	  , '{'
	  , '}'
	  , '.'
	  , '..'
	  , '/'
	];

	/**
	 * CSS pseudo-classes and pseudo-elements.
	 * See http://dev.w3.org/csswg/selectors4/
	 */

	var pseudoSelectors = [
	  // Logical Combinations
	    'matches'
	  , 'not'

	  // Linguistic Pseudo-classes
	  , 'dir'
	  , 'lang'

	  // Location Pseudo-classes
	  , 'any-link'
	  , 'link'
	  , 'visited'
	  , 'local-link'
	  , 'target'
	  , 'scope'

	  // User Action Pseudo-classes
	  , 'hover'
	  , 'active'
	  , 'focus'
	  , 'drop'

	  // Time-dimensional Pseudo-classes
	  , 'current'
	  , 'past'
	  , 'future'

	  // The Input Pseudo-classes
	  , 'enabled'
	  , 'disabled'
	  , 'read-only'
	  , 'read-write'
	  , 'placeholder-shown'
	  , 'checked'
	  , 'indeterminate'
	  , 'valid'
	  , 'invalid'
	  , 'in-range'
	  , 'out-of-range'
	  , 'required'
	  , 'optional'
	  , 'user-error'

	  // Tree-Structural pseudo-classes
	  , 'root'
	  , 'empty'
	  , 'blank'
	  , 'nth-child'
	  , 'nth-last-child'
	  , 'first-child'
	  , 'last-child'
	  , 'only-child'
	  , 'nth-of-type'
	  , 'nth-last-of-type'
	  , 'first-of-type'
	  , 'last-of-type'
	  , 'only-of-type'
	  , 'nth-match'
	  , 'nth-last-match'

	  // Grid-Structural Selectors
	  , 'nth-column'
	  , 'nth-last-column'

	  // Pseudo-elements
	  , 'first-line'
	  , 'first-letter'
	  , 'before'
	  , 'after'

	  // Non-standard
	  , 'selection'
	];

	/**
	 * Initialize a new `Parser` with the given `str` and `options`.
	 *
	 * @param {String} str
	 * @param {Object} options
	 * @api private
	 */

	var Parser = parser.exports = function Parser(str, options) {
	  var self = this;
	  options = options || {};
	  Parser.cache = Parser.cache || Parser.getCache(options);
	  this.hash = Parser.cache.key(str, options);
	  this.lexer = {};
	  if (!Parser.cache.has(this.hash)) {
	    this.lexer = new Lexer(str, options);
	  }
	  this.prefix = options.prefix || '';
	  this.root = options.root || new nodes.Root;
	  this.state = ['root'];
	  this.stash = [];
	  this.parens = 0;
	  this.css = 0;
	  this.state.pop = function(){
	    self.prevState = [].pop.call(this);
	  };
	};

	/**
	 * Get cache instance.
	 *
	 * @param {Object} options
	 * @return {Object}
	 * @api private
	 */

	Parser.getCache = function(options) {
	  return false === options.cache
	    ? cache(false)
	    : cache(options.cache || 'memory', options);
	};

	/**
	 * Parser prototype.
	 */

	Parser.prototype = {

	  /**
	   * Constructor.
	   */

	  constructor: Parser,

	  /**
	   * Return current state.
	   *
	   * @return {String}
	   * @api private
	   */

	  currentState: function() {
	    return this.state[this.state.length - 1];
	  },

	  /**
	   * Return previous state.
	   *
	   * @return {String}
	   * @api private
	   */

	  previousState: function() {
	    return this.state[this.state.length - 2];
	  },

	  /**
	   * Parse the input, then return the root node.
	   *
	   * @return {Node}
	   * @api private
	   */

	  parse: function(){
	    var block = this.parent = this.root;
	    if (Parser.cache.has(this.hash)) {
	      block = Parser.cache.get(this.hash);
	      // normalize cached imports
	      if ('block' == block.nodeName) block.constructor = nodes.Root;
	    } else {
	      while ('eos' != this.peek().type) {
	        this.skipWhitespace();
	        if ('eos' == this.peek().type) break;
	        var stmt = this.statement();
	        this.accept(';');
	        if (!stmt) this.error('unexpected token {peek}, not allowed at the root level');
	        block.push(stmt);
	      }
	      Parser.cache.set(this.hash, block);
	    }
	    return block;
	  },

	  /**
	   * Throw an `Error` with the given `msg`.
	   *
	   * @param {String} msg
	   * @api private
	   */

	  error: function(msg){
	    var type = this.peek().type
	      , val = undefined == this.peek().val
	        ? ''
	        : ' ' + this.peek().toString();
	    if (val.trim() == type.trim()) val = '';
	    throw new errors$1.ParseError(msg.replace('{peek}', '"' + type + val + '"'));
	  },

	  /**
	   * Accept the given token `type`, and return it,
	   * otherwise return `undefined`.
	   *
	   * @param {String} type
	   * @return {Token}
	   * @api private
	   */

	  accept: function(type){
	    if (type == this.peek().type) {
	      return this.next();
	    }
	  },

	  /**
	   * Expect token `type` and return it, throw otherwise.
	   *
	   * @param {String} type
	   * @return {Token}
	   * @api private
	   */

	  expect: function(type){
	    if (type != this.peek().type) {
	      this.error('expected "' + type + '", got {peek}');
	    }
	    return this.next();
	  },

	  /**
	   * Get the next token.
	   *
	   * @return {Token}
	   * @api private
	   */

	  next: function() {
	    var tok = this.stash.length
	      ? this.stash.pop()
	      : this.lexer.next()
	      , line = tok.lineno
	      , column = tok.column || 1;

	    if (tok.val && tok.val.nodeName) {
	      tok.val.lineno = line;
	      tok.val.column = column;
	    }
	    nodes.lineno = line;
	    nodes.column = column;
	    debug.lexer('%s %s', tok.type, tok.val || '');
	    return tok;
	  },

	  /**
	   * Peek with lookahead(1).
	   *
	   * @return {Token}
	   * @api private
	   */

	  peek: function() {
	    return this.lexer.peek();
	  },

	  /**
	   * Lookahead `n` tokens.
	   *
	   * @param {Number} n
	   * @return {Token}
	   * @api private
	   */

	  lookahead: function(n){
	    return this.lexer.lookahead(n);
	  },

	  /**
	   * Check if the token at `n` is a valid selector token.
	   *
	   * @param {Number} n
	   * @return {Boolean}
	   * @api private
	   */

	  isSelectorToken: function(n) {
	    var la = this.lookahead(n).type;
	    switch (la) {
	      case 'for':
	        return this.bracketed;
	      case '[':
	        this.bracketed = true;
	        return true;
	      case ']':
	        this.bracketed = false;
	        return true;
	      default:
	        return ~selectorTokens.indexOf(la);
	    }
	  },

	  /**
	   * Check if the token at `n` is a pseudo selector.
	   *
	   * @param {Number} n
	   * @return {Boolean}
	   * @api private
	   */

	  isPseudoSelector: function(n){
	    var val = this.lookahead(n).val;
	    return val && ~pseudoSelectors.indexOf(val.name);
	  },

	  /**
	   * Check if the current line contains `type`.
	   *
	   * @param {String} type
	   * @return {Boolean}
	   * @api private
	   */

	  lineContains: function(type){
	    var i = 1
	      , la;

	    while (la = this.lookahead(i++)) {
	      if (~['indent', 'outdent', 'newline', 'eos'].indexOf(la.type)) return;
	      if (type == la.type) return true;
	    }
	  },

	  /**
	   * Valid selector tokens.
	   */

	  selectorToken: function() {
	    if (this.isSelectorToken(1)) {
	      if ('{' == this.peek().type) {
	        // unclosed, must be a block
	        if (!this.lineContains('}')) return;
	        // check if ':' is within the braces.
	        // though not required by Stylus, chances
	        // are if someone is using {} they will
	        // use CSS-style props, helping us with
	        // the ambiguity in this case
	        var i = 0
	          , la;
	        while (la = this.lookahead(++i)) {
	          if ('}' == la.type) {
	            // Check empty block.
	            if (i == 2 || (i == 3 && this.lookahead(i - 1).type == 'space'))
	              return;
	            break;
	          }
	          if (':' == la.type) return;
	        }
	      }
	      return this.next();
	    }
	  },

	  /**
	   * Skip the given `tokens`.
	   *
	   * @param {Array} tokens
	   * @api private
	   */

	  skip: function(tokens) {
	    while (~tokens.indexOf(this.peek().type))
	      this.next();
	  },

	  /**
	   * Consume whitespace.
	   */

	  skipWhitespace: function() {
	    this.skip(['space', 'indent', 'outdent', 'newline']);
	  },

	  /**
	   * Consume newlines.
	   */

	  skipNewlines: function() {
	    while ('newline' == this.peek().type)
	      this.next();
	  },

	  /**
	   * Consume spaces.
	   */

	  skipSpaces: function() {
	    while ('space' == this.peek().type)
	      this.next();
	  },

	  /**
	   * Consume spaces and comments.
	   */

	  skipSpacesAndComments: function() {
	    while ('space' == this.peek().type
	      || 'comment' == this.peek().type)
	      this.next();
	  },

	  /**
	   * Check if the following sequence of tokens
	   * forms a function definition, ie trailing
	   * `{` or indentation.
	   */

	  looksLikeFunctionDefinition: function(i) {
	    return 'indent' == this.lookahead(i).type
	      || '{' == this.lookahead(i).type;
	  },

	  /**
	   * Check if the following sequence of tokens
	   * forms a selector.
	   *
	   * @param {Boolean} [fromProperty]
	   * @return {Boolean}
	   * @api private
	   */

	  looksLikeSelector: function(fromProperty) {
	    var i = 1
	      , brace;

	    // Real property
	    if (fromProperty && ':' == this.lookahead(i + 1).type
	      && (this.lookahead(i + 1).space || 'indent' == this.lookahead(i + 2).type))
	      return false;

	    // Assume selector when an ident is
	    // followed by a selector
	    while ('ident' == this.lookahead(i).type
	      && ('newline' == this.lookahead(i + 1).type
	         || ',' == this.lookahead(i + 1).type)) i += 2;

	    while (this.isSelectorToken(i)
	      || ',' == this.lookahead(i).type) {

	      if ('selector' == this.lookahead(i).type)
	        return true;

	      if ('&' == this.lookahead(i + 1).type)
	        return true;

	      if ('.' == this.lookahead(i).type && 'ident' == this.lookahead(i + 1).type)
	        return true;

	      if ('*' == this.lookahead(i).type && 'newline' == this.lookahead(i + 1).type)
	        return true;

	      // Pseudo-elements
	      if (':' == this.lookahead(i).type
	        && ':' == this.lookahead(i + 1).type)
	        return true; 

	      // #a after an ident and newline
	      if ('color' == this.lookahead(i).type
	        && 'newline' == this.lookahead(i - 1).type)
	        return true;

	      if (this.looksLikeAttributeSelector(i))
	        return true;

	      if (('=' == this.lookahead(i).type || 'function' == this.lookahead(i).type)
	        && '{' == this.lookahead(i + 1).type)
	        return false;

	      // Hash values inside properties
	      if (':' == this.lookahead(i).type
	        && !this.isPseudoSelector(i + 1)
	        && this.lineContains('.'))
	        return false;

	      // the ':' token within braces signifies
	      // a selector. ex: "foo{bar:'baz'}"
	      if ('{' == this.lookahead(i).type) brace = true;
	      else if ('}' == this.lookahead(i).type) brace = false;
	      if (brace && ':' == this.lookahead(i).type) return true;

	      // '{' preceded by a space is considered a selector.
	      // for example "foo{bar}{baz}" may be a property,
	      // however "foo{bar} {baz}" is a selector
	      if ('space' == this.lookahead(i).type
	        && '{' == this.lookahead(i + 1).type)
	        return true;

	      // Assume pseudo selectors are NOT properties
	      // as 'td:th-child(1)' may look like a property
	      // and function call to the parser otherwise
	      if (':' == this.lookahead(i++).type
	        && !this.lookahead(i-1).space
	        && this.isPseudoSelector(i))
	        return true;

	      // Trailing space
	      if ('space' == this.lookahead(i).type
	        && 'newline' == this.lookahead(i + 1).type
	        && '{' == this.lookahead(i + 2).type)
	        return true;

	      if (',' == this.lookahead(i).type
	        && 'newline' == this.lookahead(i + 1).type)
	        return true;
	    }

	    // Trailing comma
	    if (',' == this.lookahead(i).type
	      && 'newline' == this.lookahead(i + 1).type)
	      return true;

	    // Trailing brace
	    if ('{' == this.lookahead(i).type
	      && 'newline' == this.lookahead(i + 1).type)
	      return true;

	    // css-style mode, false on ; }
	    if (this.css) {
	      if (';' == this.lookahead(i).type ||
	          '}' == this.lookahead(i - 1).type)
	        return false;
	    }

	    // Trailing separators
	    while (!~[
	        'indent'
	      , 'outdent'
	      , 'newline'
	      , 'for'
	      , 'if'
	      , ';'
	      , '}'
	      , 'eos'].indexOf(this.lookahead(i).type))
	      ++i;

	    if ('indent' == this.lookahead(i).type)
	      return true;
	  },

	  /**
	   * Check if the following sequence of tokens
	   * forms an attribute selector.
	   */

	  looksLikeAttributeSelector: function(n) {
	    var type = this.lookahead(n).type;
	    if ('=' == type && this.bracketed) return true;
	    return ('ident' == type || 'string' == type)
	      && ']' == this.lookahead(n + 1).type
	      && ('newline' == this.lookahead(n + 2).type || this.isSelectorToken(n + 2))
	      && !this.lineContains(':')
	      && !this.lineContains('=');
	  },

	  /**
	   * Check if the following sequence of tokens
	   * forms a keyframe block.
	   */

	  looksLikeKeyframe: function() {
	    var i = 2
	      , type;
	    switch (this.lookahead(i).type) {
	      case '{':
	      case 'indent':
	      case ',':
	        return true;
	      case 'newline':
	        while ('unit' == this.lookahead(++i).type
	            || 'newline' == this.lookahead(i).type) ;
	        type = this.lookahead(i).type;
	        return 'indent' == type || '{' == type;
	    }
	  },

	  /**
	   * Check if the current state supports selectors.
	   */

	  stateAllowsSelector: function() {
	    switch (this.currentState()) {
	      case 'root':
	      case 'atblock':
	      case 'selector':
	      case 'conditional':
	      case 'function':
	      case 'atrule':
	      case 'for':
	        return true;
	    }
	  },

	  /**
	   * Try to assign @block to the node.
	   *
	   * @param {Expression} expr
	   * @private
	   */

	  assignAtblock: function(expr) {
	    try {
	      expr.push(this.atblock(expr));
	    } catch(err) {
	      this.error('invalid right-hand side operand in assignment, got {peek}');
	    }
	  },

	  /**
	   *   statement
	   * | statement 'if' expression
	   * | statement 'unless' expression
	   */

	  statement: function() {
	    var stmt = this.stmt()
	      , state = this.prevState
	      , block
	      , op;

	    // special-case statements since it
	    // is not an expression. We could
	    // implement postfix conditionals at
	    // the expression level, however they
	    // would then fail to enclose properties
	    if (this.allowPostfix) {
	      this.allowPostfix = false;
	      state = 'expression';
	    }

	    switch (state) {
	      case 'assignment':
	      case 'expression':
	      case 'function arguments':
	        while (op =
	             this.accept('if')
	          || this.accept('unless')
	          || this.accept('for')) {
	          switch (op.type) {
	            case 'if':
	            case 'unless':
	              stmt = new nodes.If(this.expression(), stmt);
	              stmt.postfix = true;
	              stmt.negate = 'unless' == op.type;
	              this.accept(';');
	              break;
	            case 'for':
	              var key
	                , val = this.id().name;
	              if (this.accept(',')) key = this.id().name;
	              this.expect('in');
	              var each = new nodes.Each(val, key, this.expression());
	              block = new nodes.Block(this.parent, each);
	              block.push(stmt);
	              each.block = block;
	              stmt = each;
	          }
	        }
	    }

	    return stmt;
	  },

	  /**
	   *    ident
	   *  | selector
	   *  | literal
	   *  | charset
	   *  | namespace
	   *  | import
	   *  | require
	   *  | media
	   *  | atrule
	   *  | scope
	   *  | keyframes
	   *  | mozdocument
	   *  | for
	   *  | if
	   *  | unless
	   *  | comment
	   *  | expression
	   *  | 'return' expression
	   */

	  stmt: function() {
	    var type = this.peek().type;
	    switch (type) {
	      case 'keyframes':
	        return this.keyframes();
	      case '-moz-document':
	        return this.mozdocument();
	      case 'comment':
	      case 'selector':
	      case 'literal':
	      case 'charset':
	      case 'namespace':
	      case 'import':
	      case 'require':
	      case 'extend':
	      case 'media':
	      case 'atrule':
	      case 'ident':
	      case 'scope':
	      case 'supports':
	      case 'unless':
	      case 'function':
	      case 'for':
	      case 'if':
	        return this[type]();
	      case 'return':
	        return this.return();
	      case '{':
	        return this.property();
	      default:
	        // Contextual selectors
	        if (this.stateAllowsSelector()) {
	          switch (type) {
	            case 'color':
	            case '~':
	            case '>':
	            case '<':
	            case ':':
	            case '&':
	            case '&&':
	            case '[':
	            case '.':
	            case '/':
	              return this.selector();
	            // relative reference
	            case '..':
	              if ('/' == this.lookahead(2).type)
	                return this.selector();
	            case '+':
	              return 'function' == this.lookahead(2).type
	                ? this.functionCall()
	                : this.selector();
	            case '*':
	              return this.property();
	            // keyframe blocks (10%, 20% { ... })
	            case 'unit':
	              if (this.looksLikeKeyframe()) return this.selector();
	            case '-':
	              if ('{' == this.lookahead(2).type)
	                return this.property();
	          }
	        }

	        // Expression fallback
	        var expr = this.expression();
	        if (expr.isEmpty) this.error('unexpected {peek}');
	        return expr;
	    }
	  },

	  /**
	   * indent (!outdent)+ outdent
	   */

	  block: function(node, scope) {
	    var delim
	      , stmt
	      , next
	      , block = this.parent = new nodes.Block(this.parent, node);

	    if (false === scope) block.scope = false;

	    this.accept('newline');

	    // css-style
	    if (this.accept('{')) {
	      this.css++;
	      delim = '}';
	      this.skipWhitespace();
	    } else {
	      delim = 'outdent';
	      this.expect('indent');
	    }

	    while (delim != this.peek().type) {
	      // css-style
	      if (this.css) {
	        if (this.accept('newline') || this.accept('indent')) continue;
	        stmt = this.statement();
	        this.accept(';');
	        this.skipWhitespace();
	      } else {
	        if (this.accept('newline')) continue;
	        // skip useless indents and comments
	        next = this.lookahead(2).type;
	        if ('indent' == this.peek().type
	          && ~['outdent', 'newline', 'comment'].indexOf(next)) {
	          this.skip(['indent', 'outdent']);
	          continue;
	        }
	        if ('eos' == this.peek().type) return block;
	        stmt = this.statement();
	        this.accept(';');
	      }
	      if (!stmt) this.error('unexpected token {peek} in block');
	      block.push(stmt);
	    }

	    // css-style
	    if (this.css) {
	      this.skipWhitespace();
	      this.expect('}');
	      this.skipSpaces();
	      this.css--;
	    } else {
	      this.expect('outdent');
	    }

	    this.parent = block.parent;
	    return block;
	  },

	  /**
	   * comment space*
	   */

	  comment: function(){
	    var node = this.next().val;
	    this.skipSpaces();
	    return node;
	  },

	  /**
	   * for val (',' key) in expr
	   */

	  for: function() {
	    this.expect('for');
	    var key
	      , val = this.id().name;
	    if (this.accept(',')) key = this.id().name;
	    this.expect('in');
	    this.state.push('for');
	    this.cond = true;
	    var each = new nodes.Each(val, key, this.expression());
	    this.cond = false;
	    each.block = this.block(each, false);
	    this.state.pop();
	    return each;
	  },

	  /**
	   * return expression
	   */

	  return: function() {
	    this.expect('return');
	    var expr = this.expression();
	    return expr.isEmpty
	      ? new nodes.Return
	      : new nodes.Return(expr);
	  },

	  /**
	   * unless expression block
	   */

	  unless: function() {
	    this.expect('unless');
	    this.state.push('conditional');
	    this.cond = true;
	    var node = new nodes.If(this.expression(), true);
	    this.cond = false;
	    node.block = this.block(node, false);
	    this.state.pop();
	    return node;
	  },

	  /**
	   * if expression block (else block)?
	   */

	  if: function() {
	    this.expect('if');
	    this.state.push('conditional');
	    this.cond = true;
	    var node = new nodes.If(this.expression())
	      , cond
	      , block;
	    this.cond = false;
	    node.block = this.block(node, false);
	    this.skip(['newline', 'comment']);
	    while (this.accept('else')) {
	      if (this.accept('if')) {
	        this.cond = true;
	        cond = this.expression();
	        this.cond = false;
	        block = this.block(node, false);
	        node.elses.push(new nodes.If(cond, block));
	      } else {
	        node.elses.push(this.block(node, false));
	        break;
	      }
	      this.skip(['newline', 'comment']);
	    }
	    this.state.pop();
	    return node;
	  },

	  /**
	   * @block
	   *
	   * @param {Expression} [node]
	   */

	  atblock: function(node){
	    if (!node) this.expect('atblock');
	    node = new nodes.Atblock;
	    this.state.push('atblock');
	    node.block = this.block(node, false);
	    this.state.pop();
	    return node;
	  },

	  /**
	   * atrule selector? block?
	   */

	  atrule: function(){
	    var type = this.expect('atrule').val
	      , node = new nodes.Atrule(type)
	      , tok;
	    this.skipSpacesAndComments();
	    node.segments = this.selectorParts();
	    this.skipSpacesAndComments();
	    tok = this.peek().type;
	    if ('indent' == tok || '{' == tok || ('newline' == tok
	      && '{' == this.lookahead(2).type)) {
	      this.state.push('atrule');
	      node.block = this.block(node);
	      this.state.pop();
	    }
	    return node;
	  },

	  /**
	   * scope
	   */

	  scope: function(){
	    this.expect('scope');
	    var selector = this.selectorParts()
	      .map(function(selector) { return selector.val; })
	      .join('');
	    this.selectorScope = selector.trim();
	    return nodes.null;
	  },

	  /**
	   * supports
	   */

	  supports: function(){
	    this.expect('supports');
	    var node = new nodes.Supports(this.supportsCondition());
	    this.state.push('atrule');
	    node.block = this.block(node);
	    this.state.pop();
	    return node;
	  },

	  /**
	   *   supports negation
	   * | supports op
	   * | expression
	   */

	  supportsCondition: function(){
	    var node = this.supportsNegation()
	      || this.supportsOp();
	    if (!node) {
	      this.cond = true;
	      node = this.expression();
	      this.cond = false;
	    }
	    return node;
	  },

	  /**
	   * 'not' supports feature
	   */

	  supportsNegation: function(){
	    if (this.accept('not')) {
	      var node = new nodes.Expression;
	      node.push(new nodes.Literal('not'));
	      node.push(this.supportsFeature());
	      return node;
	    }
	  },

	  /**
	   * supports feature (('and' | 'or') supports feature)+
	   */

	  supportsOp: function(){
	    var feature = this.supportsFeature()
	      , op
	      , expr;
	    if (feature) {
	      expr = new nodes.Expression;
	      expr.push(feature);
	      while (op = this.accept('&&') || this.accept('||')) {
	        expr.push(new nodes.Literal('&&' == op.val ? 'and' : 'or'));
	        expr.push(this.supportsFeature());
	      }
	      return expr;
	    }
	  },

	  /**
	   *   ('(' supports condition ')')
	   * | feature
	   */

	  supportsFeature: function(){
	    this.skipSpacesAndComments();
	    if ('(' == this.peek().type) {
	      var la = this.lookahead(2).type;

	      if ('ident' == la || '{' == la) {
	        return this.feature();
	      } else {
	        this.expect('(');
	        var node = new nodes.Expression;
	        node.push(new nodes.Literal('('));
	        node.push(this.supportsCondition());
	        this.expect(')');
	        node.push(new nodes.Literal(')'));
	        this.skipSpacesAndComments();
	        return node;
	      }
	    }
	  },

	  /**
	   * extend
	   */

	  extend: function(){
	    var tok = this.expect('extend')
	      , selectors = []
	      , sel
	      , node
	      , arr;

	    do {
	      arr = this.selectorParts();

	      if (!arr.length) continue;

	      sel = new nodes.Selector(arr);
	      selectors.push(sel);

	      if ('!' !== this.peek().type) continue;

	      tok = this.lookahead(2);
	      if ('ident' !== tok.type || 'optional' !== tok.val.name) continue;

	      this.skip(['!', 'ident']);
	      sel.optional = true;
	    } while(this.accept(','));

	    node = new nodes.Extend(selectors);
	    node.lineno = tok.lineno;
	    node.column = tok.column;
	    return node;
	  },

	  /**
	   * media queries
	   */

	  media: function() {
	    this.expect('media');
	    this.state.push('atrule');
	    var media = new nodes.Media(this.queries());
	    media.block = this.block(media);
	    this.state.pop();
	    return media;
	  },

	  /**
	   * query (',' query)*
	   */

	  queries: function() {
	    var queries = new nodes.QueryList
	      , skip = ['comment', 'newline', 'space'];

	    do {
	      this.skip(skip);
	      queries.push(this.query());
	      this.skip(skip);
	    } while (this.accept(','));
	    return queries;
	  },

	  /**
	   *   expression
	   * | (ident | 'not')? ident ('and' feature)*
	   * | feature ('and' feature)*
	   */

	  query: function() {
	    var query = new nodes.Query
	      , expr
	      , pred
	      , id;

	    // hash values support
	    if ('ident' == this.peek().type
	      && ('.' == this.lookahead(2).type
	      || '[' == this.lookahead(2).type)) {
	      this.cond = true;
	      expr = this.expression();
	      this.cond = false;
	      query.push(new nodes.Feature(expr.nodes));
	      return query;
	    }

	    if (pred = this.accept('ident') || this.accept('not')) {
	      pred = new nodes.Literal(pred.val.string || pred.val);

	      this.skipSpacesAndComments();
	      if (id = this.accept('ident')) {
	        query.type = id.val;
	        query.predicate = pred;
	      } else {
	        query.type = pred;
	      }
	      this.skipSpacesAndComments();

	      if (!this.accept('&&')) return query;
	    }

	    do {
	      query.push(this.feature());
	    } while (this.accept('&&'));

	    return query;
	  },

	  /**
	   * '(' ident ( ':'? expression )? ')'
	   */

	  feature: function() {
	    this.skipSpacesAndComments();
	    this.expect('(');
	    this.skipSpacesAndComments();
	    var node = new nodes.Feature(this.interpolate());
	    this.skipSpacesAndComments();
	    this.accept(':');
	    this.skipSpacesAndComments();
	    this.inProperty = true;
	    node.expr = this.list();
	    this.inProperty = false;
	    this.skipSpacesAndComments();
	    this.expect(')');
	    this.skipSpacesAndComments();
	    return node;
	  },

	  /**
	   * @-moz-document call (',' call)* block
	   */

	  mozdocument: function(){
	    this.expect('-moz-document');
	    var mozdocument = new nodes.Atrule('-moz-document')
	      , calls = [];
	    do {
	      this.skipSpacesAndComments();
	      calls.push(this.functionCall());
	      this.skipSpacesAndComments();
	    } while (this.accept(','));
	    mozdocument.segments = [new nodes.Literal(calls.join(', '))];
	    this.state.push('atrule');
	    mozdocument.block = this.block(mozdocument, false);
	    this.state.pop();
	    return mozdocument;
	  },

	  /**
	   * import expression
	   */

	  import: function() {
	    this.expect('import');
	    this.allowPostfix = true;
	    return new nodes.Import(this.expression(), false);
	  },

	  /**
	   * require expression
	   */

	  require: function() {
	    this.expect('require');
	    this.allowPostfix = true;
	    return new nodes.Import(this.expression(), true);
	  },

	  /**
	   * charset string
	   */

	  charset: function() {
	    this.expect('charset');
	    var str = this.expect('string').val;
	    this.allowPostfix = true;
	    return new nodes.Charset(str);
	  },

	  /**
	   * namespace ident? (string | url)
	   */

	  namespace: function() {
	    var str
	      , prefix;
	    this.expect('namespace');

	    this.skipSpacesAndComments();
	    if (prefix = this.accept('ident')) {
	      prefix = prefix.val;
	    }
	    this.skipSpacesAndComments();

	    str = this.accept('string') || this.url();
	    this.allowPostfix = true;
	    return new nodes.Namespace(str, prefix);
	  },

	  /**
	   * keyframes name block
	   */

	  keyframes: function() {
	    var tok = this.expect('keyframes')
	      , keyframes;

	    this.skipSpacesAndComments();
	    keyframes = new nodes.Keyframes(this.selectorParts(), tok.val);
	    this.skipSpacesAndComments();

	    // block
	    this.state.push('atrule');
	    keyframes.block = this.block(keyframes);
	    this.state.pop();

	    return keyframes;
	  },

	  /**
	   * literal
	   */

	  literal: function() {
	    return this.expect('literal').val;
	  },

	  /**
	   * ident space?
	   */

	  id: function() {
	    var tok = this.expect('ident');
	    this.accept('space');
	    return tok.val;
	  },

	  /**
	   *   ident
	   * | assignment
	   * | property
	   * | selector
	   */

	  ident: function() {
	    var i = 2
	      , la = this.lookahead(i).type;

	    while ('space' == la) la = this.lookahead(++i).type;

	    switch (la) {
	      // Assignment
	      case '=':
	      case '?=':
	      case '-=':
	      case '+=':
	      case '*=':
	      case '/=':
	      case '%=':
	        return this.assignment();
	      // Member
	      case '.':
	        if ('space' == this.lookahead(i - 1).type) return this.selector();
	        if (this._ident == this.peek()) return this.id();
	        while ('=' != this.lookahead(++i).type
	          && !~['[', ',', 'newline', 'indent', 'eos'].indexOf(this.lookahead(i).type)) ;
	        if ('=' == this.lookahead(i).type) {
	          this._ident = this.peek();
	          return this.expression();
	        } else if (this.looksLikeSelector() && this.stateAllowsSelector()) {
	          return this.selector();
	        }
	      // Assignment []=
	      case '[':
	        if (this._ident == this.peek()) return this.id();
	        while (']' != this.lookahead(i++).type
	          && 'selector' != this.lookahead(i).type
	          && 'eos' != this.lookahead(i).type) ;
	        if ('=' == this.lookahead(i).type) {
	          this._ident = this.peek();
	          return this.expression();
	        } else if (this.looksLikeSelector() && this.stateAllowsSelector()) {
	          return this.selector();
	        }
	      // Operation
	      case '-':
	      case '+':
	      case '/':
	      case '*':
	      case '%':
	      case '**':
	      case '&&':
	      case '||':
	      case '>':
	      case '<':
	      case '>=':
	      case '<=':
	      case '!=':
	      case '==':
	      case '?':
	      case 'in':
	      case 'is a':
	      case 'is defined':
	        // Prevent cyclic .ident, return literal
	        if (this._ident == this.peek()) {
	          return this.id();
	        } else {
	          this._ident = this.peek();
	          switch (this.currentState()) {
	            // unary op or selector in property / for
	            case 'for':
	            case 'selector':
	              return this.property();
	            // Part of a selector
	            case 'root':
	            case 'atblock':
	            case 'atrule':
	              return '[' == la
	                ? this.subscript()
	                : this.selector();
	            case 'function':
	            case 'conditional':
	              return this.looksLikeSelector()
	                ? this.selector()
	                : this.expression();
	            // Do not disrupt the ident when an operand
	            default:
	              return this.operand
	                ? this.id()
	                : this.expression();
	          }
	        }
	      // Selector or property
	      default:
	        switch (this.currentState()) {
	          case 'root':
	            return this.selector();
	          case 'for':
	          case 'selector':
	          case 'function':
	          case 'conditional':
	          case 'atblock':
	          case 'atrule':
	            return this.property();
	          default:
	            var id = this.id();
	            if ('interpolation' == this.previousState()) id.mixin = true;
	            return id;
	        }
	    }
	  },

	  /**
	   * '*'? (ident | '{' expression '}')+
	   */

	  interpolate: function() {
	    var node
	      , segs = []
	      , star;

	    star = this.accept('*');
	    if (star) segs.push(new nodes.Literal('*'));

	    while (true) {
	      if (this.accept('{')) {
	        this.state.push('interpolation');
	        segs.push(this.expression());
	        this.expect('}');
	        this.state.pop();
	      } else if (node = this.accept('-')){
	        segs.push(new nodes.Literal('-'));
	      } else if (node = this.accept('ident')){
	        segs.push(node.val);
	      } else {
	        break;
	      }
	    }
	    if (!segs.length) this.expect('ident');
	    return segs;
	  },

	  /**
	   *   property ':'? expression
	   * | ident
	   */

	  property: function() {
	    if (this.looksLikeSelector(true)) return this.selector();

	    // property
	    var ident = this.interpolate()
	      , prop = new nodes.Property(ident)
	      , ret = prop;

	    // optional ':'
	    this.accept('space');
	    if (this.accept(':')) this.accept('space');

	    this.state.push('property');
	    this.inProperty = true;
	    prop.expr = this.list();
	    if (prop.expr.isEmpty) ret = ident[0];
	    this.inProperty = false;
	    this.allowPostfix = true;
	    this.state.pop();

	    // optional ';'
	    this.accept(';');

	    return ret;
	  },

	  /**
	   *   selector ',' selector
	   * | selector newline selector
	   * | selector block
	   */

	  selector: function() {
	    var arr
	      , group = new nodes.Group
	      , scope = this.selectorScope
	      , isRoot = 'root' == this.currentState()
	      , selector;

	    do {
	      // Clobber newline after ,
	      this.accept('newline');

	      arr = this.selectorParts();

	      // Push the selector
	      if (isRoot && scope) arr.unshift(new nodes.Literal(scope + ' '));
	      if (arr.length) {
	        selector = new nodes.Selector(arr);
	        selector.lineno = arr[0].lineno;
	        selector.column = arr[0].column;
	        group.push(selector);
	      }
	    } while (this.accept(',') || this.accept('newline'));

	    if ('selector-parts' == this.currentState()) return group.nodes;

	    this.state.push('selector');
	    group.block = this.block(group);
	    this.state.pop();

	    return group;
	  },

	  selectorParts: function(){
	    var tok
	      , arr = [];

	    // Selector candidates,
	    // stitched together to
	    // form a selector.
	    while (tok = this.selectorToken()) {
	      debug.selector('%s', tok);
	      // Selector component
	      switch (tok.type) {
	        case '{':
	          this.skipSpaces();
	          var expr = this.expression();
	          this.skipSpaces();
	          this.expect('}');
	          arr.push(expr);
	          break;
	        case this.prefix && '.':
	          var literal = new nodes.Literal(tok.val + this.prefix);
	          literal.prefixed = true;
	          arr.push(literal);
	          break;
	        case 'comment':
	          // ignore comments
	          break;
	        case 'color':
	        case 'unit':
	          arr.push(new nodes.Literal(tok.val.raw));
	          break;
	        case 'space':
	          arr.push(new nodes.Literal(' '));
	          break;
	        case 'function':
	          arr.push(new nodes.Literal(tok.val.name + '('));
	          break;
	        case 'ident':
	          arr.push(new nodes.Literal(tok.val.name || tok.val.string));
	          break;
	        default:
	          arr.push(new nodes.Literal(tok.val));
	          if (tok.space) arr.push(new nodes.Literal(' '));
	      }
	    }

	    return arr;
	  },

	  /**
	   * ident ('=' | '?=') expression
	   */

	  assignment: function() {
	    var op
	      , node
	      , name = this.id().name;

	    if (op =
	         this.accept('=')
	      || this.accept('?=')
	      || this.accept('+=')
	      || this.accept('-=')
	      || this.accept('*=')
	      || this.accept('/=')
	      || this.accept('%=')) {
	      this.state.push('assignment');
	      var expr = this.list();
	      // @block support
	      if (expr.isEmpty) this.assignAtblock(expr);
	      node = new nodes.Ident(name, expr);
	      this.state.pop();

	      switch (op.type) {
	        case '?=':
	          var defined = new nodes.BinOp('is defined', node)
	            , lookup = new nodes.Expression;
	          lookup.push(new nodes.Ident(name));
	          node = new nodes.Ternary(defined, lookup, node);
	          break;
	        case '+=':
	        case '-=':
	        case '*=':
	        case '/=':
	        case '%=':
	          node.val = new nodes.BinOp(op.type[0], new nodes.Ident(name), expr);
	          break;
	      }
	    }

	    return node;
	  },

	  /**
	   *   definition
	   * | call
	   */

	  function: function() {
	    var parens = 1
	      , i = 2
	      , tok;

	    // Lookahead and determine if we are dealing
	    // with a function call or definition. Here
	    // we pair parens to prevent false negatives
	    out:
	    while (tok = this.lookahead(i++)) {
	      switch (tok.type) {
	        case 'function':
	        case '(':
	          ++parens;
	          break;
	        case ')':
	          if (!--parens) break out;
	          break;
	        case 'eos':
	          this.error('failed to find closing paren ")"');
	      }
	    }

	    // Definition or call
	    switch (this.currentState()) {
	      case 'expression':
	        return this.functionCall();
	      default:
	        return this.looksLikeFunctionDefinition(i)
	          ? this.functionDefinition()
	          : this.expression();
	    }
	  },

	  /**
	   * url '(' (expression | urlchars)+ ')'
	   */

	  url: function() {
	    this.expect('function');
	    this.state.push('function arguments');
	    var args = this.args();
	    this.expect(')');
	    this.state.pop();
	    return new nodes.Call('url', args);
	  },

	  /**
	   * '+'? ident '(' expression ')' block?
	   */

	  functionCall: function() {
	    var withBlock = this.accept('+');
	    if ('url' == this.peek().val.name) return this.url();
	    var name = this.expect('function').val.name;
	    this.state.push('function arguments');
	    this.parens++;
	    var args = this.args();
	    this.expect(')');
	    this.parens--;
	    this.state.pop();
	    var call = new nodes.Call(name, args);
	    if (withBlock) {
	      this.state.push('function');
	      call.block = this.block(call);
	      this.state.pop();
	    }
	    return call;
	  },

	  /**
	   * ident '(' params ')' block
	   */

	  functionDefinition: function() {
	    var name = this.expect('function').val.name;

	    // params
	    this.state.push('function params');
	    this.skipWhitespace();
	    var params = this.params();
	    this.skipWhitespace();
	    this.expect(')');
	    this.state.pop();

	    // Body
	    this.state.push('function');
	    var fn = new nodes.Function(name, params);
	    fn.block = this.block(fn);
	    this.state.pop();
	    return new nodes.Ident(name, fn);
	  },

	  /**
	   *   ident
	   * | ident '...'
	   * | ident '=' expression
	   * | ident ',' ident
	   */

	  params: function() {
	    var tok
	      , node
	      , params = new nodes.Params;
	    while (tok = this.accept('ident')) {
	      this.accept('space');
	      params.push(node = tok.val);
	      if (this.accept('...')) {
	        node.rest = true;
	      } else if (this.accept('=')) {
	        node.val = this.expression();
	      }
	      this.skipWhitespace();
	      this.accept(',');
	      this.skipWhitespace();
	    }
	    return params;
	  },

	  /**
	   * (ident ':')? expression (',' (ident ':')? expression)*
	   */

	  args: function() {
	    var args = new nodes.Arguments
	      , keyword;

	    do {
	      // keyword
	      if ('ident' == this.peek().type && ':' == this.lookahead(2).type) {
	        keyword = this.next().val.string;
	        this.expect(':');
	        args.map[keyword] = this.expression();
	      // arg
	      } else {
	        args.push(this.expression());
	      }
	    } while (this.accept(','));

	    return args;
	  },

	  /**
	   * expression (',' expression)*
	   */

	  list: function() {
	    var node = this.expression();

	    while (this.accept(',')) {
	      if (node.isList) {
	        list.push(this.expression());
	      } else {
	        var list = new nodes.Expression(true);
	        list.push(node);
	        list.push(this.expression());
	        node = list;
	      }
	    }
	    return node;
	  },

	  /**
	   * negation+
	   */

	  expression: function() {
	    var node
	      , expr = new nodes.Expression;
	    this.state.push('expression');
	    while (node = this.negation()) {
	      if (!node) this.error('unexpected token {peek} in expression');
	      expr.push(node);
	    }
	    this.state.pop();
	    if (expr.nodes.length) {
	      expr.lineno = expr.nodes[0].lineno;
	      expr.column = expr.nodes[0].column;
	    }
	    return expr;
	  },

	  /**
	   *   'not' ternary
	   * | ternary
	   */

	  negation: function() {
	    if (this.accept('not')) {
	      return new nodes.UnaryOp('!', this.negation());
	    }
	    return this.ternary();
	  },

	  /**
	   * logical ('?' expression ':' expression)?
	   */

	  ternary: function() {
	    var node = this.logical();
	    if (this.accept('?')) {
	      var trueExpr = this.expression();
	      this.expect(':');
	      var falseExpr = this.expression();
	      node = new nodes.Ternary(node, trueExpr, falseExpr);
	    }
	    return node;
	  },

	  /**
	   * typecheck (('&&' | '||') typecheck)*
	   */

	  logical: function() {
	    var op
	      , node = this.typecheck();
	    while (op = this.accept('&&') || this.accept('||')) {
	      node = new nodes.BinOp(op.type, node, this.typecheck());
	    }
	    return node;
	  },

	  /**
	   * equality ('is a' equality)*
	   */

	  typecheck: function() {
	    var op
	      , node = this.equality();
	    while (op = this.accept('is a')) {
	      this.operand = true;
	      if (!node) this.error('illegal unary "' + op + '", missing left-hand operand');
	      node = new nodes.BinOp(op.type, node, this.equality());
	      this.operand = false;
	    }
	    return node;
	  },

	  /**
	   * in (('==' | '!=') in)*
	   */

	  equality: function() {
	    var op
	      , node = this.in();
	    while (op = this.accept('==') || this.accept('!=')) {
	      this.operand = true;
	      if (!node) this.error('illegal unary "' + op + '", missing left-hand operand');
	      node = new nodes.BinOp(op.type, node, this.in());
	      this.operand = false;
	    }
	    return node;
	  },

	  /**
	   * relational ('in' relational)*
	   */

	  in: function() {
	    var node = this.relational();
	    while (this.accept('in')) {
	      this.operand = true;
	      if (!node) this.error('illegal unary "in", missing left-hand operand');
	      node = new nodes.BinOp('in', node, this.relational());
	      this.operand = false;
	    }
	    return node;
	  },

	  /**
	   * range (('>=' | '<=' | '>' | '<') range)*
	   */

	  relational: function() {
	    var op
	      , node = this.range();
	    while (op =
	         this.accept('>=')
	      || this.accept('<=')
	      || this.accept('<')
	      || this.accept('>')
	      ) {
	      this.operand = true;
	      if (!node) this.error('illegal unary "' + op + '", missing left-hand operand');
	      node = new nodes.BinOp(op.type, node, this.range());
	      this.operand = false;
	    }
	    return node;
	  },

	  /**
	   * additive (('..' | '...') additive)*
	   */

	  range: function() {
	    var op
	      , node = this.additive();
	    if (op = this.accept('...') || this.accept('..')) {
	      this.operand = true;
	      if (!node) this.error('illegal unary "' + op + '", missing left-hand operand');
	      node = new nodes.BinOp(op.val, node, this.additive());
	      this.operand = false;
	    }
	    return node;
	  },

	  /**
	   * multiplicative (('+' | '-') multiplicative)*
	   */

	  additive: function() {
	    var op
	      , node = this.multiplicative();
	    while (op = this.accept('+') || this.accept('-')) {
	      this.operand = true;
	      node = new nodes.BinOp(op.type, node, this.multiplicative());
	      this.operand = false;
	    }
	    return node;
	  },

	  /**
	   * defined (('**' | '*' | '/' | '%') defined)*
	   */

	  multiplicative: function() {
	    var op
	      , node = this.defined();
	    while (op =
	         this.accept('**')
	      || this.accept('*')
	      || this.accept('/')
	      || this.accept('%')) {
	      this.operand = true;
	      if ('/' == op && this.inProperty && !this.parens) {
	        this.stash.push(new Token('literal', new nodes.Literal('/')));
	        this.operand = false;
	        return node;
	      } else {
	        if (!node) this.error('illegal unary "' + op + '", missing left-hand operand');
	        node = new nodes.BinOp(op.type, node, this.defined());
	        this.operand = false;
	      }
	    }
	    return node;
	  },

	  /**
	   *    unary 'is defined'
	   *  | unary
	   */

	  defined: function() {
	    var node = this.unary();
	    if (this.accept('is defined')) {
	      if (!node) this.error('illegal unary "is defined", missing left-hand operand');
	      node = new nodes.BinOp('is defined', node);
	    }
	    return node;
	  },

	  /**
	   *   ('!' | '~' | '+' | '-') unary
	   * | subscript
	   */

	  unary: function() {
	    var op
	      , node;
	    if (op =
	         this.accept('!')
	      || this.accept('~')
	      || this.accept('+')
	      || this.accept('-')) {
	      this.operand = true;
	      node = this.unary();
	      if (!node) this.error('illegal unary "' + op + '"');
	      node = new nodes.UnaryOp(op.type, node);
	      this.operand = false;
	      return node;
	    }
	    return this.subscript();
	  },

	  /**
	   *   member ('[' expression ']')+ '='?
	   * | member
	   */

	  subscript: function() {
	    var node = this.member()
	      ;
	    while (this.accept('[')) {
	      node = new nodes.BinOp('[]', node, this.expression());
	      this.expect(']');
	    }
	    // TODO: TernaryOp :)
	    if (this.accept('=')) {
	      node.op += '=';
	      node.val = this.list();
	      // @block support
	      if (node.val.isEmpty) this.assignAtblock(node.val);
	    }
	    return node;
	  },

	  /**
	   *   primary ('.' id)+ '='?
	   * | primary
	   */
	  
	  member: function() {
	    var node = this.primary();
	    if (node) {
	      while (this.accept('.')) {
	        var id = new nodes.Ident(this.expect('ident').val.string);
	        node = new nodes.Member(node, id);
	      }
	      this.skipSpaces();
	      if (this.accept('=')) {
	        node.val = this.list();
	        // @block support
	        if (node.val.isEmpty) this.assignAtblock(node.val);
	      }
	    }
	    return node;
	  },

	  /**
	   *   '{' '}'
	   * | '{' pair (ws pair)* '}'
	   */

	  object: function(){
	    var obj = new nodes.Object
	      , id, val, comma;
	    this.expect('{');
	    this.skipWhitespace();

	    while (!this.accept('}')) {
	      if (this.accept('comment')
	        || this.accept('newline')) continue;

	      if (!comma) this.accept(',');
	      id = this.accept('ident') || this.accept('string');
	      if (!id) this.error('expected "ident" or "string", got {peek}');
	      id = id.val.hash;
	      this.skipSpacesAndComments();
	      this.expect(':');
	      val = this.expression();
	      obj.set(id, val);
	      comma = this.accept(',');
	      this.skipWhitespace();
	    }

	    return obj;
	  },

	  /**
	   *   unit
	   * | null
	   * | color
	   * | string
	   * | ident
	   * | boolean
	   * | literal
	   * | object
	   * | atblock
	   * | atrule
	   * | '(' expression ')' '%'?
	   */

	  primary: function() {
	    var tok;
	    this.skipSpaces();

	    // Parenthesis
	    if (this.accept('(')) {
	      ++this.parens;
	      var expr = this.expression()
	        , paren = this.expect(')');
	      --this.parens;
	      if (this.accept('%')) expr.push(new nodes.Ident('%'));
	      tok = this.peek();
	      // (1 + 2)px, (1 + 2)em, etc.
	      if (!paren.space
	        && 'ident' == tok.type
	        && ~units$1.indexOf(tok.val.string)) {
	        expr.push(new nodes.Ident(tok.val.string));
	        this.next();
	      }
	      return expr;
	    }

	    tok = this.peek();

	    // Primitive
	    switch (tok.type) {
	      case 'null':
	      case 'unit':
	      case 'color':
	      case 'string':
	      case 'literal':
	      case 'boolean':
	      case 'comment':
	        return this.next().val;
	      case !this.cond && '{':
	        return this.object();
	      case 'atblock':
	        return this.atblock();
	      // property lookup
	      case 'atrule':
	        var id = new nodes.Ident(this.next().val);
	        id.property = true;
	        return id;
	      case 'ident':
	        return this.ident();
	      case 'function':
	        return tok.anonymous
	          ? this.functionDefinition()
	          : this.functionCall();
	    }
	  }
	};
	return parserExports$1;
}

var parserExports = requireParser();
var Parser = /*@__PURE__*/getDefaultExportFromCjs(parserExports);

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

var browser = invariant;

function repeatString(str, num) {
  return num > 0 ? str.repeat(num) : '';
}

function nodesToJSON(nodes) {
  return nodes.map(function (node) {
    return Object.assign({
      // default in case not in node
      nodes: []
    }, node.toJSON());
  });
}

function trimFirst(str) {
  return str.replace(/(^\s*)/g, '');
}

function replaceFirstATSymbol(str) {
  var temp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '$';

  return str.replace(/^\$|/, temp);
}

function getCharLength(str, char) {
  return str.split(char).length - 1;
}

function _get$1(obj, pathArray, defaultValue) {
  if (obj == null) return defaultValue;

  var value = obj;

  pathArray = [].concat(pathArray);

  for (var i = 0; i < pathArray.length; i += 1) {
    var key = pathArray[i];
    value = value[key];
    if (value == null) {
      return defaultValue;
    }
  }

  return value;
}

var quote = '\'';
var callName = '';
var oldLineno = 1;
var paramsLength = 0;
var returnSymbol = '';
var indentationLevel = 0;
var OBJECT_KEY_LIST = [];
var FUNCTION_PARAMS = [];
var PROPERTY_LIST = [];
var VARIABLE_NAME_LIST = [];
var GLOBAL_MIXIN_NAME_LIST = [];
var GLOBAL_VARIABLE_NAME_LIST = [];
var lastPropertyLineno = 0;
var lastPropertyLength = 0;

var isCall = false;
var isCond = false;
var isNegate = false;
var isObject = false;
var isFunction = false;
var isProperty = false;
var isNamespace = false;
var isKeyframes = false;
var isArguments = false;
var isExpression = false;
var isCallParams = false;
var isIfExpression = false;

var isBlock = false;
var ifLength = 0;
var binOpLength = 0;
var identLength = 0;
var selectorLength = 0;
var nodesIndex = 0;
var nodesLength = 0;

var autoprefixer = true;

var OPEARTION_MAP = {
  '&&': 'and',
  '!': 'not',
  '||': 'or'
};

var KEYFRAMES_LIST = ['@-webkit-keyframes ', '@-moz-keyframes ', '@-ms-keyframes ', '@-o-keyframes ', '@keyframes '];

var TYPE_VISITOR_MAP = {
  If: visitIf,
  Null: visitNull,
  Each: visitEach,
  RGBA: visitRGBA,
  Unit: visitUnit,
  Call: visitCall,
  Block: visitBlock,
  BinOp: visitBinOp,
  Ident: visitIdent,
  Group: visitGroup,
  Query: visitQuery,
  Media: visitMedia,
  Import: visitImport,
  Atrule: visitAtrule,
  Extend: visitExtend,
  Member: visitMember,
  Return: visitReturn,
  'Object': visitObject,
  'String': visitString,
  Feature: visitFeature,
  Ternary: visitTernary,
  UnaryOp: visitUnaryOp,
  Literal: visitLiteral,
  Charset: visitCharset,
  Params: visitArguments,
  'Comment': visitComment,
  Property: visitProperty,
  'Boolean': visitBoolean,
  Selector: visitSelector,
  Supports: visitSupports,
  'Function': visitFunction,
  Arguments: visitArguments,
  Keyframes: visitKeyframes,
  QueryList: visitQueryList,
  Namespace: visitNamespace,
  Expression: visitExpression
};

function handleLineno(lineno) {
  return repeatString('\n', lineno - oldLineno);
}

function trimFnSemicolon(res) {
  return res.replace(/\);/g, ')');
}

function trimSemicolon(res) {
  var symbol = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  return res.replace(/;/g, '') + symbol;
}

function isCallMixin() {
  return !ifLength && !isProperty && !isObject && !isNamespace && !isKeyframes && !isArguments && !identLength && !isCond && !isCallParams && !returnSymbol;
}

function isFunctinCallMixin(node) {
  if (node.__type === 'Call') {
    return node.block.scope || GLOBAL_MIXIN_NAME_LIST.indexOf(node.name) > -1;
  } else {
    return node.__type === 'If' && isFunctionMixin(node.block.nodes);
  }
}

function hasPropertyOrGroup(node) {
  return node.__type === 'Property' || node.__type === 'Group' || node.__type === 'Atrule' || node.__type === 'Media';
}

function isFunctionMixin(nodes) {
  browser(nodes, 'Missing nodes param');
  var jsonNodes = nodesToJSON(nodes);
  return jsonNodes.some(function (node) {
    return hasPropertyOrGroup(node) || isFunctinCallMixin(node);
  });
}

function getIndentation() {
  return repeatString(' ', indentationLevel * 2);
}

function handleLinenoAndIndentation(_ref) {
  var lineno = _ref.lineno;

  return handleLineno(lineno) + getIndentation();
}

function findNodesType(list, type) {
  var nodes = nodesToJSON(list);
  return nodes.find(function (node) {
    return node.__type === type;
  });
}

function visitNode(node) {
  if (!node) return '';
  if (!node.nodes) {
    // guarantee to be an array
    node.nodes = [];
  }
  var json = node.__type ? node : node.toJSON && node.toJSON();
  var handler = TYPE_VISITOR_MAP[json.__type];
  return handler ? handler(node) : '';
}

function recursiveSearchName(data, property, name) {
  return data[property] ? recursiveSearchName(data[property], property, name) : data[name];
}

// 处理 nodes
function visitNodes() {
  var list = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  var text = '';
  var nodes = nodesToJSON(list);
  nodesLength = nodes.length;
  nodes.forEach(function (node, i) {
    nodesIndex = i;
    if (node.__type === 'Comment') {
      var isInlineComment = nodes[i - 1] && nodes[i - 1].lineno === node.lineno;
      text += visitComment(node, isInlineComment);
    } else {
      text += visitNode(node);
    }
  });
  nodesIndex = 0;
  nodesLength = 0;
  return text;
}

function visitNull() {
  return null;
}

// 处理 import；handler import
function visitImport(node) {
  browser(node, 'Missing node param');
  var before = handleLineno(node.lineno) + '@import ';
  oldLineno = node.lineno;
  var quote = '';
  var text = '';
  var nodes = nodesToJSON(node.path.nodes || []);
  nodes.forEach(function (node) {
    text += node.val;
    if (!quote && node.quote) quote = node.quote;
  });
  var result = text.replace(/\.styl$/g, '.scss');
  return '' + before + quote + result + quote + ';';
}

function visitSelector(node) {
  selectorLength++;
  browser(node, 'Missing node param');
  var nodes = nodesToJSON(node.segments);
  var endNode = nodes[nodes.length - 1];
  var before = '';
  if (endNode.lineno) {
    before = handleLineno(endNode.lineno);
    oldLineno = endNode.lineno;
  }
  before += getIndentation();
  var segmentText = visitNodes(node.segments);
  selectorLength--;
  return before + segmentText;
}

function visitGroup(node) {
  browser(node, 'Missing node param');
  handleLinenoAndIndentation(node);
  oldLineno = node.lineno;
  var nodes = nodesToJSON(node.nodes);
  var selector = '';
  nodes.forEach(function (node, idx) {
    var temp = visitNode(node);
    var result = /^\n/.test(temp) ? temp : temp.replace(/^\s*/, '');
    selector += idx ? ', ' + result : result;
  });
  var block = visitBlock(node.block);
  if (isKeyframes && /-|\*|\+|\/|\$/.test(selector)) {
    var len = getCharLength(selector, ' ') - 2;
    return '\n' + repeatString(' ', len) + '#{' + trimFirst(selector) + '}' + block;
  }
  return selector + block;
}

function visitBlock(node) {
  isBlock = true;
  browser(node, 'Missing node param');
  indentationLevel++;
  var before = ' {';
  var after = '\n' + repeatString(' ', (indentationLevel - 1) * 2) + '}';
  var text = visitNodes(node.nodes);
  var result = text;
  if (isFunction && !/@return/.test(text)) {
    result = '';
    var symbol = repeatString(' ', indentationLevel * 2);
    if (!/\n/.test(text)) {
      result += '\n';
      oldLineno++;
    }
    if (!/\s/.test(text)) result += symbol;
    result += returnSymbol + text;
  }
  if (!/^\n\s*/.test(result)) result = '\n' + repeatString(' ', indentationLevel * 2) + result;
  indentationLevel--;
  isBlock = false;
  return '' + before + result + after;
}

function visitLiteral(node) {
  browser(node, 'Missing node param');
  return node.val || '';
}

function visitProperty(_ref2) {
  var expr = _ref2.expr,
      lineno = _ref2.lineno,
      segments = _ref2.segments;

  var suffix = ';';
  var before = handleLinenoAndIndentation({ lineno: lineno });
  oldLineno = lineno;
  isProperty = true;
  var segmentsText = visitNodes(segments);

  lastPropertyLineno = lineno;
  // segmentsText length plus semicolon and space
  lastPropertyLength = segmentsText.length + 2;
  if (_get$1(expr, ['nodes', 'length']) === 1) {
    var expNode = expr.nodes[0];
    var ident = expNode.toJSON && expNode.toJSON() || {};
    if (ident.__type === 'Ident') {
      var identVal = _get$1(ident, ['val', 'toJSON']) && ident.val.toJSON() || {};
      if (identVal.__type === 'Expression') {
        var beforeExpText = before + trimFirst(visitExpression(expr));
        var _expText = '' + before + segmentsText + ': $' + ident.name + ';';
        isProperty = false;
        PROPERTY_LIST.unshift({ prop: segmentsText, value: '$' + ident.name });
        return beforeExpText + _expText;
      }
    }
  }
  var expText = visitExpression(expr);
  PROPERTY_LIST.unshift({ prop: segmentsText, value: expText });
  isProperty = false;
  return (/\/\//.test(expText) ? before + segmentsText.replace(/^$/, '') + ': ' + expText : trimSemicolon(before + segmentsText.replace(/^$/, '') + ': ' + (expText + suffix), ';')
  );
}

function visitIdent(_ref3) {
  var val = _ref3.val,
      name = _ref3.name,
      rest = _ref3.rest,
      mixin = _ref3.mixin,
      property = _ref3.property;

  identLength++;
  var identVal = val && val.toJSON() || '';
  if (identVal.__type === 'Null' || !val) {
    if (isExpression) {
      if (property || isCall) {
        var propertyVal = PROPERTY_LIST.find(function (item) {
          return item.prop === name;
        });
        if (propertyVal) {
          identLength--;
          return propertyVal.value;
        }
      }
    }
    if (selectorLength && isExpression && !binOpLength) {
      identLength--;
      return '#{' + name + '}';
    }
    if (mixin) {
      identLength--;
      return name === 'block' ? '@content;' : '#{$' + name + '}';
    }
    var nameText = VARIABLE_NAME_LIST.indexOf(name) > -1 || GLOBAL_VARIABLE_NAME_LIST.indexOf(name) > -1 ? replaceFirstATSymbol(name) : name;
    if (FUNCTION_PARAMS.indexOf(name) > -1) nameText = replaceFirstATSymbol(nameText);
    identLength--;
    return rest ? nameText + '...' : nameText;
  }
  if (identVal.__type === 'Expression') {
    if (findNodesType(identVal.nodes, 'Object')) OBJECT_KEY_LIST.push(name);
    var before = handleLinenoAndIndentation(identVal);
    oldLineno = identVal.lineno;
    var nodes = nodesToJSON(identVal.nodes || []);
    var expText = '';
    nodes.forEach(function (node, idx) {
      expText += idx ? ' ' + visitNode(node) : visitNode(node);
    });
    VARIABLE_NAME_LIST.push(name);
    identLength--;
    return '' + before + replaceFirstATSymbol(name) + ': ' + trimFnSemicolon(expText) + ';';
  }
  if (identVal.__type === 'Function') {
    identLength--;
    return visitFunction(identVal);
  }
  var identText = visitNode(identVal);
  identLength--;
  return replaceFirstATSymbol(name) + ': ' + identText + ';';
}

function visitExpression(node) {
  browser(node, 'Missing node param');
  isExpression = true;
  var nodes = nodesToJSON(node.nodes);
  var comments = [];
  var subLineno = 0;
  var result = '';
  var before = '';

  if (nodes.every(function (node) {
    return node.__type !== 'Expression';
  })) {
    subLineno = nodes.map(function (node) {
      return node.lineno;
    }).sort(function (curr, next) {
      return next - curr;
    })[0];
  }

  var space = '';
  if (subLineno > node.lineno) {
    before = handleLineno(subLineno);
    oldLineno = subLineno;
    if (subLineno > lastPropertyLineno) space = repeatString(' ', lastPropertyLength);
  } else {
    before = handleLineno(node.lineno);
    var callNode = nodes.find(function (node) {
      return node.__type === 'Call';
    });
    if (callNode && !isObject && !isCallMixin()) space = repeatString(' ', lastPropertyLength);
    oldLineno = node.lineno;
  }

  nodes.forEach(function (node, idx) {
    // handle inline comment
    if (node.__type === 'Comment') {
      comments.push(node);
    } else {
      var nodeText = visitNode(node);
      var _symbol = isProperty && node.nodes.length ? ',' : '';
      result += idx ? _symbol + ' ' + nodeText : nodeText;
    }
  });

  var commentText = comments.map(function (node) {
    return visitNode(node);
  }).join(' ');
  commentText = commentText.replace(/^ +/, ' ');

  isExpression = false;

  if (isProperty && /\);/g.test(result)) result = trimFnSemicolon(result) + ';';
  if (commentText) result = result + ';' + commentText;
  if (isCall || binOpLength) {
    if (callName === 'url') return result.replace(/\s/g, '');
    return result;
  }

  if (!returnSymbol || isIfExpression) {
    return before && space ? trimSemicolon(before + getIndentation() + space + result, ';') : result;
  }
  var symbol = '';
  if (nodesIndex + 1 === nodesLength) symbol = returnSymbol;
  return before + getIndentation() + symbol + result;
}

function visitCall(_ref4) {
  var name = _ref4.name,
      args = _ref4.args,
      lineno = _ref4.lineno,
      block = _ref4.block;

  isCall = true;
  callName = name;
  var blockText = '';
  var before = handleLineno(lineno);
  oldLineno = lineno;
  if (isCallMixin() || block || selectorLength || GLOBAL_MIXIN_NAME_LIST.indexOf(callName) > -1) {
    before = before || '\n';
    before += getIndentation();
    before += '@include ';
  }
  var argsText = visitArguments(args).replace(/;/g, '');
  isCallParams = false;
  if (block) blockText = visitBlock(block);
  callName = '';
  isCall = false;
  return before + name + '(' + argsText + ')' + blockText + ';';
}

function visitArguments(node) {
  browser(node, 'Missing node param');
  isArguments = true;
  var nodes = nodesToJSON(node.nodes);
  paramsLength += nodes.length;
  var text = '';
  nodes.forEach(function (node, idx) {
    var prefix = idx ? ', ' : '';
    var nodeText = visitNode(node);
    if (node.__type === 'Call') isCallParams = true;
    if (GLOBAL_VARIABLE_NAME_LIST.indexOf(nodeText) > -1) nodeText = replaceFirstATSymbol(nodeText);
    if (isFunction && !/(^'|")|\d/.test(nodeText) && nodeText) nodeText = replaceFirstATSymbol(nodeText);
    text += prefix + nodeText;
    paramsLength--;
  });
  if (paramsLength === 0) isArguments = false;
  return text || '';
}

function visitRGBA(node) {
  return node.raw.replace(/ /g, '');
}

function visitUnit(_ref5) {
  var val = _ref5.val,
      type = _ref5.type;

  return type ? val + type : val;
}

function visitBoolean(node) {
  return node.val;
}

function visitIf(node) {
  var symbol = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '@if ';

  ifLength++;
  browser(node, 'Missing node param');
  var before = '';
  isIfExpression = true;
  if (symbol === '@if ') {
    before += handleLinenoAndIndentation(node);
    oldLineno = node.lineno;
  }

  var condNode = node.cond && node.cond.toJSON() || {};
  isCond = true;
  isNegate = node.negate;
  var condText = trimSemicolon(visitNode(condNode));
  isCond = false;
  isNegate = false;
  isIfExpression = false;
  var block = visitBlock(node.block);
  var elseText = '';
  if (node.elses && node.elses.length) {
    var elses = nodesToJSON(node.elses);
    elses.forEach(function (node) {
      oldLineno++;
      if (node.__type === 'If') {
        elseText += visitIf(node, ' @else if ');
      } else {
        elseText += ' @else' + visitBlock(node);
      }
    });
  }
  ifLength--;
  return before + symbol + condText + block + elseText;
}

function visitFunction(node) {
  browser(node, 'Missing node param');
  isFunction = true;
  var notMixin = !isFunctionMixin(node.block.nodes);
  var before = handleLineno(node.lineno);
  oldLineno = node.lineno;
  var symbol = '';
  if (notMixin) {
    returnSymbol = '@return ';
    symbol = '@function';
  } else {
    returnSymbol = '';
    symbol = '@mixin';
  }
  var params = nodesToJSON(node.params.nodes || []);
  FUNCTION_PARAMS = params.map(function (par) {
    return par.name;
  });
  var paramsText = '';
  params.forEach(function (node, idx) {
    var prefix = idx ? ', ' : '';
    var nodeText = visitNode(node);
    VARIABLE_NAME_LIST.push(nodeText);
    paramsText += prefix + replaceFirstATSymbol(nodeText);
  });
  paramsText = paramsText.replace(/\$ +\$/g, '$');
  var fnName = symbol + ' ' + node.name + '(' + trimSemicolon(paramsText) + ')';
  var block = visitBlock(node.block);
  returnSymbol = '';
  isFunction = false;
  FUNCTION_PARAMS = [];
  return before + fnName + block;
}

function visitTernary(_ref6) {
  var cond = _ref6.cond,
      lineno = _ref6.lineno;

  var before = handleLineno(lineno);
  oldLineno = lineno;
  return before + visitBinOp(cond);
}

function visitBinOp(_ref7) {
  var op = _ref7.op,
      left = _ref7.left,
      right = _ref7.right;

  binOpLength++;
  function visitNegate(op) {
    if (!isNegate || op !== '==' && op !== '!=') {
      return op !== 'is defined' ? op : '';
    }
    return op === '==' ? '!=' : '==';
  }

  if (op === '[]') {
    var leftText = visitNode(left);
    var rightText = visitNode(right);
    binOpLength--;
    if (isBlock) return 'map-get(' + leftText + ', ' + rightText + ');';
  }

  var leftExp = left ? left.toJSON() : '';
  var rightExp = right ? right.toJSON() : '';
  var isExp = rightExp.__type === 'Expression';
  var expText = isExp ? '(' + visitNode(rightExp) + ')' : visitNode(rightExp);
  var symbol = OPEARTION_MAP[op] || visitNegate(op);
  var endSymbol = op === 'is defined' ? '!default;' : '';

  binOpLength--;
  return endSymbol ? trimSemicolon(visitNode(leftExp)).trim() + ' ' + endSymbol : visitNode(leftExp) + ' ' + symbol + ' ' + expText;
}

function visitUnaryOp(_ref8) {
  var op = _ref8.op,
      expr = _ref8.expr;

  return (OPEARTION_MAP[op] || op) + '(' + visitExpression(expr) + ')';
}

function visitEach(node) {
  browser(node, 'Missing node param');
  var before = handleLineno(node.lineno);
  oldLineno = node.lineno;
  var expr = node.expr && node.expr.toJSON();
  var exprNodes = nodesToJSON(expr.nodes);
  var exprText = '@each $' + node.val + ' in ';
  VARIABLE_NAME_LIST.push(node.val);
  exprNodes.forEach(function (node, idx) {
    var prefix = node.__type === 'Ident' ? '$' : '';
    var exp = prefix + visitNode(node);
    exprText += idx ? ', ' + exp : exp;
  });
  if (/\.\./.test(exprText)) {
    exprText = exprText.replace('@each', '@for').replace('..', 'through').replace('in', 'from');
  }
  var blank = getIndentation();
  before += blank;
  var block = visitBlock(node.block).replace('$' + node.key, '');
  return before + exprText + block;
}

function visitKeyframes(node) {
  isKeyframes = true;
  var before = handleLinenoAndIndentation(node);
  oldLineno = node.lineno;
  var resultText = '';
  var name = visitNodes(node.segments);
  var isMixin = !!findNodesType(node.segments, 'Expression');
  var blockJson = node.block.toJSON();
  if (blockJson.nodes.length && blockJson.nodes[0].toJSON().__type === 'Expression') {
    throw new Error('Syntax Error Please check if your @keyframes ' + name + ' are correct.');
  }
  var block = visitBlock(node.block);
  var text = isMixin ? '#{' + name + '}' + block : name + block;
  if (autoprefixer) {
    KEYFRAMES_LIST.forEach(function (name) {
      resultText += before + name + text;
    });
  } else {
    resultText += before + '@keyframes ' + text;
  }
  isKeyframes = false;
  return resultText;
}

function visitExtend(node) {
  var before = handleLinenoAndIndentation(node);
  oldLineno = node.lineno;
  var text = visitNodes(node.selectors);
  return before + '@extend ' + trimFirst(text) + ';';
}

function visitQueryList(node) {
  var text = '';
  var nodes = nodesToJSON(node.nodes);
  nodes.forEach(function (node, idx) {
    var nodeText = visitNode(node);
    text += idx ? ', ' + nodeText : nodeText;
  });
  return text;
}

function visitQuery(node) {
  var type = visitNode(node.type) || '';
  var nodes = nodesToJSON(node.nodes);
  var text = '';
  nodes.forEach(function (node, idx) {
    var nodeText = visitNode(node);
    text += idx ? ' and ' + nodeText : nodeText;
  });
  return type === 'screen' ? type + ' and ' + text : '' + type + text;
}

function visitMedia(node) {
  var before = handleLinenoAndIndentation(node);
  oldLineno = node.lineno;
  var val = _get$1(node, ['val'], {});
  var nodeVal = val.toJSON && val.toJSON() || {};
  var valText = visitNode(nodeVal);
  var block = visitBlock(node.block);
  return before + '@media ' + (valText + block);
}

function visitFeature(node) {
  var segmentsText = visitNodes(node.segments);
  var expText = visitExpression(node.expr);
  return '(' + segmentsText + ': ' + expText + ')';
}

function visitComment(node, isInlineComment) {
  var before = isInlineComment ? ' ' : handleLinenoAndIndentation(node);
  var matchs = node.str.match(/\n/g);
  oldLineno = node.lineno;
  if (Array.isArray(matchs)) oldLineno += matchs.length;
  var text = node.suppress ? node.str : node.str.replace(/^\/\*/, '/*!');
  return before + text;
}

function visitMember(_ref9) {
  var left = _ref9.left,
      right = _ref9.right;

  var searchName = recursiveSearchName(left, 'left', 'name');
  if (searchName && OBJECT_KEY_LIST.indexOf(searchName) > -1) {
    return 'map-get(' + visitNode(left) + ', ' + (quote + visitNode(right) + quote) + ')';
  }
  return visitNode(left) + '.' + visitNode(right);
}

function visitObject(_ref10) {
  var vals = _ref10.vals,
      lineno = _ref10.lineno;

  isObject = true;
  indentationLevel++;
  var before = repeatString(' ', indentationLevel * 2);
  var result = '';
  var count = 0;
  for (var key in vals) {
    var resultVal = visitNode(vals[key]).replace(/;/, '');
    var symbol = count ? ',' : '';
    result += symbol + '\n' + (before + quote + key + quote) + ': ' + resultVal;
    count++;
  }
  var totalLineno = lineno + count + 2;
  oldLineno = totalLineno > oldLineno ? totalLineno : oldLineno;
  indentationLevel--;
  isObject = false;
  return '(' + result + '\n' + repeatString(' ', indentationLevel * 2) + ')';
}

function visitCharset(_ref11) {
  var _ref11$val = _ref11.val,
      value = _ref11$val.val,
      quote = _ref11$val.quote,
      lineno = _ref11.lineno;

  var before = handleLineno(lineno);
  oldLineno = lineno;
  return before + '@charset ' + (quote + value + quote) + ';';
}

function visitNamespace(_ref12) {
  var val = _ref12.val,
      lineno = _ref12.lineno;

  isNamespace = true;
  var name = '@namespace ';
  var before = handleLineno(lineno);
  oldLineno = lineno;
  if (val.type === 'string') {
    var _val$val = val.val,
        value = _val$val.val,
        valQuote = _val$val.quote;

    isNamespace = false;
    return before + name + valQuote + value + valQuote + ';';
  }
  return before + name + visitNode(val);
}

// function visitAtrule(node) {
//   let before = handleLinenoAndIndentation(node)
//   oldLineno = node.lineno
//   before += '@' + node.type
//   return before + visitBlock(node.block)
// }

function visitAtrule(_ref13) {
  var type = _ref13.type,
      block = _ref13.block,
      lineno = _ref13.lineno,
      segments = _ref13.segments;

  var before = handleLineno(lineno);
  oldLineno = lineno;
  var typeText = segments.length ? '@' + type + ' ' : '@' + type;
  return '' + (before + typeText + visitNodes(segments) + visitBlock(block));
}

function visitSupports(_ref14) {
  var block = _ref14.block,
      lineno = _ref14.lineno,
      condition = _ref14.condition;

  var before = handleLineno(lineno);
  oldLineno = lineno;
  before += getIndentation();
  return before + '@Supports ' + (visitNode(condition) + visitBlock(block));
}

function visitString(_ref15) {
  var val = _ref15.val,
      quote = _ref15.quote;

  return quote + val + quote;
}

function visitReturn(node) {
  if (isFunction) return visitExpression(node.expr).replace(/\n\s*/g, '');
  return '@return $' + visitExpression(node.expr).replace(/\$|\n\s*/g, '');
}

// 处理 stylus 语法树；handle stylus Syntax Tree
function visitor(ast, options, globalVariableList, globalMixinList) {
  quote = options.quote;
  autoprefixer = options.autoprefixer;
  GLOBAL_MIXIN_NAME_LIST = globalMixinList;
  GLOBAL_VARIABLE_NAME_LIST = globalVariableList;
  var result = visitNodes(ast.nodes) || '';
  var indentation = ' '.repeat(options.indentVueStyleBlock);
  result = result.replace(/(.*\S.*)/g, indentation + '$1');
  result = result.replace(/(.*)>>>(.*)/g, '$1/deep/$2');
  oldLineno = 1;
  FUNCTION_PARAMS = [];
  OBJECT_KEY_LIST = [];
  PROPERTY_LIST = [];
  VARIABLE_NAME_LIST = [];
  GLOBAL_MIXIN_NAME_LIST = [];
  GLOBAL_VARIABLE_NAME_LIST = [];
  return result + '\n';
}

//_@ts-check

function parse(result) {
  return new Parser(result).parse();
}

function nodeToJSON(data) {
  return nodesToJSON(data);
}

function _get(obj, pathArray, defaultValue) {
  return _get$1(obj, pathArray, defaultValue);
}

function converter(result) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    quote: '\'',
    conver: 'sass',
    autoprefixer: true
  };
  var globalVariableList = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var globalMixinList = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  if (options.isSignComment) result = result.replace(/\/\/\s(.*)/g, '/* !#sign#! $1 */');

  // Add semicolons to properties with inline comments to ensure that they are parsed correctly
  result = result.replace(/^( *)(\S(.+?))( *)(\/\*.*\*\/)$/gm, '$1$2;$4$5');

  if (typeof result !== 'string') return result;
  var ast = new Parser(result).parse();
  // 开发时查看 ast 对象。
  // console.log(JSON.stringify(ast))
  var text = visitor(ast, options, globalVariableList, globalMixinList);
  // Convert special multiline comments to single-line comments
  return text.replace(/\/\*\s!#sign#!\s(.*)\s\*\//g, '// $1');
}

exports._get = _get;
exports.converter = converter;
exports.nodeToJSON = nodeToJSON;
exports.parse = parse;
