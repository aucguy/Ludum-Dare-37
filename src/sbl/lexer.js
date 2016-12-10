base.registerModule('sbl.lexer', function() {
  var common = base.importModule('sbl.common');
  
  var PrimTypes = {
    WORD: 0,
    NUMBER: 1,
    SYMBOL: 2,
    WHITESPACE: 3
  }
  
  var PrimToken = base.extend(common.Token, 'PrimToken', {
    constructor: function PrimiteToken(position, type, contents) {
      this.type = type;
      this.contents = contents;
    }
  });
  
  //also signifies a new line (length can be 0)
  var IndentToken = base.extend(common.Token, 'IdentToken', {
    constructor: function IndentToken(position, length) {
      this.constructor$Token(position);
      this.length = length;
    }
  });
  
  function lex(src) {
    //TODO
  }
  
  function lexWord(state) {
    //TODO
  }
  
  function lexNumber(state) {
    //TODO
  }
  
  function lexSymbol(state) {
    //TODO
  }
  
  function lexWhitespace(state) {
    //TODO
  }
  
  return {
   lex: lex 
  }
});