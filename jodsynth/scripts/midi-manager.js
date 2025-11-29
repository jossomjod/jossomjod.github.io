/**
 * @param {Uint8Array<ArrayBuffer>} bytes 
 * @returns {number}
 */
function byteArrayToNumber(bytes) {
	const len = bytes.length - 1;
	return bytes.reduce((prev, cur, i) => {
		prev |= cur << (8 * (len - i));
		return prev;
	}, 0);
}

function toHexString(num) {
	return '0x' + (+num).toString('16').padStart(2, '0');
}

// us = microseconds
function usPerBeatToBpm(us) {
	return 60 / (us / 1000000);
}

function bpmToUsPerBeat(bpm) {
	return 1000000 / (bpm / 60);
}


class MidiManager {
	/** @type {Uint8Array<ArrayBuffer>} */
	buffer;
	index = 0;

	constructor(arrayBuffer) {
		this.buffer = arrayBuffer;
	}

	readByte(doNotIncr = false) {
		if (doNotIncr) return this.buffer[(this.index)];
		return this.buffer[(this.index++)];
	}

	readBytes(amount = 1) {
		return this.buffer.slice(this.index, this.index += amount);
	}

	readString(length = 1) {
		return String.fromCharCode(...this.readBytes(length));
	}

	readEventData(sizeInBytes = 1) {
		let byte = this.buffer[this.index++];
		let value = byte & 0x7f;

		for (let i = 1; i <= sizeInBytes; i++) {
			byte = this.buffer[this.index++];
			value = (value << 7) | (byte & 0x7f);
		}
		return value;
	}

	readVarLength() {
		let byte = this.buffer[this.index++];
		let value = byte;

		if (byte & 0x80) {
			value &= 0x7f;
			do {
				byte = this.buffer[this.index++];
				value = (value << 7) | (byte & 0x7f);
			} while (byte & 0x80);
		}
		return value;
	}

	readEventType() {
		let byte = this.buffer[this.index++];
		let value = byte;
		if (!(byte & 0xff)) return value;
		
		while (byte & 0x80) {
			byte = this.buffer[this.index++];
			value = (value << 8) | byte;
		}
		return value;
	}

