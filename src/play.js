base.registerModule('play', function() {
  var util = base.importModule('util');
  var sbl = base.importModule('sbl');
  
  var PlayContextual = util.extend(util.Contextual, 'PlayContextual', {
    state: util.contextAttr,
    game: util.contextAttr
  });
  
  var PlayState = util.extend(PlayContextual, 'PlayState', {
    constructor: function PlayState() {
      this.program = null;
      this.actors = {};
      this.state = this;
    },
    create: function create() {
      var program = sbl.compile(base.getAsset('state/test'));
      program.run();
    },
    create_: function create_() {
      this.program = sbl.compile(base.getAsset('state/storys'));
      this.program.linkForeign(sblCallbacks(this))
      this.program.run();
      this.setupSprites();
    },
    setupSprites: function setupSprites() {
      //add the elevator, level etc
    },
    addSprite: function addSprite(sprite) {
      //TODO
    }
  });
  
  var Building = util.extend(PlayContextual, 'Building', {
    constructor: function Building() {
      this.sprite = null; //TODO
    }
  });
  
  var Elevator = util.extend(PlayContextual, 'Elevator', {
    constructor: function Elevator() {
      this.sprite = null; //TODO
    }
  });
  
  var Actor = util.extend(PlayContextual, 'Actor', {
    constructor: function Actor() {
      this.sprite = null; //TODO
    }
  });
  
  function sblCallbacks(state) {
    return {
      dialog: function dialog(person, message) {
        //display dialog gui
      },
      options: function options(block) {
        //TODO
      },
      option: function option(lb, message) {
        if(sbl.isLabel(lb)) {
          state.program.goTo(lb)
        } else if (sbl.isFunc(lb)) {
          state.program.call(lb)
        } else {
          throw(state.program.throwExc("label is invalid"))
        }
      },
      animation: function animation(spriteName, animation) {
        //play the animation
      },
      expression: function expression(spriteName, expression) {
        //play the expression
      }
    };
  }
  
  return {
    PlayState: PlayState
  };
});