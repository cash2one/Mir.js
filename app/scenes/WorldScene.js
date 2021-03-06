var LoaderService = require('../services/LoaderService.js');
var GameService = require('../services/GameService.js');
var ResourceService = require('../services/ResourceService.js');
var InputService = require('../services/InputService.js');
var DirectionEnum = require('../enums/DirectionEnum.js');
var GameInterface = require('../gui/GameInterface.js');
var PIXI = require('pixi.js');

function depthCompare(a,b) {
	if (a.z < b.z) {
	 return -1;
	}
	if (a.z > b.z) {
		return 1;
	}
	return 0;
}

function WorldScene(appContainer) {
	this._appContainer = appContainer;
	this._stage = new PIXI.Stage();
	this._map = null;
	this._isLoadingMap = false;
	this._gameOffSetX = null;
	this._gameOffSetY = null;
	this._tileLayer = new PIXI.DisplayObjectContainer();
	this._smTileLayer = new PIXI.DisplayObjectContainer();
	this._objTileLayer = new PIXI.DisplayObjectContainer();
	this._lastProcessedX = null;
	this._lastProcessedY = null;
	this._cameraDeltaX = 0;
	this._cameraDeltaY = 0;
	this._topBound = null;
	this._leftBound = null;
	this._rightBound = null;
	this._bottomBound = null;
	this._graphicsPlacements = [];
	this._readyForInput = false;
	this._mainPlayer = GameService.player;
	this._gameInterface = null;
}

WorldScene.prototype.init = function() {
	var defaults = GameService.defaults;
	this._gameOffSetX = defaults.screenWidth / 2 - 32;
    this._gameOffSetY = defaults.screenHeight / 2 - 48;

    //add
    this._stage.addChild(this._tileLayer);
    this._stage.addChild(this._smTileLayer);
    this._stage.addChild(this._objTileLayer);

	this._initGui();
	this._enableInput();
	this._initObjects();

	//load the placements and the starting map
	this._loadGraphicsPlacements()
		.then(this._loadMap.bind(this))
		.then(function(map) {
			this._map = map;
			this._lastProcessedX = this._mainPlayer.getX();
			this._lastProcessedY = this._mainPlayer.getY();	
			this._readyForInput = true;
			this._updateCamera(0, 0);		
			this._isLoadingMap = false;
			this._gameInterface = new GameInterface(this._appContainer);
		}.bind(this));
}

WorldScene.prototype._initObjects = function() {
	//init the sprites for our objects
	this._mainPlayer.initHumanSprite(this);
	for(var i = 0; i < GameService.npcs.length; i++) {
		GameService.npcs[i].initNpcSprite(this);
	}
	for(var i = 0; i < GameService.mobs.length; i++) {
		GameService.mobs[i].initMobSprite(this);
	}	
}

WorldScene.prototype._enableInput = function() {
	if(GameService.debug.enabled === true) {
		InputService.on('mousemove', this._mouseDebug.bind(this), true);
	}
}

WorldScene.prototype._mouseDebug = function(mousePosition) {
	var defaults = GameService.defaults;

	for (y = this._topBound; y <= this._bottomBound; y++) {
		drawY = (y - this._mainPlayer.getY()) * defaults.cellHeight + this._gameOffSetY; //Moving OffSet

	    for (x = this._leftBound; x <= this._rightBound; x++) {
			drawX = (x - this._mainPlayer.getX()) * defaults.cellWidth + this._gameOffSetX; //Moving OffSet

			if(mousePosition.x > drawX && mousePosition.y > drawY && mousePosition.x < drawX + 48 && mousePosition.y < drawY + 32) {
				GameService.debug.x = x;
				GameService.debug.y = y;
				return;
			}

		}
	}
}

