class SaveManager {
	static quickSaveName = 'joddaw-save-data';
	static metaDataName = 'joddaw-meta-data';
	static synthPresetPrefix = 'joddaw-synth-preset:';
	static prefixSeparator = ':';
	
	static getSaveNameList() {
		const list = [];
		for (let i = 0; i < localStorage.length; i++) {
			const name = localStorage.key(i);
			if (name !== this.quickSaveName) list.push(name);
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
	
	static parseTrackData(data) {
		const parsed = JSON.parse(data);
		return parsed.tracks ? parsed : { bpm: 140, tracks: parsed }; // for backwards compatibility
	}
	
	static quickSave(saveData) {
		const data = JSON.stringify(saveData);
		localStorage.setItem(this.quickSaveName, data);
		navigator.clipboard.writeText(data).then(() => console.log('data copied to clipboard'));
	}
	
	static quickLoad() {
		const data = localStorage.getItem(this.quickSaveName) ?? '[]';
		return this.parseTrackData(data);
	}
	
	static saveAll(data, name) {
		const saveName = name;
		if (!saveName) return;
		console.log('Saving as ', saveName);

		const stringData = JSON.stringify(data);
		localStorage.setItem(saveName, stringData);
		navigator.clipboard.writeText(stringData).then(() => console.log('data copied to clipboard'));
	}
	
	static loadAll(name) {
		const saveName = name;
		if (!saveName) return;
		console.log('Loading ', saveName);
		
		const dataString = localStorage.getItem(saveName) ?? saveName;
		return this.parseTrackData(dataString);
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
		return this.parseTrackData(dataString);
	}
}
