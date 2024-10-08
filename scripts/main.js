
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2") ||
	canvas.getContext("webgl") ||
	canvas.getContext("experimental-webgl");

if (!gl) {
	console.log("WebGL doesn't seem to work... Bummer.");
}


const buttons = [
	document.querySelector("#btn1"),
	document.querySelector("#btn2"),
	document.querySelector("#btn3"),
	document.querySelector("#btn4"),
	document.querySelector("#btn5"),
	document.querySelector("#btn6"),
];

for (let i = 0; i < buttons.length; i++) {
	buttons[i].addEventListener("click", () => { changeProgram(i) });
}


var WIDTH = canvas.width = window.innerWidth;
var HEIGHT = canvas.height = window.innerHeight;
let bounds = new Vector2(WIDTH, HEIGHT);

gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);


// SHADER PROGRAMS
const shaderPrograms = [
	initShaderProgram(gl, vsSource, wereLight),
	initShaderProgram(gl, vsSource, fsSource),
	initShaderProgram(gl, vsSource, boi),
	initShaderProgram(gl, vsSource, quatro),
	initShaderProgram(gl, vsFive, fsFive),
	initShaderProgram(gl, sdfVertexShader, sdfFragmentShader),
];

const startIndex = 0;


// PROGRAM INFO
const programInfo = {
	program: shaderPrograms[startIndex],
	attribLocations: {
		vertexPosition: gl.getAttribLocation(shaderPrograms[startIndex], 'aVertexPosition'),
	},
	uniformLocations: {
		TIME: gl.getUniformLocation(shaderPrograms[startIndex], 'TIME'),
		bounds: gl.getUniformLocation(shaderPrograms[startIndex], 'bounds'),
		mPos: null,
		LMB: null,
	},
};


let currentProgramIndex = startIndex;

function changeProgram(index) {
	const isSimple = index < 4;
	currentProgramIndex = index;
	
	programInfo.program = shaderPrograms[index];
	programInfo.attribLocations.vertexPosition =
		gl.getAttribLocation(shaderPrograms[index], 'aVertexPosition');
	programInfo.uniformLocations.TIME = gl.getUniformLocation(shaderPrograms[index], 'TIME');
	programInfo.uniformLocations.bounds = gl.getUniformLocation(shaderPrograms[index], 'bounds');
	programInfo.uniformLocations.mPos =
		!isSimple ? gl.getUniformLocation(shaderPrograms[index], 'mPos') : null;
	
	programInfo.uniformLocations.LMB =
		!isSimple ? gl.getUniformLocation(shaderPrograms[index], 'LMB') : null;
}


const buffers = initBuffers(gl);





let mPos = new Vector2();
let mVel = new Vector2();
let leftMouseDown = false;
let LMBDown = 0.0;

let testOn = false;

let keys = {
	left: false,
	up: false,
	right: false,
	down: false,
	ctrl: false
};



gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);









// CANVAS UPDATE LOOP

let dt    = 1.0;
let now   = 1.0;
let then  = 0.0;
let modTime = 1.0;

function mainLoop(time) {
	
	now = time;
	dt  = now - then;
	LMBDown = lerp(LMBDown, +leftMouseDown, dt * 0.003);
	modTime += dt + LMBDown * 5.0;
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
	gl.clearDepth(1.0);                 // Clear everything
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	drawScene(gl, programInfo, buffers, modTime * 0.001);
	
	then = now;
	requestAnimationFrame(mainLoop);
}

mainLoop(0.0);


function drawScene(gl, programInfo, buffers, time) {

	// Tell WebGL how to pull out the positions from the position
	// buffer into the vertexPosition attribute.
	{
		const numComponents = 2;  // pull out 2 values per iteration
		const type = gl.FLOAT;    // the data in the buffer is 32bit floats
		const normalize = false;  // don't normalize
		const stride = 0;         // how many bytes to get from one set of values to the next
		                          // 0 = use type and numComponents above
		const offset = 0;         // how many bytes inside the buffer to start from
		
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexPosition,
			numComponents,
			type,
			normalize,
			stride,
			offset
		);
		gl.enableVertexAttribArray(
			programInfo.attribLocations.vertexPosition
		);
	}
	
	
	gl.useProgram(programInfo.program);
	
	
	gl.uniform1f(programInfo.uniformLocations.TIME, time);
	gl.uniform2f(programInfo.uniformLocations.bounds, WIDTH, HEIGHT);
	
	if (currentProgramIndex >= 4) {
		gl.uniform2f(programInfo.uniformLocations.mPos, mPos.x, HEIGHT - mPos.y);
		gl.uniform1f(programInfo.uniformLocations.LMB, smoothStartStop(LMBDown));
	}
	
	{
		const offset = 0;
		const vertexCount = 4;
		gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}
}



// EVENTS----------------------------------------------------------------------


// Prevents context menu.
window.oncontextmenu = (e) => {
  //e.preventDefault();
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
};


document.body.onmouseup = function(e) {
	leftMouseDown = false;
	getTrueCanvasPos(e);
};


document.body.onmousemove = function(e) {
	getTrueCanvasPos(e);
}




// KEY STUFF

document.body.onkeydown = function(e) {
	e.preventDefault();
	
	switch (e.which) {
		case 32:            // Space
			
			break;
		case 71: // g
			break;
		case 86: // v
			break;
		case 72: // b
			break;
		case 67: // c
			break;
		case 49: // 1
			changeProgram(0);
			break;
		case 50: // 2
			changeProgram(1);
			break;
		case 51: // 3
			changeProgram(2);
			break;
		case 52: // 4
			changeProgram(3);
			break;
		case 53: // 5
			changeProgram(4);
			break;
		case 54: // 6
			changeProgram(5);
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
			keys.ctrl = bool;  // Ctrl (duh)
			break;
		default:
			console.log(key);
			break;
	}
}