WorldScene.prototype._moveNorthWest = function(distance) {
	if(this._readyForInput === true) {

		var originalDistance = distance;

		//first check walk
		if(this._checkCollision(-1, -1) === true) {
			return false;
		}
		//check run if we are running
		if(originalDistance > 1) {
			if(this._checkCollision(-2, -2) === true) {
				distance = 1;
			}
		}
		//check hourse run if distance is 3
		if(originalDistance > 2) {
			if(this._checkCollision(-3, -3) === true) {
				distance = 2;
			}			
		}

		if(this._mainPlayer.isMoving === false) {
			distance = 1;
		}		

		this._readyForInput = false;
		this._mainPlayer.setVirtualLocation(-distance, -distance);
	
		this._mainPlayer.move(distance, 7, function begin() {
			//do nothing
		}.bind(this), function cameraMove(value) {
			this._updateCameraOffset(-value, -value);
		}.bind(this), function done() {
			this._updateCamera(-distance, -distance);
		}.bind(this), function inputReady() {
			this._readyForInput = true;
		}.bind(this));
	}
}


WorldScene.prototype._moveWest = function(distance) {
	if(this._readyForInput === true) {

		var originalDistance = distance;

		//first check walk
		if(this._checkCollision(-1, 0) === true) {
			return false;
		}
		//check run if we are running
		if(originalDistance > 1) {
			if(this._checkCollision(-2, 0) === true) {
				distance = 1;
			}
		}
		//check hourse run if distance is 3
		if(originalDistance > 2) {
			if(this._checkCollision(-3, 0) === true) {
				distance = 2;
			}			
		}

		if(this._mainPlayer.isMoving === false) {
			distance = 1;
		}		

		this._readyForInput = false;
		this._mainPlayer.setVirtualLocation(-distance, 0);
	
		this._mainPlayer.move(distance, 6, function begin() {
			//do nothing
		}.bind(this), function cameraMove(value) {
			this._updateCameraOffset(-value, 0);
		}.bind(this), function done() {
			this._updateCamera(-distance, 0);
		}.bind(this), function inputReady() {
			this._readyForInput = true;
		}.bind(this));
	}
}

WorldScene.prototype._moveEast = function(distance) {
	if(this._readyForInput === true) {

		var originalDistance = distance;

		//first check walk
		if(this._checkCollision(1, 0) === true) {
			return false;
		}
		//check run if we are running
		if(originalDistance > 1) {
			if(this._checkCollision(2, 0) === true) {
				distance = 1;
			}
		}
		//check hourse run if distance is 3
		if(originalDistance > 2) {
			if(this._checkCollision(3, 0) === true) {
				distance = 2;
			}			
		}

		if(this._mainPlayer.isMoving === false) {
			distance = 1;
		}		

		this._readyForInput = false;
		this._mainPlayer.setVirtualLocation(distance, 0);
	
		this._mainPlayer.move(distance, 2, function begin() {
			//do nothing
		}.bind(this), function cameraMove(value) {
			this._updateCameraOffset(value, 0);
		}.bind(this), function done() {
			this._updateCamera(distance, 0);
		}.bind(this), function inputReady() {
			this._readyForInput = true;
		}.bind(this));
	}
}

WorldScene.prototype._moveNorth = function(distance) {
	if(this._readyForInput === true) {

		var originalDistance = distance;

		//first check walk
		if(this._checkCollision(0, -1) === true) {
			return false;
		}
		//check run if we are running
		if(originalDistance > 1) {
			if(this._checkCollision(0, -2) === true) {
				distance = 1;
			}
		}
		//check hourse run if distance is 3
		if(originalDistance > 2) {
			if(this._checkCollision(0, -3) === true) {
				distance = 2;
			}			
		}

		if(this._mainPlayer.isMoving === false) {
			distance = 1;
		}

		this._readyForInput = false;
		this._mainPlayer.setVirtualLocation(0, -distance);
	
		this._mainPlayer.move(distance, 0, function begin() {
			//do nothing
		}.bind(this), function cameraMove(value) {
			this._updateCameraOffset(0, -value);
		}.bind(this), function done() {
			this._updateCamera(0, -distance);
		}.bind(this), function inputReady() {
			this._readyForInput = true;
		}.bind(this));
	}
}

