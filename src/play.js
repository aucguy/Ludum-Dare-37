base.registerModule('play', function() {
  var util = base.importModule('util');
  var sbl = base.importModule('sbl');
  
  var EDITOR_ID = "editor";
  var ERROR_ID = "sblError";
  var TILE_SIZE = 32;
  var EXIT_TILE = 2;
  var MAX_LEVEL = 2;
  
  var PlayContextual = util.extend(util.Contextual, 'PlayContextual', {
    state: util.contextAttr,
    game: util.contextAttr
  });
  
  var PlayState = util.extend(PlayContextual, 'PlayState', {
    constructor: function PlayState() {
      this.constructor$PlayContextual();
      this.level = null;
      this.running = false;
      this.levelNo = 1;
      this.unlocked = parseInt(localStorage.getItem("unlockedLevels")) || 1;
      this.nextMove = null;
    },
    create: function create() {
      base.addEventListener(document.getElementById('runCode'), 'click', function() {
        saveCode(this.levelNo);
        this.resetLevel();
        this.nextMove = this.game.time.totalElapsedSeconds() + 1;
      }.bind(this));
      
      base.addEventListener(document.getElementById('stopCode'), 'click', function() {
        saveCode(this.levelNo);
        this.resetLevel();
        this.nextMove = null;
      }.bind(this));
      
      base.addEventListener(document.getElementById('resetCode'), 'click', function() {
        resetCode(this.levelNo);
      }.bind(this));
      
      var self = this;
      base.addEventListener(document.getElementById('levelSelect'), 'change', function() {
        saveCode(self.levelNo);
        var level = this.selectedIndex + 1;
        if(level <= self.unlocked) {
          self.levelNo = level;
          self.gotoLevel(level);
        }
        self.nextMove = null;
      })
      
      this.gotoLevel();
    },
    gotoLevel: function() {
      var editor = document.getElementById(EDITOR_ID);
      editor.value = getCode(this.levelNo);
      document.getElementById('levelSelect').selectedIndex = this.levelNo - 1;
      this.resetLevel();
    },
    resetLevel: function resetLevel() {
      document.getElementById(ERROR_ID).innerHTML = '';
      if(this.level != null){
        destroyLevel(this.level);
      }
      this.level = createLevel(this.game, this.levelNo);
    },
    update: function update() {
      if(this.level.complete) {
        this.levelNo = Math.min(this.levelNo + 1, MAX_LEVEL);
        this.unlocked = Math.max(this.levelNo, this.unlocked);
        localStorage.setItem("unlockedLevels", this.unlocked);
        this.gotoLevel();
        this.nextMove = null;
      }
      if(this.nextMove != null && this.level.program != null) {
        var time = this.game.time.totalElapsedSeconds();
        this.level.field.turtleGroup.group.visible = true;
        if(time >= this.nextMove) { 
          try {
            this.level.program.run();
            this.nextMove = time + 1;
          } catch (error) {
            handleProgramError(error);
            this.nextMove = null;
          }
          this.updateLocks();
        } else if(time >= this.nextMove - 0.25) {
          this.level.field.turtleGroup.group.visible = false;
        }
      }
    },
    updateLocks: function updateLocks() {
      var switches = this.level.field.switchGroup.switches;
      var locks = this.level.field.lockGroup.locks;
      var turtles = this.level.field.turtleGroup.turtles;
      var i;
      for(i=0; i<locks.entries.length; i++) {
        locks.entries[i].value.setSolid(true);
      }
      for(i=0; i<turtles.length; i++) {
        var sw = switches.get([turtles[i].x, turtles[i].y]);
        if(sw != null) {
          var lock = locks.get(sw.name);
          if(lock != null){
            lock.setSolid(false);
          }
        }
      }
    }
  });
  
  function createLevel(game, number) {
    var program = null;
    try {
      var program = sbl.compile(editor.value);
    } catch (error) {
      handleProgramError(error);
    }
    if(program != null) {
      program.linkForeign(sblCallbacks(program));
    }
    
    var map = {
      tilemap: game.add.tilemap('level/level' + number),
      layer: null
    };
    map.tilemap.addTilesetImage('tiles', 'image/tiles');
    map.tilemap.setCollision(1);
    map.layer = map.tilemap.createLayer('main');
    
    var switchGroup = {
      group: game.add.group(),
      switches: new util.Map()
    }
    
    var lockGroup = {
      group: game.add.group(),
      locks: new util.Map(),
      locksPos: new util.Map()
    };
    
    var turtleGroup = {
      group: game.add.group(),
      turtles: []
    };
    
    var field = {
      map: map,
      turtleGroup: turtleGroup,
      switchGroup: switchGroup,
      lockGroup: lockGroup
    };
    
    var level = {
      field: field,
      program: program,
      complete: false,
      game: game
    }
    
    map.tilemap.createFromObjects('objects', 9, 'image/turtle', 0, undefined, undefined, turtleGroup.group);
    map.tilemap.createFromObjects('objects', 4, 'image/tiles', 3, undefined, undefined, switchGroup.group);
    map.tilemap.createFromObjects('objects', 3, 'image/tiles', 2, undefined, undefined, lockGroup.group);
    if(program != null) {
      for(var i=0; i<turtleGroup.group.children.length; i++) {
        turtleGroup.turtles.push(new Turtle(level, turtleGroup.group.children[i], program.branches[0]));
      }
      for(var i=0; i<switchGroup.group.children.length; i++) {
        var obj = new Switch(level, switchGroup.group.children[i]);
        switchGroup.switches.put([obj.x, obj.y], obj);
      }
      for(var i=0; i<lockGroup.group.children.length; i++) {
        var obj = new Lock(level, lockGroup.group.children[i]);
        lockGroup.locks.put(obj.name, obj);
        lockGroup.locksPos.put([obj.x, obj.y], obj);
      }
    }
    
    return level;
  }
  
  function destroyLevel(level) {
    level.field.map.tilemap.destroy();
    level.field.map.layer.destroy();
    level.field.turtleGroup.group.destroy();
    level.field.switchGroup.group.destroy();
    level.field.lockGroup.group.destroy();
  }
  
  var GameObject = util.extend(Object, 'GameObject', {
    constructor: function GameObject(level, sprite) {
      this.level = level;
      this.sprite = sprite;
      this.x = Math.round(sprite.position.x / TILE_SIZE);
      this.y = Math.round(sprite.position.y / TILE_SIZE);
    }
  });
  
  var Turtle = util.extend(GameObject, 'Turtle', {
    constructor: function Turtle(level, sprite, branch, dir) {
      this.constructor$GameObject(level, sprite);
      branch.turtle = this;
      this.direction = dir || direction.RIGHT;
      this.updateSprite();
    },
    updateSprite: function() {
      var tile = this.getTileAt(this.x, this.y)
      if(tile && tile.index == EXIT_TILE) {
        this.level.complete = true;
      }
      this.sprite.x = this.x * TILE_SIZE;
      this.sprite.y = this.y * TILE_SIZE;
      this.sprite.frame = this.direction.frame;
    },
    getTileAt(x, y) {
      return this.level.field.map.tilemap.getTile(x, y, this.level.field.map.layer)
    },
    fork: function fork(branch) {
      var sprite = this.level.game.add.sprite(this.sprite.x, this.sprite.y, 
        'image/turtle', undefined, this.level.field.turtleGroup.group);
      var turtle = new Turtle(this.level, sprite, branch, this.direction);
      this.level.field.turtleGroup.turtles.push(turtle);
      return turtle;
    }
  });
  
  var Switch = util.extend(GameObject, 'Switch', {
    constructor: function Switch(level, sprite) {
      this.constructor$GameObject(level, sprite);
      this.name = sprite.name;
    }
  });
  
  var Lock = util.extend(GameObject, 'Lock', {
    constructor: function Lock(level, sprite) {
      this.constructor$GameObject(level, sprite);
      this.name = sprite.name;
      this.setSolid(true);
    },
    setSolid: function setSolid(solid) {
      this.solid = solid;
      this.sprite.frame = solid ? 2 : 4;
    }
  });
  
  function sblCallbacks(program) {
    return {
      left: function left(branch) {
        var turtle = branch.turtle;
        turtle.direction = turtle.direction.leftDir;
        turtle.updateSprite();
        branch.pause();
      },
      right: function right(branch) {
        var turtle = branch.turtle;
        turtle.direction = turtle.direction.rightDir;
        turtle.updateSprite();
        branch.pause();
      },
      forward: function forward(branch) {
        var turtle = branch.turtle;
        var x = turtle.x + turtle.direction.vector[0];
        var y = turtle.y + turtle.direction.vector[1];
        var tile = turtle.level.field.map.tilemap.getTile(x, y, turtle.level.field.map.layer);
        var lock = turtle.level.field.lockGroup.locksPos.get([x, y]);
        if((tile == null || !tile.collides) && (lock == null || !lock.solid)) {
          turtle.x = x;
          turtle.y = y;
          turtle.updateSprite();
        }
        branch.pause();
      }
    };
  }
  
  var direction = {
    LEFT: {
      vector: [-1, 0]
    },
    RIGHT: {
      vector: [1, 0]
    },
    UP: {
      vector: [0, -1]
    },
    DOWN: {
      vector: [0, 1]
    }
  }
  
  direction.LEFT.rightDir = direction.UP;
  direction.UP.rightDir = direction.RIGHT;
  direction.RIGHT.rightDir = direction.DOWN;
  direction.DOWN.rightDir = direction.LEFT;
  
  direction.LEFT.leftDir = direction.DOWN;
  direction.UP.leftDir = direction.LEFT;
  direction.RIGHT.leftDir = direction.UP;
  direction.DOWN.leftDir = direction.RIGHT;
  
  direction.LEFT.frame = 2;
  direction.UP.frame = 3;
  direction.RIGHT.frame = 0;
  direction.DOWN.frame = 1;
  
  function handleProgramError(error) {
    document.getElementById(ERROR_ID).innerHTML = (error.notInternal ? '' : '(internal) ') + error.message;
    if(!error.notInternal) {
      console.error(error.stack);
    }
  }
  
  function saveCode(levelNo) {
    var editor = document.getElementById(EDITOR_ID);
    setCode(levelNo, editor.value);
  }
  
  function getCode(levelNo) {
    return localStorage.getItem("levelCode" + levelNo) || base.getAsset("program/level" + levelNo);
  }
  
  function setCode(levelNo, code) {
    localStorage.setItem("levelCode" + levelNo, code);
  }
  
  function resetCode(levelNo) {
    document.getElementById(EDITOR_ID).value = base.getAsset("program/level" + levelNo);
  }
  
  return {
    PlayState: PlayState
  };
});