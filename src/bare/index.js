var base = base || {};
(function() {
  var logo;
  var logoLoaded = false;

  base.indexFunc = function indexFunc(state) {
    var assets = [
      ['image/test',          'assets/image/test.png',        'image'],
      ['image/tiles',         'assets/image/tiles.png',       'spritesheet', {
        frameWidth: 32,
        frameHeight: 32,
        pixelated: true
      }],
      ['image/turtle',        'assets/image/turtle.png',      'spritesheet', {
        frameWidth: 32,
        frameHeight: 32,
        pixelated: true
      }],
      
      ['program/level1',      'assets/program/level1.sbl',    'text'],
      ['program/level2',      'assets/program/level2.sbl',    'text'],
      
      ['level/level1',        'assets/level/level1.json',     'tilemap'],
      ['level/level2',        'assets/level/level2.json',     'tilemap']
    ];
    //#mode dev
    base.loadAssets(assets.concat([
      ['scripts/phaser',      'lib/phaser/v2/build/phaser.js',   'script'],
      ['scripts/canvg',       'lib/canvg/canvg.js',           'script'],
      ['scripts/rgbcolor',    'lib/canvg/rgbcolor.js',        'script'],
      ['scripts/stackblur',   'lib/canvg/StackBlur.js',       'script'],
      ['scripts/stateMachine', 'lib/javascript-state-machine/state-machine.js', 'script'],
      ['scripts/phaserInjector', 'lib/basejs/src/injectors/phaserInjector.js', 'script'],

      ['scripts/main',        'src/bare/main.js',             'script'],
      ['scripts/gui',         'src/bare/gui.js',              'script'],
      ['scripts/util',        'src/bare/util.js',             'script'],
      ['scripts/app',         'src/app.js',                   'script'],
      
      ['scripts/play',        'src/play.js',                   'script'],
      ['scripts/sbl/lexer',   'src/sbl/lexer.js',              'script'],
      ['scripts/sbl/parser',  'src/sbl/parser.js',             'script'],
      ['scripts/sbl/compiler','src/sbl/compiler.js',           'script'],
      ['scripts/sbl/interpreter','src/sbl/interpreter.js',     'script'],
      ['scripts/sbl/common',  'src/sbl/common.js',             'script'],
      ['scripts/sbl/lib',     'src/sbl/lib.js',                'script'],
      ['scripts/sbl/sbl',     'src/sbl/sbl.js',                'script']
    ]));
    //#mode none
    //#mode rel
    //base.loadAssets(assets.concat([
    // ['scripts/app',        'app.min.js',                   'script']
    //]));
    //#mode none

    logo = new Image();
    logo.onload = base.external(function() {
      logoLoaded = true;
    });
    logo.src = 'assets/image/logo.png';
  };
  
  base.displayId = "content";
  
  base.renderLoadingScreen = function(canvasID, loading, loaded) {
    var display = document.getElementById(canvasID);
    if(display === null) return;
    var context = display.getContext('2d');
    if(context === null) return;
    var width = context.canvas.width;
    var height = context.canvas.height;

    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);
    if(logoLoaded) {
      context.drawImage(logo, (width - logo.width) / 2, (height - logo.height) / 2);
    }
    context.fillStyle = '#000000';
    context.beginPath();
    context.rect(20, height - 40, width - 40, 20);
    context.stroke();
    context.beginPath();
    context.rect(20, height - 40, (loaded / (loaded + loading)) * (width - 40), 20);
    context.fill();
  };
})();
