var GameService = require('./services/GameService.js');
var PIXI = require('pixi.js');
require('../fpsmeter.min.js');

function Renderer(appContainer) {
	this._stopped = false;
	this._renderer = null;
	this._appContainer = appContainer;
	this._init();
	this._fpsMeter = new FPSMeter();
}

Renderer.prototype._init = function() {
	this._renderer = new PIXI.WebGLRenderer(GameService.defaults.screenWidth, GameService.defaults.screenHeight);
	this._appContainer.appendChild(this._renderer.view);
	this._render();
}

Renderer.prototype._render = function() {

	var lastTick = 0;

	var loop = function loop() {
		var scene = GameService.scene;

		this._fpsMeter.tickStart();

		if(this._stopped === true) {
			return;
		}

		if(scene !== null && scene.isLoadingMap() === false) {
			scene.checkInputs();
			scene.updateAnimations();
			if(Date.now() - lastTick > 16) {
				lastTick = Date.now();
				this._renderer.render(scene.getStage());
			}
		};

		this._fpsMeter.tick();

		requestAnimationFrame(loop.bind(this));

	}.bind(this);

	requestAnimationFrame(loop.bind(this));
}


Renderer.prototype.start = function() {
	this._stopped = false;
}

Renderer.prototype.end = function() {
	this._stopped = true;
}

module.exports = Renderer;