import * as lexer from './lexer.js';
import * as parser from './parser.js';
import * as compiler from './compiler.js';
import * as lib from './lib.js';

function compile(src) {
  var root = lexer.lex(src);
  root = parser.parse(root);
  var program = compiler.compile(root);
  program.linkForeign(lib.stdForeign);
  return program;
}

export {
  compile
};