/*
	audio-visualizer FUNCTIONS v0.0.0.1
	
	Here should all the functions be.
	
	Dependencies: vector.js
*/









// SHADER STUFF----------------------------------------------------------------



function loadShader(gl, type, source) {

	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.log("Failed to compile shaders: " + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}




function initShaderProgram(gl, vsSource, fsSource) {

	const vs = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fs = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
	
	
	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vs);
	gl.attachShader(shaderProgram, fs);
	gl.linkProgram(shaderProgram);
	
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.log("Failed to initialize shader program: " + gl.getProgramInfoLog(shaderProgram));
		return null;
	}
	return shaderProgram;
}



function initBuffers(gl) {

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	
	const positions = [
		-1.0,  1.0,
		 1.0,  1.0,
		-1.0, -1.0,
		 1.0, -1.0,
	];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	
	return {
		position: positionBuffer,
	};
}





// END SHADER STUFF------------------------------------------------------------








// Returns accurate mouse position in canvas coordinates.
function getMousePos(canvas, evt) {
    let rect   = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;   //// Needed if the canvas has
    let scaleY = canvas.height / rect.height; //// been resized.
    
    return new Vector2(
        (evt.clientX - rect.left) * scaleX,
        (evt.clientY - rect.top) * scaleY
    );
}




	
// Shows text.
function showText(ctx, txt, pos, color) {
	
	let p = pos || new Vector2(20, 20);
	let col = color || '#ffffff';
	
	ctx.font = '14px Arial';
	ctx.fillStyle = col;
	ctx.fillText(txt, p.x, p.y);
}


// EASING----------------------------------------------------------------------
// See https://www.youtube.com/watch?v=mr5xkf6zSzk for details.

// t should be a number between 0 and 1
// Squaring is smooth - cubing is smoother.
// ^^ Exponentiating by higher numbers is smoother.
// (1 - t) flips the curve.


function smoothStart(t) {
	return t * t;
}

function smoothStop(t) {
	const num = 1 - t;
	return 1 - num * num;
}

function arch2(t) {
	return t * (1 - t);
}

function smoothStartArch3(t) {
	return t * arch2(t);
}

function smoothStartStop(t) {
	return smoothStart(smoothStop(t));
}



function lerp(a, b, t) {
	return a * t + b * (1 - t);
}


// COLORS----------------------------------------------------------------------

// Returns a random color
function randomColor() {
	return 'rgb(' +
			Math.ceil(Math.random() * 255) + ',' +
			Math.ceil(Math.random() * 255) + ',' +
			Math.ceil(Math.random() * 255) + ')';
}


function generateWhiteNoise(num) {
	
	let nois = [];
	for (let i = 0; i < num; i++) {
		nois += Math.random();
	}
	return nois;
}




// MUSIC AND SOUND-------------------------------------------------------------


// This is the magic formula which finds all the right notes.
// fr: Frequency to start with.
// detune: Amount of semitones to adjust by. Fractions acceptable.
function magicFormula(fr, detune) {
	return fr * Math.pow(2, (detune / 12));
}


function toneToPosition(tone, maxTone, maxPos) {
	
	return (-tone / maxTone + 1) * maxPos;
}


function posToTone(posy, boundsy, gridy, bottomTone) {
	return ((-posy / boundsy + 1.0) * gridy) + bottomTone;
}



// y: height, h: maxHeight, rng: noteRange, offset: whatever tone you want at the bottom.
// Returns frequency for use with oscillator.
function getFreqFromNum(y, h, rng, offset) {
	let t = ((-y / h + 1.0) * rng) + offset;
	return 27.5 * Math.pow(2, t / 12);
}



// 27.5  hz = A0
// 440.0 hz = A4
// 440.0 hz = 27.5 * 2^(48 / 12)
// 110.0 hz = 27.5 * 2^(24 / 12)

// tone is the offset from A0 (27.5 hz) in semitones.

function toneToFreq(tone) {
	return 27.5 * Math.pow(2, tone / 12);
}




// This one is good.
function beatsToTime(beats, bpm) {
	
	return bpm / 60 * beats / 4;
}


function pixelsToBeats(pixels, width, rng) {
	
	return pixels / width * rng / 4;
}



function pixelsToTime(pixels, width, rng, bpm) {
	
	let beats = pixels / width * rng / 4;
	
	let t = beatsToTime(beats, bpm);
	
	return t;
}






// UI

function drawGrid(ctx, bounds, cellSize) {
	
	ctx.fillStyle = "#222";
	ctx.fillRect(0, 0, bounds.x, bounds.y);
	
	let cellIndex = new Vector2(
		bounds.x / cellSize.x,
		bounds.y / cellSize.y
	);
	
	ctx.lineWidth = 1;
	
	let n = 1;
	for (let y = cellSize.y; y < bounds.y; y += cellSize.y) {
		
		ctx.beginPath();
		
		if (n === 12) {
			ctx.strokeStyle = "#47f";
			n = 1;
		} else {
			ctx.strokeStyle = "#999";
			n++
		}
		
		ctx.moveTo(0.0, y);
		ctx.lineTo(bounds.x, y);
		ctx.stroke();
	}
	
	let b = 1;
	for (let x = cellSize.x; x < bounds.x; x += cellSize.x) {
	
		ctx.beginPath();
		
		if (b === 16) {
			ctx.strokeStyle = "#eee";
			b = 1;
		} else {
			ctx.strokeStyle = "#999";
			b++
		}
		
		ctx.moveTo(x, 0.0);
		ctx.lineTo(x, bounds.y);
		ctx.stroke();
	}
	
	return ctx.getImageData(0, 0, bounds.x, bounds.y);
}











// CLONING OBJECTS

function clone(obj){
	if (obj == null || typeof(obj) != 'object') {
		return obj;
	}

	var temp = new obj.constructor(); 
	for(var key in obj)
	temp[key] = clone(obj[key]);

	return temp;
}









// DEBUGGING-------------------------------------------------------------------

// Displays a debug message ([STRING] message, [INT] vertical position number)
function debugLog(ctx, bug, mult) {
	
	var y = mult * 12 + 12 || 12;
	
	ctx.fillStyle = '#ffffff';
	ctx.fillText(bug, 10, y);
}