WorldScene.prototype._moveNorthEast = function(distance) {
	if(this._readyForInput === true) {

		var originalDistance = distance;

		//first check walk
		if(this._checkCollision(1, -1) === true) {
			return false;
		}
		//check run if we are running
		if(originalDistance > 1) {
			if(this._checkCollision(2, -2) === true) {
				distance = 1;
			}
		}
		//check hourse run if distance is 3
		if(originalDistance > 2) {
			if(this._checkCollision(3, -3) === true) {
				distance = 2;
			}			
		}

		if(this._mainPlayer.isMoving === false) {
			distance = 1;
		}		

		this._readyForInput = false;
		this._mainPlayer.setVirtualLocation(distance, -distance);
		
		this._mainPlayer.move(distance, 1, function begin() {
			//do nothing
		}.bind(this), function cameraMove(value) {
			this._updateCameraOffset(value, -value);
		}.bind(this), function done() {
			this._updateCamera(distance, -distance);
		}.bind(this), function inputReady() {
			this._readyForInput = true;
		}.bind(this));
	}
}

WorldScene.prototype._moveSouth = function(distance) {
	if(this._readyForInput === true) {

		var originalDistance = distance;

		//first check walk
		if(this._checkCollision(0, 1) === true) {
			return false;
		}
		//check run if we are running
		if(originalDistance > 1) {
			if(this._checkCollision(0, 2) === true) {
				distance = 1;
			}
		}
		//check hourse run if distance is 3
		if(originalDistance > 2) {
			if(this._checkCollision(0, 3) === true) {
				distance = 2;
			}			
		}

		if(this._mainPlayer.isMoving === false) {
			distance = 1;
		}		

		this._readyForInput = false;
		this._mainPlayer.setVirtualLocation(0, distance);
		
		this._mainPlayer.move(distance, 4, function begin() {
			this._mainPlayer.setZ(this._mainPlayer.getY() + distance);
			this._objTileLayer.children.sort(depthCompare);
		}.bind(this), function cameraMove(value) {
			this._updateCameraOffset(0, value);
		}.bind(this), function done() {
			this._updateCamera(0, distance);
		}.bind(this), function inputReady() {
			this._readyForInput = true;
		}.bind(this));
	}
}

WorldScene.prototype._moveSouthWest = function(distance) {
	if(this._readyForInput === true) {

		var originalDistance = distance;

		//first check walk
		if(this._checkCollision(-1, 1) === true) {
			return false;
		}
		//check run if we are running
		if(originalDistance > 1) {
			if(this._checkCollision(-2, 2) === true) {
				distance = 1;
			}
		}
		//check hourse run if distance is 3
		if(originalDistance > 2) {
			if(this._checkCollision(-3, 3) === true) {
				distance = 2;
			}			
		}

		if(this._mainPlayer.isMoving === false) {
			distance = 1;
		}		

		this._readyForInput = false;
		this._mainPlayer.setVirtualLocation(-distance, distance);
		
		this._mainPlayer.move(distance, 5, function begin() {
			this._mainPlayer.setZ(this._mainPlayer.getY() + distance);
			this._objTileLayer.children.sort(depthCompare);
		}.bind(this), function cameraMove(value) {
			this._updateCameraOffset(-value, value);
		}.bind(this), function done() {
			this._updateCamera(-distance, distance);
		}.bind(this), function inputReady() {
			this._readyForInput = true;
		}.bind(this));
	}
}

WorldScene.prototype._moveSouthEast = function(distance) {
	if(this._readyForInput === true) {

		var originalDistance = distance;

		//first check walk
		if(this._checkCollision(1, 1) === true) {
			return false;
		}
		//check run if we are running
		if(originalDistance > 1) {
			if(this._checkCollision(2, 2) === true) {
				distance = 1;
			}
		}
		//check hourse run if distance is 3
		if(originalDistance > 2) {
			if(this._checkCollision(3, 3) === true) {
				distance = 2;
			}			
		}

		if(this._mainPlayer.isMoving === false) {
			distance = 1;
		}		

		this._readyForInput = false;
		this._mainPlayer.setVirtualLocation(distance, distance);

		this._mainPlayer.move(distance, 3, function begin() {
			this._mainPlayer.setZ(this._mainPlayer.getY() + distance);
			this._objTileLayer.children.sort(depthCompare);
		}.bind(this), function cameraMove(value) {
			this._updateCameraOffset(value, value);
		}.bind(this), function done() {
			this._updateCamera(distance, distance);
		}.bind(this), function inputReady() {
			this._readyForInput = true;
		}.bind(this));
	}
}

