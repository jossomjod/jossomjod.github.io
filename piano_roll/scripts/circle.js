


function Circle(pos, size, color, freq, tone, value) { // TODO: Double-click on circle to edit value.

	this.pos        = pos   || new Vector2();
	this.size       = size  || 10.0;
	this.color      = color || "#bbb";
	this.isDragging = false;
	this.value      = value || 0.5; // A generic value between 0 and 1.
	this.freq       = freq  || 440.0;
	this.tone       = 24; // Start using tone instead of freq.
	                     //  Also, tone should be able to hold any kind of value.
	                     //  Or maybe just use pos. You have to convert all the things anyway.
	                     // UPDATE: DEFINITELY just use pos. You avoid so many problems that way.
	
	
	this.draw = (ctx) => {
		
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.pos.x, this.pos.y, this.size, 0, 2 * Math.PI);
		ctx.fill();
	};
	
	this.isPointInside = (point) => {
		return (vecLengthSquared(this.pos.subtract(point)) <= this.size * this.size);
	};
	
	this.clone = () => {
	
		return new Circle(this.pos.get(), this.size, this.color, this.freq, this.tone, this.value);
	};
}



