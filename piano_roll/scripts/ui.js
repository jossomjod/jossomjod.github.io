

function Box(pos, size, color) {
    this.pos   =   pos;
    this.size  =  size;
    this.color = color;
    
    this.draw = function(ctx) {
        ctx.strokeStyle = this.color;
        ctx.strokeRect(pos.x, pos.y, size.x, size.y);
    }
}



// A point in a canvas, which can be dragged around.

function Point(c, pos, size, col)
{
	this.pos   = pos  || new Vector2();
	this.size  = size || 6;
	this.color = col  || '#888888';
	
	this.isDragging = false;
	
	// Updates the point
	this.update = function(m) {
		
        if (this.isDragging) {
            this.pos = m;
        }
        
		c.beginPath();
		c.fillStyle = this.color;
		c.arc(this.pos.x, this.pos.y,
		this.size, 0, Math.PI * 2, true);
		c.closePath();
		c.fill();
	};
	
	
	
	this.isClick = function(vec) {
		if (vecIsCloserThan(this.pos, vec, this.size))
		{
			return true;
		}
		return false;
	};
}



// A graphical envelope
function graphEnvelope(ctx, canvas) {    
    
    let mPos = new Vector2();
    
    let stepWidth  = canvas.width  / 300;
    let stepHeight = canvas.height / 100;
    
    let attPos = new Vector2(stepWidth * 2, 6);
    let decPos = new Vector2(stepWidth * 25, canvas.height * 0.5);
    let susPos = new Vector2(stepWidth * 50, canvas.height * 0.5);
    let relPos = new Vector2(stepWidth * 70, canvas.height);
    
    this.attPoint = new Point(ctx, attPos);
    this.decPoint = new Point(ctx, decPos);
    this.susPoint = new Point(ctx, susPos);
    this.relPoint = new Point(ctx, relPos);
    
    
    this.update = function() {
        
        this.attPoint.update(mPos);
        this.decPoint.update(mPos);
        this.susPoint.update(mPos);
        this.relPoint.update(mPos);
        
        this.relPoint.pos.y = canvas.height;
        
        if (this.decPoint.pos.x < this.attPoint.pos.x) {
            this.decPoint.pos.x = this.attPoint.pos.x;
        }
        if (this.susPoint.pos.x < this.decPoint.pos.x) {
            this.susPoint.pos.x = this.decPoint.pos.x;
        }
        if (this.relPoint.pos.x < this.susPoint.pos.x) {
            this.relPoint.pos.x = this.susPoint.pos.x;
        }
        
        
        ctx.lineWidth   = 2;
        ctx.strokeStyle = '#3fc715';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(this.attPoint.pos.x, this.attPoint.pos.y);
        ctx.lineTo(this.decPoint.pos.x, this.decPoint.pos.y);
        ctx.lineTo(this.susPoint.pos.x, this.susPoint.pos.y);
        ctx.lineTo(this.relPoint.pos.x, this.relPoint.pos.y);
        ctx.stroke();
        
        
        
        if (this.attPoint.isDragging) {
            let att = this.getAttack();
            showText(ctx,
                'Attack: ' + att.x.toFixed(3) + ', ' + att.y.toFixed(3),
                new Vector2(70, 16)
            );
        }
        else if (this.decPoint.isDragging) {
            let dec = this.getDecay();
            showText(ctx,
                'Decay: ' + dec.x.toFixed(3) + ', ' + dec.y.toFixed(3),
                new Vector2(70, 16)
            );
        }
        else if (this.susPoint.isDragging) {
            let sus = this.getSustain();
            showText(ctx,
                'Sustain: ' + sus.x.toFixed(3) + ', ' + sus.y.toFixed(3),
                new Vector2(70, 16)
            );
        }
        else if (this.relPoint.isDragging) {
            showText(
                ctx, 'Release: ' + this.getRelease().toFixed(3),
                new Vector2(70, 16)
            );
        }
    };
    
    
    
    this.getAttack = function() {
        return new Vector2(
            this.attPoint.pos.x / canvas.width * 3,
            1 - this.attPoint.pos.y / canvas.height
        );
    };
    this.getDecay = function() {
        return new Vector2(
            (this.decPoint.pos.x - this.attPoint.pos.x) / canvas.width * 3,
            1 - this.decPoint.pos.y / canvas.height
        );
    };
    this.getSustain = function() {
        return new Vector2(
            (this.susPoint.pos.x - this.decPoint.pos.x) / canvas.width * 3,
            1 - this.susPoint.pos.y / canvas.height
        );
    };
    this.getRelease = function() {
        return (this.relPoint.pos.x - this.susPoint.pos.x) / canvas.width * 3;
    };
    
    
    
    
    this.onMouseMove = function(e) {
        mPos = getMousePos(canvas, e);
    };
    
    this.onMouseDown = function() {
        
        if (this.attPoint.isClick(mPos)) {
            this.attPoint.isDragging = true;
        } else if (this.decPoint.isClick(mPos)) {
            this.decPoint.isDragging = true;
        } else if (this.susPoint.isClick(mPos)) {
            this.susPoint.isDragging = true;
        } else if (this.relPoint.isClick(mPos)) {
            this.relPoint.isDragging = true;
        }
        
        console.log("X: " + mPos.x + ", Y: " + mPos.y);
    };
    
    this.onMouseUp = function() {
        this.attPoint.isDragging = false;
        this.decPoint.isDragging = false;
        this.susPoint.isDragging = false;
        this.relPoint.isDragging = false;
    };
    
}








