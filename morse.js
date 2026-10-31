(function (root) {
  const MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
    J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
    S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....',
    7: '--...', 8: '---..', 9: '----.'
  };
  // Lessons introduce letters gradually (Koch-like order of difficulty).
  const LESSONS = [
    { title: 'E T', chars: 'ET' }, { title: 'I M A N', chars: 'IMAN' },
    { title: 'S O U R', chars: 'SOUR' }, { title: 'D K G W', chars: 'DKGW' },
    { title: 'H V F L', chars: 'HVFL' }, { title: 'B C P Q', chars: 'BCPQ' },
    { title: 'J X Y Z', chars: 'JXYZ' }, { title: '0 – 4', chars: '01234' },
    { title: '5 – 9', chars: '56789' }
  ];
  const UNIT = 80; // ms per dot at speed 1

  // Returns [{on: bool, ms}] for a pattern like ".-"
  function timeline(pattern, unit) {
    unit = unit || UNIT;
    const out = [];
    [...pattern].forEach((s, i) => {
      if (i) out.push({ on: false, ms: unit });
      out.push({ on: true, ms: s === '.' ? unit : unit * 3 });
    });
    return out;
  }
  function vibrationPattern(pattern, unit) {
    // navigator.vibrate: alternating on/off durations
    return timeline(pattern, unit).map(s => s.ms);
  }
  function encode(text) {
    return [...text.toUpperCase()].map(c => MORSE[c]).filter(Boolean);
  }
  function lettersUpTo(lessonIndex) {
    return LESSONS.slice(0, lessonIndex + 1).map(l => l.chars).join('');
  }
  const api = { MORSE, LESSONS, UNIT, timeline, vibrationPattern, encode, lettersUpTo };
  if (typeof module !== 'undefined') module.exports = api; else root.Morse = api;
})(typeof self !== 'undefined' ? self : this);
