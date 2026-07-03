/**
 * Next 14.2.x chama React.cache no servidor (dedupe-fetch), mas o React 18.3.1
 * estável do package.json não exporta `cache`. O Next inclui um React canary com cache.
 * Este hook faz require('react') usar o bundle do Next quando o React do projeto não tem cache.
 */
'use strict';

const path = require('path');
const Module = require('module');

const projectRoot = path.join(__dirname, '..');
const nextReactDev = path.join(
  projectRoot,
  'node_modules',
  'next',
  'dist',
  'compiled',
  'react',
  'cjs',
  'react.development.js',
);
const nextReactProd = path.join(
  projectRoot,
  'node_modules',
  'next',
  'dist',
  'compiled',
  'react',
  'cjs',
  'react.production.min.js',
);

let cachedNextReact = null;

function loadNextReact() {
  if (cachedNextReact) return cachedNextReact;
  const target =
    process.env.NODE_ENV === 'production' ? nextReactProd : nextReactDev;
  const orig = Module.prototype.require;
  cachedNextReact = orig.call(module, target);
  return cachedNextReact;
}

const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  const result = originalRequire.apply(this, arguments);
  if (id === 'react' && result && typeof result.cache !== 'function') {
    return loadNextReact();
  }
  return result;
};
