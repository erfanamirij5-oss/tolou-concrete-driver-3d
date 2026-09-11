'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = require.resolve('babylonjs/babylon.js', { paths: [root] });
const vendorDir = path.join(root, 'vendor');
const target = path.join(vendorDir, 'babylon.js');

fs.mkdirSync(vendorDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(`Vendored Babylon.js -> ${path.relative(root, target)}`);
