
const sdfVertexShader = `

attribute vec4 aVertexPosition;

uniform float LMB;
uniform vec2 mPos;
uniform vec2 bounds;
uniform float TIME;

void main() {
	gl_Position = vec4(aVertexPosition.xy, 0.0, 1.0);
}
`;


const sdfFragmentShader = `

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float LMB;
uniform vec2 mPos;
uniform float TIME;
uniform vec2 bounds;


float sdfCircle(vec2 pos, float radius) {
	return length(pos) - radius;
}

float sdfSquare(vec2 pos, vec2 size) {
	vec2 q = abs(pos) - size;
	float maxComp = max(q.x, q.y);
	return length(max(q, 0.0)) + min(maxComp, 0.0);
}

float sdfLineSegment(vec2 uv, vec2 posA, vec2 posB) {
	vec2 line = posB - posA;
	vec2 vecToA = uv - posA;
	float len = length(line);
	float expr = dot(vecToA, line) / (len * len);
	float h = min(1.0, max(0.0, expr));
	return length(vecToA - h * line);
}

vec2 rotateVec2(vec2 vec, float angle) {
	float newAngle = atan(vec.y, vec.x) + angle;
	return vec2(cos(newAngle), sin(newAngle)) * length(vec);
}

vec3 drawBox(vec2 uv, vec2 pos, vec2 size, float angle, vec3 color, float radius, float intensity) {
	vec2 vecTo = uv - pos;
	vec2 rotatedUV = rotateVec2(vecTo, angle);
	float distToBox = sdfSquare(rotatedUV, size - radius) - radius;
	return color * exp(-intensity* abs(distToBox));
}


void main() {
	float aspectRatio = bounds.x / bounds.y;
	vec2 center = vec2(0.5 * aspectRatio, 0.5);
	vec2 uv = gl_FragCoord.xy / bounds;
	uv.x *= aspectRatio;
	vec2 vecTo = center - uv;
	vec2 _mPos = vec2(aspectRatio, 1.0) * mPos / bounds;

	vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
	vec3 color = vec3(0.0, 0.0, 0.0);


	// CIRCLE
	float radius = 75.0 + sin(TIME * 0.6) * 25.0;
	radius = sin(TIME * 0.6) * 0.1 + 0.1;
	float distToCircle = sdfCircle(vecTo, radius);
	color = vec3(1.3, 2.0, 8.0);
	color *= (exp(-200.0 * abs(distToCircle))); // Outline
	// TODO: get angle -> change color and stuff based on it


	// BOX
	vec2 boxPos = center + vec2(0.25, 0.0);
	vec3 boxCol = vec3(1.1, 5.3, 1.4);
	vec2 boxUv = uv;

	boxUv.x += (sin(TIME * 5.0 + boxUv.y * 20.0) * 2.0 - 1.0) * 0.01;
	boxUv.y += (sin(TIME * 5.3 + boxUv.x * 21.2) * 2.0 - 1.0) * 0.009;

	float mult = sin(TIME + boxUv.x * 20.0);

	color += drawBox(
		boxUv,
		boxPos,
		vec2(0.1, 0.1),
		TIME * 0.6,
		vec3(1.1, 5.3 * -mult + 6.0, 1.4 * mult + 2.0),//boxCol,
		0.02,
		200.0 + mult * 90.1
	);


	col = vec4(color, 1.0);

	gl_FragColor = col;
}
`;

