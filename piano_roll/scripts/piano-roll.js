/*
* The cool and totally awesome modern piano roll.
*
* Dependencies: vector.js, functions.js, synth.js, circle.js editing-field.js
*/




// This should be in a separate file smh

function Note(ac, bounds, grid, pos, freq, tone, noteLength, color, activeColor) {
	
	this.pos         = pos   || new Vector2();
	this.circleSize  = 10.0;
	this.activeColor = activeColor || 0;
	this.color       = getActiveColor(this.activeColor); // color || "#fff9";
	this.noteLength  = noteLength || 80.0;
	this.circles     = [
		new Circle(pos, this.circleSize + 2.0, "#fefb", freq, tone),
		new Circle(
			vecAdd(pos, new Vector2(this.noteLength, 0.0)),
			this.circleSize, this.color, freq, tone
		)
	];
	
	this.playing               = false;
	this.selected              = true;
	this.isDragging            = true; // obsolete, but still in use somewhere because reasons.
	this.circles[0].isDragging = true;
	
	this.freq  = freq || 440;  // I should stop using freq. Tone is better.
	this.tone  = tone || 48;
	
	this.synth = new Synth(ac);
	
	this.gainField = new EditField(
		new Vector2(this.pos.x, this.pos.y - 20.0),
		new Vector2(this.noteLength, 40.0)
	);
	this.editMode = 0;
	
	
	// DRAWING YAY
	this.draw = (ctx, mPos, fr, to) => {
		
		ctx.lineWidth = 3;
		let lineColor = this.selected ? "#5fb" : "#bf5";
		
		
		let mainPos  = this.circles[0].pos;
		let mainTone = this.circles[0].tone;
		
		let dragIndex = -1;
		
		
		for (let c in this.circles) {
			
			// Drag a circle. If dragging the first: Move all of them.
			if (this.circles[c].isDragging) {
			
				this.circles[c].pos = mPos;
				this.circles[c].tone = to;
				this.circles[c].freq = this.freq = fr;
				dragIndex = c;
				
				if (c > 0) {
					if (this.circles[c].pos.x < this.circles[c-1].pos.x) {
						this.circles[c].pos.x = this.circles[c-1].pos.x;
					}
					
					if (c == this.circles.length - 1) {
						this.noteLength = this.circles[c].pos.x - this.circles[0].pos.x;
						this.gainField.circles[this.gainField.circles.length - 1].pos.x = mPos.x;
					}
				}
				
				this.pos = this.circles[c].pos;
				
			} else if (dragIndex == 0) {
				
				let distTo = vecSubt(this.circles[c].pos, mainPos);
				let toneTo = this.circles[c].tone - mainTone;
				
				this.circles[c].pos = vecAdd(mPos, distTo);
				this.circles[c].tone = to + toneTo;
				this.circles[c].freq = toneToFreq(this.circles[c].tone);
			}
			
			
			
			
			
			
			
			// DRAW
			
			this.circles[c].draw(ctx);
			
			if (c > 0) {
				ctx.strokeStyle = lineColor;
				ctx.beginPath();
				ctx.moveTo(this.circles[c-1].pos.x, this.circles[c-1].pos.y);
				ctx.lineTo(this.circles[c].pos.x, this.circles[c].pos.y);
				ctx.stroke();
			}
		}
		
		// Draw edit fields if correct mode. This will be a switch later.
		
		 if (dragIndex == 0) {
					
			this.gainField.dragFromTo(mainPos, mPos);
		}
		
		if (this.editMode === 1) {
			this.gainField.draw(ctx, this.circles[0].pos, this.circles[this.circles.length-1].pos, mPos);
		}
	};
	
	
	
	
	this.addCircle = (pos, index) => {
		
		this.circles.splice(index, 0, new Circle(
			pos, this.circleSize, this.color, this.freq, this.tone
		));
		this.circles[index].isDragging = true;
	};
	
	
	
	
	this.deleteCircle = (pos) => {
		
		if (this.editMode === 1) {
			this.gainField.deleteCircle(pos);
			return false;
		}
		
		for (let c in this.circles) {
		
			if (this.circles[c].isPointInside(pos)) {
				
				if (c == 0 || c == this.circles.length - 1) { return true; }
				
				this.circles.splice(c, 1); // Deletes the circle from the array.
				
				return false;
			}
		}
	};
	
	
	// This whole fucking function is sooooo ugly lmao pls delet dis
	this.checkClick = (pos) => {
		
		
		if (this.editMode === 1) {
			return this.gainField.checkClick(pos);
		}
		
		for (let c in this.circles) {
		
			if (this.circles[c].isPointInside(pos)) {
				this.circles[c].isDragging = true;
				
				if (c == 0) {
					this.isDragging = true;
				}
				return true; // Maybe I could just return the object itself (or at least the index).
			}
		}
		
		for (let c in this.circles) {
			
			if (c > 0) {
				
				if (this.circles[c-1].pos.x < pos.x && this.circles[c].pos.x > pos.x) {
					
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
		this.gainField.unSelect();
		this.isDragging = false;
	}
	
	
	
	this.dragFromTo = (from, to) => {
		
		let vecTo = vecSubt(to, from);
		
		this.circles.forEach((c) => { c.pos = vecAdd(c.pos, vecTo); });
		
		this.gainField.dragFromTo(from, to);
	};
	
	
	
	
	this.getFreqAtPos = (pos) => {
	
		let left, right;
		
		for (let c = 1; c < this.circles.length; c++) {
		
			if (pos > this.circles[c-1].pos.x && pos < this.circles[c].pos.x) {
			
				left = this.circles[c-1];
				right = this.circles[c];
			}
		}
		if (right == undefined) return 48; // Might prevent a wierd glitch.
		
		let distX = right.pos.x - left.pos.x;
		
		let distPos = pos - left.pos.x;
		
		let multiplier = distPos / distX;
		
		let toneRight = posToTone(right.pos.y, bounds.y, grid.y, 0);
		let toneLeft = posToTone(left.pos.y, bounds.y, grid.y, 0);
		
		let toneDiff = toneRight - toneLeft;
		let tone = multiplier * toneDiff + toneLeft;//left.tone;
		
		return toneToFreq(tone);
	};
	
	
	
	// Copying objects in javascript is rather inconvenient.
	
	this.clone = () => {
	
		let obj = new Note(
			ac,
			bounds,
			grid,
			this.pos.get(),
			this.freq,
			this.tone,
			this.noteLength,
			this.color
		);
		
		this.circles.forEach((c, i)=>{
			obj.circles[i] = new Circle(c.pos.get(), c.size, c.color, c.freq, c.tone, c.value);
		});
		
		obj.gainField = this.gainField.clone();
		
		return obj;
	};
}











function PianoRoll(ctx, ac, pos, bounds, masterGain) {

	this.pos          = pos    || new Vector2();
	this.bounds       = bounds || new Vector2(window.innerWidth, window.innerHeight);
	this.cellSize     = new Vector2(20, 16);
	this.gridSize     = vecDivide(this.bounds, this.cellSize);
	this.cellsPerBeat = 4;
	this.toneOffset   = 0;
	
	this.notes      = [];
	this.clipboard  = [];
	this.copyPos    = new Vector2();
	this.noteLength = this.cellSize.x * this.cellsPerBeat;
	
	this.mPos       = new Vector2();
	this.snapPos    = new Vector2();
	
	this.lmbDown    = false;
	this.mmbDown    = false;
	this.rmbDown    = false;
	
	this.lastTimeLmbWasDown = 0.0;
	
	
	this.caretPos   = 0.0;
	this.playing    = false;
	this.time       = 0.0;
	this.beats      = 0.0;
	this.bpm        = 100;
	this.freq       = 440.0;
	this.tone       = 0.0;
	
	this.synth      = new Synth(ac);
	
	this.snapToGrid = true;
	this.snapMode   = 2;
	
	this.editMode   = 0; // 0: pitch, 1: gain, 2: idk, filter, maybe?
	
	this.activeColor = 0; // Note color.
	
	
	this.draw = (dt) => {
		ctx.putImageData(this.background, this.pos.x, this.pos.y); // Draw grid.
		
		
		
		// If playing--------------------------------------------------------------
		if (this.playing) {
			
			this.time += dt / 60;
			this.beats = this.time / this.bpm * 60;
			
			this.caretPos = this.beats * this.cellSize.x * this.cellsPerBeat * this.cellsPerBeat;
			
			
			
			
			// NOTE PLAYING STUFF:
			
			for (let n in this.notes) {  // For every note:
			
				let endPos = this.notes[n].circles[this.notes[n].circles.length-1].pos.x;
				
			
				if (this.notes[n].playing) {   // If the note is playing:
				
					if (endPos < this.caretPos) { // If the caret has moved past the end of the note:
					
						this.notes[n].synth.stop();
						this.notes[n].playing = false;
						
					} else {                    // If the caret has yet to reach the end of the note:
					
						// Adjust automation values:
						let fr = this.notes[n].getFreqAtPos(this.caretPos);            // Frequency
						let ga = this.notes[n].gainField.getValueAtPos(this.caretPos); // Gain
						this.notes[n].synth.update(fr, ga);
					}
					
				} else {                // If the note is not playing:
					
					                    // If the caret is inside the note:
					if (this.notes[n].circles[0].pos.x < this.caretPos && endPos > this.caretPos) {
						
						let tone = posToTone(
							this.notes[n].circles[0].pos.y,
							this.bounds.y,
							this.gridSize.y,
							0
						);
						
						this.notes[n].synth.start(
							masterGain,                                  // Reference to the output.
							toneToFreq(tone),
							this.notes[n].gainField.circles[0].value
						);
						this.notes[n].playing = true;
					}
				}
			}
			
			
			
			
			
			if (this.caretPos >= this.bounds.x) { // When the caret reaches the end:
				this.time = 0.0;                  // Loop back to the beginning.
			}
			
			// Caret drawing
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#ff0";
			ctx.beginPath();
			ctx.moveTo(this.caretPos, 0);
			ctx.lineTo(this.caretPos, this.bounds.y);
			ctx.stroke();
		} // End if playing-----------------------------------------------
		
		
		
		if (this.lmbDown && this.editMode == 0) {
			let tone = (-this.mPos.y / this.bounds.y + 1.0) * this.gridSize.y + this.toneOffset;
			this.tone = (this.snapMode > 1) ? Math.round(tone) : tone;
			this.freq = 27.5 * Math.pow(2, this.tone / 12);
			
			this.synth.update(this.freq, 1.0);
		}
		
		
		
		
		
		
		// Draw all the notes:
		for (let n in this.notes) {
			this.notes[n].draw(ctx, this.snapPos, this.freq, this.tone);
		}
	};
	
	
	
	this.addNote = (pos) => {
		let t = (-pos.y / this.bounds.y + 1.0) * this.gridSize.y + this.toneOffset;
		let f = toneToFreq(t);
		
		this.notes.push(new Note(
			ac, this.bounds, this.gridSize, pos, f, t, this.noteLength, "#9cda"
		));
	};
	
	this.deleteNote = (index) => {
		this.notes.splice(index, 1);
	};
	
	
	
	
	
	this.copySelected = (pos) => {
		
		this.clipboard = []; // Empty clipboard first.
		this.copyPos   = pos;
		
		this.notes.forEach((n) => {
			
			if (n.selected) {
				this.clipboard.push(n.clone()); // Add selected notes to clipboard.
			}
		});
	};
	
	
	this.pasteAtPos = (pos) => {
	
		
		this.notes.forEach((n) => { n.selected = false; });
		
		
		this.clipboard.forEach((c) => {
			
			c = c.clone();
			
			c.dragFromTo(this.copyPos, pos);
			this.notes.push(c);
		});
	};
	
	
	
	
	
	this.setEditMode = (mode) => {
		this.editMode = mode;
		this.notes.forEach((n) => { n.editMode = mode; });
	};
	
	
	
	this.togglePlaying = (time) => {
		
		this.playing = !this.playing;
		if (this.playing) {
			
			this.time = time || 0.0;
		} else {
			
			this.notes.forEach((n) => { n.synth.stop(); n.playing = false; });
		}
	};
	
	
	// TODO: Middle-clicking a note should duplicate it.
	//       Middle-clicking nothing should create a copy of the last duplicated note.
	//       Number keys should switch between different automation modes.
	//       It should be possible to select multiple notes and edit all simultaneously.
	
	
	this.onMouseDown = (e, pos) => {
		this.mPos = pos;
		
		switch (e.which) {
			case 1:
				this.snapPos = snapToGrid(pos, this.bounds, this.gridSize, this.snapMode);
				this.tone = (-pos.y / this.bounds.y + 1.0) * this.gridSize.y + this.toneOffset;
				this.freq = toneToFreq(this.tone);
				
				if (this.editMode == 0) {       // if pitch mode:
					
					if (+new Date - this.lastTimeLmbWasDown < 200.0) { // if double-click:
					
						console.log("DAUBEL KLAIKK");
						
					} else {                                           // if NOT double-click:
					
						this.lastTimeLmbWasDown = +new Date;
						this.synth.start(masterGain, this.freq, 1.0);
					}
				}
				this.lmbDown = true;
				break;
			case 2:
				this.mmbDown = true;
				break;
			case 3:
				this.rmbDown = true;
				break;
		}
		
		
		
		if (this.lmbDown) { // THIS SHIT REALLY SHOULD BE MOVED TO THE SWITCH ABOVE
			
			
			if (!keys.ctrl) {
				this.notes.forEach((n) => { n.selected = false; });
			}
			
			let bul = false;
			
			for (let n in this.notes) {
			
				bul = (bul || this.notes[n].checkClick(this.mPos));
				if (bul) {
					this.notes[n].selected = true;
					
					break;
				}
			}
			
			if (!bul) {
				this.notes.forEach((n) => { n.selected = false; });
				
				if (this.editMode == 0) {
					this.addNote(this.snapPos);
				}
			}
			
		} else if (this.rmbDown) {
				
			for (let n in this.notes) {
				
				if (this.notes[n].deleteCircle(pos)) {
					this.deleteNote(n);
					break;
				}
			}
		}
	};
	
	
	
	
	this.onMouseUp = (e, pos) => {
		this.mPos = pos;
		
		switch (e.which) {
			case 1:
				this.synth.stop();
				this.lmbDown = false;
				break;
			case 2:
				this.mmbDown = false;
				break;
			case 3:
				this.rmbDown = false;
				break;
		}
		
		
		
		for (let n in this.notes) {
			if (this.notes[n].selected) {
				this.noteLength = this.notes[n].noteLength;
			}
			this.notes[n].unSelect();
		}
	};
	
	
	
	
	this.onMouseMove = (e, pos) => {
		this.mPos = pos;
		
		if (this.lmbDown) {
		
			this.snapPos = snapToGrid(pos, this.bounds, this.gridSize, this.snapMode);
			this.tone = (-pos.y / this.bounds.y + 1.0) * this.gridSize.y + this.toneOffset;
			this.freq = toneToFreq(this.tone);
		}
		
		if (this.rmbDown) {
				
			for (let n in this.notes) {
				if (this.notes[n].deleteCircle(pos)) {
					this.deleteNote(n);
					break;
				}
			}
		}
	};
	
	
	
	
	
	
	this.generateBackground = () => {
		
		ctx.fillStyle = "#222";
		ctx.fillRect(0, 0, this.bounds.x, this.bounds.y);
		
		
		ctx.lineWidth = 1;
		
		let n = 1;
		for (let y = this.cellSize.y; y < this.bounds.y; y += this.cellSize.y) {
			
			ctx.beginPath();
			
			if (n === 12) {
				ctx.strokeStyle = "#47f";
				n = 1;
			} else {
				ctx.strokeStyle = "#999";
				n++
			}
			
			ctx.moveTo(0.0, y);
			ctx.lineTo(this.bounds.x, y);
			ctx.stroke();
		}
		
		let b = 1;
		for (let x = this.cellSize.x; x < this.bounds.x; x += this.cellSize.x) {
		
			ctx.beginPath();
			
			if (b === 16) {
				ctx.strokeStyle = "#eee";
				b = 1;
			} else {
				ctx.strokeStyle = "#999";
				b++
			}
			
			ctx.moveTo(x, 0.0);
			ctx.lineTo(x, this.bounds.y);
			ctx.stroke();
		}
		
		return ctx.getImageData(0, 0, this.bounds.x, this.bounds.y);
	};
	
	this.background = this.generateBackground();
}









