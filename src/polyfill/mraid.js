var util = require('util');
var EventEmitter = require('events').EventEmitter;
var StateManager = require('./state-manager');
var WebView = require('./web-view');

var defaultSupports = {
	'sms': true,
	'tel': true,
	'calendar': true,
	'storepicture': true,
	'inlinevideo': true
};

function Mraid(options){
	EventEmitter.call(this);

	var self = this, 
		webView = new WebView(options.screen), 
		expandProperties = Object.create(webView.getScreenSize()), 
		resizeProperties, 
		placementType = options.placementType || 'inline',
		stateManager = new StateManager();

	expandProperties.useCustomClose = false;

	this.open = function(url){ 

		if (/^(tel|sms):/){
			webView.showMessage(url);
			return;
		}

		window.open(url); 
	};

	this.close = function(){
		switch (stateManager.get()){
			case 'default':
				webView.hide();
				webView.resetSize();
				stateManager.set('hidden');
			break;

			case 'resized':
			case 'expanded':
				webView.hideClose();
				webView.resetSize();
				stateManager.set('default');
			break;
		}
	};

	this.resize = function(){
		var rp = this.getResizeProperties();
		if (!rp){
			this.emit('error');
			return;
		}

		switch (stateManager.get()){
			case 'expanded':
			case 'default':
			case 'resized':
				webView.showClose();
				webView.setSize(rp.width || 100, rp.height || 100);
				stateManager.set('resized');
			break;
		}
	};

	this.expand = function(url){
		if (!stateManager.isValid('expanded'))return;
		
		var expandProps = this.getExpandProperties();

		webView.setSize(expandProps.width, expandProps.height);

		if (expandProps.useCustomClose){
			webView.hideClose();
		} else {
			webView.showClose();
		}

		if (url){
			webView.showUrl(url);
		}

		stateManager.set('expanded');
	};

	this.getPlacementType = function(){ return placementType; };
	this.getExpandProperties = function(){ return expandProperties; };
	this.setExpandProperties = function(p){ expandProperties = p; };
	this.getResizeProperties = function(){ return resizeProperties; };
	this.setResizeProperties = function(p){ resizeProperties = p; };
	this.playVideo = function(url){ webView.showVideo(url); };
	
	this.storePicture = function(a){ 
		console.log('mraid.storePicture("'+a+'") ');
		webView.showMessage('mraid.storePicture(...)'); 
	};
	this.createCalendarEvent = function(a){ 
		console.log('mraid.createCalendarEvent(...) called with following argument: ');
		console.log(a);
		webView.showMessage('mraid.createCalendarEvent(...)'); 
	};
	this.getCurrentPosition = function(){ return webView.getCurrentPosition(); };
	this.getDefaultPosition = function(){ return webView.getDefaultPosition(); };
	this.getMaxSize = function(){ return webView.getScreenSize();};
	this.getScreenSize = function(){return webView.getScreenSize();};
	this.supports = function(feature){
		return typeof feature === 'string' &&
			feature.toLowerCase() in defaultSupports;
	};

	this.getVersion = function(){ return 'appnexus'; };
	this.getState = function(){ return stateManager.get(); };
	this.isViewable = function(){ return true; };

	this.addEventListener = function(event_name, method){ this.on(event_name, method); };

	this.removeEventListener=function(eventName, method){
		if (method === undefined){
			this.removeAllListeners(eventName);
		} else {
			this.removeListener(eventName, method);
		}
	};

	this.useCustomClose = function(b){
		var ep = this.getExpandProperties();
		ep.useCustomClose = b;
		this.setExpandProperties(ep);
	};

	this.triggerReady = function(){
		webView.triggerReady();
		stateManager.set('default');

		console.log('firing mraid.ready');
		self.emit('ready');
		console.log('fired mraid.ready');
	};

	function init(){
		stateManager.on('stateChange', function(data){ 
			self.emit('stateChange', data); 
		});

		stateManager.on('error', function(data){ 
			self.emit('error', data);
		});
		
		webView.on('close-click', function(){ 
			self.close(); 
		});

		self.on('error', function(){}); // this is so node doesn't throw if no one is listening
	}

	init();
}

util.inherits(Mraid, EventEmitter);

module.exports = Mraid;
