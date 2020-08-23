import * as util from '/lib/util.js';
import * as play from './play.js';

var parser = new DOMParser();

/**
 * entry point
 */
function init() {
  var doc = parser.parseFromString(util.getAsset('gui'), 'text/html');
  var gui = doc.getElementById('game');
  document.getElementById('gameContainer').appendChild(gui);

  var style = util.getAsset('style');
  var elem = document.createElement('style');
  elem.innerText = style;
  document.head.appendChild(elem);

  var game = new Phaser.Game({
    width: 320,
    height: 400,
    canvasID: 'display',
    parent: 'screen',
    renderer: Phaser.AUTO,
    state: new util.BootState('play')
  });
  game.state.add('play', new play.PlayState());
  return game;
}

export {
  init,
};