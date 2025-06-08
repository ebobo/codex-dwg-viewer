const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../node_modules/@mlightcad/libredwg-web/wasm/libredwg-web.wasm');
const dest = path.resolve(__dirname, '../public/libredwg-web.wasm');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Copied libredwg.wasm');
} else {
  console.warn('libredwg.wasm not found; please install dependencies');
}
