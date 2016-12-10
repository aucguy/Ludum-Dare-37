base.registerModule('executor', function() {
  var Program = util.extend(Object, 'Program', {
    constructor: function Program() {
      this.bytecode = null;
      this.vars = {}
      this.branches = [{
        instruction: 0,
        stack: [],
        callstack: []
      }];
    },
    run: function run() {
      //TODO
    },
    get: function get(name) {
      //TODO
    },
    call: function call(name) {
      //TODO
    },
    linkForeign: function linkForeign(foreign) {
      //TODO
    }
  });
  
  return {
    Program: Program
  }
});