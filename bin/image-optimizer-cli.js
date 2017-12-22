#!/usr/bin/env node
const semver = require('semver');
if (semver.satisfies(process.version, '<6.0.0')) {
  console.warn('\x1b[33m%s\x1b[0m', 'Your mileage may vary on node versions < v6.0.0');
}
if (semver.satisfies(process.version, '<7.6.x')) {
  require('babel-polyfill');
}

require('../dist/image-optimize');
