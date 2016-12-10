base.registerModule('sbl.parser', function() {
  function parse(ast) {
    ast = groupBlocks(ast);
    ast = groupCalls(ast);
  }
  
  function groupBlocks(ast) {
    //TODO
  }
  
  function groupCalls(ast) {
    //TODO
  }
  
  return {
    parse: parse
  };
});