class SaveManager {
	static quickSaveName = 'joddaw-save-data';
	static metaDataName = 'joddaw-meta-data';
	static configurationName = 'joddaw-configuration';
	static synthPresetPrefix = 'joddaw-synth-preset:';
	static prefixSeparator = ':';

	static autoSaveName = 'joddaw-auto-save';
	static autoSaves = [];
	static maxAutoSaves = 10;

	static hasUnsavedChanges = false;

	static markAsUnsaved() {
		this.hasUnsavedChanges = true;
	}

	static getSaveNameList() {
		const list = [];
		for (let i = 0; i < localStorage.length; i++) {
			const name = localStorage.key(i);
			if (name !== this.quickSaveName && name !== this.configurationName) list.push(name);
		}
		return list;
	}

	static getSaveNames() {
		const prefix = this.synthPresetPrefix;
		const list = this.getSaveNameList();
		return list.filter((l) => !l.startsWith(prefix));
	}

	static getSynthPresetNames() {
		const prefix = this.synthPresetPrefix;
		const list = this.getSaveNameList();
		return list.filter((l) => l.startsWith(prefix)).map((l) => l.replace(prefix, ''));
	}

	static saveConfiguration(config) {
		localStorage.setItem(this.configurationName, JSON.stringify(config));
	}

	static loadConfiguration() {
		const config = localStorage.getItem(this.configurationName);
		return config && JSON.parse(config);
	}

	static extractDataFromUrl(url) {
		const idx = url.indexOf('project=');
		if (idx === -1) return url;

		const nextParamIdx = url.indexOf('&', idx + 8);
		const k = nextParamIdx === -1 ? undefined : nextParamIdx;
		return url.slice(idx + 8, k);
	}

	static async parseDataStringOrUrl(d) {
		d = this.extractDataFromUrl(d);
		if (d.startsWith('H4sIAAAAAAAAA')) d = await this.decompressBase64(d);
		return d;
	}

	static async parseTrackData(data) {
		console.log(`Parsing data of size: ${data.length / 1000} kB`);
		let d = data;
		if (typeof d === 'string') d = await this.parseDataStringOrUrl(d);
		const parsed = JSON.parse(d);
		return (parsed.w ?? parsed.tracks) ? parsed : { bpm: 140, tracks: parsed }; // for backwards compatibility
	}

	// TODO
	static autoSave(saveData) {
		const data = JSON.stringify(saveData);
		const arrLen = this.autoSaves.unshift(data);
		if (arrLen > this.maxAutoSaves) this.autoSaves.pop();
		localStorage.setItem(this.autoSaveName, data);
		this.hasUnsavedChanges = false;
		console.log('Project auto-saved');
	}

	static async loadAutoSave() {
		const data = this.autoSaves[0] ?? localStorage.getItem(this.autoSaveName) ?? '[]';
		this.hasUnsavedChanges = false;
		return await this.parseTrackData(data);
	}

	static quickSave(saveData) {
		const data = JSON.stringify(saveData);
		navigator.clipboard.writeText(data).then(() => console.log(`data copied to clipboard. Size: ${data.length / 1000} kB`));
		localStorage.setItem(this.quickSaveName, data);
		this.hasUnsavedChanges = false;
	}

	static async quickLoad() {
		const data = localStorage.getItem(this.quickSaveName) ?? '[]';
		this.hasUnsavedChanges = false;
		return await this.parseTrackData(data);
	}

	static async saveAll(data, name) {
		const saveName = name;
		if (!saveName) return;
		console.log('Saving as ', saveName);

		const stringData = JSON.stringify(data);
		const b64 = await this.compressData(stringData);
		localStorage.setItem(saveName, b64);
		console.log(`Saved locally as "${saveName}"\nSize: ${b64.length / 1000} kB`);
		this.hasUnsavedChanges = false;
	}

	static async loadAll(name) {
		const saveName = name;
		if (!saveName) return;
		console.log('Loading ', saveName);

		const dataString = localStorage.getItem(saveName) ?? saveName;
		this.hasUnsavedChanges = false;
		return await this.parseTrackData(dataString);
	}

	static async loadFromClipboard() {
		console.log('Loading from clipboard');
		this.hasUnsavedChanges = false;
		const data = await navigator.clipboard.readText();
		return await this.parseTrackData(data);
	}

	static async compress(data) {
		const stream = new Blob([data]).stream();
		const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
		const chunks = [];
		for await (const chunk of compressedStream) {
			chunks.push(chunk);
		}
		return await new Blob(chunks).bytes();
	}

	static async compressData(data) {
		const compressed = await this.compress(data);
		const b64 = compressed.toBase64({ alphabet: 'base64url' });
		return b64;
	}

	static async decompress(data) {
		const stream = new Blob([data]).stream();
		const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
		const chunks = [];
		for await (const chunk of decompressedStream) {
			chunks.push(chunk);
		}
		const decompressed = await new Blob(chunks).text();
		return decompressed;
	}

	static async decompressBase64(b64) {
		const data = Uint8Array.fromBase64(b64, { alphabet: 'base64url' });
		return await this.decompress(data);
	}

	static async exportUrl(data) {
		const stringData = JSON.stringify(data);
		const base64 = await this.compressData(stringData);
		const { origin, pathname } = document.location;
		const url = `${origin}${pathname}?project=${base64}`;

		console.log('compressed from', stringData.length, 'to', base64.length);

		history.replaceState(null, '', url);

		await navigator.clipboard.writeText(url)
		console.log(`URL copied to clipboard. Data size: ${base64.length / 1000} kB`);
		return url;
	}

	static async importBase64(data) {
		if (!data) return null;

		console.log('Importing base64 data');
		this.hasUnsavedChanges = false;
		return await this.parseTrackData(data);
	}


	static saveSynthPreset(data, name) {
		const saveName = this.synthPresetPrefix + name;
		console.log('Saving preset as ', name);

		const stringData = JSON.stringify(data);
		localStorage.setItem(saveName, stringData);
		navigator.clipboard.writeText(stringData).then(() => console.log('data copied to clipboard'));
	}

	static loadSynthPreset(name) {
		const saveName = this.synthPresetPrefix + name;
		console.log('Loading preset ', saveName);

		const dataString = localStorage.getItem(saveName) ?? saveName;
		return JSON.parse(dataString);
	}
}
