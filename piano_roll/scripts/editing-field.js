/*

This is supposed to be a rectangle which pops up when you double-click on a note.
OR maybe when you switch to gain mode or whatevs.

Inside it there will be stuff to edit e.g. volume over time.

Dependencies: vector.js, circle.js
*/


function EditField(pos, bounds, color, outlineColor, circleColor) {

	this.pos          = pos          || new Vector2();
	this.bounds       = bounds       || new Vector2(300, 300); // Width and height
	this.color        = color        || "#4448";
	this.outlineColor = outlineColor || "#fffe";
	this.circleColor  = circleColor  || "#acf";
	
	this.circles      = [
		new Circle(new Vector2(this.pos.x, this.pos.y), 7.0, this.circleColor),
		new Circle(new Vector2(this.pos.x + this.bounds.x, this.pos.y), 7.0, this.circleColor)
	];
	
	this.circles[0].value = 1.0;
	this.circles[1].value = 1.0;
	
	
	this.draw = (ctx, p, b, mPos) => { // p: note left pos, b: note right pos.
		
		let dist = Math.abs(b.y - p.y);
		
		this.pos.x = p.x;
		this.pos.y = p.y - 20.0;
		this.bounds.x = b.x - p.x;
		this.bounds.y = 40.0;
		
	
		ctx.fillStyle = this.color;
		ctx.fillRect(this.pos.x, this.pos.y, this.bounds.x, this.bounds.y);
		ctx.strokeStyle = this.outlineColor;
		ctx.lineWidth = 2;
		ctx.strokeRect(this.pos.x, this.pos.y, this.bounds.x, this.bounds.y);
		
		
		// Draw circles.
		for (let c in this.circles) {
			
			
			if (this.circles[c].isDragging) {
				
				this.circles[c].pos = mPos;
				
				
				
				if (this.circles[c].pos.y < this.pos.y) {
					this.circles[c].pos.y = this.pos.y;
					
				} else if (this.circles[c].pos.y > this.pos.y + this.bounds.y) {
					this.circles[c].pos.y = this.pos.y + this.bounds.y;
				}
				if (this.circles[c].pos.x < this.pos.x) {
					this.circles[c].pos.x = this.pos.x;
					
				} else if (this.circles[c].pos.x > this.pos.x + this.bounds.x) {
					this.circles[c].pos.x = this.pos.x + this.bounds.x;
				}
				
				if (c == 0) {
					this.circles[c].pos.x = this.pos.x;
				} else if (c == this.circles.length - 1) {
					this.circles[c].pos.x = this.pos.x + this.bounds.x;
				}
				
				
				
				this.circles[c].value = (this.pos.y - mPos.y) / this.bounds.y + 1.0;
				if (this.circles[c].value < 0.0) {
					this.circles[c].value = 0.0; // Might be unnecessary.
				}
				
				showText(ctx, "Gain: " + this.circles[c].value.toFixed(3),
					mPos.add(new Vector2(5.0, -5.0)), "#bcf");
			}
			
			
			
			if (c > 0) {
				
				if (this.circles[c].pos.x < this.circles[c-1].pos.x) {
					this.circles[c].pos.x = this.circles[c-1].pos.x;
				}
				
				ctx.strokeStyle = "#ccfe";
				ctx.beginPath();
				ctx.moveTo(this.circles[c-1].pos.x, this.circles[c-1].pos.y);
				ctx.lineTo(this.circles[c].pos.x, this.circles[c].pos.y);
				ctx.stroke();
			}
			
			this.circles[c].draw(ctx);
		}
	};
	
	
	
	
	
	
	
	this.addCircle = (pos, index) => {
		
		this.circles.splice(index, 0, new Circle(
			pos, 6.0, this.circleColor
		));
		this.circles[index].isDragging = true;
	};
	
	
	
	
	this.deleteCircle = (pos) => {
		
		for (let c in this.circles) {
		
			if (this.circles[c].isPointInside(pos)) {
				
				if (c == 0 || c == this.circles.length - 1) { return true; }
				
				this.circles.splice(c, 1); // Deletes the circle from the array.
				
				return false;
			}
		}
	};
	
	
	
	
	this.dragFromTo = (from, to) => {
	
		let dist = vecSubt(to, from);
		
		this.circles.forEach((c) => { c.pos = vecAdd(c.pos, dist); });
	};
	
	
	
	
	this.checkClick = (pos) => {
		
		for (let c in this.circles) {
			
			if (this.circles[c].isPointInside(pos)) {
				
				this.circles[c].isDragging = true;
				return true;
			} else if (c > 0) {
				
				if (this.circles[c-1].pos.x < pos.x && this.circles[c].pos.x > pos.x) {
					
					// Ideally one should be able to add a circle by clicking anywhere (except on a circle),
					// but this is good enough for now.
					let test = vecGetDistanceToLineSquared(
						pos, this.circles[c-1].pos, this.circles[c].pos
					);
					
					if (test < 10.0 * 10.0) {
						this.addCircle(pos, c);
						return true;
					}
				}
			}
		}
		return false;
	};
	
	
	this.unSelect = () => {
		
		for (let c in this.circles) {
			
			this.circles[c].isDragging = false;
		}
	};
	
	
	
	
	
	// Use this to find gain value at pos.
	this.getValueAtPos = (pos) => {
	
		let left, right;
		
		for (let c = 1; c < this.circles.length; c++) {
		
			if (pos > this.circles[c-1].pos.x && pos < this.circles[c].pos.x) {
			
				left = this.circles[c-1];
				right = this.circles[c];
				break;
			}
		}
		if (right == undefined) return 0.0; // Might prevent a wierd glitch.
		
		let dist = right.pos.x - left.pos.x;
		
		// Get distance from left to pos
		let distPos = pos - left.pos.x;
		
		// Get 0-1 range from left to right
		let multiplier = distPos / dist;
		
		let valueDiff = right.value - left.value;
		
		let val = multiplier * valueDiff + left.value;
		
		return val;
	};
	
	
	
	this.clone = () => {
		
		let obj = new EditField(
			this.pos.get(),
			this.bounds.get(),
			this.color,
			this.outlineColor,
			this.circleColor
		);
		
		this.circles.forEach((c, i)=>{
			obj.circles[i] = new Circle(c.pos.get(), c.size, c.color, c.freq, c.tone, c.value);
		});
		
		return obj;
	};
}
