base.registerModule('sbl.lexer', function() {
  var util = base.importModule('util');
  var common = base.importModule('sbl.common');
  
  var PrimTypes = common.PrimTypes;
  var PrimToken = common.PrimToken;
  var IndentToken = common.IndentToken;
  
  function simplifyLines(src) {
    var parts = [];
    var last = 0;
    for(var i=0; i<src.length; i++) {
      var c  = src[i];
      if(c == '\n' || c == '\r') {
        if(last != i) {
          parts.push(src.slice(last, i));
          parts.push('\n');
        }
        last = i + 1;
      }
    }
    if(last != i) {
      parts.push(src.slice(last, i));
    }
    return parts.join('');
  }
  
  function lex(src) {
    src = simplifyLines(src);
    src += String.fromCharCode(0); //make the loops stop since this is an invalid character
    
    var state = {
      src: src,
      index: 0,
      root: new common.RootToken(),
      line: 1,
      column: 0
    };
    
    while(state.index < state.src.length - 1) { //-1 because of the termination character
      var begin = state.index;
      var c = getChar(state);
      if(c == '#') {
        advanceTo(state, '\n');
      } else if(PrimTypes.LITERAL.start.indexOf(c) != -1) {
        lexLiteral(state);
      } else if(PrimTypes.WORD.start.indexOf(c) != -1) {
        lexWord(state);
      } else if(PrimTypes.NUMBER.start.indexOf(c) != -1) {
        lexNumber(state);
      } else if(PrimTypes.SYMBOL.start.indexOf(c) != -1) {
        lexSymbol(state);
      } else if(PrimTypes.WHITESPACE.start.indexOf(c) != -1) {
        lexWhitespace(state);
      } else if(PrimTypes.REFERENCE.start.indexOf(c) != -1) {
        lexReference(state);
      } else {
        syntaxError(state, "invalid character");
      }
      if(begin == state.index) { //prevent infinite loop
        throw(new Error("character not advanced"));
      }
    }
    return state.root;
  }
  
  function lexLiteral(state) {
    advance(state); //go to after the '"'
    var start = state.index;
    advanceTo(state, '"');
    addToken(state, PrimTypes.LITERAL, state.src.slice(start, state.index));
    advance(state); //avoid closing '"'
  }
  
  function lexWord(state) {
    addToken(state, PrimTypes.WORD, advanceWhile(state, PrimTypes.WORD.all));
  }
  
  function lexNumber(state) {
    var str = advanceWhile(state, PrimTypes.NUMBER.all);
    if(str == '-' || str == '.') { //its actually just a symbol
      addToken(state, PrimTypes.SYMBOL, str);
    } else {
      var num = parseFloat(str);
      if(num == NaN) {
        syntaxError(state, "invalid number");
      }
      addToken(state, PrimTypes.NUMBER, num);
    }
  }
  
  function lexSymbol(state) {
    var c = getChar(state);
    if(c == '(' || c == ')') {
      addToken(state, PrimTypes.SYMBOL, c);
      advance(state);
    } else {
      addToken(state, PrimTypes.SYMBOL, advanceWhile(state, PrimTypes.SYMBOL.all));
    }
  }
  
  function lexWhitespace(state) {
    var str = advanceWhile(state, PrimTypes.WHITESPACE.start);
    if(getChar(state) != '#' && str.indexOf('\n') != -1) {
      str = str.split('\n');
      str = str[str.length - 1];
      var indent = 0;
      for(var i=0; i<str.length; i++) {
        indent += str[i] == '\t' ? 4 : 1;
      }
      state.root.addChild(new IndentToken(state.line, indent));
    }
  }
  
  function lexReference(state) {
    addToken(state, PrimTypes.REFERENCE, advanceWhile(state, PrimTypes.REFERENCE.all));
  }
  
  function getChar(state) {
    return state.src[state.index];
  }
 
  function advance(state) {
    var c = getChar(state);
    state.index++;
    if(c == '\n') {
      state.line++;
      state.column = 0;
    } else if(c == '\t') {
      state.column += 4;
    } else {
      state.column++;
    }
  }
  
  function advanceTo(state, target) {
    var start = state.index;
    while(getChar(state) != target) {
      advance(state);
    }
    return state.src.slice(start, state.index);
  }
  
  function advanceWhile(state, target) {
    var start = state.index;
    while(target.indexOf(getChar(state)) != -1) {
      advance(state);
    }
    return state.src.slice(start, state.index);
  }
  
  function addToken(state, type, contents) {
    state.root.addChild(new PrimToken(state.line, type, contents, state.root));
  }
  
  function syntaxError(state, message) {
    throw(new Error("Syntax Error: "  + state.line + ","  + state.column + ": " + message))
  }
  
  return {
    lex: lex
  }
});