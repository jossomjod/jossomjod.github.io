
const canvas = document.querySelector("#canvas");
const ctx    = canvas.getContext("2d");

var WIDTH  = canvas.width  = window.innerWidth * 2;
var HEIGHT = canvas.height = window.innerHeight * 2;
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



// MASTER Gain

let masterGain = ac.createGain();
masterGain.connect(ac.destination);
masterGain.gain.value = 0.1;



// Grid
let cellSize = new Vector2(20, 14);

let grid = new Vector2(WIDTH / cellSize.x, HEIGHT / cellSize.y);


// caret
let bpm        = 140;
let caretPos   = 0.0;
let playing    = false;

let background = drawGrid(ctx, bounds, cellSize);

const pianoRoll = new PianoRoll(ctx, ac, new Vector2(), bounds, masterGain);



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
	
	pianoRoll.draw(dt);
	
	
	// Debug info box:
	ctx.fillStyle = "#444d";
	ctx.fillRect(0, 0, 160, 110);
	
	
	
	
	showText(ctx, "X: " + mPos.x + ", Y: " + mPos.y, new Vector2(10, 20));
	showText(ctx, "Frequency: " + pianoRoll.freq.toFixed(3), new Vector2(10, 40));
	showText(ctx, "Tone: " + pianoRoll.tone.toFixed(3), new Vector2(10, 60));
	showText(ctx, "Time: " + pianoRoll.time.toFixed(3), new Vector2(10, 80));
	showText(ctx, "Beats: " + pianoRoll.beats.toFixed(3), new Vector2(10, 100));
	
	then = now;
	requestAnimationFrame(mainLoop);
}

mainLoop();




// EVENTS----------------------------------------------------------------------


// Prevents context menu.
window.oncontextmenu = (e) => {
  e.preventDefault();
};


// MOUSE STUFF

function getTrueCanvasPos(e) {

	let rect = canvas.getBoundingClientRect();
	
	mPos.x = e.x - rect.left;
	mPos.y = e.y - rect.top;
}


document.body.onmousedown = function(e) {
	e.preventDefault();
	
	leftMouseDown = true;
	
	getTrueCanvasPos(e);
	
	pianoRoll.onMouseDown(e, mPos.get());
};


document.body.onmouseup = function(e) {
	leftMouseDown = false;
	
	getTrueCanvasPos(e);
	
	pianoRoll.onMouseUp(e, mPos.get());
};


document.body.onmousemove = function(e) {
	
	getTrueCanvasPos(e);
	
	pianoRoll.onMouseMove(e, mPos.get());
}




// KEY STUFF

document.body.onkeydown = function(e) {
	e.preventDefault();
	
	switch (e.which) {
		case 32:            // Space
			let t = 0.0;
			if (keys.ctrl) {  // If ctrl is pressed:
				              // Start playback from wherever the cursor is.
				t = pixelsToTime(mPos.x, WIDTH, pianoRoll.gridSize.x, pianoRoll.bpm);
			}
			pianoRoll.togglePlaying(t);
			break;
		case 71: // g - Toggle snapping to grid.
			pianoRoll.snapToGrid = !pianoRoll.snapToGrid;
			pianoRoll.snapMode = (pianoRoll.snapMode === 2) ? 0 : 2;
			break;
		case 86: // v - Toggle snapping to horisontal grid.
			if (keys.ctrl) {
				pianoRoll.pasteAtPos(mPos.get());
			} else {
				pianoRoll.snapMode = (pianoRoll.snapMode === 3) ? 0 : 3;
			}
			break;
		case 72: // b - Toggle snapping to vertical grid.
			pianoRoll.snapMode = (pianoRoll.snapMode === 1) ? 0 : 1;
			break;
		case 67: // c
			if (keys.ctrl) {
				pianoRoll.copySelected(mPos.get());
			}
			break;
		case 49: // 1
			pianoRoll.setEditMode(0); // Pitch mode
			pianoRoll.snapMode = 2;
			break;
		case 50: // 2
			pianoRoll.setEditMode(1); // Gain Mode
			pianoRoll.snapMode = 0;
			break;
		case 51: // 3
			pianoRoll.setEditMode(2); // IDK yet
			pianoRoll.snapMode = 0;
			break;
		default:
			toggleKeys(e.which, true);
	}
	
};


document.body.onkeyup = function(e) {
	e.preventDefault();
	
	toggleKeys(e.which, false);
};

function toggleKeys(key, bool) {
	switch (key) {
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
			keys.ctrl = bool;  // Ctrl
			break;
		default:
			console.log(key);
			break;
	}
}
