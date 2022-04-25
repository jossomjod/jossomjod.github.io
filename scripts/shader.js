
// Vertex Shader Source

const vsSource = `

attribute vec4 aVertexPosition;
uniform vec2 bounds;
uniform float TIME;

void main() {
	gl_Position = vec4(aVertexPosition.xy, 0.0, 1.0);
}
`;


// Fragment Shader Source

// A rotating cone of light.
const fsSource = `

precision highp float;

uniform float TIME;
uniform vec2 bounds;

void main() {
	
	vec2 vecTo = bounds * 0.5 - gl_FragCoord.xy;
	float distSq = vecTo.x * vecTo.x + vecTo.y * vecTo.y;
	float dist = sqrt(distSq);
	float value = (dist * 100.0) / distSq;
	
	vec2 dir = vecTo / dist;
	
	float angle = atan(dir.x, dir.y);
	
	dir.x = cos(angle + TIME);
	dir.y = sin(angle + TIME);
	
	dir.x += cos(3.14159265);
	dir.y += sin(3.14159265);
	
	float val = value * (dir.x + dir.y);
	
	vec4 col = vec4(val, val, val, 1.0);
	//col += vec4(dir.x, dir.y, -dir.x, -dir.y);
	//vec4 col = vec4(value * dir.x, value * dir.y, value * (-dir.y - dir.x) / 2.0, 1.0);	
	
	gl_FragColor = col;
}
`;







const boi = `

precision highp float;

uniform float TIME;
uniform vec2 bounds;


float getWaveAmplitude(vec2 vecTo, float mult) {
	
	float distSq = vecTo.x * vecTo.x + vecTo.y * vecTo.y;
	return (sqrt(distSq) * mult) / distSq;
}


void main() {
	
	vec2 center = bounds * 0.5;
	vec2 vecTo = center - gl_FragCoord.xy;
	
	float plane = 1.0 / abs(center.y - gl_FragCoord.y);
	float ball = 0.0;
	float shadow = 0.0;
	
	vec2 pos = center;
	float posz = 0.0;
	float onePart = 0.05;
	
	for (float i = 0.5; i < 20.5; i++) {
		
		float part = i * onePart;
	
		pos.x = part * bounds.x + bounds.x * onePart * 0.5 * sin(TIME * 2.0);
		pos.y = abs(sin(part * 3.14159265 + TIME * 4.0)) * bounds.y * 0.2 + center.y;
		posz = 2.0 + sin(part * 3.14159265 + TIME * 1.0) * 1.0;
		vecTo = pos - gl_FragCoord.xy;
		ball += getWaveAmplitude(vecTo, posz);
		
		vecTo.y -= abs(sin(part * 3.14159265 + TIME * 4.0)) * bounds.y * 0.4;
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

precision highp float;

uniform float TIME;
uniform vec2 bounds;



float getWaveAmplitude(vec2 vecTo, float mult) {
	
	float distSq = vecTo.x * vecTo.x + vecTo.y * vecTo.y;
	return mult / distSq;
}


void main() {
	
	vec2 center = bounds * 0.5;
	vec2 vecTo = center - gl_FragCoord.xy;
	float distSq = vecTo.x * vecTo.x + vecTo.y * vecTo.y;
	float dist = sqrt(distSq);
	float value = getWaveAmplitude(vecTo, 160.0 * (sin(TIME) + 20.0));
	
	float red = value * (sin(TIME * 0.7) + 1.0);
	float green = value * (sin(TIME * 1.2) + 1.0);
	float blue = value * (cos(TIME * 1.6) + 1.0);
	
	vec4 col = vec4(red, green, blue, 1.0);
	
	float radian = 0.0;
	vec2 dir = vec2(0.0);
	float len = (1.0 + sin(TIME * 2.0)) * 50.0;
	vec2 pos = center;
	
	for (float i = 0.0; i < 20.0; i++) {
	
		radian = i / 20.0 * 3.14159265 * 2.0 + sin(TIME) * 2.0;
		dir.x = cos(radian);
		dir.y = sin(radian);
		pos = center + dir * len;
		
		vec2 fragDir = pos - gl_FragCoord.xy;
		fragDir /= sqrt(fragDir.x * fragDir.x + fragDir.y * fragDir.y);
		
		vec2 oof = gl_FragCoord.xy;
		oof += (dir.x * fragDir.x + dir.y * fragDir.y) * 200.9;
		
		value = getWaveAmplitude(pos - oof, 60.0);
		col += vec4(value, value, value, 1.0);
	}
	
	
	gl_FragColor = col;
}
`;