	readTrack({ ticksPerBeat }) {
		const startIndex = this.index;
		const firstFourBytes = this.readBytes(4);
		console.log('first 4 bytes of track', ...firstFourBytes);
		const chunkType = String.fromCharCode(...firstFourBytes);
		if (chunkType !== 'MTrk') console.warn(`This chunk ain\'t a normal track bro: ${chunkType} at index ${this.index - 4}`);
		
		const length = byteArrayToNumber(this.readBytes(4));
		console.log('chunkType, length', chunkType, length);

		let tempo = 500000; // in microseconds per beat
		let bpm = usPerBeatToBpm(tempo);
		let endOfTrack = false;
		let name, copyright, instrumentName, channelPrefix;
		let textEvents = [];
		let lyrics = [];
		let markers = [];
		let prevEventId = 0;
		let currentTime = 0;
		const notes = [];
		const channels = [];
		const pitches = []; // 14 bit pitch wheel value per channel (0x2000 is centered)

		while (!endOfTrack && this.index - startIndex < length) {
			const delta = this.readVarLength(); // time since previous event
			currentTime += delta;
			const running = !(this.readByte(true) & 0x80);
			if (running) console.log('RUNNNNNING');
			const eventType = !running ? this.readByte() : prevEventId;
			prevEventId = eventType;

			if ((eventType) === 0xff) {
				const event = this.readByte();
				if (event === 0x2f) endOfTrack = true;
				const len = this.readVarLength();

				switch (event) {
					case 0x00: // sequence number
						const seqNum = this.readBytes(len);
						console.log('Sequence number event', byteArrayToNumber(seqNum));
						continue;
					case 0x01: // any text event
						textEvents.push(this.readString(len));
						continue;
					case 0x02: // copyright notice
						copyright = this.readString(len);
						continue;
					case 0x03: // track name
						name = this.readString(len);
						continue;
					case 0x04:
						instrumentName = this.readString(len);
						continue;
					case 0x05:
						lyrics.push(this.readString(len));
						continue;
					case 0x06:
						markers.push(this.readString(len));
						continue;
					case 0x07: // cue point
						cuePoints.push(this.readString(len));
						continue;
					case 0x20: // MIDI channel prefix (associate a channel with all following events)
						channelPrefix = byteArrayToNumber(this.readBytes(len));
						continue;
					case 0x2f: // end of track
						endOfTrack = true;
						break;
					case 0x51: // set tempo in microseconds per beat
						tempo = byteArrayToNumber(this.readBytes(len));
						console.log('TEMPO', tempo);
						continue;
					case 0x54: // SMPTE offset
						const [hr, mn, se, fr, ff] = this.readBytes(len);
						console.log('SMPTE offset', hr, mn, se, fr, ff);
						continue;
					case 0x58: // time signature
						const [nn, dd, cc, bb] = this.readBytes(len);
						console.log('time signature', nn, dd, cc, bb);
						continue;
					case 0x59: // key signature
						console.log('IS ANY1 UNIRONICALLY USING THIS??? (key signature, 0x59)', this.index - 1);
						break;
					case 0x7f:
						console.log('Speshal sheet');
						break;
					default:
						console.warn('Unknown meta event encountered at index', this.index - 1);
						break;
				}

				this.index += len; // skip meta events for now
				console.log('skipped meta event:', toHexString(eventType), event, len);
				continue;
			}
			//console.log('EVENT ID:', eventId);
			
			switch (eventType & 0xf0) {
				/* case 0xff:
					const len = this.readEvent();
					switch (eventType & 0xff) {
						case 0x51:
							const microSecPerQuarterNote = this.readEventData(len); // TODO
							console.log('microSecPerQuarterNote', microSecPerQuarterNote);
							break;
						default:
							this.index += len; // skip data
							break;
					}
					break; */
				
				case 0x80: // note off
					const chnl2 = eventType & 0x0f;
					const tone2 = this.readByte();
					const velocity2 = this.readByte();
					if (!channels[chnl2]?.[tone2]) {
						console.log('unnecessary note off');
						break;
					}
					const note = { ...channels[chnl2][tone2] };
					note.duration = currentTime / ticksPerBeat - note.startTime;
					note.tone -= 20;
					notes.push(note);
					break;
				case 0x90: // note on
					const chnl = eventType & 0x0f;
					const tone = this.readByte();
					const velocity = this.readByte();
					if (channels[chnl]?.[tone] && !velocity) { // velocity == 0 counts as note off
						const note = { ...channels[chnl][tone] };
						note.duration = currentTime / ticksPerBeat - note.startTime;
						note.tone -= 20;
						notes.push(note);
						break;
					}
					//activeNotes[tone] = new Note(tone, currentTime / ticksPerBeat, 1, velocity / 127);
					if (!channels[chnl]) channels[chnl] = [];
					channels[chnl][tone] = new Note(tone, currentTime / ticksPerBeat, 1, velocity / 127);
					break;
				case 0xb0: // control change / channel mode messages
					const channel = eventType & 0x0f;
					const ctrlNo = this.readByte();
					const newValue = this.readByte();
					switch (ctrlNo) {
						case 122: // local control
							console.log('local control', newValue);
							break;
						case 123: // all notes off
						case 124: // omni mode off
						case 125: // omni mode on
						case 126: // mono mode on
						case 127: // poly mode on
							channels[channel]?.forEach((n) => {
								const note = { ...n };
								note.duration = currentTime / ticksPerBeat - note.startTime;
								note.tone -= 20;
								notes.push(note);
							});
							channels[channel] = [];
							console.log('ALL NOTES OFF');
							break;
						default: // control change
							console.log('control change', ctrlNo, newValue);
					}
					break;
				case 0xc0: // program change
				case 0xd0: // channel pressure
					this.readByte();
					break;
				case 0xe0: // pitch wheel
					pitches[eventType & 0x0f] = this.readEventData(2);
					break;
				case 0xf0: // system common messages
					console.log(`skipped system common message ${toHexString(eventType)} at index ${this.index}`);
					switch (eventType & 0x0f) {
						case 0:
							console.warn('UNCERTAIN LENGTH, MUST CHECK', toHexString(eventType), this.index);
							this.index += 2;
							break;
						case 2:
							this.index += 2;
							break;
						case 3:
							this.index++;
							break;
						default:
							break;
					}
					break;
				default:
					const type = this.readEventType();
					console.log('unhandled event:', toHexString(eventType), toHexString(type));
					break;
			}
		}
		return { notes, bpm, name };
	}

	readBuffer(buffer = this.buffer) {
		this.buffer = buffer;
		this.index = 0;

		const headerChunkType = String.fromCharCode(...buffer.slice(0, 4));
		if (headerChunkType !== 'MThd') throw new Error('File is not MIDI');
		
		const headerLength = byteArrayToNumber(buffer.slice(4, 8));

		const format = byteArrayToNumber(buffer.slice(8, 10));
		const ntrcks = byteArrayToNumber(buffer.slice(10, 12));
		const division = byteArrayToNumber(buffer.slice(12, 14));

		const timeFormat = (division >> 15) & 1;
		const ticksPerBeat = !timeFormat ? division & 0x7fff : division & 0xff;
		const framesPerSecond = division & 0x7f00; // irrelevant if !timeFormat

		if (timeFormat) throw new Error('Unsupported MIDI time format');

		console.log('format, ntrcks, division, time, ticks, frames', format, ntrcks, division, timeFormat, ticksPerBeat, framesPerSecond);

		this.index = 8 + headerLength;
		const tracks = [];
		
		for (let i = 0; i < ntrcks; i++) {
			if (this.index >= this.buffer.length - 4) {
				console.warn('mf lied about the amount of tracks bro', i, ntrcks);
				break;
			}
			tracks[i] = this.readTrack({ ticksPerBeat });
		}
		console.log('tracks', tracks);
		return { tracks };
	}
}
