/*
	Shaders FUNCTIONS v0.0.0.1
	
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
	let num = 1 - t;
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




// COLORS----------------------------------------------------------------------

// Returns a random color
function randomColor() {
	return 'rgb(' +
			Math.ceil(Math.random() * 255) + ',' +
			Math.ceil(Math.random() * 255) + ',' +
			Math.ceil(Math.random() * 255) + ')';
}


// Returns a random color similar to the one specified
// (RED, GREEN, BLUE, RANGE)
function shadeOfColor(r, g, b, i) {
	
	var r = Math.ceil(Math.random() + r - i);
	var g = Math.ceil(Math.random() + g - i);
	var b = Math.ceil(Math.random() + b - i);
	
	return 'rgb(' + r + ',' + g + ',' + b + ')';
}




function generateWhiteNoise(num) {
	
	let nois = [];
	for (let i = 0; i < num; i++) {
		nois += Math.random();
	}
	return nois;
}






// DEBUGGING-------------------------------------------------------------------

// Displays a debug message ([STRING] message, [INT] vertical position number)
function debugLog(ctx, bug, mult) {
	
	var y = mult * 12 + 12 || 12;
	
	ctx.fillStyle = '#ffffff';
	ctx.fillText(bug, 10, y);
}
