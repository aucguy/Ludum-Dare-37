base.registerModule('sbl', function() {
  var lexer = base.importModule('sbl.lexer');
  var parser = base.importModule('sbl.parser');
  var compiler = base.importModule('sbl.compiler');
  var lib = base.importModule('sbl.lib');
  
  function compile(src) {
    var root = lexer.lex(src);
    root = parser.parse(root);
    var program = compiler.compile(root);
    program.linkForeign(lib.stdForeign);
    return program;
  }
  
  return {
    compile: compile
  }
})