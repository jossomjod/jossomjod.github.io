
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
	return color * exp(-intensity * abs(distToBox));
}


void main() {
	float aspectRatio = bounds.x / bounds.y;
	vec2 center = vec2(0.5 * aspectRatio, 0.5);
	vec2 uv = gl_FragCoord.xy / bounds;
	uv.x *= aspectRatio;
	vec2 _mPos = vec2(aspectRatio, 1.0) * mPos / bounds;

	vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
	vec3 color = vec3(0.0, 0.0, 0.0);


	// CIRCLE
	vec2 circleUv = uv;
	circleUv.x += cos(TIME * 3.3 + 20.0 * circleUv.y) * 0.02;
	circleUv.y += sin(TIME * 2.9 + 21.3 * circleUv.x) * 0.1;
	vec2 circlePos = center + vec2(-0.25, 0.0);
	vec2 vecTo = circlePos - circleUv;
	vecTo.x += sin(TIME * 2.3 + circleUv.y * 10.7) * 0.02;
	vecTo.y += sin(TIME * 1.3 + vecTo.x * 4.7) * 0.3 * vecTo.y + sin(TIME * 6.4 + circleUv.y * 33.333) * 0.011;

	float circleAngle = atan(vecTo.y, vecTo.x) + TIME * 2.0;
	vec3 circleColor = vec3(
		sin(circleAngle) * 1.5 + 3.1,
		sin(circleAngle + 3.1415 * 0.4 + circleUv.y) * 0.8 + 0.9 * 1.1,
		sin(circleAngle + 3.1415 * 0.9 + circleUv.x) * 0.4 + 0.8 * 1.1
	);
	circleColor = vec3(2.1, 1.01, 0.7);

	float radius = 0.08;
	radius += sin(TIME * 3.6 + vecTo.x * 40.0) * 0.04;

	float distToCircle = sdfCircle(vecTo, radius);
	color = circleColor;// vec3(1.3, 2.0, 8.0);
	color *= (exp(-50.0 * distToCircle));
	//color *= (exp(-200.0 * abs(distToCircle))); // Outline


	// BOX
	vec2 boxPos = center + vec2(0.25, 0.0);
	vec3 boxCol = vec3(1.1, 5.3, 1.4);
	vec2 boxUv = uv;
	float boxAngle = TIME * 0.4;

	boxUv.x += (sin(TIME * 5.0 + boxUv.y * 20.0) * 2.0 - 1.0) * 0.01;
	boxUv.y += (sin(TIME * 5.3 + boxUv.x * 21.2) * 2.0 - 1.0) * 0.009;

	float mult = sin(TIME * 9.4 + boxUv.x * 20.0);
	boxCol.r += mult * 2.4;
	boxCol = vec3(
		sin(boxAngle) * 0.5 + 1.1,
		sin(boxAngle + 3.1415 * 0.4 + uv.y) * 2.5 + 5.5,
		sin(boxAngle + 3.1415 * 0.9 + uv.x) * 0.5 + 1.1
	);

	color += drawBox(
		boxUv,
		boxPos,
		vec2(0.1, 0.1),
		boxAngle,
		boxCol,
		0.02,
		200.0 + mult * 50.1
	);







	// MPOS CIRCLE
	circlePos = vec2(0.38, 0.5); //_mPos;
	circleUv = uv;
	float kek = circleUv.x - circlePos.x;
	circleUv.x += cos(-TIME * 1.7 + 20.0 * circleUv.y) * 0.06 + cos(TIME * 2.54 + circleUv.y * 40.2) * 0.03;
	circleUv.y += sin(-TIME * 2.9 + 21.3 * circleUv.x) * 0.1 + sin(TIME * 1.54 + circleUv.x * 34.2) * 0.03;
	vecTo = circlePos - circleUv;
	circleColor = vec3(2.1, 1.01, 0.7);
	circleColor = vec3(1.07, 1.11, 3.7);
	
	//vecTo = rotateVec2(vecTo, TIME);



	radius = 0.09;
	radius += sin(TIME * 1.6 + vecTo.x * 8.5) * 0.1;

	distToCircle = sdfCircle(vecTo, radius);
	float expt = (exp((-50.0 + LMB * 30.0) * abs(distToCircle)));
	color += circleColor * expt * expt;





	col = vec4(color, 1.0);

	gl_FragColor = col;
}
`;

