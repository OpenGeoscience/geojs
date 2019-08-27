// prevent errors from double inclusion in downstream libraries
if (!global._babelPolyfill) {
  require('babel-polyfill');
}
