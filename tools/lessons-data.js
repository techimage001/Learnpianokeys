/* The five-lesson beginner course. Every word of teaching copy, every
   exercise, and every quiz question lives here, so the generator builds
   the pages and the harness can verify the banks (20 questions per
   lesson, four options each, one correct, every one explained). */

const LESSONS = [

/* ---------------------------------------------------------- lesson 1 */
{
  n: 1,
  slug: 'piano-lesson-keyboard-layout',
  navTitle: 'The keyboard map',
  title: 'Piano Keyboard Layout: Find Any Note in Minutes',
  metaTitle: 'Piano Keyboard Layout Lesson: Practise Naming the Keys',
  desc: 'Lesson 1 of 5. Learn how the black key groups name every white key, then practise on a playable keyboard and take a ten question quiz.',
  ogAlt: 'Lesson 1: the piano keyboard layout, taught on a playable keyboard',
  eyebrow: 'Lesson 1 of 5',
  lede: 'The keyboard looks like a wall of identical white keys. It is not. One repeating pattern names every key on the instrument, and you can learn it in the next few minutes.',
  learn: ['Why the black keys sit in groups of two and three', 'How to find C, D and F anywhere on the keyboard without counting', 'The seven letter names and how they repeat', 'What an octave is, and why it makes the piano smaller than it looks'],
  recap: ['C is always just left of a group of two black keys', 'D sits between those two black keys, F just left of the group of three', 'White keys run C D E F G A B, then start again', 'One octave is twelve keys: seven white and five black'],
  pair: ['piano-keyboard-layout', 'Piano keyboard layout: 88 keys explained', 'the quick reference version of this lesson, with the numbers and the history'],
  links: [['/middle-c-on-piano.html', 'where middle C is'], ['/online-piano-keyboard.html', 'the full online piano keyboard'], ['/piano-keys-for-beginners.html', 'the five minute walkthrough']],
  sections: [
    { h: 'The black keys are the map', ps: [
      'Look at the black keys and ignore everything else for a moment. They are not spaced evenly. They come in a repeating pattern: a group of two, then a group of three, then two, then three, all the way up the keyboard.',
      'That grouping is the whole trick. White keys all look the same, but every white key sits in a particular spot next to the black key groups, and that spot gives it its name. Learn the pattern once and you can name any key on any piano in the world, because every piano uses the same layout.'
    ]},
    { h: 'Finding C', ps: [
      'C is the key just to the left of any group of two black keys. Not three. Two. Slide your eye to a two black key group, step one white key to the left, and you are on C.',
      'The keyboard repeats, so there are several Cs. Each one is the same note at a different height: the further right, the higher the sound. The C nearest the middle of a full keyboard is called middle C, and it is where most beginners start.'
    ]},
    { h: 'The seven letter names', ps: [
      'White keys use the first seven letters of the alphabet: C, D, E, F, G, A, B. After B the pattern starts again at C. Going right, the notes climb: C, D, E, F, G, A, B, C. Going left, they descend the same way in reverse.',
      'A few landmarks make this fast. D lives between the two black keys. F sits just to the left of the group of three black keys. Once you can spot C, D and F without counting, everything else is one or two steps from a landmark.'
    ]},
    { h: 'What an octave is', ps: [
      'The distance from one C to the next C is called an octave. It spans eight white keys, which is where the name comes from. Two notes an octave apart sound like the same note sung high and low, which is why they share a letter.',
      'Within one octave there are seven white keys and five black keys, twelve keys in all. The whole keyboard is just that twelve key block repeated. This is why the instrument is far smaller than it looks: master one octave and you have mastered the layout of all of them.'
    ]}
  ],
  exercise: {
    type: 'sequence',
    heading: 'Try it on the keyboard',
    note: 'Tap the keys below, use your computer keys, or plug in a MIDI keyboard. Press Hear the demo to watch it done first.',
    keybed: { low: 60, high: 84 },
    steps: [
      { prompt: 'Press every C on this keyboard. There are three, each just left of a group of two black keys.', targets: [60, 72, 84], all: true },
      { prompt: 'Press D. It lives between the two black keys.', targets: [62], all: false },
      { prompt: 'Press F. It sits just left of the group of three black keys.', targets: [65], all: false },
      { prompt: 'Press A. Start from F and step right two white keys: F, G, A.', targets: [69], all: false },
      { prompt: 'Now walk one octave: press C, then the next C up.', targets: [60, 72], all: true, ordered: true }
    ]
  },
  faq: [
    { q: 'Why do the black keys come in twos and threes?', a: 'The pattern exists so your eyes and hands can find their place. If all twelve keys in an octave looked identical, nobody could tell one C from the next. The alternating groups of two and three act as signposts that repeat identically across the whole keyboard.' },
    { q: 'How many keys does a full piano have?', a: 'A full size piano has 88 keys: 52 white and 36 black, a little over seven octaves. Smaller keyboards with 61 or 76 keys use exactly the same repeating layout, so everything in this lesson applies to them too.' },
    { q: 'Do I need to memorise every key name?', a: 'No. Learn the landmarks: C left of the two black keys, D between them, F left of the three. Every other key is one or two steps from a landmark, and with a little practice the naming becomes automatic rather than memorised.' },
    { q: 'Is middle C special?', a: 'Only in position. It sounds no different in character from any other C. It matters because it sits near the centre of the keyboard, between where your two hands naturally rest, so written music and lessons use it as the reference point.' }
  ],
  quiz: [
    { q: 'How are the black keys grouped along the keyboard?', options: ['In groups of two and three, alternating', 'In groups of four', 'Evenly, one between every white key', 'Randomly, it varies by piano'], a: 0, explain: 'The black keys alternate: a group of two, then a group of three, repeating identically along the whole keyboard. That repeating pattern is what lets you name every key.' },
    { q: 'Where is C?', options: ['Just left of a group of two black keys', 'Just right of a group of three black keys', 'Between the two black keys', 'It is a black key'], a: 0, explain: 'C always sits immediately to the left of a two black key group. Find the pair, step one white key left, and you are on C, anywhere on any piano.' },
    { q: 'Which white key lives between the two black keys?', options: ['D', 'C', 'E', 'G'], a: 0, explain: 'D is the white key nested between the pair of black keys. It is one of the easiest landmarks to spot.' },
    { q: 'Which letters name the white keys?', options: ['C D E F G A B', 'A B C D E F G H', 'Do re mi fa sol la ti do', 'C D E F G H I'], a: 0, explain: 'White keys use only the first seven letters of the alphabet, C through B, and then the pattern repeats. There is no H key in this naming system.' },
    { q: 'What happens to the sound as you play keys further to the right?', options: ['It gets higher', 'It gets lower', 'It gets louder', 'Nothing changes'], a: 0, explain: 'Moving right raises the pitch and moving left lowers it. Loudness comes from how firmly you press, not from where the key sits.' },
    { q: 'What is an octave?', options: ['The distance from one C to the next C', 'The distance from C to G', 'A group of three black keys', 'The loudest note on the piano'], a: 0, explain: 'An octave is the span from any note to the next note with the same name, eight white keys apart, like C up to the next C. The two notes sound like the same note high and low.' },
    { q: 'How many keys are inside one octave, black and white together?', options: ['Twelve', 'Eight', 'Seven', 'Ten'], a: 0, explain: 'One octave holds seven white keys and five black keys, twelve in total. The whole keyboard is that twelve key block repeated over and over.' },
    { q: 'Which key sits just left of the group of three black keys?', options: ['F', 'C', 'B', 'D'], a: 0, explain: 'F is the landmark for the three black key group, exactly as C is the landmark for the two. Spotting F quickly gives you G and A one and two steps to its right.' },
    { q: 'What comes after B when you keep going up the white keys?', options: ['C', 'A', 'H', 'D'], a: 0, explain: 'After B the seven letter cycle starts again at C. The naming loops: C D E F G A B, then C again, an octave higher.' },
    { q: 'Why do two notes an octave apart share the same letter name?', options: ['They sound like the same note, high and low', 'They are played with the same finger', 'They look the same on the page', 'It is a historical accident'], a: 0, explain: 'Notes an octave apart vibrate in a two to one relationship, so our ears hear them as the same note at different heights. Sharing a letter reflects how alike they sound.' },
    { q: 'What is special about middle C?', options: ['Its position near the centre of the keyboard', 'It sounds different from other Cs', 'It is the loudest C', 'It is the only white C'], a: 0, explain: 'Middle C is a reference point because of where it sits, near the middle of the keyboard between your two hands. Its sound character is the same as any other C.' },
    { q: 'How many white keys does one octave contain?', options: ['Seven', 'Five', 'Eight', 'Twelve'], a: 0, explain: 'Seven white keys, C D E F G A B, sit inside one octave, along with five black keys. The eighth white key is the C that begins the next octave.' },
    { q: 'You find a group of two black keys. The white key one step to their LEFT is:', options: ['C', 'D', 'E', 'F'], a: 0, explain: 'One white key left of the two black key group is always C. That single rule locates every C on the instrument.' },
    { q: 'You find a group of two black keys. The white key just to their RIGHT is:', options: ['E', 'F', 'C', 'B'], a: 0, explain: 'The two black key group has C on its left, D in the middle, and E on its right. F begins the three black key group that follows.' },
    { q: 'How do the layouts of different pianos compare?', options: ['Every piano uses the same repeating layout', 'Grand pianos reverse the pattern', 'Each brand arranges keys differently', 'Digital keyboards use a different pattern'], a: 0, explain: 'The layout is universal. Whether it is a grand piano, an upright or a phone screen, the two and three black key pattern and the letter names are identical.' },
    { q: 'Roughly how many keys does a full size piano have?', options: ['88', '61', '100', '52'], a: 0, explain: 'A full piano has 88 keys, 52 white and 36 black. Smaller keyboards simply cut octaves from the ends, keeping the same layout.' },
    { q: 'Which is the fastest way to name an unfamiliar white key?', options: ['Step from the nearest landmark like C, D or F', 'Count every key from the far left end', 'Press it and guess from the sound', 'Check the brand of the piano'], a: 0, explain: 'Counting from a nearby landmark takes one or two steps. Counting from the end of the keyboard works but is slow, and sound alone will not name a key for a beginner.' },
    { q: 'Going DOWN from E one white key at a time, which order is correct?', options: ['E, D, C', 'E, F, G', 'E, C, D', 'E, D, B'], a: 0, explain: 'Going down reverses the alphabet: E to D to C. Going up from E would give F then G.' },
    { q: 'Where would you look to find another, higher C after finding one?', options: ['Left of the next group of two black keys to the right', 'Left of the next group of three black keys', 'Eight black keys to the right', 'There is only one C'], a: 0, explain: 'Every C uses the same landmark, so the next one up is beside the next two black key group to the right. The keyboard has several Cs, one per octave.' },
    { q: 'The distance from D up to the next D is:', options: ['An octave', 'Half an octave', 'Two octaves', 'It depends on the piano'], a: 0, explain: 'An octave is from any note to the next note of the same name, not just C to C. D up to the next D spans eight white keys, exactly like C to C.' }
  ]
},

/* ---------------------------------------------------------- lesson 2 */
{
  n: 2,
  slug: 'piano-lesson-finger-numbers',
  navTitle: 'Fingers and hand position',
  title: 'Piano Finger Numbers and Hand Position',
  metaTitle: 'Piano Finger Numbers Lesson: Practise C Position',
  desc: 'Lesson 2 of 5. Learn the finger numbers and C position, practise both hands on a playable keyboard, then take a ten question quiz.',
  ogAlt: 'Lesson 2: piano finger numbers and hand position, taught on a playable keyboard',
  eyebrow: 'Lesson 2 of 5',
  lede: 'Pianists do not think in finger names. They think in numbers, one to five on each hand, and those numbers appear all through written music. Ten minutes here saves months of tangled hands later.',
  learn: ['How pianists number their fingers, one to five on each hand', 'Why the two hands mirror each other', 'What C position is, and how to set both hands in it', 'How to sit, shape your hands, and stay free of tension'],
  recap: ['Thumb is 1 and little finger is 5, on both hands', 'Right hand C position: thumb on middle C, fingers on D E F G', 'Left hand C position: little finger on the lower C, thumb on G', 'Curved fingers, level wrists, loose hands. Pain always means stop and check'],
  pair: ['piano-finger-numbers', 'Piano finger numbers: a beginner guide', 'the short reference for the numbers themselves'],
  links: [['/piano-keyboard-layout.html', 'the keyboard layout'], ['/app.html', 'the practice room, where the falling blocks carry the same numbers'], ['/piano-keys-for-beginners.html', 'the five minute walkthrough']],
  sections: [
    { h: 'The numbering', ps: [
      'Each hand numbers its fingers one to five, starting at the thumb. Thumb is 1, index is 2, middle is 3, ring is 4, and the little finger is 5. Both hands use the same numbers, so the two thumbs are both 1 and the two little fingers are both 5.',
      'This trips people up for exactly one reason: on the right hand the numbers run left to right, and on the left hand they run right to left, because the thumbs face each other. Hold both hands above the keys and the two 1s meet in the middle.'
    ]},
    { h: 'Why the numbers matter', ps: [
      'Written piano music prints small numbers above or below notes. Those are finger numbers, and they are advice from someone who has already played the piece: use this finger here and your hand will be in the right place for what comes next.',
      'Ignoring them works for three notes and then punishes you. A melody played with whichever finger happens to be free runs out of fingers mid phrase. The numbers exist to stop that, and on this site the falling blocks carry the same numbers.'
    ]},
    { h: 'C position', ps: [
      'C position is the classic beginner home. Right hand: thumb on middle C, and the other four fingers resting on D, E, F and G, one key each. Left hand: little finger on the C below middle C, with the other fingers on D, E, F and G.',
      'In this position each finger owns one key, so five notes are playable without moving your hand at all. Most first tunes, including the ones in the practice room, sit inside it. When a piece needs more than five notes, the hand shifts or a finger crosses, but that is a later lesson.'
    ]},
    { h: 'Sitting and hand shape', ps: [
      'Sit tall at the middle of the keyboard, far enough back that your elbows hang slightly in front of your body. Forearms level with the floor, wrists level with the hands, neither drooping nor arched.',
      'Now the shape: curve your fingers gently, as if a small bubble sat under your palm that must not pop. Play on the fingertip pads, not flat fingers. And keep everything loose. Tension is the real enemy at the piano, and no exercise is worth practising with clenched hands.'
    ]}
  ],
  exercise: {
    type: 'sequence',
    heading: 'Try it on the keyboard',
    note: 'The number chip on each glowing key tells you which finger to use. The app cannot see your fingers, so you are on your honour. Press Hear the demo to watch first.',
    keybed: { low: 48, high: 72 },
    steps: [
      { prompt: 'Right hand in C position: play C with finger 1, your thumb.', targets: [60], all: false, fingers: { 60: 1 }, hand: 'r' },
      { prompt: 'Walk up: D with 2, E with 3, F with 4, G with 5, one at a time.', targets: [62, 64, 65, 67], all: true, ordered: true, fingers: { 62: 2, 64: 3, 65: 4, 67: 5 }, hand: 'r' },
      { prompt: 'And back down: G, F, E, D, C with fingers 5, 4, 3, 2, 1.', targets: [67, 65, 64, 62, 60], all: true, ordered: true, fingers: { 67: 5, 65: 4, 64: 3, 62: 2, 60: 1 }, hand: 'r' },
      { prompt: 'Left hand now: play the lower C with finger 5, your little finger.', targets: [48], all: false, fingers: { 48: 5 }, hand: 'l' },
      { prompt: 'Left hand walks up: D with 4, E with 3, F with 2, G with 1.', targets: [50, 52, 53, 55], all: true, ordered: true, fingers: { 50: 4, 52: 3, 53: 2, 55: 1 }, hand: 'l' }
    ]
  },
  faq: [
    { q: 'Is the thumb really a finger in piano counting?', a: 'Yes. Piano numbering counts five fingers per hand with the thumb as number 1. This differs from string instruments, where the index finger is 1 and the thumb is not numbered, which is why guitarists often stumble on piano fingering at first.' },
    { q: 'Do I have to follow printed finger numbers exactly?', a: 'As a beginner, yes, treat them as instructions. They place your hand so the next notes fall under your fingers. Advanced players sometimes adapt fingerings to their own hands, but that judgement comes from experience with the standard ones.' },
    { q: 'What if my hands are small?', a: 'C position asks each hand to cover only five neighbouring white keys, which nearly all hands manage comfortably, including children. Wider stretches come much later, and there are established fingering solutions for smaller hands when they do.' },
    { q: 'Should my fingers hurt after practising?', a: 'No. Mild tiredness in the hand is normal for a beginner; pain is not. Pain usually means tension, flat fingers, or a collapsed wrist. Stop, shake your hands loose, check your posture and hand shape, and shorten the session rather than pushing through.' }
  ],
  quiz: [
    { q: 'Which finger is number 1?', options: ['The thumb', 'The index finger', 'The little finger', 'The middle finger'], a: 0, explain: 'Piano numbering starts at the thumb on both hands: thumb 1, index 2, middle 3, ring 4, little finger 5.' },
    { q: 'Which finger is number 5?', options: ['The little finger', 'The thumb', 'The ring finger', 'The index finger'], a: 0, explain: 'Number 5 is the little finger on both hands, the outermost finger, just as 1 is always the thumb.' },
    { q: 'How do the two hands compare in their numbering?', options: ['Both use 1 to 5 starting at the thumb', 'The left hand starts at the little finger', 'The left hand uses 6 to 10', 'Only the right hand is numbered'], a: 0, explain: 'Both hands number identically from the thumb. Because the thumbs face each other, the numbers mirror: rightward on the right hand, leftward on the left.' },
    { q: 'In right hand C position, where does the thumb sit?', options: ['On middle C', 'On G', 'On the C below middle C', 'On E'], a: 0, explain: 'Right hand C position puts the thumb, finger 1, on middle C, with fingers 2 to 5 resting on D, E, F and G.' },
    { q: 'In left hand C position, which finger takes the C?', options: ['Finger 5, the little finger', 'Finger 1, the thumb', 'Finger 3, the middle finger', 'Finger 2, the index finger'], a: 0, explain: 'The left hand mirrors the right: its little finger, 5, takes the lower C, and the thumb, 1, ends up on G.' },
    { q: 'What do the small numbers printed above notes in piano music mean?', options: ['Which finger to use', 'How loudly to play', 'How many times to repeat', 'Which octave to play in'], a: 0, explain: 'Printed numbers are fingering: advice on which finger plays that note so your hand is placed well for what follows. Loudness is marked with words and symbols, not numbers.' },
    { q: 'Why is planned fingering better than using whichever finger is free?', options: ['It keeps fingers available for the notes that follow', 'It looks more professional', 'It makes the notes sound louder', 'Pianos only respond to certain fingers'], a: 0, explain: 'Fingering is planning. A melody played with random fingers runs out of hand mid phrase; following the plan means the next note always has a finger ready.' },
    { q: 'How many keys does each finger cover in C position?', options: ['One each', 'Two each', 'It varies constantly', 'Only the thumb plays'], a: 0, explain: 'In C position five fingers rest on five neighbouring white keys, one each, so five notes are playable with no hand movement at all.' },
    { q: 'Which notes does the right hand cover in C position?', options: ['C D E F G', 'C E G B D', 'A B C D E', 'C D E F G A B'], a: 0, explain: 'Right hand C position covers the five white keys from middle C: C, D, E, F, G, under fingers 1 to 5 in order.' },
    { q: 'What is the ideal wrist position at the piano?', options: ['Level with the hand and forearm', 'Dropped well below the keys', 'Arched high above the keys', 'Resting on the wood in front of the keys'], a: 0, explain: 'Wrists stay level, in line with hand and forearm. A dropped or propped wrist adds tension and slows the fingers.' },
    { q: 'What hand shape should you aim for?', options: ['Gently curved fingers, playing on the fingertip pads', 'Completely flat fingers', 'A tight fist opened only when playing', 'Straight, locked fingers'], a: 0, explain: 'Fingers curve gently, as if holding a small bubble under the palm, and press with the fingertip pads. Flat or locked fingers are slower and tire quickly.' },
    { q: 'Both thumbs are held above the keys. What is true of their numbers?', options: ['Both are number 1', 'One is 1 and the other is 5', 'The right thumb is 1, the left is 2', 'Thumbs are not numbered'], a: 0, explain: 'Each hand numbers from its own thumb, so both thumbs are 1. The mirror effect only changes the direction the numbers run.' },
    { q: 'On the RIGHT hand, moving from thumb toward the little finger, the numbers run:', options: ['1, 2, 3, 4, 5', '5, 4, 3, 2, 1', '1, 3, 5, 2, 4', '2, 3, 4, 5, 1'], a: 0, explain: 'From thumb outward the count always rises: 1, 2, 3, 4, 5. On the right hand that direction happens to be left to right across the keys.' },
    { q: 'Right hand in C position: which finger plays E?', options: ['3', '1', '5', '2'], a: 0, explain: 'From the thumb on C, fingers land in order: C 1, D 2, E 3, F 4, G 5. E belongs to the middle finger.' },
    { q: 'Left hand in C position: which finger plays G?', options: ['1, the thumb', '5, the little finger', '3, the middle finger', '4, the ring finger'], a: 0, explain: 'The left hand runs 5 on C, 4 on D, 3 on E, 2 on F and 1 on G, so the thumb takes G. It mirrors the right hand exactly.' },
    { q: 'Piano fingering differs from guitar fingering because on the piano:', options: ['The thumb is counted as finger 1', 'Only four fingers are used', 'Numbering starts at the little finger', 'The numbers go up to ten on one hand'], a: 0, explain: 'Guitarists number from the index finger and leave the thumb out. Pianists count the thumb as 1, which is why players switching instruments often misread fingerings at first.' },
    { q: 'What does pain while practising usually signal?', options: ['Tension or poor hand position that needs fixing', 'Good progress', 'That the piano needs adjusting', 'That you should press harder'], a: 0, explain: 'Practice can tire the hands slightly, but pain means something is wrong, usually tension, flat fingers or a collapsed wrist. The fix is posture and looseness, never pushing through.' },
    { q: 'How far from the keyboard should you sit?', options: ['Far enough that elbows hang slightly in front of the body', 'As close as possible, stomach touching the piano', 'An arm\u2019s length away', 'Distance makes no difference'], a: 0, explain: 'Sitting slightly back lets the elbows hang a little in front of the body with level forearms. Cramming close locks the arms; sitting too far strains the shoulders.' },
    { q: 'A beginner should treat printed finger numbers as:', options: ['Instructions to follow', 'Optional decoration', 'Loudness markings', 'Counting aids for rhythm'], a: 0, explain: 'For a beginner the printed fingering is the plan to follow. It exists because someone worked out how the hand best travels through the piece.' },
    { q: 'How many notes can one hand play from C position without moving?', options: ['Five', 'Three', 'Eight', 'Twelve'], a: 0, explain: 'Five fingers on five keys means five notes, C to G, with zero hand movement. Needing a sixth note is what makes a hand shift or a finger cross necessary, and that is a later skill.' }
  ]
},

/* ---------------------------------------------------------- lesson 3 */
{
  n: 3,
  slug: 'piano-lesson-steps-and-skips',
  navTitle: 'Steps, skips and your first melody',
  title: 'Steps and Skips on the Piano: Play Your First Melody',
  metaTitle: 'Steps and Skips Piano Lesson: Play Your First Melody',
  desc: 'Lesson 3 of 5. Melodies move by steps, skips and repeats. Practise all three on a playable keyboard, play a real tune, then take a quiz.',
  ogAlt: 'Lesson 3: steps, skips and a first melody, taught on a playable keyboard',
  eyebrow: 'Lesson 3 of 5',
  lede: 'Every melody ever written moves in only three ways: to the next door note, over a note, or nowhere at all. Learn to see those three moves and tunes stop being random strings of notes.',
  learn: ['What a step, a skip and a repeat are', 'How the three moves feel under your fingers in C position', 'How to read a melody as a chain of moves instead of separate notes', 'How to play the opening phrase of a real song'],
  recap: ['A step moves to the next door key, up or down', 'A skip jumps over exactly one key. Anything wider is a leap', 'A repeat plays the same key again, usually with the same finger', 'Mary Had a Little Lamb opens E D C D E E E: four steps and a repeat'],
  pair: ['middle-c-on-piano', 'Where is middle C on piano', 'the landmark every melody in this lesson starts from'],
  links: [['/mary-had-a-little-lamb-piano-notes.html', 'the full Mary Had a Little Lamb notes'], ['/twinkle-twinkle-little-star-piano-notes.html', 'Twinkle Twinkle Little Star'], ['/songs.html', 'all the beginner songs']],
  sections: [
    { h: 'Steps: next door notes', ps: [
      'A step is a move to the very next white key, up or down. C to D is a step up. E to D is a step down. Nothing is jumped over.',
      'Steps are the smoothest sound in music, and most melodies are built mainly from them. Under the fingers a step means the neighbouring finger plays next, which is why C position works so well: the fingers already sit one per key, ready to step.'
    ]},
    { h: 'Skips: jumping over one', ps: [
      'A skip jumps over exactly one white key. C to E is a skip up, because D is passed over. G to E is a skip down.',
      'Under the fingers a skip means skipping a finger too: thumb to middle finger, or finger 2 to finger 4. Skips sound bouncier and more open than steps. Larger jumps than a skip are called leaps, and they are rarer, exactly because they are harder to sing and to play.'
    ]},
    { h: 'Repeats: staying put', ps: [
      'The third move is no move at all: the same note played again. Repeats give a melody its rhythm engine, a chance for the words or the beat to carry on while the pitch rests.',
      'You already know a famous example. The opening of Mary Had a Little Lamb ends its first phrase with the same note played three times in a row. Repeated notes are usually played by the same finger, staying home on its key.'
    ]},
    { h: 'Reading a melody as moves', ps: [
      'Here is the shift that makes tunes learnable. Instead of reading E, D, C, D, E, E, E as seven separate facts, read it as moves: start on E, step down twice, step back up twice, then repeat the note twice more.',
      'Six moves, one starting note. Your hand only ever needs to answer one question: step, skip, or stay? That question is what the exercise below trains, and it ends with you playing that exact phrase, the real opening of Mary Had a Little Lamb.'
    ]}
  ],
  exercise: {
    type: 'sequence',
    heading: 'Try it on the keyboard',
    note: 'Right hand in C position: thumb on C. Follow the glow and the finger chips. Press Hear the demo to hear each pattern before you play it.',
    keybed: { low: 55, high: 79 },
    steps: [
      { prompt: 'Play a step up: C, then D.', targets: [60, 62], all: true, ordered: true, fingers: { 60: 1, 62: 2 }, hand: 'r' },
      { prompt: 'Play a skip up: C, then E. Your thumb, then your middle finger, jumping over D.', targets: [60, 64], all: true, ordered: true, fingers: { 60: 1, 64: 3 }, hand: 'r' },
      { prompt: 'Play a repeat: G three times with finger 5.', targets: [67, 67, 67], all: true, ordered: true, fingers: { 67: 5 }, hand: 'r' },
      { prompt: 'Steps down: E, D, C. Fingers 3, 2, 1.', targets: [64, 62, 60], all: true, ordered: true, fingers: { 64: 3, 62: 2, 60: 1 }, hand: 'r' },
      { prompt: 'Now the real thing. The opening of Mary Had a Little Lamb: E, D, C, D, E, E, E.', targets: [64, 62, 60, 62, 64, 64, 64], all: true, ordered: true, fingers: { 64: 3, 62: 2, 60: 1 }, hand: 'r' }
    ],
    handoff: { text: 'You just played a real melody. The whole tune is waiting in the practice room, with the same falling blocks and finger numbers.', href: '/app.html?piece=mary-had-a-little-lamb', label: 'Play the whole song' }
  },
  faq: [
    { q: 'What is the difference between a skip and a leap?', a: 'A skip jumps over exactly one white key, like C to E. Anything wider, such as C to F or C to G, is a leap. Melodies use steps most, skips next, and leaps sparingly, because larger jumps are harder to sing and to place under the fingers.' },
    { q: 'Do steps and skips work the same going down?', a: 'Yes, direction does not change the move. E down to D is a step, G down to E is a skip. The only difference is which way your hand travels, so practise every pattern in both directions from the start.' },
    { q: 'Why do so many melodies repeat notes?', a: 'Repeats let the rhythm and the words move forward while the pitch holds still, which gives a tune breathing space. They also make phrases singable. A melody that changed pitch on every single note would be exhausting to sing and to hear.' },
    { q: 'Do steps and skips involve the black keys?', a: 'They can, in music that uses them. In this lesson everything stays on the white keys inside C position so the idea is clear. The concept transfers directly: a step is always to the nearest note of the scale you are in, whatever its colour.' }
  ],
  quiz: [
    { q: 'What is a step?', options: ['A move to the very next white key', 'A jump over one white key', 'The same note played twice', 'Any move using the thumb'], a: 0, explain: 'A step moves to the immediate neighbour, up or down, with nothing jumped over. C to D and E to D are both steps.' },
    { q: 'What is a skip?', options: ['A jump over exactly one white key', 'A move to the next door key', 'A jump over three keys', 'A rest in the music'], a: 0, explain: 'A skip passes over one white key: C to E skips over D. Wider jumps are leaps, not skips.' },
    { q: 'C up to E is:', options: ['A skip', 'A step', 'A repeat', 'A leap'], a: 0, explain: 'D is jumped over, and jumping exactly one key is the definition of a skip.' },
    { q: 'E down to D is:', options: ['A step down', 'A skip down', 'A repeat', 'A leap down'], a: 0, explain: 'D is the next door key below E, so the move is a step. Direction never changes what the move is called.' },
    { q: 'G played three times in a row is:', options: ['A repeated note', 'Three steps', 'A skip', 'A chord'], a: 0, explain: 'Playing the same note again is a repeat, the third kind of melodic move. It is usually played by the same finger staying on its key.' },
    { q: 'Which move sounds smoothest and appears most in melodies?', options: ['The step', 'The skip', 'The leap', 'The repeat'], a: 0, explain: 'Steps glide to the nearest note, which is easiest to sing and hear, so most melodies are built mainly from them, with skips for colour and leaps used sparingly.' },
    { q: 'In C position, a step means your hand does what?', options: ['The neighbouring finger plays next', 'The whole hand slides along', 'The same finger stretches over', 'The other hand takes over'], a: 0, explain: 'With one finger resting per key, the next door key belongs to the next door finger. That is exactly why C position suits melodies built on steps.' },
    { q: 'A skip from the thumb in C position lands on which finger?', options: ['Finger 3, the middle finger', 'Finger 2, the index finger', 'Finger 5, the little finger', 'The thumb again'], a: 0, explain: 'Skipping a key means skipping a finger too: from the thumb on C, the skip to E lands on the middle finger, passing over finger 2.' },
    { q: 'C up to G is best described as:', options: ['A leap', 'A skip', 'A step', 'A repeat'], a: 0, explain: 'C to G jumps over three white keys, far more than the single key a skip crosses, so it is a leap. Leaps are the rarest move because they are hardest to sing and place.' },
    { q: 'The opening notes of Mary Had a Little Lamb are:', options: ['E, D, C, D, E, E, E', 'C, D, E, F, G, G, G', 'E, E, E, D, C, D, E', 'C, C, G, G, A, A, G'], a: 0, explain: 'The phrase starts on E, steps down to C, steps back up to E, then repeats E twice more: E D C D E E E.' },
    { q: 'That opening phrase uses which moves?', options: ['Steps and repeats only', 'Skips and leaps only', 'Steps, skips and leaps', 'Repeats only'], a: 0, explain: 'E D C D E is four steps in a row, and E E E is a repeat. There are no skips or leaps anywhere in the phrase.' },
    { q: 'Reading a melody as moves means asking, for each note:', options: ['Step, skip, or stay?', 'Loud or quiet?', 'Black key or white key?', 'Left hand or right hand?'], a: 0, explain: 'Every next note is a step, a skip or a leap up or down, or the same note again. Reading moves instead of isolated letters is what makes melodies learnable.' },
    { q: 'How many white keys does a skip pass over?', options: ['One', 'Two', 'None', 'Three'], a: 0, explain: 'Exactly one key is jumped: that single skipped key is what separates a skip from a step, which jumps none, and a leap, which jumps more.' },
    { q: 'D up a step, then up a skip from there, lands on:', options: ['G', 'F', 'E', 'A'], a: 0, explain: 'D steps up to E, and from E a skip jumps over F to land on G. Chaining moves like this is exactly how you read a melody.' },
    { q: 'Repeated notes are usually played with:', options: ['The same finger staying on the key', 'A different finger each time', 'Both hands together', 'The thumb only'], a: 0, explain: 'For a beginner the natural choice is the finger already resting there. Very fast repeats can swap fingers, but that is an advanced technique for later.' },
    { q: 'Why do melodies use leaps sparingly?', options: ['Large jumps are harder to sing and to play', 'Leaps are banned in written music', 'Pianos cannot play leaps cleanly', 'Leaps only work on black keys'], a: 0, explain: 'Wide jumps are demanding for the voice and the hand, so composers save them for moments of drama. Steps carry the everyday motion of a tune.' },
    { q: 'Which sequence is three steps up in a row?', options: ['C, D, E, F', 'C, E, G, B', 'C, C, C, C', 'C, E, D, F'], a: 0, explain: 'C to D, D to E and E to F are each a move to the next door key: three consecutive steps. C E G B is a chain of skips.' },
    { q: 'G down a skip lands on:', options: ['E', 'F', 'D', 'C'], a: 0, explain: 'A skip down from G jumps over F and lands on E. Down works exactly like up, just mirrored.' },
    { q: 'The move C to E compared with the move E to D:', options: ['The first is a skip, the second is a step', 'Both are steps', 'Both are skips', 'The first is a step, the second is a skip'], a: 0, explain: 'C to E jumps over D, a skip. E to D moves to the neighbour, a step. Naming each move on sight is the skill this lesson builds.' },
    { q: 'What should your hand be doing while you play E D C D E E E in C position?', options: ['Staying still while fingers 3, 2 and 1 do the work', 'Sliding one key per note', 'Crossing the thumb under', 'Swapping between hands'], a: 0, explain: 'The whole phrase sits inside C position, so the hand never travels: fingers 3, 2 and 1 trade the melody between themselves while the hand rests in place.' }
  ]
},

/* ---------------------------------------------------------- lesson 4 */
{
  n: 4,
  slug: 'piano-lesson-rhythm-and-counting',
  navTitle: 'Rhythm and counting',
  title: 'Piano Rhythm for Beginners: Counting Beats',
  metaTitle: 'Piano Rhythm Lesson: Count Beats and Play in Time',
  desc: 'Lesson 4 of 5. Beats, bars and note lengths made simple. Tap real rhythms against a metronome, then take a ten question quiz.',
  ogAlt: 'Lesson 4: rhythm and counting, practised against a real metronome',
  eyebrow: 'Lesson 4 of 5',
  lede: 'Play the right keys at the wrong time and nobody recognises the tune. Play a wrong key at the right time and the song survives. Rhythm is half of music, and it is completely learnable.',
  learn: ['What the beat is, and what tempo measures', 'How beats group into bars, and what 4/4 means', 'How long quarter, half and whole notes last', 'How to land your notes with the beat rather than near it'],
  recap: ['The beat is the steady pulse. Tempo is how fast it ticks', 'Four four time means four beats in every bar, counted 1 2 3 4', 'Quarter note one beat, half note two beats, whole note four', 'Slow and together beats fast and scattered, every time'],
  pair: ['online-piano-metronome', 'the free online metronome', 'the same steady click, on its own page for any practice session'],
  links: [['/online-piano-metronome.html', 'the online metronome'], ['/how-to-read-music.html', 'how note lengths look on the page'], ['/app.html', 'the practice room, which grades your timing']],
  sections: [
    { h: 'The beat', ps: [
      'The beat is the steady pulse under a piece of music, the thing your foot taps without being asked. It never speeds up or slows down on its own; it ticks like a clock for the whole song.',
      'How fast the beat ticks is the tempo, measured in beats per minute. Sixty beats per minute is one beat every second. The practice room slider you have already used sets exactly this number, and the ticking device musicians practise with is called a metronome.'
    ]},
    { h: 'Bars and counting to four', ps: [
      'Beats are bundled into small groups called bars. The most common grouping is four beats to a bar, written as 4 over 4 at the start of a piece and spoken as four four time.',
      'Musicians count the beats out loud: one, two, three, four, then straight back to one for the next bar. The count is the skeleton of the music. Every note you play hangs on one of those numbers, which is why counting aloud, however silly it feels, is the fastest rhythm skill there is.'
    ]},
    { h: 'Note lengths: quarter, half, whole', ps: [
      'Notes last for different numbers of beats. A quarter note lasts one beat: four of them fill a bar, one per count. A half note lasts two beats: press on one, hold through two, press on three, hold through four. A whole note lasts all four beats: press on one and hold to the end of the bar.',
      'The names are just fractions of a four beat bar: a whole note fills the whole bar, a half note fills half, a quarter note fills a quarter. Long notes are not slower playing; they are one press and a long hold while the count keeps walking underneath.'
    ]},
    { h: 'Playing in time', ps: [
      'Playing in time means your press lands together with the beat, not somewhere near it. The skill is anticipation: you hear the tick coming and move with it, the way you catch a ball where it will be.',
      'The exercise below is the whole lesson in miniature. The metronome counts you in for one bar, then you tap the note on the beats shown, and every tap is judged: with the beat, or off it. Start slow. Slow and together beats fast and scattered, here and everywhere in music.'
    ]}
  ],
  exercise: {
    type: 'rhythm',
    heading: 'Tap it against the metronome',
    note: 'You will hear four clicks to count you in, then the pattern begins. Tap the glowing C on the marked beats. Headphones help. Press Hear the demo to hear each pattern first.',
    keybed: { low: 60, high: 72 },
    bpm: 80,
    tapMidi: 60,
    patterns: [
      { name: 'Four quarter notes', desc: 'Tap on every beat: 1, 2, 3, 4.', beats: [0, 1, 2, 3] },
      { name: 'Two half notes', desc: 'Tap on 1 and on 3, holding through 2 and 4.', beats: [0, 2] },
      { name: 'One whole note', desc: 'Tap on 1 and hold for the whole bar.', beats: [0] },
      { name: 'A mixed bar', desc: 'Two quarter notes then a half note: tap on 1, 2 and 3.', beats: [0, 1, 2] }
    ]
  },
  faq: [
    { q: 'What exactly does a metronome do?', a: 'It clicks at a steady speed you choose, measured in beats per minute, giving you an honest external beat to play against. Practising with one exposes rushing and dragging that you cannot hear in your own playing, which is why musicians at every level still use them.' },
    { q: 'What tempo should a beginner practise at?', a: 'Slower than feels impressive. Somewhere around 60 to 80 beats per minute leaves room to think and still land with the click. The rule that matters: pick a speed where you can play correctly, and only raise it once correct feels easy.' },
    { q: 'Is 4/4 the only time signature?', a: 'No, only the most common. Three beats to a bar, written 3/4, gives the swaying feel of a waltz, and plenty of other groupings exist. Everything in this lesson transfers: the count just runs to a different number before returning to one.' },
    { q: 'Should I count out loud or in my head?', a: 'Out loud, at least at first. Speaking the count forces it to stay steady while your hands work, and it reveals instantly when a hold was cut short. Counting silently comes naturally later, once the spoken habit has done its job.' }
  ],
  quiz: [
    { q: 'What is the beat?', options: ['The steady pulse running under the music', 'The melody of the song', 'The loudest note in a bar', 'The name of the lowest key'], a: 0, explain: 'The beat is the constant pulse you tap your foot to. Melodies move around freely on top of it, but the pulse itself ticks steadily like a clock.' },
    { q: 'What does tempo measure?', options: ['How fast the beat ticks', 'How loud the music is', 'How high the notes are', 'How long the piece lasts'], a: 0, explain: 'Tempo is the speed of the beat, counted in beats per minute. Louder and quieter is dynamics; higher and lower is pitch.' },
    { q: 'A tempo of 60 beats per minute means:', options: ['One beat every second', 'One beat every minute', 'Sixty bars per second', 'Six beats per second'], a: 0, explain: 'Sixty beats spread over sixty seconds is exactly one per second. At 120 beats per minute the pulse ticks twice each second.' },
    { q: 'What is a metronome for?', options: ['Keeping a perfectly steady beat to practise against', 'Tuning the strings of the piano', 'Measuring how loudly you play', 'Recording your practice sessions'], a: 0, explain: 'A metronome clicks at a fixed speed so you can hear exactly where the beat is. It exposes rushing and dragging that are invisible when you play alone.' },
    { q: 'What is a bar?', options: ['A small group of beats, most often four', 'A group of five notes', 'The wooden frame of the piano', 'A very long note'], a: 0, explain: 'Beats are bundled into bars, and four beats per bar is the most common bundle. The count runs 1 2 3 4 and then a new bar begins.' },
    { q: 'What does 4/4 time mean?', options: ['Four beats in every bar', 'Four notes in the whole piece', 'Play four times faster', 'Four bars per line'], a: 0, explain: 'The time signature 4/4 groups the pulse into bars of four beats, counted 1 2 3 4. It is so common it is nicknamed common time.' },
    { q: 'How many beats does a quarter note last?', options: ['One', 'Two', 'Four', 'Half a beat'], a: 0, explain: 'A quarter note lasts one beat, so four of them fill a 4/4 bar, one on each count. The name means a quarter of the bar.' },
    { q: 'How many beats does a half note last?', options: ['Two', 'One', 'Four', 'Three'], a: 0, explain: 'A half note lasts two beats: press and hold while two counts pass. Two half notes fill a four beat bar.' },
    { q: 'How many beats does a whole note last in 4/4?', options: ['Four', 'One', 'Two', 'Eight'], a: 0, explain: 'A whole note fills the whole four beat bar: one press on count 1, held to the end of the bar.' },
    { q: 'Playing a half note means:', options: ['Press once and hold while two beats pass', 'Press the key twice quickly', 'Press two keys at once', 'Play at half the loudness'], a: 0, explain: 'Long notes are one press and a hold. The count keeps walking underneath; your finger simply stays down for two of its steps.' },
    { q: 'Which fills one bar of 4/4 exactly?', options: ['Four quarter notes', 'Three half notes', 'Two whole notes', 'Five quarter notes'], a: 0, explain: 'Four quarter notes make four beats, exactly one bar. Three half notes make six beats and two whole notes make eight, both too long for a single bar.' },
    { q: 'Two half notes in one bar are tapped on which counts?', options: ['1 and 3', '1 and 2', '2 and 4', '1, 2, 3 and 4'], a: 0, explain: 'The first half note starts on 1 and holds through 2; the second starts on 3 and holds through 4. Taps land on 1 and 3.' },
    { q: 'After counting 1, 2, 3, 4, what do you say next?', options: ['1, starting the next bar', '5', '4 again', 'Nothing, the music stops'], a: 0, explain: 'The count loops: after 4, the next bar begins on 1. Music is bar after bar of the same short count.' },
    { q: 'Playing in time means:', options: ['Your press lands together with the beat', 'Playing as fast as possible', 'Never using long notes', 'Finishing the song within a set time'], a: 0, explain: 'In time means synchronised with the pulse: the press and the tick arrive together. Speed is a separate choice, set by the tempo.' },
    { q: 'Why practise slowly at first?', options: ['Correct and steady can then be sped up; scattered cannot', 'Slow playing is louder', 'Pianos respond better to slow playing', 'To make sessions last longer'], a: 0, explain: 'A slow tempo leaves time to place every note with the click. Once correct is easy, raising the speed is simple. Fast and messy has to be unlearned first.' },
    { q: 'Why does counting OUT LOUD help so much?', options: ['It keeps the count steady and exposes cut short holds', 'It makes the piano louder', 'It impresses listeners', 'It removes any need for a metronome'], a: 0, explain: 'Speaking the numbers forces the count to stay even while the hands work, and a held note that ends too early is instantly obvious against your own voice.' },
    { q: 'A waltz in 3/4 time is counted:', options: ['1, 2, 3, then back to 1', '1, 2, 3, 4', '1, 2, then back to 1', '1 to 8'], a: 0, explain: 'In 3/4 each bar holds three beats, giving the waltz its swaying feel. The counting habit is identical; only the number you count to changes.' },
    { q: 'The names quarter, half and whole come from:', options: ['The fraction of a four beat bar each note fills', 'How hard you press the key', 'The size of the printed note', 'The age of the composer'], a: 0, explain: 'A whole note fills the whole bar, a half note half of it, a quarter note a quarter. The names are plain fractions of the bar.' },
    { q: 'Which mistake matters MORE to how a tune is recognised?', options: ['Playing at the wrong times', 'Playing one wrong key', 'Playing too quietly', 'Using the wrong finger'], a: 0, explain: 'Listeners recognise tunes largely by rhythm. A wrong note in time barely dents a song; right notes at scattered times make it unrecognisable. That is why rhythm is half of music.' },
    { q: 'The skill of landing exactly on the beat is mostly about:', options: ['Anticipating the tick and moving with it', 'Reacting after you hear each tick', 'Pressing the keys harder', 'Watching your fingers closely'], a: 0, explain: 'Reacting after the click always lands late. Players listen to the steady pulse and move with the coming tick, the way you catch a ball where it will be, not where it was.' }
  ]
},

/* ---------------------------------------------------------- lesson 5 */
{
  n: 5,
  slug: 'piano-lesson-reading-the-staff',
  navTitle: 'Reading the staff',
  title: 'Reading Piano Notes: The Treble Staff for Beginners',
  metaTitle: 'Reading Piano Notes Lesson: The Treble Staff Made Simple',
  desc: 'Lesson 5 of 5. The staff, the treble clef and middle C. Read a note on a real staff and press its key, then take a ten question quiz.',
  ogAlt: 'Lesson 5: reading treble staff notes, practised key by key',
  eyebrow: 'Lesson 5 of 5',
  lede: 'Written music is not a code to decipher note by note. It is a picture of the keyboard turned on its side: higher on the page is higher in pitch, and every line and space is one letter name.',
  learn: ['What the five line staff shows, and why height means pitch', 'What the treble clef is and which line it fixes', 'The line and space names, and the memory aids for them', 'Where middle C lives, and what a ledger line is'],
  recap: ['Higher on the page means higher on the keyboard', 'Treble lines from the bottom: E G B D F. Spaces spell FACE', 'The clef spiral wraps the G line, second from the bottom', 'Middle C sits below the staff on its own short ledger line'],
  pair: ['how-to-read-music', 'How to read music for piano', 'the full reading guide, including the bass clef and note lengths'],
  links: [['/how-to-read-music.html', 'the complete reading guide'], ['/middle-c-on-piano.html', 'more on finding middle C'], ['/app.html', 'Read mode in the practice room']],
  sections: [
    { h: 'The staff', ps: [
      'Music is written on a staff: five horizontal lines with four spaces between them. Every line and every space holds one note. A note sitting higher on the staff sounds higher on the piano; a note lower on the page sounds lower. That single idea is most of music reading.',
      'Moving from a line to the very next space, or a space to the next line, is a step, the same next door move you played in lesson three. Line to line or space to space, jumping the one between, is a skip. The moves you already know are drawn right onto the page.'
    ]},
    { h: 'The treble clef', ps: [
      'The curly symbol at the start of the staff is the treble clef. Piano music uses two staves at once: the treble staff, mostly for the right hand, and the bass staff below it, mostly for the left. This lesson stays on the treble staff, where beginner melodies live.',
      'The treble clef is also called the G clef, because its spiral curls around the second line from the bottom and stamps that line as G. Fix one line and every other line and space follows alphabetically from it.'
    ]},
    { h: 'Naming the lines and spaces', ps: [
      'From the bottom up, the five treble lines are E, G, B, D, F. Generations of learners have remembered them as Every Good Boy Deserves Fruit. The four spaces from the bottom up spell a word by themselves: F, A, C, E.',
      'Use the memory aids to get started, but let landmarks take over quickly: the bottom line is E, the spiral line is G, the spaces spell FACE. From any landmark, count lines and spaces alphabetically and you can name anything on the staff.'
    ]},
    { h: 'Middle C and the ledger line', ps: [
      'Middle C sits just below the treble staff, too low for the five lines, so it borrows a short line of its own drawn through the note. That little dash is called a ledger line. Middle C on a ledger line below the treble staff is the single most useful landmark in piano reading.',
      'From there the beginner notes climb exactly as you would guess: C on its ledger line, D just below the bottom line, E on the bottom line, F in the first space, G on the spiral line. Five notes, and they are the same five your right hand covers in C position. The exercise below drills them until your eyes answer before you can think.'
    ]}
  ],
  exercise: {
    type: 'staff',
    heading: 'Read it, then press it',
    note: 'A note appears on the staff. Press its key on the keyboard below. Ten right answers completes the exercise, and wrong guesses cost nothing. Press Hear the demo to see one worked example.',
    keybed: { low: 60, high: 72 },
    range: [60, 62, 64, 65, 67],
    rounds: 10
  },
  faq: [
    { q: 'Why does music use a staff instead of letter names?', a: 'Because the staff shows shape at a glance. A rising line of notes looks like a rising line on the page, chords stack visibly, and rhythm symbols attach to each note. Letters can name one note at a time; the staff shows the whole journey of a phrase.' },
    { q: 'What is the bass clef, and when do I learn it?', a: 'The bass clef marks the lower staff, where the left hand mostly lives, with its own line and space names. Learn it after the treble staff feels comfortable rather than at the same time. The reading guide on this site covers it fully when you are ready.' },
    { q: 'What are ledger lines?', a: 'Short line fragments drawn through notes that sit above or below the five staff lines, extending the staff on demand. Middle C below the treble staff is the first one every pianist meets. They stack for notes that climb higher or dive lower still.' },
    { q: 'How long does learning to read music actually take?', a: 'Recognising the beginner treble notes takes days of short practice, not months. Fluent sight reading grows over years, like reading words did. The honest measure is not speed but direction: a few minutes of note reading most days moves you forward without fail.' }
  ],
  quiz: [
    { q: 'How many lines does a staff have?', options: ['Five', 'Four', 'Six', 'Seven'], a: 0, explain: 'The staff is five horizontal lines with four spaces between them, and every line and space holds one note.' },
    { q: 'A note written higher on the staff sounds:', options: ['Higher in pitch', 'Lower in pitch', 'Louder', 'Longer'], a: 0, explain: 'Height on the page maps to height in pitch: up the staff is up the keyboard. Loudness and length are shown by other markings, not position.' },
    { q: 'The treble clef is also known as:', options: ['The G clef', 'The F clef', 'The C clef', 'The high clef'], a: 0, explain: 'Its spiral curls around the second line from the bottom, fixing that line as G, which gives the clef its other name.' },
    { q: 'In piano music, the treble staff is mostly played by:', options: ['The right hand', 'The left hand', 'Both feet', 'Whichever hand is free'], a: 0, explain: 'Piano music pairs two staves: treble on top, mostly for the right hand, and bass below, mostly for the left. Composers can cross hands over, but that is the default.' },
    { q: 'From the bottom up, the treble staff LINES are:', options: ['E, G, B, D, F', 'F, A, C, E', 'A, B, C, D, E', 'C, D, E, F, G'], a: 0, explain: 'The five lines read E G B D F from the bottom, remembered as Every Good Boy Deserves Fruit. F A C E names the spaces, not the lines.' },
    { q: 'From the bottom up, the treble staff SPACES spell:', options: ['FACE', 'CAFE', 'EGBDF', 'BEAD'], a: 0, explain: 'The four spaces read F, A, C, E from the bottom, conveniently spelling the word FACE.' },
    { q: 'Where does middle C sit relative to the treble staff?', options: ['Just below it, on its own ledger line', 'On the middle line', 'In the top space', 'Just above it'], a: 0, explain: 'Middle C is too low for the five treble lines, so it borrows a short ledger line of its own just below the staff. It is the most useful landmark in piano reading.' },
    { q: 'What is a ledger line?', options: ['A short line extending the staff for notes above or below it', 'The bottom line of the staff', 'A line showing how loudly to play', 'The bar line between bars'], a: 0, explain: 'Ledger lines are little line fragments drawn through notes that overflow the staff, extending it on demand in both directions.' },
    { q: 'Which line does the treble clef spiral curl around?', options: ['The G line, second from the bottom', 'The top line', 'The middle line', 'The bottom line'], a: 0, explain: 'The spiral wraps the second line from the bottom and stamps it as G. From that one fixed point, every other line and space follows alphabetically.' },
    { q: 'The note ON the bottom line of the treble staff is:', options: ['E', 'C', 'G', 'F'], a: 0, explain: 'The bottom line is E, the first letter of Every Good Boy Deserves Fruit. Middle C sits lower still, below the staff on its ledger line.' },
    { q: 'The note in the FIRST space from the bottom is:', options: ['F', 'A', 'E', 'D'], a: 0, explain: 'The spaces spell FACE from the bottom, so the first space is F, sitting one step above the bottom line E.' },
    { q: 'Moving from a line to the very next space is:', options: ['A step', 'A skip', 'An octave', 'A repeat'], a: 0, explain: 'Line to neighbouring space, or space to neighbouring line, is the next door move: a step. The moves from lesson three are drawn directly onto the page.' },
    { q: 'Moving from one line to the next line up, skipping the space between, is:', options: ['A skip', 'A step', 'A leap of an octave', 'Impossible to write'], a: 0, explain: 'Line to line, or space to space, jumps over the one between, which is exactly a skip, like C to E on the keys.' },
    { q: 'Where does D, the note just above middle C, sit?', options: ['Just below the bottom line', 'On the bottom line', 'In the first space', 'On a ledger line above the staff'], a: 0, explain: 'Climbing from middle C on its ledger line, D hangs just below the bottom line, and E lands on the bottom line itself.' },
    { q: 'The five beginner notes C, D, E, F, G on the treble staff match:', options: ['The five keys of right hand C position', 'The five black keys of one octave', 'The five lines of the bass staff', 'Five different octaves'], a: 0, explain: 'The first five treble notes are the same C to G your right hand covers in C position, which is why reading and playing click together so quickly at this stage.' },
    { q: 'Piano music is usually written on:', options: ['Two staves at once, treble above bass', 'One staff only', 'Three staves', 'A different staff for every finger'], a: 0, explain: 'Piano music pairs a treble staff and a bass staff, one per hand as the default. This lesson covers the treble; the bass staff follows once it feels comfortable.' },
    { q: 'Every Good Boy Deserves Fruit helps you remember:', options: ['The treble staff lines from the bottom up', 'The treble staff spaces', 'The order of the black keys', 'Finger numbers'], a: 0, explain: 'The initial letters E G B D F name the five treble lines from the bottom. The spaces have their own reminder: they spell FACE.' },
    { q: 'A note on the spiral line of the treble clef is:', options: ['G', 'E', 'B', 'C'], a: 0, explain: 'The clef fixes its spiral line as G. It is one of the fastest landmarks: see the spiral, and that line is G, no counting needed.' },
    { q: 'Two notes stacked directly on top of each other on the staff mean:', options: ['Play them at the same time', 'Play them one after another', 'Play the top one only', 'A printing error'], a: 0, explain: 'Vertical alignment means together in time: stacked notes sound at once, which is how chords are written. Left to right order is what shows one after another.' },
    { q: 'The realistic path to fluent music reading is:', options: ['Short, frequent note reading practice over time', 'Memorising every song instead', 'Reading only the finger numbers', 'One long session to learn it all'], a: 0, explain: 'Reading fluency grows like word reading did: minutes most days, compounding. The beginner notes arrive in days; speed and range keep improving for as long as you feed them.' }
  ]
}
];

module.exports = LESSONS;
