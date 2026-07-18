/* Learn Piano Keys - score data
   Every piece here is in the public domain. Nothing sampled, nothing licensed.
   Timing unit = one sixteenth note. bpm = quarter-note beats per minute.
   h = hand ('r' | 'l'), f = suggested finger (1 thumb .. 5 little).            */

const PIECES = [
  {
    id: 'twinkle',
    title: 'Twinkle, Twinkle, Little Star',
    composer: 'Traditional',
    origin: 'French folk melody, published 1761',
    level: 1,
    levelName: 'First piece',
    meter: [4, 4],
    barUnits: 16,
    bpm: 88,
    keyName: 'C major',
    blurb: 'Five notes, one hand position, no black keys. If you have never played before, start here.',
    tip: 'Your right thumb sits on middle C. Slide the hand up one note to reach the A, then slide back.',
    notes: [
      // bar 1
      { m: 60, s: 0, d: 4, h: 'r', f: 1 }, { m: 60, s: 4, d: 4, h: 'r', f: 1 },
      { m: 67, s: 8, d: 4, h: 'r', f: 5 }, { m: 67, s: 12, d: 4, h: 'r', f: 5 },
      { m: 48, s: 0, d: 16, h: 'l', f: 5 },
      // bar 2
      { m: 69, s: 16, d: 4, h: 'r', f: 5 }, { m: 69, s: 20, d: 4, h: 'r', f: 5 },
      { m: 67, s: 24, d: 8, h: 'r', f: 5 },
      { m: 53, s: 16, d: 8, h: 'l', f: 2 }, { m: 48, s: 24, d: 8, h: 'l', f: 5 },
      // bar 3
      { m: 65, s: 32, d: 4, h: 'r', f: 4 }, { m: 65, s: 36, d: 4, h: 'r', f: 4 },
      { m: 64, s: 40, d: 4, h: 'r', f: 3 }, { m: 64, s: 44, d: 4, h: 'r', f: 3 },
      { m: 53, s: 32, d: 8, h: 'l', f: 2 }, { m: 48, s: 40, d: 8, h: 'l', f: 5 },
      // bar 4
      { m: 62, s: 48, d: 4, h: 'r', f: 2 }, { m: 62, s: 52, d: 4, h: 'r', f: 2 },
      { m: 60, s: 56, d: 8, h: 'r', f: 1 },
      { m: 55, s: 48, d: 8, h: 'l', f: 1 }, { m: 48, s: 56, d: 8, h: 'l', f: 5 },
      // bar 5
      { m: 67, s: 64, d: 4, h: 'r', f: 5 }, { m: 67, s: 68, d: 4, h: 'r', f: 5 },
      { m: 65, s: 72, d: 4, h: 'r', f: 4 }, { m: 65, s: 76, d: 4, h: 'r', f: 4 },
      { m: 48, s: 64, d: 16, h: 'l', f: 5 },
      // bar 6
      { m: 64, s: 80, d: 4, h: 'r', f: 3 }, { m: 64, s: 84, d: 4, h: 'r', f: 3 },
      { m: 62, s: 88, d: 8, h: 'r', f: 2 },
      { m: 55, s: 80, d: 16, h: 'l', f: 1 },
      // bar 7
      { m: 67, s: 96, d: 4, h: 'r', f: 5 }, { m: 67, s: 100, d: 4, h: 'r', f: 5 },
      { m: 65, s: 104, d: 4, h: 'r', f: 4 }, { m: 65, s: 108, d: 4, h: 'r', f: 4 },
      { m: 48, s: 96, d: 16, h: 'l', f: 5 },
      // bar 8
      { m: 64, s: 112, d: 4, h: 'r', f: 3 }, { m: 64, s: 116, d: 4, h: 'r', f: 3 },
      { m: 62, s: 120, d: 8, h: 'r', f: 2 },
      { m: 55, s: 112, d: 16, h: 'l', f: 1 },
      // bar 9
      { m: 60, s: 128, d: 4, h: 'r', f: 1 }, { m: 60, s: 132, d: 4, h: 'r', f: 1 },
      { m: 67, s: 136, d: 4, h: 'r', f: 5 }, { m: 67, s: 140, d: 4, h: 'r', f: 5 },
      { m: 48, s: 128, d: 16, h: 'l', f: 5 },
      // bar 10
      { m: 69, s: 144, d: 4, h: 'r', f: 5 }, { m: 69, s: 148, d: 4, h: 'r', f: 5 },
      { m: 67, s: 152, d: 8, h: 'r', f: 5 },
      { m: 53, s: 144, d: 8, h: 'l', f: 2 }, { m: 48, s: 152, d: 8, h: 'l', f: 5 },
      // bar 11
      { m: 65, s: 160, d: 4, h: 'r', f: 4 }, { m: 65, s: 164, d: 4, h: 'r', f: 4 },
      { m: 64, s: 168, d: 4, h: 'r', f: 3 }, { m: 64, s: 172, d: 4, h: 'r', f: 3 },
      { m: 53, s: 160, d: 8, h: 'l', f: 2 }, { m: 48, s: 168, d: 8, h: 'l', f: 5 },
      // bar 12
      { m: 62, s: 176, d: 4, h: 'r', f: 2 }, { m: 62, s: 180, d: 4, h: 'r', f: 2 },
      { m: 60, s: 184, d: 8, h: 'r', f: 1 },
      { m: 55, s: 176, d: 8, h: 'l', f: 1 }, { m: 48, s: 184, d: 8, h: 'l', f: 5 }
    ]
  },

  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    composer: 'Ludwig van Beethoven',
    origin: 'Theme from Symphony No. 9, 1824',
    level: 2,
    levelName: 'Beginner',
    meter: [4, 4],
    barUnits: 16,
    bpm: 96,
    keyName: 'C major',
    blurb: 'The whole melody fits under five fingers without moving your hand once. The best second piece there is.',
    tip: 'Right thumb on middle C and leave it there. Every note is a step away from the last one.',
    notes: [
      // bar 1  E E F G
      { m: 64, s: 0, d: 4, h: 'r', f: 3 }, { m: 64, s: 4, d: 4, h: 'r', f: 3 },
      { m: 65, s: 8, d: 4, h: 'r', f: 4 }, { m: 67, s: 12, d: 4, h: 'r', f: 5 },
      { m: 48, s: 0, d: 8, h: 'l', f: 5 }, { m: 48, s: 8, d: 8, h: 'l', f: 5 },
      // bar 2  G F E D
      { m: 67, s: 16, d: 4, h: 'r', f: 5 }, { m: 65, s: 20, d: 4, h: 'r', f: 4 },
      { m: 64, s: 24, d: 4, h: 'r', f: 3 }, { m: 62, s: 28, d: 4, h: 'r', f: 2 },
      { m: 48, s: 16, d: 8, h: 'l', f: 5 }, { m: 55, s: 24, d: 8, h: 'l', f: 1 },
      // bar 3  C C D E
      { m: 60, s: 32, d: 4, h: 'r', f: 1 }, { m: 60, s: 36, d: 4, h: 'r', f: 1 },
      { m: 62, s: 40, d: 4, h: 'r', f: 2 }, { m: 64, s: 44, d: 4, h: 'r', f: 3 },
      { m: 48, s: 32, d: 8, h: 'l', f: 5 }, { m: 55, s: 40, d: 8, h: 'l', f: 1 },
      // bar 4  E. D D(half)
      { m: 64, s: 48, d: 6, h: 'r', f: 3 }, { m: 62, s: 54, d: 2, h: 'r', f: 2 },
      { m: 62, s: 56, d: 8, h: 'r', f: 2 },
      { m: 48, s: 48, d: 8, h: 'l', f: 5 }, { m: 55, s: 56, d: 8, h: 'l', f: 1 },
      // bar 5  E E F G
      { m: 64, s: 64, d: 4, h: 'r', f: 3 }, { m: 64, s: 68, d: 4, h: 'r', f: 3 },
      { m: 65, s: 72, d: 4, h: 'r', f: 4 }, { m: 67, s: 76, d: 4, h: 'r', f: 5 },
      { m: 48, s: 64, d: 8, h: 'l', f: 5 }, { m: 48, s: 72, d: 8, h: 'l', f: 5 },
      // bar 6  G F E D
      { m: 67, s: 80, d: 4, h: 'r', f: 5 }, { m: 65, s: 84, d: 4, h: 'r', f: 4 },
      { m: 64, s: 88, d: 4, h: 'r', f: 3 }, { m: 62, s: 92, d: 4, h: 'r', f: 2 },
      { m: 48, s: 80, d: 8, h: 'l', f: 5 }, { m: 55, s: 88, d: 8, h: 'l', f: 1 },
      // bar 7  C C D E
      { m: 60, s: 96, d: 4, h: 'r', f: 1 }, { m: 60, s: 100, d: 4, h: 'r', f: 1 },
      { m: 62, s: 104, d: 4, h: 'r', f: 2 }, { m: 64, s: 108, d: 4, h: 'r', f: 3 },
      { m: 48, s: 96, d: 8, h: 'l', f: 5 }, { m: 55, s: 104, d: 8, h: 'l', f: 1 },
      // bar 8  D. C C(half)
      { m: 62, s: 112, d: 6, h: 'r', f: 2 }, { m: 60, s: 118, d: 2, h: 'r', f: 1 },
      { m: 60, s: 120, d: 8, h: 'r', f: 1 },
      { m: 55, s: 112, d: 8, h: 'l', f: 1 }, { m: 48, s: 120, d: 8, h: 'l', f: 5 }
    ]
  },

  {
    id: 'fur-elise',
    title: 'Für Elise',
    composer: 'Ludwig van Beethoven',
    origin: 'Bagatelle in A minor, WoO 59, composed 1810',
    level: 3,
    levelName: 'Returning player',
    meter: [3, 8],
    barUnits: 6,
    bpm: 100,
    keyName: 'A minor',
    pickup: 2,
    blurb: 'The complete opening section, both hands, with the fingering most teachers actually use.',
    tip: 'The opening E and D sharp alternate with fingers 5 and 4. Keep the wrist loose and let the hand rock rather than the fingers poke.',
    notes: [
      // pickup
      { m: 76, s: 0, d: 1, h: 'r', f: 5 }, { m: 75, s: 1, d: 1, h: 'r', f: 4 },
      // bar 1
      { m: 76, s: 2, d: 1, h: 'r', f: 5 }, { m: 75, s: 3, d: 1, h: 'r', f: 4 },
      { m: 76, s: 4, d: 1, h: 'r', f: 5 }, { m: 71, s: 5, d: 1, h: 'r', f: 1 },
      { m: 74, s: 6, d: 1, h: 'r', f: 3 }, { m: 72, s: 7, d: 1, h: 'r', f: 2 },
      // bar 2
      { m: 69, s: 8, d: 6, h: 'r', f: 1 },
      { m: 45, s: 8, d: 2, h: 'l', f: 5 }, { m: 52, s: 10, d: 2, h: 'l', f: 2 },
      { m: 57, s: 12, d: 2, h: 'l', f: 1 },
      // bar 3
      { m: 60, s: 14, d: 2, h: 'r', f: 1 }, { m: 64, s: 16, d: 2, h: 'r', f: 2 },
      { m: 69, s: 18, d: 2, h: 'r', f: 5 },
      // bar 4
      { m: 71, s: 20, d: 6, h: 'r', f: 5 },
      { m: 40, s: 20, d: 2, h: 'l', f: 5 }, { m: 52, s: 22, d: 2, h: 'l', f: 2 },
      { m: 56, s: 24, d: 2, h: 'l', f: 1 },
      // bar 5
      { m: 64, s: 26, d: 2, h: 'r', f: 1 }, { m: 68, s: 28, d: 2, h: 'r', f: 2 },
      { m: 71, s: 30, d: 2, h: 'r', f: 4 },
      // bar 6
      { m: 72, s: 32, d: 6, h: 'r', f: 5 },
      { m: 45, s: 32, d: 2, h: 'l', f: 5 }, { m: 52, s: 34, d: 2, h: 'l', f: 2 },
      { m: 57, s: 36, d: 2, h: 'l', f: 1 },
      // bar 7
      { m: 64, s: 38, d: 2, h: 'r', f: 1 }, { m: 76, s: 40, d: 1, h: 'r', f: 5 },
      { m: 75, s: 41, d: 1, h: 'r', f: 4 }, { m: 76, s: 42, d: 1, h: 'r', f: 5 },
      { m: 75, s: 43, d: 1, h: 'r', f: 4 },
      // bar 8
      { m: 76, s: 44, d: 1, h: 'r', f: 5 }, { m: 75, s: 45, d: 1, h: 'r', f: 4 },
      { m: 76, s: 46, d: 1, h: 'r', f: 5 }, { m: 71, s: 47, d: 1, h: 'r', f: 1 },
      { m: 74, s: 48, d: 1, h: 'r', f: 3 }, { m: 72, s: 49, d: 1, h: 'r', f: 2 },
      // bar 9
      { m: 69, s: 50, d: 6, h: 'r', f: 1 },
      { m: 45, s: 50, d: 2, h: 'l', f: 5 }, { m: 52, s: 52, d: 2, h: 'l', f: 2 },
      { m: 57, s: 54, d: 2, h: 'l', f: 1 },
      // bar 10
      { m: 60, s: 56, d: 2, h: 'r', f: 1 }, { m: 64, s: 58, d: 2, h: 'r', f: 2 },
      { m: 69, s: 60, d: 2, h: 'r', f: 5 },
      // bar 11
      { m: 71, s: 62, d: 6, h: 'r', f: 5 },
      { m: 40, s: 62, d: 2, h: 'l', f: 5 }, { m: 52, s: 64, d: 2, h: 'l', f: 2 },
      { m: 56, s: 66, d: 2, h: 'l', f: 1 },
      // bar 12
      { m: 64, s: 68, d: 2, h: 'r', f: 1 }, { m: 72, s: 70, d: 2, h: 'r', f: 4 },
      { m: 71, s: 72, d: 2, h: 'r', f: 3 },
      // bar 13
      { m: 69, s: 74, d: 6, h: 'r', f: 1 },
      { m: 45, s: 74, d: 2, h: 'l', f: 5 }, { m: 52, s: 76, d: 2, h: 'l', f: 2 },
      { m: 57, s: 78, d: 2, h: 'l', f: 1 }
    ]
  }
];

PIECES.forEach(p => {
  p.totalUnits = Math.max(...p.notes.map(n => n.s + n.d));
  p.bars = Math.ceil(p.totalUnits / p.barUnits);
});
