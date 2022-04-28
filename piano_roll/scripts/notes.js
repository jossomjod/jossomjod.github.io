/*
* This file stores musical note frequencies.
*/

// Copied from https://gist.github.com/marcgg/94e97def0e8694f906443ed5262e9cbb
var noteValues = {
    'C0': 16.35,
    'C#0': 17.32,
    'Db0': 17.32,
    'D0': 18.35,
    'D#0': 19.45,
    'Eb0': 19.45,
    'E0': 20.60,
    'F0': 21.83,
    'F#0': 23.12,
    'Gb0': 23.12,
    'G0': 24.50,
    'G#0': 25.96,
    'Ab0': 25.96,
    'A0': 27.50,
    'A#0': 29.14,
    'Bb0': 29.14,
    'B0': 30.87,
    'C1': 32.70,
    'C#1': 34.65,
    'Db1': 34.65,
    'D1': 36.71,
    'D#1': 38.89,
    'Eb1': 38.89,
    'E1': 41.20,
    'F1': 43.65,
    'F#1': 46.25,
    'Gb1': 46.25,
    'G1': 49.00,
    'G#1': 51.91,
    'Ab1': 51.91,
    'A1': 55.00,
    'A#1': 58.27,
    'Bb1': 58.27,
    'B1': 61.74,
    'C2': 65.41,
    'C#2': 69.30,
    'Db2': 69.30,
    'D2': 73.42,
    'D#2': 77.78,
    'Eb2': 77.78,
    'E2': 82.41,
    'F2': 87.31,
    'F#2': 92.50,
    'Gb2': 92.50,
    'G2': 98.00,
    'G#2': 103.83,
    'Ab2': 103.83,
    'A2': 110.00,
    'A#2': 116.54,
    'Bb2': 116.54,
    'B2': 123.47,
    'C3': 130.81,
    'C#3': 138.59,
    'Db3': 138.59,
    'D3': 146.83,
    'D#3': 155.56,
    'Eb3': 155.56,
    'E3': 164.81,
    'F3': 174.61,
    'F#3': 185.00,
    'Gb3': 185.00,
    'G3': 196.00,
    'G#3': 207.65,
    'Ab3': 207.65,
    'A3': 220.00,
    'A#3': 233.08,
    'Bb3': 233.08,
    'B3': 246.94,
    'C4': 261.63,
    'C#4': 277.18,
    'Db4': 277.18,
    'D4': 293.66,
    'D#4': 311.13,
    'Eb4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'F#4': 369.99,
    'Gb4': 369.99,
    'G4': 392.00,
    'G#4': 415.30,
    'Ab4': 415.30,
    'A4': 440.00,
    'A#4': 466.16,
    'Bb4': 466.16,
    'B4': 493.88,
    'C5': 523.25,
    'C#5': 554.37,
    'Db5': 554.37,
    'D5': 587.33,
    'D#5': 622.25,
    'Eb5': 622.25,
    'E5': 659.26,
    'F5': 698.46,
    'F#5': 739.99,
    'Gb5': 739.99,
    'G5': 783.99,
    'G#5': 830.61,
    'Ab5': 830.61,
    'A5': 880.00,
    'A#5': 932.33,
    'Bb5': 932.33,
    'B5': 987.77,
    'C6': 1046.50,
    'C#6': 1108.73,
    'Db6': 1108.73,
    'D6': 1174.66,
    'D#6': 1244.51,
    'Eb6': 1244.51,
    'E6': 1318.51,
    'F6': 1396.91,
    'F#6': 1479.98,
    'Gb6': 1479.98,
    'G6': 1567.98,
    'G#6': 1661.22,
    'Ab6': 1661.22,
    'A6': 1760.00,
    'A#6': 1864.66,
    'Bb6': 1864.66,
    'B6': 1975.53,
    'C7': 2093.00,
    'C#7': 2217.46,
    'Db7': 2217.46,
    'D7': 2349.32,
    'D#7': 2489.02,
    'Eb7': 2489.02,
    'E7': 2637.02,
    'F7': 2793.83,
    'F#7': 2959.96,
    'Gb7': 2959.96,
    'G7': 3135.96,
    'G#7': 3322.44,
    'Ab7': 3322.44,
    'A7': 3520.00,
    'A#7': 3729.31,
    'Bb7': 3729.31,
    'B7': 3951.07,
    'C8': 4186.01,
    'C#8': 4434.92,
    'Db8': 4434.92,
    'D8': 4698.63,
    'D#8': 4978.03,
    'Eb8': 4978.03,
    'E8': 5274.04,
    'F8': 5587.65,
    'F#8': 5919.91,
    'Gb8': 5919.91,
    'G8': 6271.93,
    'G#8': 6644.88,
    'Ab8': 6644.88,
    'A8': 7040.00,
    'A#8': 7458.62,
    'Bb8': 7458.62,
    'B8': 7902.13
};