function Visualizer(ac, nh, pos, size) {
    
    let analyser = ac.createAnalyser();
    nh.volume.connect(analyser);
    
    analyser.fftSize = 2048;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray    = new Uint8Array(bufferLength);
    
    this.pos  = pos  || new Vector2();
    this.size = size || new Vector2(100, 100);
    
    
    this.draw = function(ctx) {
        
        ctx.fillStyle = shadeOfColor(30, 30, 30, 10);
        ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
        
        analyser.getByteTimeDomainData(dataArray);
        
        ctx.lineWidth   = 2;
        ctx.strokeStyle = shadeOfColor(50, 230, 40, 40);//'#3fc715';
        ctx.beginPath();
        
        let sliceWidth = this.size.x * 1.0 / bufferLength;
        let x = this.pos.x;
        
        for (let i = 0; i < bufferLength; i++) {
            
            let v = dataArray[i] / 128.0;
            let y = v * this.size.y / 2 + this.pos.y;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        ctx.lineTo(x, this.size.y / 2 + this.pos.y);
        ctx.stroke();
    };
}






function Particle(pos, vel, size, color, ttl, id) {
    this.pos   = pos;
    this.vel   = vel   || new Vector2();
    this.size  = size  || 1.0;
    this.color = color || "#ffffff";
    this.ttl   = ttl   || 100;
    this.id    = id;
    
    this.update = function(ctx, dt) {
        this.pos = vecAdd(this.pos, vecMultNum(this.vel, dt));
        this.ttl--;
        
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
    };
}


function ParticleHandler(position) {
    this.pos       = position || new Vector2();
    this.particles = [];
    this.index     = 0;
    this.amount    = 6;
    this.mode      = 1;
    this.on        = false;
    
    this.generateParticle = function(mode) {
        let pos = this.pos;
        let vel;
        let size;
        let color;
        let ttl;
        
        switch (mode) {
            case 0:
                vel = vecFromAngle(
                    Math.random() * Math.PI * 2,
                    Math.random() * 2.0
                );
                size  = Math.random() * 4.0 + 1.0;
                color = randomColor();
                ttl   = 10 + Math.random() * 20;
                break;
            case 1:
                vel = vecFromAngle(
                    Math.random() * Math.PI * 2,
                    Math.random() * 12.0
                );
                size  = Math.random() * 3.0 + 3.0;
                color = shadeOfColor(20, 230, 40, 80);
                ttl   = 5 + Math.random() * 5;
                break;
            default:
                vel = new Vector2(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1
                );
                size  = Math.random() * 3.0 + 1.0;
                color = randomColor();
                ttl   = 300 + Math.random() * 200;
                break;
        }
        
        this.particles[this.index] = new Particle(
            pos, vel, size, color, ttl, this.index
        );
        this.index++;
    };
    
    this.update = function(ctx, dt, box) {
        if (this.on) {
            for (let i = 0; i < this.amount; i++) {
                this.generateParticle(this.mode);
            }
        }
        
        for (let p in this.particles) {
            this.particles[p].update(ctx, dt);
            if (this.particles[p].ttl < 0 ||
                vecIsOutside(
                    this.particles[p].pos,
                    new Vector2(),
                    box
                )
            ) {
                delete this.particles[p];
                this.index--;
            }
        }
    };
}





function SynthUI(pos, size) {
    this.pos    = pos    || new Vector2();
    this.size   = size   || new Vector2(400, 400);
    
    this.draw = function(ctx) {
        
        ctx.fillStyle = '#555555';
        ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
        
    };
}





function UiManager(canvas, ctx, bounds, ac, nh) {
    this.mode = 0; // 0: visualizer, 1: synth, 2: TBD,
    this.bounds = bounds || new Vector2(100, 100);
    this.visualizer = new Visualizer(
        ac, nh, new Vector2(200.0, 0.0), new Vector2(100, 100)
    );
    this.synthUI = new SynthUI(
        new Vector2(0.0, 100.0), new Vector2(400, 500)
    );
    
    this.draw = function(dt) {
        switch (this.mode) {
            case 0:
                this.visualizer.draw(ctx);
                break;
            case 1:
                this.synthUI.draw(ctx);
                break;
        }
    };
}


