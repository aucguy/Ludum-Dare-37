base.registerModule('sbl.compiler', function() {
  var util = base.importModule('util');
  var common = base.importModule('sbl.common');
  var interpreter = base.importModule('sbl.interpreter');
  
  function compile(root) {
    var bytecode = new util.ExtendableUint8Array();
    var constants = [];
    var names = [];
    var currentLine = null;
    
    function process(token) {
      if(!token.is$BlockToken && currentLine != token.line) { //blocktoken check doesn't always work
        currentLine = token.line;
        bytecode.appendByte(common.opcodes.LINE);
        bytecode.appendShort(currentLine);
      }
      if(token.is$RootToken) {
        compileChildren(token, 0);
      } else if(token.is$CallToken) {
        compileChildren(token, 1);
        process(token.children[0]); //function on top
        bytecode.appendByte(common.opcodes.CALL);
        bytecode.appendByte(token.children.length - 1);
      } else if(token.is$BlockToken) {
        bytecode.appendByte(common.opcodes.PUSH_BLOCK);
        var arg = bytecode.length();
        bytecode.appendShort(0); //a placeholder
        compileChildren(token, 0);
        bytecode.appendByte(common.opcodes.HALT);
        bytecode.setShort(arg, bytecode.length());
      } else if(token.is$PrimToken) {
        if(token.type === common.PrimTypes.LITERAL || token.type === common.PrimTypes.NUMBER) {
          bytecode.appendByte(common.opcodes.PUSH_CONST);
          bytecode.appendShort(common.addIfNotPresent(constants, root.idToName(token.contents)));
        } else if(token.type === common.PrimTypes.WORD || token.type === common.PrimTypes.SYMBOL) {
          bytecode.appendByte(common.opcodes.PUSH_VAR);
          bytecode.appendShort(common.addIfNotPresent(names, root.idToName(token.contents)));
        } else if(token.type === common.PrimTypes.REFERENCE) {
          bytecode.appendByte(common.opcodes.PUSH_REF);
          bytecode.appendShort(common.addIfNotPresent(names, root.idToName(token.contents).slice(1)));
        }
      }
    }
    
    function compileChildren(token, start) {
      for(var i=start; i<token.children.length; i++) {
        process(token.children[i]);
      }
    }
  
    process(root);
    return new interpreter.Program(bytecode.compress(), constants, names);
  }
  
  return {
    compile: compile
  }
});