// This should do the trick.
function generateNoteTable() {
    let notes = [];
    let n = 1;
    for (let i = 0; i < 9; i++) {
        if (i > 0) { n *= 2 };
        notes[i] = [];
        notes[i]['C']  = 16.35 * n;
        notes[i]['C#'] = 17.32 * n;
        notes[i]['D']  = 18.35 * n;
        notes[i]['Eb'] = 19.45 * n;
        notes[i]['E']  = 20.60 * n;
        notes[i]['F']  = 21.83 * n;
        notes[i]['F#'] = 23.12 * n;
        notes[i]['G']  = 24.50 * n;
        notes[i]['Ab'] = 25.96 * n;
        notes[i]['A']  = 27.50 * n;
        notes[i]['Bb'] = 29.14 * n;
        notes[i]['B']  = 30.87 * n;
    }
    return notes;
}




// LOL, This is what I did first:
function getFreq(note) {
    let freq = 440.0;
    switch (note) {
        case 'C0':
            freq = 16.35;
            break;
        case 'C#0':
            freq = 17.32;
            break;
        case 'D0':
            freq = 18.35;
            break;
        case 'Eb0':
            freq = 19.45;
            break;
        case 'E0':
            freq = 20.60;
            break;
        case 'F0':
            freq = 21.83;
            break;
        case 'F#0':
            freq = 23.12;
            break;
        case 'G0':
            freq = 24.50;
            break;
        case 'Ab0':
            freq = 25.96;
            break;
        case 'A0':
            freq = 27.50;
            break;
        case 'Bb0':
            freq = 29.14;
            break;
        case 'B0':
            freq = 30.87;
            break;
        case 'C1':
            freq = 32.70;
            break;
        case 'C#1':
            freq = 34.65;
            break;
        case 'D1':
            freq = 36.71;
            break;
        case 'Eb1':
            freq = 38.89;
            break;
        case 'E1':
            freq = 41.20;
            break;
        case 'F1':
            freq = 43.65;
            break;
        case 'F#1':
            freq = 46.25;
            break;
        case 'G1':
            freq = 49.00;
            break;
        case 'Ab1':
            freq = 51.91;
            break;
        case 'A1':
            freq = 55.00;
            break;
        case 'Bb1':
            freq = 58.27;
            break;
        case 'B1':
            freq = 61.74;
            break;
        case 'C2':
            freq = 65.41;
            break;
        case 'C#2':
            freq = 69.30;
            break;
        case 'D2':
            freq = 73.42;
            break;
        case 'Eb2':
            freq = 77.78;
            break;
        case 'E2':
            freq = 82.41;
            break;
        case 'F2':
            freq = 87.31;
            break;
        case 'F#2':
            freq = 92.50;
            break;
        case 'G2':
            freq = 98.00;
            break;
        case 'Ab2':
            freq = 103.83;
            break;
        case 'A2':
            freq = 110.00;
            break;
        case 'Bb2':
            freq = 116.54;
            break;
        case 'B2':
            freq = 123.47;
            break;
        case 'C3':
            freq = 130.81;
            break;
        case 'C#3':
            freq = 138.59;
            break;
        case 'D3':
            freq = 146.83;
            break;
        case 'Eb3':
            freq = 155.56;
            break;
        case 'E3':
            freq = 164.81;
            break;
        case 'F3':
            freq = 174.61;
            break;
        case 'F#3':
            freq = 185.00;
            break;
        case 'G3':
            freq = 196.00;
            break;
        case 'Ab3':
            freq = 207.65;
            break;
        case 'A3':
            freq = 220.00;
            break;
        case 'Bb3':
            freq = 233.08;
            break;
        case 'B3':
            freq = 246.94;
            break;
        case 'C4':
            freq = 261.63;
            break;
        case 'C#4':
            freq = 277.18;
            break;
        case 'D4':
            freq = 293.66;
            break;
        case 'Eb4':
            freq = 311.13;
            break;
        case 'E4':
            freq = 329.63;
            break;
        case 'F4':
            freq = 349.23;
            break;
        case 'F#4':
            freq = 369.99;
            break;
        case 'G4':
            freq = 392.00;
            break;
        case 'Ab4':
            freq = 415.30;
            break;
        case 'A4':
            freq = 440.00;
            break;
        case 'Bb4':
            freq = 466.16;
            break;
        case 'B4':
            freq = 493.88;
            break;
        case 'C5':
            freq = 523.25;
            break;
        case 'C#5':
            freq = 554.37;
            break;
        case 'D5':
            freq = 587.33;
            break;
        case 'Eb5':
            freq = 622.25;
            break;
        case 'E5':
            freq = 659.25;
            break;
        case 'F5':
            freq = 698.46;
            break;
        case 'F#5':
            freq = 739.99;
            break;
        case 'G5':
            freq = 783.99;
            break;
        case 'Ab5':
            freq = 830.61;
            break;
        case 'A5':
            freq = 880.00;
            break;
        case 'Bb5':
            freq = 932.33;
            break;
        case 'B5':
            freq = 987.77;
            break;
        case 'C6':
            freq = 1046.50;
            break;
        case 'C#6':
            freq = 1108.73;
            break;
        case 'D6':
            freq = 1174.66;
            break;
        case 'Eb6':
            freq = 1244.51;
            break;
        case 'E6':
            freq = 1318.51;
            break;
        case 'F6':
            freq = 1396.91;
            break;
        case 'F#6':
            freq = 1479.98;
            break;
        case 'G6':
            freq = 1567.98;
            break;
        case 'Ab6':
            freq = 1661.22;
            break;
        case 'A6':
            freq = 1760.00;
            break;
        case 'Bb6':
            freq = 1864.66;
            break;
        case 'B6':
            freq = 1975.53;
            break;
        case 'C7':
            freq = 2093.00;
            break;
        case 'C#7':
            freq = 2217.46;
            break;
        case 'D7':
            freq = 2349.32;
            break;
        case 'Eb7':
            freq = 2489.02;
            break;
        case 'E7':
            freq = 2637.02;
            break;
        case 'F7':
            freq = 2793.83;
            break;
        case 'F#7':
            freq = 2959.96;
            break;
        case 'G7':
            freq = 3135.96;
            break;
        case 'Ab7':
            freq = 3322.44;
            break;
        case 'A7':
            freq = 3520.00;
            break;
        case 'Bb7':
            freq = 3729.31;
            break;
        case 'B7':
            freq = 3951.07;
            break;
        case 'C8':
            freq = 4186.01;
            break;
        case 'C#8':
            freq = 4434.92;
            break;
        case 'D8':
            freq = 4698.63;
            break;
        case 'Eb8':
            freq = 4978.03;
            break;
        case 'E8':
            freq = 5274.04;
            break;
        case 'F8':
            freq = 5587.65;
            break;
        case 'F#8':
            freq = 5919.91;
            break;
        case 'G8':
            freq = 6271.93;
            break;
        case 'Ab8':
            freq = 6644.88;
            break;
        case 'A8':
            freq = 7040.00;
            break;
        case 'Bb8':
            freq = 7458.62;
            break;
        case 'B8':
            freq = 7902.13;
            break;
        default:
            freq = 440.0;
    }
    return freq;
}