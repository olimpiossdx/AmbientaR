/**
 * Shim para @firebase/auth/internal (usado por @firebase/auth-compat).
 * Reexporta o módulo interno do pacote @firebase/auth que está em firebase/node_modules,
 * para que o webpack resolva corretamente no Next.js.
 *
 * ESLint: desabilitamos regras neste arquivo específico porque ele é apenas
 * um bridge CommonJS para um módulo ESM interno do Firebase.
 */
/* eslint-disable */
module.exports = require("../../../node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/internal.js");
