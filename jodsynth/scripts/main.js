
const canvas = document.querySelector("#canvas");
const ctx    = canvas.getContext("2d");

var WIDTH  = canvas.width  = window.innerWidth;
var HEIGHT = canvas.height = window.innerHeight;
let bounds = new Vector2(WIDTH, HEIGHT);


const ac = new (window.AudioContext || window.webkitAudioContext);


var mPos = new Vector2();
var leftMouseDown = false;

var testOn = false;

var keys = {
	left: false,
	up: false,
	right: false,
	down: false,
	ctrl: false
};

var lowerKeys = [
	'KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ',
	'KeyM', 'Comma', 'KeyL', 'Period', 'Semicolon', 'Slash', 'ShiftRight', 'Backslash',
];
var upperKeys = [
	'KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7',
	'KeyU', 'KeyI', 'Digit9', 'KeyO', 'Digit0', 'KeyP', 'BracketLeft', 'Equal', 'BracketRight',
];


var keyboardKeys = {};

function generateKeyDict() {
	lowerKeys.forEach((k, i) => keyboardKeys[k] = { down: false, index: i });
	upperKeys.forEach((k, i) => keyboardKeys[k] = { down: false, index: i + 12 });
}
generateKeyDict();
console.log(keyboardKeys);



// MASTER Gain

let masterGain = ac.createGain();
masterGain.connect(ac.destination);
masterGain.gain.value = 0.1;




// CANVAS UPDATE LOOP

let dt    = 1.0;
let now   = 1.0;
let then  = +new Date;
let time  = 0.0;
let beats = 0.0;

let testValue = 0.0;

function mainLoop() {
	
	now = +new Date;
	dt  = (now - then) / 16.7;
	
	
	// Debug info box:
	ctx.fillStyle = "#444d";
	ctx.fillRect(0, 0, 160, 110);
	
	
	
	then = now;
	requestAnimationFrame(mainLoop);
}

//mainLoop();




// EVENTS----------------------------------------------------------------------


// Prevents context menu.
window.oncontextmenu = (e) => {
  e.preventDefault();
};


// MOUSE STUFF

document.body.onmousedown = function(e) {
	e.preventDefault();
	leftMouseDown = true;
};


document.body.onmouseup = function(e) {
	leftMouseDown = false;
};


document.body.onmousemove = function(e) {

}




// KEY STUFF

document.body.onkeydown = function(e) {
	e.preventDefault();
	
	switch (e.which) {
		default:
			toggleKeys(e, true);
	}
	
};


document.body.onkeyup = function(e) {
	e.preventDefault();
	
	toggleKeys(e, false);
};

function toggleKeys(e, bool) {
	keyboardKeys[e.code]?.down = bool;

	switch (e.which) {
		case 37:
			keys.left = bool;
			break;
		case 38:
			keys.up = bool;
			break;
		case 39:
			keys.right = bool;
			break;
		case 40:
			keys.down = bool;
			break;
		case 17:
			keys.ctrl = bool;
			break;
		default:
			console.log('Key event - physical:', e.code);
			break;
	}
}