WorldScene.prototype.getMap = function() {
	return this._map;
}

WorldScene.prototype._checkCollision = function(x, y) {
	var mapCell = this._map.getMapCell(this._mainPlayer.getVirtualX() + x, this._mainPlayer.getVirtualY() + y),
		npcs = GameService.npcs,
		mobs = GameService.mobs,
		i = 0;

	if(mapCell.collision) {
		return true;
	}

	//check npcs
	for(i = 0; i < npcs.length; i++) {
		if(this._mainPlayer.getVirtualX() + x === npcs[i].x && this._mainPlayer.getVirtualY() + y === npcs[i].y) {
			return true;
		}
	}	

	//check mobs
	for(i = 0; i < mobs.length; i++) {
		if(this._mainPlayer.getVirtualX() + x === mobs[i].x && this._mainPlayer.getVirtualY() + y === mobs[i].y) {
			return true;
		}
	}		

	return false;
}

WorldScene.prototype._updateCameraOffset = function(diffX, diffY) {
	var defaults = GameService.defaults;

	var moveX = parseInt(defaults.cellWidth * diffX);
	var moveY = parseInt(defaults.cellHeight * diffY);

	this._tileLayer.x = this._tileLayer.x - moveX;
	this._tileLayer.y = this._tileLayer.y - moveY;
	this._smTileLayer.x = this._smTileLayer.x - moveX;
	this._smTileLayer.y = this._smTileLayer.y - moveY;
	this._objTileLayer.x = this._objTileLayer.x - moveX;
	this._objTileLayer.y = this._objTileLayer.y - moveY;

	this._mainPlayer.getHumanSprite().sprites.x = this._mainPlayer.getHumanSprite().sprites.x + moveX;
	this._mainPlayer.getHumanSprite().sprites.y = this._mainPlayer.getHumanSprite().sprites.y + moveY;
}

WorldScene.prototype._updateCamera = function(diffX, diffY) {
	var defaults = GameService.defaults;

	var moveX = parseInt(defaults.cellWidth * diffX);
	var moveY = parseInt(defaults.cellHeight * diffY);

	//move this out eventually
	this._mainPlayer.setLocation(this._mainPlayer.getX() + diffX, this._mainPlayer.getY() + diffY);

	this._cameraDeltaX = this._cameraDeltaX + moveX;
	this._cameraDeltaY = this._cameraDeltaY + moveY;

	this._updateBounds();
	this._handleOldSprites();
	this._handleNewSprites();

}

WorldScene.prototype._calculateDirection = function() {
    var fDistanceX = InputService.mouseX - this._gameOffSetX; 
    var fDistanceY = InputService.mouseY - this._gameOffSetY + 64; 

    var n = Math.abs(fDistanceX) + Math.abs(fDistanceY); 

    var fMouseDir; 

    if( ( fDistanceX >= 0 ) & ( fDistanceY >= 0 ) ) fMouseDir = 90 * ( fDistanceY / n ); 
    else 
    if( ( fDistanceX <= 0 ) && ( fDistanceY >= 0 ) ) fMouseDir = -90 * ( fDistanceX / n ) + 90; 
    else 
    if( ( fDistanceX <= 0 ) && ( ( fDistanceY ) <= 0 ) ) fMouseDir = -90 * ( fDistanceY / n ) + 180; 
    else 
        fMouseDir = 90 * ( fDistanceX / n ) + 270; 

    var direction;

    //225  270  315
    //    - - -
    //180 - X - 0
    //    - - -
    //135  90   45

    if( fMouseDir > 315 - 22.5 && fMouseDir < 315 + 22.5  ) { direction = DirectionEnum.NorthEast; } 
    if( fMouseDir > 360 - 22.5 || fMouseDir < 22.5 ) { direction = DirectionEnum.East; } 
    if( fMouseDir > 45 - 22.25 && fMouseDir < 45 + 22.5 ) { direction = DirectionEnum.SouthEast; } 
    if( fMouseDir > 90 - 22.5 && fMouseDir < 90 + 22.5 ) { direction = DirectionEnum.South; } 
    if( fMouseDir > 135 - 22.5 && fMouseDir < 135 + 22.5 ) { direction = DirectionEnum.SouthWest; } 
    if( fMouseDir > 180 - 22.5 && fMouseDir < 180 + 22.5 ) { direction = DirectionEnum.West; } 
    if( fMouseDir > 225 - 22.5 && fMouseDir < 225 + 22.5 ) { direction = DirectionEnum.NorthWest; } 
    if( fMouseDir > 270 - 22.5 && fMouseDir < 270 + 22.5 ) { direction = DirectionEnum.North; } 

    return direction;
}

