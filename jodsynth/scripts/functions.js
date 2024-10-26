/*
	FUNCTIONS
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
function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;   // Needed if the canvas has
    const scaleY = canvas.height / rect.height; // been resized.
    
    return new Vector2(
        (event.clientX - rect.left) * scaleX,
        (event.clientY - rect.top) * scaleY
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





function makeSerializable(obj) {
	return Object.entries(obj)
		.filter(([,v]) => typeof v !== 'function')
		.reduce((prev, [key, value]) => {
			prev[key] = (!!value && typeof value === 'object') ? makeSerializable(value) : value;
			return prev;
		}, {});
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
