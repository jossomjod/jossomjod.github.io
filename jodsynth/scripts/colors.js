const jodColors = {
	background: '#000000',
	caret: '#e7fc8f68',
	cursorLine: '#9ca5ff66',
	cursorHighlight: '#9ca5ff33',
	gridReference: '#579cef',
	gridLine: '#a7cab322',
	gridOctave: '#97a6ca64',
	gridBar: '#97a6ca64',
	gridBeat: '#a3adba2c',
	selectArea: '#88ccff66',
	track: '#376cf3',
	trackActive: '#77b5ff',
	selectedNote: '#9259f2',
	hoveredNote: '#c2a9f2',
	note: '#6699ff',
	resizeHandle: '#99c9ff',
	fadedNote: '#6699ff3c',
	fadedResizeHandle: '#99c9ff6c',
	fadedSelectedNote: '#7c42e176',
	playingNote: '#aceaff',
	playingNoteBorder: '#aceaff',
	mutedNote: '#55426253',
	automationBox: '#384c6caa',
	automationNode: '#eca592',
	automationLine: '#3a8afc77',
	fadedAutomationNode: '#eca59244',
	fadedAutomationLine: '#ffff7044',
	releaseBox: '#283e6299',
	loopLine: '#58c34ab2',
};


function getRandomColor(range = 255) {
	if (range > 255) range = 255;
	if (range < 0) range = 0;
	const diff = 255 - range;
	const r = Math.floor(Math.random() * range + diff);
	const g = Math.floor(Math.random() * range + diff);
	const b = Math.floor(Math.random() * range + diff);
	const col = r << 16 | g << 8 | b;
	return `#${col.toString(16)}`;
}

function colorHexToNum(hex) {
	if (typeof hex !== 'string') throw 'this thing is not a string';
	return Number.parseInt(hex.slice(1), 16);
}

function numberToColor(num) {
	if (typeof num !== 'number') throw 'this lumber is not a number';
	return `#${num.toString(16).padStart(6, '0')}`;
}

function colorHexToRgbTuple(hex) {
	const byteCount = (hex.length - 1) >> 1;
	const num = colorHexToNum(hex);
	const result = [];
	for (let i = byteCount-1; i > -1; i--) {
		result.push((num >> (8 * i)) & 0xff);
	}
	return result;
}

function isColorDark(hex, threshold = 186) {
	const [r, g, b] = colorHexToRgbTuple(hex);
	return r * 0.299 + g * 0.587 + b * 0.114 < threshold;
}

function fadeColor(col1, col2, t) {
	const [r1, g1, b1, a1] = colorHexToRgbTuple(col1);
	const [r2, g2, b2, a2] = colorHexToRgbTuple(col2);
	const r = r1 + (r2 - r1) * t;
	const g = g1 + (g2 - g1) * t;
	const b = b1 + (b2 - b1) * t;
	if (a1 != null || a2 != null) {
		const a = (a1 ?? 255) + ((a2 ?? 255) - (a1 ?? 255)) * t;
		return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}${(a).toString(16).padStart(2, '0')}`;
	}
	return `#${(r << 16 | g << 8 | b).toString(16)}`;
}





// from stackoverflow

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

















class ColorManager {
	predefinedColors = {
		default: {
			main: jodColors.note,
			active: jodColors.selectedNote,
			disabled: jodColors.mutedNote,
			faded: jodColors.fadedNote,
			highlight: jodColors.hoveredNote,
			fadedActive: jodColors.fadedSelectedNote,
		},
	};

	createCustomColor(baseColor) {
		const color = {
			main: baseColor,
			active: fadeColor(baseColor, '#ffffff', 0.6),
			disabled: jodColors.mutedNote,
			faded: fadeColor(baseColor, '#000000', 0.7),
			highlight: fadeColor(baseColor, '#ffffff', 0.3),
			fadedActive: fadeColor(baseColor, '#000000', 0.5),
		};
		return color;
	}
}

const colorManager = new ColorManager();