// Four pulsating colorful circles of light moving around.
const wereLight = `

precision highp float;

uniform float TIME;
uniform vec2 bounds;


float get_wave_amplitude(vec2 vec_to, float mult) {
	
	float dist = vec_to.x * vec_to.x + vec_to.y * vec_to.y;
	return mult / sqrt(dist);
}



void main() {
	vec2 adjusted_uv = gl_FragCoord.xy;// * tile_factor;
	
	float red = 0.1 + sin(TIME * 0.4) * 0.1;
	float green = 0.1 + cos(TIME * 0.9) * 0.1;
	float blue = 0.11 + sin(TIME) * 0.11;
	
	//gl_FragColor = vec4(red, green, blue, 1.0);
	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	
	int max_origins = 3;
	float radius = 24.0 + sin(TIME * 5.0) * 0.1;
	
	float posx = bounds.x * 0.5;
	float posy = bounds.y * 0.5;
	
	float r = 0.5 + sin(TIME);
	float g = 0.5 + sin(TIME * 0.7);
	float b = 0.8 + sin(TIME * 1.5);
	
	for (int i = 0; i < 4; i++) {
		
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
		
		vec2 vecTo = adjusted_uv - vec2(posx, posy);
		float value = get_wave_amplitude(vecTo, radius);
		
		gl_FragColor += vec4(value * r, value * g, value * b, 1.0);
	}
}
`;




//-----------------------------------------------------------------------------



// Vertex shader source

const vsFive = `

attribute vec4 aVertexPosition;

uniform float LMB;
uniform vec2 mPos;
uniform vec2 bounds;
uniform float TIME;

void main() {
	gl_Position = vec4(aVertexPosition.xy, 0.0, 1.0);
}
`;


// Fragment Shader Source

const fsFive = `

precision highp float;

uniform float LMB;
uniform vec2 mPos;
uniform float TIME;
uniform vec2 bounds;




float get_wave_amplitude(vec2 vec_to, float mult) {
	
	float dist = vec_to.x * vec_to.x + vec_to.y * vec_to.y;
	return mult / dist;
}



void main() {
	
	vec2 center = bounds * 0.5;
	vec2 vecTo = mPos - gl_FragCoord.xy;
	float distSq = vecTo.x * vecTo.x + vecTo.y * vecTo.y;
	float light = 1000.0 / distSq;
	
	float red = mPos.x / bounds.x + sin(TIME * 4.2) * 0.5;
	float green = mPos.y / bounds.y + sin(TIME * 3.3) * 0.5;
	float blue = (mPos.x + mPos.y) / (bounds.x + bounds.y) + sin(TIME * 1.2) * 0.5;
	
	vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
	// = vec4(light * red, light * green, light * blue, 1.0);
	

	vec2 mNorm = 2.0 * mPos / bounds;
	mNorm.x -= 1.0;
	mNorm.y -= 1.0;

	
	vec2 pos;
	float radius = 70.0 + 100.0 * LMB;

	for (float i = 0.0; i < 20.0; i++) {

		float part = i * 0.05;
		pos = mPos;

		float timMul = light * (300.0 + 500.0 * LMB) * mNorm.x * mNorm.y * sin(TIME);

		pos.x += cos(
			part * 2.0 * 3.14159265 * TIME + timMul + TIME + mNorm.x * LMB * 6.28
		) * radius;
		pos.y += sin(
			part * 2.0 * 3.14159265 * TIME + timMul + TIME + mNorm.y * LMB * 6.28
		) * radius;


		vecTo = pos - gl_FragCoord.xy;
		light = get_wave_amplitude(vecTo, 100.0 + 300.0 * LMB);

		col.x += light * red;
		col.y += light * green;
		col.z += light * blue;
	}



	
	gl_FragColor = col;
}
`;