WorldScene.prototype.checkInputs = function() {
	var direction = 0,
		distance = 0;

	if(this._readyForInput === true) {
		if((InputService.leftMouseButtonDown === true && InputService.shiftKeyDown === false) || InputService.rightMouseButtonDown === true) {
			direction = this._calculateDirection();
			distance = InputService.rightMouseButtonDown === true ? 2 : 1;

			switch(direction) {
				case DirectionEnum.North:
					this._moveNorth(distance);
					break;
				case DirectionEnum.NorthEast:
					this._moveNorthEast(distance);
					break;
				case DirectionEnum.East:
					this._moveEast(distance);
					break;
				case DirectionEnum.SouthEast:
					this._moveSouthEast(distance);
					break;
				case DirectionEnum.South:
					this._moveSouth(distance);
					break;
				case DirectionEnum.SouthWest:
					this._moveSouthWest(distance);
					break;
				case DirectionEnum.West:
					this._moveWest(distance);
					break;
				case DirectionEnum.NorthWest:
					this._moveNorthWest(distance);
					break;										
			}
		} else if(InputService.leftMouseButtonDown === true && InputService.shiftKeyDown === true) {
			direction = this._calculateDirection();
			//attack
			this._readyForInput = false;
			this._mainPlayer.meleeAttack(direction, this._enableReadyForInput.bind(this));
		}
	}
}

WorldScene.prototype._enableReadyForInput = function() {
	this._readyForInput = true;
}

WorldScene.prototype.updateAnimations = function() {
	var npcs = GameService.npcs,
		mobs = GameService.mobs;
	//update main player
	this._mainPlayer.update();
	//update npcs
	for(var i = 0; i < npcs.length; i++) {
		npcs[i].update();
	}	
	//update mobs
	for(var i = 0; i < mobs.length; i++) {
		mobs[i].update();
	}	
}

WorldScene.prototype._updateBounds = function() {
	var defaults = GameService.defaults;

	this._topBound = this._mainPlayer.getY() - defaults.viewRangeY < 0 ? 0 : this._mainPlayer.getY() - defaults.viewRangeY;
	this._leftBound = this._mainPlayer.getX() - defaults.viewRangeX < 0 ? 0 : this._mainPlayer.getX() - defaults.viewRangeX;
	this._rightBound = this._mainPlayer.getX() + defaults.viewRangeX > this._map.getWidth() - 1 ? this._map.getWidth() - 1 : this._mainPlayer.getX() + defaults.viewRangeX;
	this._bottomBound = this._mainPlayer.getY() + defaults.viewRangeY + 5 > this._map.getHeight() - 1 ? this._map.getHeight() - 1 : this._mainPlayer.getY() + defaults.viewRangeY + 5;
}

