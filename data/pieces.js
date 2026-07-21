/* Learn Piano Keys - the repertoire.

   Every melody here is out of copyright: the composer died before 1900, or the
   tune is traditional with no known author. The arrangement, the fingering and
   the notation are our own original work.

   Written in the compact notation from data/notation.js so bar totals are
   validated on load. A mistake fails the build rather than shipping.        */

const PIECE_DEFS = [
  {
    id: 'twinkle-twinkle-little-star',
    title: 'Twinkle, Twinkle, Little Star',
    composer: 'Traditional',
    composerDied: null,
    origin: 'French folk melody, published 1761',
    pd: 'Traditional melody with no known composer, first printed in France in 1761.',
    level: 1,
    levelName: 'First piece',
    meter: [4, 4], barUnits: 16, bpm: 88, keyName: 'C major',
    blurb: 'Five notes, one hand position, no black keys. If you have never played before, start here.',
    tip: 'Your right thumb sits on middle C. Slide the hand up one note to reach the A, then slide back.',
    mistakes: [
      'Reaching for the A with the wrong finger. Slide the whole hand up rather than stretching.',
      'Rushing the two-beat notes at the end of each line. Count them out loud.',
      'Pressing hard. The sound comes from the weight of the hand, not from force.'
    ],
    rh: 'C4:4 C4:4 G4:4 G4:4 | A4:4 A4:4 G4:8 | F4:4 F4:4 E4:4 E4:4 | D4:4 D4:4 C4:8 | ' +
        'G4:4 G4:4 F4:4 F4:4 | E4:4 E4:4 D4:8 | G4:4 G4:4 F4:4 F4:4 | E4:4 E4:4 D4:8 | ' +
        'C4:4 C4:4 G4:4 G4:4 | A4:4 A4:4 G4:8 | F4:4 F4:4 E4:4 E4:4 | D4:4 D4:4 C4:8',
    rhFingers: '1 1 5 5 5 5 5 4 4 3 3 2 2 1 5 5 4 4 3 3 2 5 5 4 4 3 3 2 1 1 5 5 5 5 5 4 4 3 3 2 2 1',
    lh: 'C3:16 | F3:8 C3:8 | F3:8 C3:8 | G3:8 C3:8 | C3:16 | G3:16 | C3:16 | G3:16 | ' +
        'C3:16 | F3:8 C3:8 | F3:8 C3:8 | G3:8 C3:8'
  },

  {
    id: 'mary-had-a-little-lamb',
    title: 'Mary Had a Little Lamb',
    composer: 'Lowell Mason',
    composerDied: 1872,
    origin: 'Words by Sarah Josepha Hale, 1830; music by Lowell Mason, 1830',
    pd: 'Words by Sarah Josepha Hale, who died in 1879. Music by Lowell Mason, who died in 1872. Out of UK copyright since 1950.',
    level: 1,
    levelName: 'First piece',
    meter: [4, 4], barUnits: 16, bpm: 96, keyName: 'C major',
    blurb: 'Three notes to begin with, and the whole tune sits under one hand position.',
    tip: 'Fingers 3, 2 and 1 do almost all of the work. Keep them curved and let the hand stay still.',
    mistakes: [
      'Moving the whole hand for each note. Only the fingers should move.',
      'Playing the repeated E notes unevenly. Aim for three identical sounds.',
      'Forgetting the last note is four beats long.'
    ],
    rh: 'E4:4 D4:4 C4:4 D4:4 | E4:4 E4:4 E4:8 | D4:4 D4:4 D4:8 | E4:4 G4:4 G4:8 | ' +
        'E4:4 D4:4 C4:4 D4:4 | E4:4 E4:4 E4:4 E4:4 | D4:4 D4:4 E4:4 D4:4 | C4:16',
    rhFingers: '3 2 1 2 3 3 3 2 2 2 3 5 5 3 2 1 2 3 3 3 3 2 2 3 2 1',
    lh: 'C3:16 | C3:16 | G3:16 | C3:16 | C3:16 | C3:16 | G3:16 | C3:16'
  },

  {
    id: 'frere-jacques',
    title: 'Fr\u00e8re Jacques',
    composer: 'Traditional',
    composerDied: null,
    origin: 'French traditional, earliest known manuscript around 1780',
    pd: 'French traditional melody. The earliest known manuscript dates to about 1780 and every proposed author died before 1800.',
    level: 1,
    levelName: 'First piece',
    meter: [4, 4], barUnits: 16, bpm: 100, keyName: 'C major',
    blurb: 'Four short phrases, each played twice. The easiest tune on the site to memorise.',
    tip: 'Every phrase repeats immediately, so you only ever learn four short ideas.',
    mistakes: [
      'Speeding up on the repeat. Each phrase should sound identical both times.',
      'Losing evenness in the run of four quicker notes in bar five.',
      'Letting the last note stop short. Hold it for its full two beats.'
    ],
    rh: 'C4:4 D4:4 E4:4 C4:4 | C4:4 D4:4 E4:4 C4:4 | E4:4 F4:4 G4:8 | E4:4 F4:4 G4:8 | ' +
        'G4:2 A4:2 G4:2 F4:2 E4:4 C4:4 | G4:2 A4:2 G4:2 F4:2 E4:4 C4:4 | ' +
        'C4:4 G3:4 C4:8 | C4:4 G3:4 C4:8',
    rhFingers: '1 2 3 1 1 2 3 1 3 4 5 3 4 5 5 - 5 4 3 1 5 - 5 4 3 1 1 - 1 1 - 1',
    lh: 'C3:16 | C3:16 | C3:16 | C3:16 | C3:8 G3:8 | C3:8 G3:8 | C3:8 G3:8 | C3:16'
  },

  {
    id: 'london-bridge-is-falling-down',
    title: 'London Bridge Is Falling Down',
    composer: 'Traditional',
    composerDied: null,
    origin: 'English traditional, published 1744',
    pd: 'English traditional rhyme with no known author, first published in 1744.',
    level: 1,
    levelName: 'First piece',
    meter: [4, 4], barUnits: 16, bpm: 104, keyName: 'C major',
    blurb: 'A stepwise tune that never jumps more than one note, so the hand barely moves.',
    tip: 'Almost every note is next door to the one before it. Let your fingers walk rather than jump.',
    mistakes: [
      'Cutting the two-beat notes short at the end of each line.',
      'Playing the D in bar three with the wrong finger and running out of hand.',
      'Rushing. It is a walking pace, not a march.'
    ],
    rh: 'G4:4 A4:4 G4:4 F4:4 | E4:4 F4:4 G4:8 | D4:4 E4:4 F4:8 | E4:4 F4:4 G4:8 | ' +
        'G4:4 A4:4 G4:4 F4:4 | E4:4 F4:4 G4:8 | D4:4 G4:4 E4:8 | C4:16',
    rhFingers: '5 5 5 4 3 4 5 2 3 4 3 4 5 5 5 5 4 3 4 5 2 5 3 1',
    lh: 'C3:16 | C3:8 G3:8 | G3:16 | C3:8 G3:8 | C3:16 | C3:8 G3:8 | G3:16 | C3:16'
  },

  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    composer: 'Ludwig van Beethoven',
    composerDied: 1827,
    origin: 'Theme from Symphony No. 9, 1824',
    pd: 'Composed by Ludwig van Beethoven, who died in 1827. Out of UK copyright since 1898.',
    level: 2,
    levelName: 'Beginner',
    meter: [4, 4], barUnits: 16, bpm: 96, keyName: 'C major',
    blurb: 'The whole melody fits under five fingers without moving your hand once.',
    tip: 'Right thumb on middle C and leave it there. Every note is a step away from the last one.',
    mistakes: [
      'Moving the hand. The entire tune sits under one five-finger position.',
      'Getting the dotted rhythm in bars four and eight wrong. It is long, then short.',
      'Playing it too fast. It is a hymn, not a race.'
    ],
    rh: 'E4:4 E4:4 F4:4 G4:4 | G4:4 F4:4 E4:4 D4:4 | C4:4 C4:4 D4:4 E4:4 | E4:6 D4:2 D4:8 | ' +
        'E4:4 E4:4 F4:4 G4:4 | G4:4 F4:4 E4:4 D4:4 | C4:4 C4:4 D4:4 E4:4 | D4:6 C4:2 C4:8',
    rhFingers: '3 3 4 5 5 4 3 2 1 1 2 3 3 2 2 3 3 4 5 5 4 3 2 1 1 2 3 2 1 1',
    lh: 'C3:8 C3:8 | C3:8 G3:8 | C3:8 G3:8 | C3:8 G3:8 | C3:8 C3:8 | C3:8 G3:8 | C3:8 G3:8 | G3:8 C3:8'
  },

  {
    id: 'jingle-bells',
    title: 'Jingle Bells',
    composer: 'James Lord Pierpont',
    composerDied: 1893,
    origin: 'Published 1857',
    pd: 'Written by James Lord Pierpont, who died in 1893, and first published in 1857. Out of UK copyright since 1964.',
    level: 2,
    levelName: 'Beginner',
    meter: [4, 4], barUnits: 16, bpm: 112, keyName: 'C major',
    blurb: 'The chorus everyone knows, and the first three bars use one note.',
    tip: 'The opening is three E naturals repeated. Get them even before you go any further.',
    mistakes: [
      'Uneven repeated notes at the start. They should sound like one steady pulse.',
      'Missing the drop to C in bar three, which is the biggest jump in the tune.',
      'Rushing the run of quicker notes in bar six.'
    ],
    rh: 'E4:4 E4:4 E4:8 | E4:4 E4:4 E4:8 | E4:4 G4:4 C4:4 D4:4 | E4:16 | ' +
        'F4:4 F4:4 F4:4 F4:4 | F4:4 E4:4 E4:4 E4:2 E4:2 | E4:4 D4:4 D4:4 E4:4 | D4:8 G4:8',
    rhFingers: '3 3 3 3 3 3 3 5 1 2 3 4 4 4 4 4 3 3 3 3 3 2 2 3 2 5',
    lh: 'C3:16 | C3:16 | C3:8 G3:8 | C3:16 | F3:16 | F3:8 C3:8 | G3:16 | G3:8 C3:8'
  },

  {
    id: 'silent-night',
    title: 'Silent Night',
    composer: 'Franz Xaver Gruber',
    composerDied: 1863,
    origin: 'Composed 1818, words by Joseph Mohr',
    pd: 'Music by Franz Xaver Gruber, who died in 1863, and words by Joseph Mohr, who died in 1848. Composed in 1818 and out of UK copyright since 1934.',
    level: 2,
    levelName: 'Beginner',
    meter: [3, 4], barUnits: 12, bpm: 76, keyName: 'C major',
    blurb: 'Your first piece in three time, and a gentle introduction to a swaying rhythm.',
    tip: 'Count one two three, one two three throughout. The long notes fall on the first beat of the bar.',
    mistakes: [
      'Counting in four out of habit. This one has three beats to the bar.',
      'Clipping the dotted rhythm in bars one and three. It is long, then very short.',
      'Playing it loudly. It should be quiet enough to sing over.'
    ],
    rh: 'G4:6 A4:2 G4:4 | E4:12 | G4:6 A4:2 G4:4 | E4:12 | ' +
        'D5:8 D5:4 | B4:12 | C5:8 C5:4 | G4:12',
    rhFingers: '1 2 1 - 1 2 1 - 5 5 - 4 4 - 1',
    lh: 'C3:12 | C3:12 | C3:12 | C3:12 | G3:12 | G3:12 | C3:12 | C3:12'
  },

  {
    id: 'fur-elise',
    title: 'F\u00fcr Elise',
    composer: 'Ludwig van Beethoven',
    composerDied: 1827,
    origin: 'Bagatelle in A minor, WoO 59, composed 1810',
    pd: 'Composed by Ludwig van Beethoven, who died in 1827. Out of UK copyright since 1898.',
    level: 3,
    levelName: 'Returning player',
    meter: [3, 8], barUnits: 6, bpm: 100, keyName: 'A minor',
    pickup: 2,
    blurb: 'The complete opening section, both hands, with the fingering most teachers actually use.',
    tip: 'The opening E and D sharp alternate with fingers 5 and 4. Keep the wrist loose and let the hand rock rather than the fingers poke.',
    mistakes: [
      'Poking at the opening notes with stiff fingers. Rock the hand instead.',
      'Losing the pulse when the left hand enters. Count the three quick beats in every bar.',
      'Speeding up as it gets familiar. The tempo should never change.'
    ],
    rh: 'E5:1 D#5:1 | E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 | A4:6 | C4:2 E4:2 A4:2 | B4:6 | ' +
        'E4:2 G#4:2 B4:2 | C5:6 | E4:2 E5:1 D#5:1 E5:1 D#5:1 | ' +
        'E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 | A4:6 | C4:2 E4:2 A4:2 | B4:6 | ' +
        'E4:2 C5:2 B4:2 | A4:6',
    rhFingers: '5 4 5 4 5 1 3 2 1 1 2 5 5 1 2 4 5 1 5 4 5 4 5 4 5 1 3 2 1 1 2 5 5 1 4 3 1',
    lh: 'r:2 | r:6 | A2:2 E3:2 A3:2 | r:6 | E2:2 E3:2 G#3:2 | r:6 | A2:2 E3:2 A3:2 | r:6 | ' +
        'r:6 | A2:2 E3:2 A3:2 | r:6 | E2:2 E3:2 G#3:2 | r:6 | A2:2 E3:2 A3:2'
  }
];

if (typeof module !== 'undefined') module.exports = PIECE_DEFS;
