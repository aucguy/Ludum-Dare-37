base.registerModule('app', function() {
  var util = base.importModule('util');
  
  var setup = {
    preinit: function preinit(main) {
    },
    /**
     * load the assets
     */
    loadAssets: function loadAssets(main) {
    },
    /**
     * create the states
     */
    getStates: function getStates(main) {
        return {
            test: new TestState()
        }
    },
    /**
     * initialize the application
     */
    initApp: function initApp(main) {
      main.game.state.start('test');
    }
  };
  
  var TestState = util.extend(Object, 'TestState', {
    create: function create() {
      this.game.add.sprite(50, 50, 'image/test');
    }
  });
  
  return {
    setup: setup
  };
});