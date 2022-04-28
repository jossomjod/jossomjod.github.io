
function Ball(pos, vel, size, color, mass) {
	this.pos   = pos   || new Vector2();
	this.vel   = vel   || new Vector2();
	this.size  = size  || 10.0;
	this.color = color || '#ffffff';
	this.mass  = mass  || 1.0;
	
	this.update = function(ctx, dt) {
		this.pos = vecAdd(this.pos, this.vel);
		
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
	};
}
