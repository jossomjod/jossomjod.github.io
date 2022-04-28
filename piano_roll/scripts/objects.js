
// TODO: I should totally make an object storing all the needed information, with functions using it.
// Or maybe a js file with constants and variables, which is loaded first...

// ALSO BOIII!   ./notes.txt   <----- CheckitoutcheckitoutnowdoitnownowNAOBOI
/*
function Note(pos, length, bounds, rng, color) {

	this.pos      = pos      || new Vector2();
	this.len      = length   || 40.0;
	this.color    = color    || "#47f";
	this.current  = true;
	this.playing  = false;
	this.timeLeft = 1.0;
	this.freq     = getFreqFromNum(this.pos.y, bounds.y, rng);
	this.osc;
	
	let lastPosY = this.pos.y;
	let lastLength = this.len;
	
	
	
	this.update = function(ctx) {
		
		if (lastPosY !== this.pos.y) {
			
			this.freq = getFreqFromNum(this.pos.y, bounds.y, rng);
			
			lastPosY = this.pos.y;
		}
		
		
		
		ctx.fillStyle = this.color;
		ctx.fillRect(this.pos.x, this.pos.y - 6.0, this.len, 10.0);
		ctx.strokeStyle = "#7af";
		ctx.strokeRect(this.pos.x, this.pos.y - 6.0, this.len, 10.0);
	};
	
	
	
	this.play = function(ac, type, masterGain, caretSpeed) {
		
		this.timeLeft = this.len / caretSpeed / 60
		
		this.osc = ac.createOscillator();
		this.osc.type = type;
		this.osc.frequency.value = this.freq;
		this.osc.detune.value = 4;
		
		let osc1 = ac.createOscillator();
		osc1.type = type;
		osc1.frequency.value = this.freq;
		osc1.detune.value = -4;
		
		let gain = ac.createGain();
		gain.gain.value = 0.0;
		gain.gain.linearRampToValueAtTime(0.5, ac.currentTime + 0.02);
		
		this.osc.connect(gain);
		osc1.connect(gain);
		
		gain.connect(masterGain);
		
		this.osc.start();
		osc1.start()
		
		
		gain.gain.linearRampToValueAtTime(0.0, ac.currentTime + this.timeLeft);
		this.osc.stop(ac.currentTime + this.timeLeft);
		osc1.stop(ac.currentTime + this.timeLeft);
	};
}



function NoteHandler(ac, masterGain, bounds, grid) {
	this.notes = [];
	this.index = 0;
	
	
	this.update = function(ctx) {
		for (let n in this.notes) {
			this.notes[n].update(ctx);
		}
	};
	
	
	
	this.addNote = function(pos, length, color) {
		this.index = this.notes.push(new Note(pos, length, bounds, grid.y, color));
		this.notes[this.notes.length - 1].timeLeft = 3.0;
		console.log(this.index);
	};
	
	
	this.deleteNote = function(index) {
		if (this.notes[index]) {
			delete this.notes[index];
		}
	};
	
	
	this.unselectAll = function() {
		for (let n in this.notes) {
			this.notes[n].current = false;
		}
	};
	
	
	this.dragTo = function(pos) {
		for (let n in this.notes) {
			if (this.notes[n].current) {
				this.notes[n].pos = pos;
				
				let tone = (-this.notes[n].pos.y / bounds.y + 1.0) * grid.y;
				let beat = this.notes[n].pos.x / bounds.x * grid.x;
				
				this.notes[n].pos.y = toneToPosition(Math.round(tone), grid.y, bounds.y);
				this.notes[n].pos.x = Math.round(beat) / grid.x * bounds.x;
			}
		}
	};
	
	
	this.checkNote = function(caretPos, caretSpeed) {
	
		for (let n in this.notes) {
		
			if (this.notes[n].pos.x <= caretPos &&
				this.notes[n].pos.x + this.notes[n].len > caretPos ) {
				
				if (!this.notes[n].playing) {
				
					this.notes[n].playing = true;
					
					this.notes[n].play(ac, "sawtooth", masterGain, caretSpeed);
					
					return this.notes[n].pos.y;
				}
			} else if (this.notes[n].playing) {
			
				this.notes[n].playing = false;
				return false;
			}
		}
		return true;
	};
	
	
	this.testCollision = function(pos) {
		for (let n in this.notes) {
		
			if (pos.x < this.notes[n].pos.x)                     { continue; }
			if (pos.x > this.notes[n].pos.x + this.notes[n].len) { continue; }
			if (pos.y < this.notes[n].pos.y - 10.0)              { continue; }
			if (pos.y > this.notes[n].pos.y + 10.0)              { continue; }
			
			this.notes[n].current = true;
			
			return true; // TODO: Allow changing note lengths.
		}
	};
}




*/



// KEYS yay--------------------uwu---------------------------------------------

var key = {
	left: false,
	up: false,
	down: false,
	right: false,
	space: false,
	ctrl: false,
	shift: false,
	a: false,
	w: false,
	s: false,
	e: false,
	d: false,
	f: false,
	t: false,
	g: false,
	y: false,
	h: false,
	u: false,
	j: false,
	k: false,
	o: false,
	l: false,
	p: false,
	oe: false,
	ae: false
};
