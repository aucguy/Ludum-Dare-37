base.registerModule('sbl.interpreter', function() {
  var util = base.importModule('util');
  var common = base.importModule('sbl.common');
  
  var Block = util.extend(Object, 'Block', {
    constructor: function Block(program, start) {
      this.program = program;
      this.start = start;
    }
  });
  
  var Branch = util.extend(Object, 'Branch', {
    constructor: function Branch(program) {
      this.program = program;
      this.instruction = 0;
      this.stack = [];
      this.blockStack = [];
      this.line = 0;
      this.dead = false;
      this.running = false;
    },
    run: function run() {
      if(this.dead) {
        return;
      }
      this.running = true;
      var lastPush = null;
      var tmp;
      var count = 0;
      while(this.running && this.instruction <= this.program.bytecode.length && count++ < 10000) {
        switch(this.program.bytecode[this.instruction++]) {
          case common.opcodes.PUSH_CONST:
            tmp = this.getShortArg();
            this.stack.push(this.program.constants[tmp]);
            lastPush = null;
            //console.log('PUSH_CONST ' + this.program.constants[tmp]);
            break;
          case common.opcodes.PUSH_VAR:
            lastPush = this.getShortArg();
            this.stack.push(this.program.vars[lastPush]);
            //console.log('PUSH_VAR ' + this.program.names[lastPush]);
            break;
          case common.opcodes.PUSH_REF:
            lastPush = this.getShortArg();
            this.stack.push(lastPush);
            //console.log('PUSH_REF ' + this.program.names[lastPush]);
            break;
          case common.opcodes.PUSH_BLOCK:
            var index = this.getShortArg();
            this.stack.push(new Block(this.program, this.instruction));
            this.instruction = index;
            //console.log('PUSH_BLOCK ' + index);
            break;
          case common.opcodes.CALL:
            var func = this.stack.pop();
            if(typeof func != "function") {
              if(lastPush == null) {
                this.error("not a function");
              } else {
                this.error("'" + this.program.names[lastPush] + "' is not a function");
              }
            }
            var argNo = this.getByteArg();
            var args = [];
            for(var i=0; i<argNo; i++) {
              args.unshift(this.stack.pop());
            }
            args.unshift(this);
            func.apply(null, args);
            //console.log('CALL ' + func);
            break;
          case common.opcodes.END_BLOCK:
            this.blockStack.pop()();
            //console.log('END_BLOCK');
          case common.opcodes.LINE:
            this.line = this.getShortArg();
            //console.log('LINE ' + this.line);
        }
      }
      if(this.instruction >= this.program.bytecode.length) {
        this.halt();
      }
      if(count == 10000) {
        console.warn("run away loop");
      }
    },
    halt: function halt() {
      this.dead = true;
      this.running = false;
    },
    pause: function pause() {
      this.running = false;
    },
    getByteArg: function getByteArg() {
      return this.program.bytecode[this.instruction++];
    },
    getShortArg: function getShortArg() {
      return this.program.bytecode[this.instruction++] << 8 || this.program.bytecode[this.instruction++];
    },
    error: function(message) {
      for(var i=0; i<this.program.branches.length; i++) {
        this.program.branches[i].halt();
      }
      var error = new Error("Error at line " + this.line + ": " + message);
      error.notInternal = true;
      throw(error);
    }
  });
  
  var Program = util.extend(Object, 'Program', {
    constructor: function Program(bytecode, constants, names) {
      this.bytecode = bytecode;
      this.constants = constants;
      this.names = names; //only used for errors and debugging
      this.vars = [];
      for(var i=0; i<this.names.length; i++) {
        this.vars.push(null);
      }
      this.branches = [new Branch(this)];
    },
    run: function run() {
      for(var i=0; i<this.branches.length; i++) {
        var branch = this.branches[i];
        branch.run();
        if(branch.dead) {
          this.branches.splice(i--, 1);
        }
      }
    },
    linkForeign: function linkForeign(foreign) {
      var foreignNames = Object.getOwnPropertyNames(foreign);
      var i;
      for(i=0; i<foreignNames.length; i++) {
        var name = foreignNames[i];
        var func = foreign[name];
        var index = common.addIfNotPresent(this.names, name);
        if(this.vars.length < this.names.length) {
          this.vars.push(func);
        } else {
          this.vars[index] = func;
        }
      }
    },
    genAsm: function genAsm() {
      var instruction = 0;
      var ends = [];
      for(var instruction=0; instruction<this.bytecode.length;) {
        var instr = this.bytecode[instruction++];
        if(instr == common.opcodes.PUSH_CONST) {
          var index = this.bytecode[instruction++] << 8 || this.bytecode[instruction++];
          console.log("PUSH_CONST " + this.constants[index]);
        } else if(instr == common.opcodes.PUSH_VAR) {
          var index = this.bytecode[instruction++] << 8 || this.bytecode[instruction++];
          console.log("PUSH_VAR " + this.names[index]);
        } else if(instr == common.opcodes.PUSH_REF) {
          var index = this.bytecode[instruction++] << 8 || this.bytecode[instruction++];
          console.log("PUSH_REF " + this.names[index]);
        } else if(instr == common.opcodes.PUSH_BLOCK) {
          ends.push({
            start: instruction,
            end: this.bytecode[instruction++] << 8 || this.bytecode[instruction++]
          });
          console.log("PUSH_BLOCK " + (instruction - 2));
        } else if(instr == common.opcodes.CALL) {
          console.log("CALL " + this.bytecode[instruction++]);
        } else if(instr == common.opcodes.END_BLOCK) {
          console.log("END_BLOCK");
        } else if(instr == common.opcodes.LINE) {
          var index = this.bytecode[instruction++] << 8 || this.bytecode[instruction++];
          console.log("LINE " + index);
        } else {
          console.log("UNKNOWN " + instr);
        }
        
        var newends = [];
        for(var k=0; k<ends.length; k++) {
          var end = ends[k];
          if(instruction >= end.end) {
            console.log("END " + end.start);
          } else {
            newends.push(end);
          }
        }
        ends = newends;
      }
    }
  });
  
  return {
    Branch: Branch,
    Program: Program
  }
});