WorldScene.prototype._handleOldSprites = function() {
	var defaults = GameService.defaults;

	//if we have a different lastProcessed X/Y from now, our player has moved, so we need handle some old tiles
	if(this._lastProcessedX !== null && this._lastProcessedY !== null) {
		if(this._lastProcessedX !== this._mainPlayer.getX() || this._lastProcessedY !== this._mainPlayer.getY()) {
			if(this._lastProcessedX > this._mainPlayer.getX() && this._lastProcessedX < this._rightBound) {
				//player has moved left, so let's clear the far right sprites
				this._clearSpritesFromStage(this._rightBound + 1, this._rightBound + this._lastProcessedX - this._mainPlayer.getX(), this._topBound, this._bottomBound)
			} else if(this._lastProcessedX < this._mainPlayer.getX() && this._lastProcessedX > this._leftBound) {
				//player has moved right, so let's clear the far left sprites
				this._clearSpritesFromStage(this._leftBound - this._mainPlayer.getX() + this._lastProcessedX, this._leftBound - 1, this._topBound, this._bottomBound)
			}

			if(this._lastProcessedY > this._mainPlayer.getY() && this._lastProcessedY < this._bottomBound) {
				//player has moved up, so let's clear the bottom sprites
				this._clearSpritesFromStage(this._leftBound, this._rightBound, this._bottomBound + 1, this._bottomBound + this._lastProcessedY - this._mainPlayer.getY())
			} else if(this._lastProcessedY < this._mainPlayer.getY() && this._lastProcessedY > this._topBound) {
				//player has moved right, so let's clear the far left sprites
				this._clearSpritesFromStage(this._leftBound, this._rightBound, this._topBound - this._mainPlayer.getY() + this._lastProcessedY, this._topBound - 1)
			}			

			if (this._lastProcessedX < this._leftBound || this._lastProcessedX > this._rightBound
				|| this._lastProcessedY < this._topBound || this._lastProcessedY > this._bottomBound) {
				//player has completely moved from the last place (new area, teleport)
				this._clearAllSpritesFromStage();
			}

			this._lastProcessedX = this._mainPlayer.getX();
			this._lastProcessedY = this._mainPlayer.getY();				
		}
	}
}

WorldScene.prototype._clearAllSpritesFromStage = function() {
	this._tileLayer.removeChildren();
	this._smTileLayer.removeChildren();
	this._objTileLayer.removeChildren();
	if(this._map) {
		this._map.clearSprites();
	}
}

WorldScene.prototype._clearSpritesFromStage = function(leftBound, rightBound, topBound, bottomBound) {
	var mapCell;
	if(leftBound < 0) {
		leftBound = 0;
	}
	if(rightBound > this._map.getWidth() - 1) {
		rightBound = this._map.getWidth() - 1;
	}
	if(topBound < 0) {
		topBound = 0;
	}
	if(bottomBound > this._map.getHeight() - 1) {
		bottomBound = this._map.getHeight() - 1;
	}	
	for (var y = topBound; y <= bottomBound; y++) {
		for (var x = leftBound; x <= rightBound; x++) {
			mapCell = this._map.getMapCell(x, y);

			if(mapCell.backSprite !== null) {
				this._tileLayer.removeChild(mapCell.backSprite);
				this._map.clearSprite(mapCell);
			}
			if(mapCell.middleSprite !== null) {
				this._smTileLayer.removeChild(mapCell.middleSprite);
				this._map.clearSprite(mapCell);
			}			

			if(mapCell.frontSprite !== null) {
				this._objTileLayer.removeChild(mapCell.frontSprite);
				this._map.clearSprite(mapCell);
			}					
		}
	}
}

WorldScene.prototype.getMap = function() {
	return this._map;
}

