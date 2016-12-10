base.registerModule('sbl', function() {
  var compiler = base.importModule('sbl.compiler');
  
  return {
    compile: compiler.Compile
  }
})