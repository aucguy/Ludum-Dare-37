base.registerModule('sbl.lib', function() {
  var interpreter = base.importModule('sbl.interpreter');
  
  var stdForeign = {
    print: function print(branch, x) {
      console.log(x)
    },
    label: function label(branch, name, block) {
      branch.program.vars[name] = block;
    },
    "goto": function goTo(branch, block) {
      branch.instruction = block.start;
      var here = branch.instruction;
      branch.blockStack.push(function() {
        branch.instruction = here;
      });
    },
    fork: function fork(branch, block) {
      if(branch.program.branches.length > 50) {
        nb.program.error('too many forks');
      }
      var nb = new interpreter.Branch(branch.program);
      nb.turtle = branch.turtle.fork(nb); //if this ever becomes a real language, don't do this.
      nb.instruction = block.start;
      var here = branch.instruction;
      nb.blockStack.push(function() {
        nb.instruction = here;
      });
      nb.program.branches.push(nb);
    },
    halt: function halt(branch) {
      branch.halt();
    },
    repeat: function repeat(branch, times, block) {
      var counter = times;
      var end = branch.instruction;
      function endHandle() {
        times--;
        if(times >= 0) {
          branch.blockStack.push(endHandle);
          branch.instruction = block.start;
        } else {
          branch.instruction = end;
        }
      }
      branch.instruction = block.start;
      endHandle();
    }
  };
  
  return {
    stdForeign: stdForeign
  }
})