WorldScene.prototype._handleNewSprites = function() {
	var texture = null,
		imageUrl = '',
		imageUrlAndPlacements = {},
		defaults = GameService.defaults,
		drawX = 0,
		drawY = 0,
		mapCell = null,
		placementX = 0,
		placementY = 0,
		x = 0,
		y = 0,
		i = 0,
		npcs = GameService.npcs,
		mobs = GameService.mobs,
		otherPlayers = GameService.otherPlayers,
		npc = null,
		mob = null,
		mobSprite = null,
		otherPlayer = null,
		mainPlayerHumanSprite = null,
		mainPlayerX = this._mainPlayer.getX(),
		mainPlayerY = this._mainPlayer.getY();

	for (y = this._topBound; y <= this._bottomBound; y++) {
		drawY = (y - mainPlayerY) * defaults.cellHeight + this._gameOffSetY + this._cameraDeltaY; //Moving OffSet

	    for (x = this._leftBound; x <= this._rightBound; x++) {
			drawX = (x - mainPlayerX) * defaults.cellWidth + this._gameOffSetX + this._cameraDeltaX; //Moving OffSet
			mapCell = this._map.getMapCell(x, y);

			//handle big tiles
			if(x % 2 === 0 && y % 2 === 0) {
				//if we do not have backSprite for this tile, generate one and store it to the tileLayer
				if(mapCell.backSprite === null && mapCell.backIndex > 0 && mapCell.backImage > 0) {
					getBackImageUrl = this._map.getBackImageUrl(mapCell);
					if(getBackImageUrl !== null) {
						mapCell.backSprite = false;					
						LoaderService.loadTexture(getBackImageUrl)
							.then(this._addBackSprite.bind(this, mapCell, drawX, drawY + 64));
					} else {
						console.log('Failed loading map graphics ' + imageUrl + ' at index: ' + mapCell.backIndex);
					}
				}
			} else if (mapCell.backSprite !== null) {
				this._handleSpriteVisibility(mapCell.backSprite);
			}		

			//middle sprites (sm tiles)
			if(mapCell.middleSprite === null && mapCell.middleIndex > 0 && mapCell.middleImage > 0) {
				imageUrl = this._map.getMiddleImageUrl(mapCell);
				if(imageUrl !== null) {
					mapCell.middleSprite = false;
					LoaderService.loadTexture(imageUrl)
						.then(this._addMiddleSprite.bind(this, mapCell, drawX, drawY + 64));
				} else {
					console.log('Failed loading map graphics ' + imageUrl + ' at index: ' + mapCell.middleIndex);
				}
			} else if (mapCell.middleSprite !== null) {
				this._handleSpriteVisibility(mapCell.middleSprite);
			}

			//debug flag?
			if(!mapCell.debug && mapCell.collision === true && GameService.debug.enabled === true) {
				mapCell.debug = true;

				var graphics = new PIXI.Graphics();

				graphics.beginFill(0xFFFF00);

				graphics.drawRect(drawX, drawY, 48, 32);	
				this._objTileLayer.addChild(graphics);			
			}


			//top sprites (objects)
			if(mapCell.frontSprite === null && mapCell.frontIndex > 0 && mapCell.frontImage > 0) {
				imageUrlAndPlacements = this._map.getFrontImageUrlAndPlacements(mapCell);
				if(imageUrlAndPlacements !== null) {
					mapCell.frontSprite = false;

					placementX = this._graphicsPlacements[imageUrlAndPlacements.placements][imageUrlAndPlacements.index][0];
					placementY = this._graphicsPlacements[imageUrlAndPlacements.placements][imageUrlAndPlacements.index][1];

					LoaderService.loadTexture(imageUrlAndPlacements.url)
						.then(this._addFrontSprite.bind(
							this, 
							mapCell, 
							drawX + placementX, 
							drawY + placementY + 64,
							y
						));
				} else {
					console.log('Failed loading map graphics ' + imageUrl + ' at index: ' + mapCell.frontIndex);
				}
			} else if (mapCell.frontSprite !== null) {
				this._handleSpriteVisibility(mapCell.frontSprite);
			}		

			mainPlayerHumanSprite = this._mainPlayer.getHumanSprite();

			//handle main player
			if(mainPlayerX === x && mainPlayerY === y && mainPlayerHumanSprite.loaded === false) {
				mainPlayerHumanSprite.loaded = true;
				mainPlayerHumanSprite.init();
				mainPlayerHumanSprite.sprites.x = drawX;
				mainPlayerHumanSprite.sprites.y = drawY - 16;
				this._objTileLayer.addChild(mainPlayerHumanSprite.sprites);
			}

			//handle Npcs
			for(i = 0; i < npcs.length; i++) {
				npc = npcs[i];
				if(npc.x === x & npc.y === y && npc.npcSprite.loaded === false) {
					npc.npcSprite.loaded = true;
					npc.npcSprite.init();
					npc.npcSprite.sprites.x = drawX;
					npc.npcSprite.sprites.y = drawY - 16;
					this._objTileLayer.addChild(npc.npcSprite.sprites);
				}
			}

			//handle mobs
			for(i = 0; i < mobs.length; i++) {
				mob = mobs[i],
				mobSprite = mob.getMobSprite();
				if(mob.x === x & mob.y === y && mobSprite.loaded === false) {
					mobSprite.loaded = true;
					mobSprite.init();
					mobSprite.sprites.x = drawX;
					mobSprite.sprites.y = drawY - 16;
					this._objTileLayer.addChild(mobSprite.sprites);
				}
			}			
	    }
	}

	//handle layer order for objects
	this._objTileLayer.children.sort(depthCompare);
}

