/* Learn Piano Keys - compact notation parser.

   Each piece is written once, in a readable string, and expanded into note
   data by code. Writing "E4:4 E4:4 F4:4 G4:4" is far harder to get wrong than
   hand-typing MIDI numbers and start offsets, and bar totals are validated on
   load so a mistake fails the build instead of shipping.

   Format:  NOTE:DURATION  separated by spaces, bars separated by |
            NOTE is a letter, optional # or b, then an octave (C4 = middle C)
            r:DURATION is a rest
            DURATION is in sixteenth notes: 16 = whole, 8 = half, 4 = quarter,
            2 = eighth, 1 = sixteenth, 6 = dotted quarter, 12 = dotted half
   Chords:  C4+E4+G4:4 sounds all three together                              */

const STEP_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function noteToMidi(token) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(token.trim());
  if (!m) throw new Error('bad note: ' + token);
  let midi = (parseInt(m[3], 10) + 1) * 12 + STEP_SEMITONES[m[1]];
  if (m[2] === '#') midi += 1;
  if (m[2] === 'b') midi -= 1;
  return midi;
}

/* Expands one voice into [{m, s, d}], and checks every bar adds up. */
function parseVoice(src, barUnits, label) {
  const notes = [];
  let cursor = 0;
  const bars = src.split('|').map(b => b.trim()).filter(Boolean);

  bars.forEach((bar, barIndex) => {
    const before = cursor;
    bar.split(/\s+/).filter(Boolean).forEach(tok => {
      const [pitches, durTxt] = tok.split(':');
      const dur = parseInt(durTxt, 10);
      if (!dur || dur < 1) throw new Error(`bad duration in ${label}: ${tok}`);
      if (pitches !== 'r') {
        pitches.split('+').forEach(p => notes.push({ m: noteToMidi(p), s: cursor, d: dur }));
      }
      cursor += dur;
    });
    const filled = cursor - before;
    // the first bar may be a pick-up, every other bar must be complete
    if (barIndex > 0 && filled !== barUnits) {
      throw new Error(`${label} bar ${barIndex + 1} has ${filled} units, expected ${barUnits}`);
    }
  });
  return { notes, total: cursor };
}

/* Fingering is given as a parallel list, one number per melody note.
   A dash means "no suggestion", which keeps long lists readable.        */
function applyFingers(notes, spec) {
  if (!spec) return;
  const list = spec.split(/\s+/).filter(Boolean);
  const onsets = [...new Set(notes.map(n => n.s))].sort((a, b) => a - b);
  onsets.forEach((s, i) => {
    const f = list[i];
    if (!f || f === '-') return;
    notes.filter(n => n.s === s).forEach(n => { n.f = parseInt(f, 10); });
  });
}

/* Builds the runtime piece object the practice room already understands.
   lvl is the lowest difficulty level at which a note appears:
     1 = melody only, one hand
     2 = melody plus a simple bass note
     3 = both hands as arranged                                          */
function buildPiece(def) {
  const barUnits = def.barUnits;
  const rh = parseVoice(def.rh, barUnits, def.id + ' right hand');
  applyFingers(rh.notes, def.rhFingers);
  rh.notes.forEach(n => { n.h = 'r'; n.lvl = 1; });

  let lhNotes = [];
  if (def.lh) {
    const lh = parseVoice(def.lh, barUnits, def.id + ' left hand');
    applyFingers(lh.notes, def.lhFingers);
    lh.notes.forEach(n => { n.h = 'l'; n.lvl = 3; });
    lhNotes = lh.notes;
  }

  /* Level 2 is generated, not hand-written: the lowest left-hand note at the
     start of each bar, held for the bar. One simple anchor per bar is what a
     beginner can actually manage while reading the melody. */
  const level2 = [];
  if (lhNotes.length) {
    const bars = Math.ceil(rh.total / barUnits);
    for (let b = 0; b < bars; b++) {
      const from = b * barUnits;
      const inBar = lhNotes.filter(n => n.s >= from && n.s < from + barUnits);
      if (!inBar.length) continue;
      const first = Math.min(...inBar.filter(n => n.s === Math.min(...inBar.map(x => x.s))).map(n => n.m));
      level2.push({ m: first, s: from, d: barUnits, h: 'l', lvl: 2, f: 5 });
    }
  }

  const notes = rh.notes.concat(level2, lhNotes);
  const totalUnits = Math.max(...notes.map(n => n.s + n.d));

  return Object.assign({}, def, {
    notes,
    totalUnits,
    bars: Math.ceil((totalUnits - (def.pickup || 0)) / barUnits),
    levels: [
      { n: 1, name: 'One hand', hint: 'The melody on its own, right hand only.' },
      { n: 2, name: 'Melody and bass', hint: 'One steady left-hand note under each bar.' },
      { n: 3, name: 'Both hands', hint: 'The full arrangement, both hands as written.' }
    ]
  });
}

if (typeof module !== 'undefined') module.exports = { noteToMidi, parseVoice, buildPiece };
