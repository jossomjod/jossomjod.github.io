
function Vector2(x, y) {
	
	this.x = x || 0.0;
	this.y = y || 0.0;
	
	
	// Use this for object positions to avoid obscure bugs.
	this.get = function() {
		return new Vector2(this.x, this.y);
	};
	
	this.add = function(vec) {
		return new Vector2(
			this.x + vec.x,
			this.y + vec.y
		);
	};
	
	this.subtract = function(vec) {
		return new Vector2(
			this.x - vec.x,
			this.y - vec.y
		);
	};
	
	this.multiply = function(num) {
		return new Vector2(
			this.x * vec.x,
			this.y * vec.y
		);
	};
}



// Returns vector + vector
function vecAdd(v1, v2) {
	
	return new Vector2(
		v1.x + v2.x,
		v1.y + v2.y
	);
}


// Returns vector - vector
function vecSubt(v1, v2) {
	
	return new Vector2(
		v1.x - v2.x,
		v1.y - v2.y
	);
}


// Returns vector * vector
function vecMult(v1, v2) {
	
	return new Vector2(
		v1.x * v2.x,
		v1.y * v2.y
	);
}


// Returns vector * number
function vecMultNum(v, n) {
	
	return new Vector2(
		v.x * n,
		v.y * n
	);
}


// Returns vector / vector
function vecDivide(v1, v2) {
	
	return new Vector2(
		v1.x / v2.x,
		v1.y / v2.y
	);
}


// Returns squared length of the vector
function vecLengthSquared(v) {
	
	return v.x * v.x + v.y * v.y;
}


// Returns length of the vector
function vecLength(v) {
	
	return Math.sqrt(v.x * v.x + v.y * v.y);
}



function vecDistanceTo(v1, v2) {

	return vecLength(vecSubt(v2, v1));
}


// Returns a normalized vector. Include vector length if known.
function vecNorm(v, l) {
	
	var l = l || vecLength(v);
	return new Vector2(
		v.x / l,
		v.y / l
	);
}


// Returns dot product of the vectors
function vecDot(v1, v2) {
	
	return v1.x * v2.x + v1.y * v2.y;
}


// Returns the angle of the vector
function vecAngle(v) {
	
	return Math.atan2(v.x, v.y);
}


// Returns a new vector from angle and length
function vecFromAngle(ang, len) {
	
	return new Vector2(
		len * Math.cos(ang),
		len * Math.sin(ang)
	);
}


// Returns a rotated vector
function vecRotate(vec, ang) {
	
	return vecFromAngle(vecAngle(vec) + ang, vecLength(vec));
}


// Returns true if the vector is outside the AABB bounding box
function vecIsOutside(vec, v1, v2) {
	
	return (vec.x < v1.x || vec.x > v2.x || vec.y < v1.y || vec.y > v2.y);
}


// Returns true if v1 is within r of v2
function vecIsCloserThan(v1, v2, r) {
	
	var vec = vecSubt(v2, v1);
	var n = vecLengthSquared(vec);
	
	return (n <= r * r); // Untested
}




// Returns the shortest distance squared between a point p and the line ab.
// NOTE: This gives the distance to the infinite line, not the line segment.
function vecGetDistanceToLineSquared(p, a, b) {

	let ab = vecSubt(b, a);
	let pa = vecSubt(a, p);
	
	let c = vecMultNum(ab, (vecDot(pa, ab) / vecDot(ab, ab)));
	let d = vecSubt(pa, c);
	
	
	return vecDot(d, d);
}

// Returns the shortest distance between a point p and the line ab.
function vecGetDistanceToLine(p, a, b) {

	let ab = vecSubt(b, a);
	let pa = vecSubt(a, p);
	
	let c = vecMultNum(ab, (vecDot(pa, ab) / vecDot(ab, ab)));
	let d = vecSubt(pa, c);
	
	
	let ans = Math.sqrt(vecDot(d, d));
	
	return ans;
}




// https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment?rq=1
// Shit sucks and will never be used.

function vecDistToSegmentSquared(p, v, w) {
	let l2 = vecDistanceTo(v, w);
	
	if (l2 == 0) return vecDistanceTo(p, v);
	
	let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
	
	t = Math.max(0, Math.min(1, t));
	
	return vecDistanceTo(p,
		{ x: v.x + t * (w.x - v.x),
		y: v.y + t * (w.y - v.y) }
	);
}


function vecDistToSegment(p, v, w) {
	return Math.sqrt(vecDistToSegmentSquared(p, v, w));
}






// The following was written real quick to prototype stuff.
// Then I copy/pasted the stuff above from other projects.
// Some old prototypes might still depend on this...

function Vector(x, y) {
	this.x = x || 0.0;
	this.y = y || 0.0;
	
	this.add = function(vec) {
		this.x += vec.x;
		this.y += vec.y;
	}
	
	this.subtract = function(vec) {
		this.x -= vec.x;
		this.y -= vec.y;
	}
	
	this.multiply = function(num) {
		this.x *= num;
		this.y *= num;
	}
}



function Vector3(x, y, z) {
	this.x = x || 0.0;
	this.y = y || 0.0;
	this.z = z || 0.0;
	
	this.add = function(vec) {
		this.x += vec.x;
		this.y += vec.y;
		this.z += vec.z;
	}
	
	this.subtract = function(vec) {
		this.x -= vec.x;
		this.y -= vec.y;
		this.z -= vec.z;
	}
	
	this.multiply = function(num) {
		this.x *= num;
		this.y *= num;
		this.z *= num;
	}
}
