base.registerModule('app', function() {
  var play = base.importModule('play');
  
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
            play: new play.PlayState()
        }
    },
    /**
     * initialize the application
     */
    initApp: function initApp(main) {
      document.getElementById('game').style.display = 'inline';
      main.game.state.start('play');
    }
  };
  
  return {
    setup: setup
  };
});