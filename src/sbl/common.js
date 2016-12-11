base.registerModule('sbl.common', function() {
  var util = base.importModule('util');
  
  var debug = true;
  
  var Token = util.extend(Object, 'Token', {
    constructor: function Token(line) {
      this.line = line;
    }
  });
  
  var PrimToken = util.extend(Token, 'PrimToken', {
    constructor: function PrimToken(line, type, contents, root) {
      this.constructor$Token(line)
      this.type = type;
      this.contents = root.nameToId(contents);
      if(debug) {
        this.str = contents; //for debugging purposes
      }
    }
  });
  
  //also signifies a new line (length can be 0)
  var IndentToken = util.extend(Token, 'IndentToken', {
    constructor: function IndentToken(line, indent) {
      this.constructor$Token(line);
      this.indent = indent;
    }
  });
  
  var GroupToken = util.extend(Token, 'GroupToken', {
    constructor: function GroupToken() {
      this.constructor$Token(null);
      this.children = [];
    },
    addChild: function addChild(child) {
      this.children.push(child);
      if(this.line == null || (child.line != null && this.line > child.line)) {
        this.line = child.line;
      }
    }
  });
  
  var RootToken = util.extend(GroupToken, 'RootToken', {
    constructor: function RootToken(oldRoot) {
      this.constructor$GroupToken();
      if(oldRoot) {
        this.idsToNames = oldRoot.idsToNames;
      } else {
        this.idsToNames = [];
      }
    },
    nameToId: function nameToId(name) {
      var ret = this.idsToNames.indexOf(name);
      if(ret != -1) {
        return ret; //already exists
      }
      var ret = this.idsToNames.length;
      this.idsToNames.push(name);
      return ret;
    },
    idToName: function idToName(id) {
      return this.idsToNames[id];
    }
  });
  
  var PrimTypes = {
    WORD: {
      start: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_',
      all: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789'
    },
    NUMBER: {
      start: '0123456789.-',
      all: '0123456789.-eE'
    },
    SYMBOL: {
      start: '~!@%^&*-=+|;:,./\\?[]{}<>()',
      all: '~!@%^&*-=+|;:,./\\?[]{}<>'
    },
    WHITESPACE: {
      start: ' \t\n'
    },
    LITERAL: {
      start: '"'
    },
    REFERENCE: {
      start: '$',
      all: '$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789'
    }
  };
  
  var tmp = 0;
  var opcodes = {
    PUSH_CONST: tmp++, //one arg: the constant index
    PUSH_VAR: tmp++, //one arg: the variable index
    PUSH_REF: tmp++, //one arg: the reference to push
    PUSH_BLOCK: tmp++, //one args: the length
    CALL: tmp++, //one arg: the number of arguments
    HALT: tmp++, //no args
    LINE: tmp++, //one arg: the line number
  }
  
  function syntaxError(token, message) {
    throw(new Error("Syntax Error at line " + token.line + ": " + message));
  }
  
  function addIfNotPresent(array, item) {
    var index = array.indexOf(item);
    if(index == -1) {
      index = array.length;
      array.push(item);
    }
    return index;
  }
  
  return {
    Token: Token,
    PrimToken: PrimToken,
    IndentToken: IndentToken,
    GroupToken: GroupToken,
    RootToken: RootToken,
    PrimTypes: PrimTypes,
    syntaxError: syntaxError,
    opcodes: opcodes,
    debug: debug,
    addIfNotPresent: addIfNotPresent
  }
});