
// Vertex Shader Source

const vsSource = `

attribute vec4 aVertexPosition;
uniform mediump vec2 bounds;
uniform highp float TIME;

void main() {
	gl_Position = vec4(aVertexPosition.xy, 0.0, 1.0);
}
`;


// Fragment Shader Source

// A rotating cone of light.
const fsSource = `

uniform highp float TIME;
uniform mediump vec2 bounds;

void main() {
	
	mediump vec2 vecTo = bounds * 0.5 - gl_FragCoord.xy;
	mediump float distSq = vecTo.x * vecTo.x + vecTo.y * vecTo.y;
	mediump float dist = sqrt(distSq);
	mediump float value = (dist * 100.0) / distSq;
	
	mediump vec2 dir = vecTo / dist;
	
	mediump float angle = atan(dir.x, dir.y);
	
	dir.x = cos(angle + TIME);
	dir.y = sin(angle + TIME);
	
	dir.x += cos(3.141528);
	dir.y += sin(3.141528);
	
	mediump float val = value * (dir.x + dir.y);
	
	mediump vec4 col = vec4(val, val, val, 1.0);
	//col += vec4(dir.x, dir.y, -dir.x, -dir.y);
	//mediump vec4 col = vec4(value * dir.x, value * dir.y, value * (-dir.y - dir.x) / 2.0, 1.0);	
	
	gl_FragColor = col;
}
`;







const boi = `

uniform highp float TIME;
uniform mediump vec2 bounds;


mediump float getWaveAmplitude(vec2 vecTo, float mult) {
	
	mediump float distSq = vecTo.x * vecTo.x + vecTo.y * vecTo.y;
	return (sqrt(distSq) * mult) / distSq;
}


void main() {
	
	mediump vec2 center = bounds * 0.5;
	mediump vec2 vecTo = center - gl_FragCoord.xy;
	
	mediump float plane = 1.0 / abs(center.y - gl_FragCoord.y);
	mediump float ball = 0.0;
	mediump float shadow = 0.0;
	
	mediump vec2 pos = center;
	mediump float posz = 0.0;
	mediump float onePart = 0.05;
	
	for (mediump float i = 0.0; i < 20.0; i++) {
		
		mediump float part = i * 0.05;
	
		pos.x = part * bounds.x + bounds.x * onePart * 0.5 * sin(TIME * 2.0);
		pos.y = abs(sin(part * 3.141528 + TIME * 4.0)) * bounds.y * 0.2 + center.y;
		posz = 2.0 + sin(part * 3.141528 + TIME * 1.0) * 1.0;
		vecTo = pos - gl_FragCoord.xy;
		ball += getWaveAmplitude(vecTo, posz);
		
		vecTo.y -= abs(sin(part * 3.141528 + TIME * 4.0)) * bounds.y * 0.4;
		shadow += getWaveAmplitude(vecTo, posz);
	}
	
	gl_FragColor = vec4(
		plane * 0.2 + sin(TIME * 1.1) * 0.2,
		plane * 0.7 + sin(TIME * 1.6) * 0.1,
		plane * 0.9 + sin(TIME * 0.5) * 0.1,
		1.0
	);
	
	gl_FragColor += vec4(ball, ball, ball, 1.0);
	gl_FragColor += vec4(shadow, shadow, shadow, 1.0);
}
`;







// A spinning ring of lights surrounding a pulsating colorful circle.
const quatro = `

uniform highp float TIME;
uniform mediump vec2 bounds;



mediump float getWaveAmplitude(vec2 vecTo, float mult) {
	
	mediump float distSq = vecTo.x * vecTo.x + vecTo.y * vecTo.y;
	return (sqrt(distSq) * mult) / distSq;
}


void main() {
	
	mediump vec2 center = bounds * 0.5;
	mediump vec2 vecTo = center - gl_FragCoord.xy;
	mediump float distSq = vecTo.x * vecTo.x + vecTo.y * vecTo.y;
	mediump float dist = sqrt(distSq);
	mediump float value = getWaveAmplitude(vecTo, 10.0 * (sin(TIME) + 2.0));
	
	mediump float red = value * (sin(TIME * 0.7) + 1.0);
	mediump float green = value * (sin(TIME * 1.2) + 1.0);
	mediump float blue = value * (cos(TIME * 1.6) + 1.0);
	
	mediump vec4 col = vec4(red, green, blue, 1.0);
	
	mediump float radian = 0.0;
	mediump vec2 dir = vec2(0.0);
	mediump float len = (1.0 + sin(TIME * 2.0)) * 100.0;
	mediump vec2 pos = center;
	
	for (mediump float i = 0.0; i < 20.0; i++) {
	
		radian = i / 20.0 * 3.141528 * 2.0 + sin(TIME) * 10.0;
		dir.x = cos(radian);
		dir.y = sin(radian);
		pos = center + dir * len;
		
		value = getWaveAmplitude(pos - gl_FragCoord.xy, 2.0);
		col += vec4(value, value, value, 1.0);
	}
	
	
	gl_FragColor = col;
}
`;








// Four pulsating colorful circles of light moving around pseudo-randomly, forming a blob.
const wereLight = `

uniform highp float TIME;
uniform mediump vec2 bounds;


mediump float get_wave_amplitude(vec2 vec_to, float mult) {
	
	mediump float dist = vec_to.x * vec_to.x + vec_to.y * vec_to.y;
	return (sqrt(dist) * mult) / dist;
}



void main() {
	mediump vec2 adjusted_uv = gl_FragCoord.xy;// * tile_factor;
	
	mediump float red = 0.1 + sin(TIME * 0.4) * 0.1;
	mediump float green = 0.1 + cos(TIME * 0.9) * 0.1;
	mediump float blue = 0.11 + sin(TIME) * 0.11;
	
	//gl_FragColor = vec4(red, green, blue, 1.0);
	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	
	lowp int max_origins = 3;
	mediump float radius = 24.0 + sin(TIME * 5.0) * 0.1;
	
	mediump float posx = bounds.x * 0.5;
	mediump float posy = bounds.y * 0.5;
	
	mediump float r = 0.5 + sin(TIME);
	mediump float g = 0.5 + sin(TIME * 0.7);
	mediump float b = 0.8 + sin(TIME * 1.5);
	
	for (lowp int i = 0; i < 4; i++) {
		
		if (i > 0) {
			radius *= 0.5 + sin(TIME) * 0.1 * sin(TIME * 0.1);
			posx += cos(TIME * 0.5) * bounds.x * 0.14;
			posy += sin(TIME * 0.5) * bounds.y * 0.14;
			
			if (i == 2) {
				radius *= 2.8 + posx / bounds.x;
				posx = bounds.x * 0.5 + cos(TIME * -1.0) * bounds.x * 0.1;
				posy = bounds.y * 0.5 + sin(TIME * -1.0) * bounds.y * 0.1;
			}
		} if (i == 3) {
			
			posx += cos(TIME * 1.4) * bounds.x * 0.05;
			posy += sin(TIME * 1.0) * bounds.y * 0.05;
		}
		
		mediump vec2 vecTo = adjusted_uv - vec2(posx, posy);
		mediump float value = get_wave_amplitude(vecTo, radius);
		
		gl_FragColor += vec4(value * r, value * g, value * b, 1.0);
	}
}
`;