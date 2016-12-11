base.registerModule('sbl.parser', function() {
  var util = base.importModule('util');
  var common = base.importModule('sbl.common');
  
  var LineToken = util.extend(common.GroupToken, 'LineToken', {
    constructor: function LineToken() {
      this.constructor$GroupToken();
    }
  });
  
  var BlockToken = util.extend(common.GroupToken, 'BlockToken', {
    constructor: function BlockToken() {
      this.constructor$GroupToken();
    }
  });
  
  var CallToken = util.extend(common.GroupToken, 'CallToken', {
    constructor: function CallToken() {
      this.constructor$GroupToken();
    }
  });
  
  function parse(root) {
    root = groupLines(root);
    root = groupBlocks(root);
    root = groupCalls(root);
    root = joinCallsAndBlocks(root);
    return root;
  }
  
  function groupLines(root) {
    var COLON = root.nameToId(':'); //doesn't get grouped
    var newroot = new common.RootToken(root);
    var line = new LineToken();
    
    for(var i=0; i<root.children.length; i++) {
      var token = root.children[i];
      if(token.is$IndentToken || token.contents == COLON) {
        if(line.children.length != 0) { //blank lines
          newroot.addChild(line);  
          line = new LineToken();
        }
        newroot.addChild(token); //indents get preserved for blocks
      } else {
        line.addChild(token);
      }
    }
    
    if(line.children.length != 0) { //blank lines
      newroot.addChild(line);
    }
    
    return newroot;
  }
  
  function groupBlocks(root) {
    var stack = [{
      token: new common.RootToken(root),
      indent: 0
    }];
    var COLON = root.nameToId(':');
    var lastColon = false;
    
    for(var i=0; i<root.children.length; i++) {
      var token = root.children[i];
      var tos = util.peek(stack); //top of stack
      
      if(token.is$IndentToken) { //don't keep any of these; they're just used to detect blocks
        if(token.indent > tos.indent) {
          if(!lastColon) {
            common.syntaxError(token, "invalid indent; colon required");
          }
          var item = {
            token: new BlockToken(),
            indent: token.indent
          };
          tos.token.addChild(item.token);
          stack.push(item);
        } else if(token.indent < tos.indent) {
          if(stack.length == 1) {
            throw(new Error("invalid indent (internal error)"));
          }
          stack.pop();
        }
        lastColon = false;
      } else if(token.contents == COLON) { //throw away
        lastColon = true;
      } else {
        tos.token.addChild(token);
        lastColon = false;
      }
    }
    return stack[0].token;
  }
  
  function createFreshToken(token) {
    if(token.is$RootToken) {
      return new common.RootToken(token);
    } else if(token.is$LineToken) { //switches
      return new CallToken(token);
    } else if(token.is$BlockToken) {
      return new BlockToken(token);
    } else if(token.is$PrimToken) {
      return new common.PrimToken(token);
    }
  }
  
  function groupCalls(root) {
    var LEFT_PAREN = root.nameToId('(');
    var RIGHT_PAREN = root.nameToId(')');
    
    function process(token) {
      var newtoken = createFreshToken(token);
      var stack = [newtoken];
    
      for(var i=0; i<token.children.length; i++) {
        var current = token.children[i];
        var tos = util.peek(stack);
        
        if(current.is$RootToken) {
          throw(new Error("token cannot be root"));
        } else if(current.is$LineToken || current.is$BlockToken) {
          tos.addChild(process(current));
        } else if(current.is$PrimToken) {
          if(current.contents == LEFT_PAREN) {
            var current = new CallToken();
            tos.addChild(current);
            stack.push(current);
          } else if(current.contents == RIGHT_PAREN) {
            if(stack.length == 1) {
              common.syntaxError(current, "unbalanced parenthesis");
            }
            stack.pop();
          } else {
            tos.addChild(current);
          }
        }
      }
    
      if(stack.length != 1) {
        common.sytanxError(util.peek(stack), "unbalanced parenthesis");
      }
      return newtoken;
    }
    
    return process(root);
  }
  
  function joinCallsAndBlocks(root) {
    function process(token) {
      var newtoken = createFreshToken(token);
      var lastCall = null;
      
      for(var i=0; i<token.children.length; i++) {
        var current = token.children[i];
        if(current.is$CallToken) {
          lastCall = current;
          newtoken.addChild(current);
        } else if(current.is$BlockToken) {
          lastCall.addChild(process(current));
        } else if(currrent.is$PrimToken) {
          lastCall.addChild(current);
        }
      }
      
      return newtoken;
    }
    
    return process(root);
  }
  
  return {
    groupBlocks: groupBlocks,
    groupLines: groupLines,
    groupCalls: groupCalls,
    parse: parse
  };
});