WorldScene.prototype._handleSpriteVisibility = function(sprite) {
	var defaults = GameService.defaults;

	if(sprite.x - this._cameraDeltaX > defaults.screenWidth + (defaults.cellWidth * 3)) {
		sprite.visible = false;
	} else if(sprite.x + sprite.width - this._cameraDeltaX < (defaults.cellWidth * -3)) {
		sprite.visible = false;
	} else if(sprite.y + sprite.height - this._cameraDeltaY < (defaults.cellheight * -3)) {
		sprite.visible = false;
	} else if(sprite.y - this._cameraDeltaY > defaults.screenHeight + (defaults.cellheight * 10)) {
		sprite.visible = false;
	} else {
		sprite.visible = true;
	}
}

WorldScene.prototype._addBackSprite = function(mapCell, drawX, drawY, texture){
	mapCell.backSprite = new PIXI.Sprite(texture);
	mapCell.backSprite.x = drawX + 7;
	mapCell.backSprite.y = drawY - texture.height;
	this._tileLayer.addChild(mapCell.backSprite);	
}

WorldScene.prototype._addMiddleSprite = function(mapCell, drawX, drawY, texture){
	mapCell.middleSprite = new PIXI.Sprite(texture);
	mapCell.middleSprite.x = drawX;
	mapCell.middleSprite.y = drawY - texture.height;
	this._smTileLayer.addChild(mapCell.middleSprite);
}

WorldScene.prototype._addFrontSprite = function(mapCell, drawX, drawY, z, texture){
	mapCell.frontSprite = new PIXI.Sprite(texture);
	mapCell.frontSprite.z = z;

	//light source
	if(mapCell.light === 5 && mapCell.frontImage >= 2723 && mapCell.frontImage  <= 2732) {
		mapCell.frontSprite.blendMode = PIXI.blendModes.SCREEN;
		mapCell.frontSprite.y = drawY - texture.height - 44;
		mapCell.frontSprite.x = drawX + 4;
	} else {
		mapCell.frontSprite.y = drawY - texture.height;
		mapCell.frontSprite.x = drawX;
	}
	this._objTileLayer.addChild(mapCell.frontSprite);
}

WorldScene.prototype._loadGraphicsPlacements = function() {
	return new Promise(function(resolve, reject) {
		var total = ResourceService.graphics.placements.length,
			count = 0;
		for(var i = 0; i < total; i++) {
			var placementsName = ResourceService.graphics.placements[i];
			LoaderService.loadGraphicsPlacements(placementsName).then(function(placementsName, placements) {
				this._graphicsPlacements[placementsName] = placements;
				count++

				if(count === total) {
					resolve();
				}
			}.bind(this, placementsName));
		}
	}.bind(this));
}

WorldScene.prototype._loadMap = function() {
	return new Promise(function(resolve, reject) {
		this._isLoadingMap = true;
		this._clearAllSpritesFromStage();
		LoaderService.loadMap(GameService.map.file)
			.then(function(map) {
				resolve(map);
			});
	}.bind(this));
}

WorldScene.prototype._initGui = function() {
	//init GUI?
}

WorldScene.prototype.getStage = function() {
	return this._stage;
}

WorldScene.prototype.hide = function() {
	return Promise.resolve();
}

WorldScene.prototype.show = function() {
	return Promise.resolve();
}

WorldScene.prototype.isLoadingMap = function() {
	return this._isLoadingMap;
}

module.exports = WorldScene;