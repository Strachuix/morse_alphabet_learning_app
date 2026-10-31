const assert = require('assert');
const M = require('./morse');
assert.deepStrictEqual(M.encode('sos'), ['...', '---', '...']);
assert.deepStrictEqual(M.vibrationPattern('.-', 10), [10, 10, 30]);
assert.strictEqual(M.lettersUpTo(0), 'ET');
assert.strictEqual(new Set(Object.values(M.MORSE)).size, Object.keys(M.MORSE).length);
console.log('ok');
