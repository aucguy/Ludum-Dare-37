base.registerModule('sbl.lib', function() {
  var interpreter = base.importModule('sbl.interpreter');
  
  var stdForeign = {
    print: function print(branch, x) {
      console.log(x)
    },
    label: function label(branch, name, block) {
      branch.program.vars[name] = block;
    }
    "goto": function goTo(branch, block) {
      branch.instruction = block.start;
    },
    fork: function fork(branch, block) {
      var nb = new interpreter.Branch(branch.program);
      nb.instruction = block.start;
      nb.program.branches.push(nb);
    }
  };
  
  return {
    stdForeign: stdForeign
  }
})