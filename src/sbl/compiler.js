import * as util from '/lib/util.js';
import * as common from './common.js';
import * as interpreter from './interpreter.js';

function compile(root) {
  var bytecode = new ExtendableUint8Array();
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
      bytecode.appendByte(common.opcodes.END_BLOCK);
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
    for(var i = start; i < token.children.length; i++) {
      process(token.children[i]);
    }
  }

  process(root);
  return new interpreter.Program(bytecode.compress(), constants, names);
}


var ExtendableUint8Array = util.extend(Object, ExtendableUint8Array, {
  constructor: function ExtendableUint8Array() {
    this.partSize = 1024;
    this.current = new Uint8Array(this.partSize);
    this.index = 0;
    this.filled = [];
  },
  appendByte: function appendByte(x) {
    if(this.index >= this.current.length) {
      this.filled.push(this.current);
      this.current = new Uint8Array(this.partSize);
    }
    this.current[this.index++] = x;
  },
  appendShort: function appendShort(x) {
    this.appendByte(x >> 8);
    this.appendByte(x & 255);
  },
  setByte: function setByte(i, x) {
    var filledSize = this.filled.length * this.partSize;
    if(i < filledSize) {
      this.filled[Math.floor(i / this.partSize)][i % this.partSize] = x;
    } else {
      this.current[i - filledSize] = x;
    }
  },
  setShort: function setShort(i, x) {
    this.setByte(i, x >> 8);
    this.setByte(i + 1, x & 255);
  },
  length: function length() {
    return this.filled.length * this.partSize + this.index;
  },
  compress: function compress() {
    var ret = new Uint8Array(this.length());
    var filledSize = this.filled.length * this.partSize;
    var i;
    for(i = 0; i < this.filled.length; i++) {
      ret.set(this.filled[i], i * this.partSize);
    }
    for(i = 0; i < this.index; i++) {
      ret[filledSize + i] = this.current[i];
    }
    return ret;
  }
});

export {
  compile
};