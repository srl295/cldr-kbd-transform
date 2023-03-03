import assert from 'node:assert';
import test from 'node:test';
import { processTransform, unescapeStr } from '../src/lib/transform.js';

import { readXml } from './util.js';


test('basic test', (t) => {
  const inTxt = 'Quack: a big happy string';
  const outTxt = processTransform(readXml('sample0'), inTxt);
  assert.strictEqual(outTxt, `\\\\\\"ubck: b big hbppy string`);
});


test('failing tests', (t) => {
  const inTxt = '≈';
  assert.doesNotThrow(() => processTransform(readXml('fail-badvar'), inTxt));
});

test('utilities', (t) => {
  t.test('unescapeStr', (t) => {
    assert.equal(unescapeStr(`\u{22}295=\u{0127}\u{22}`), `"295=ħ"`);
    assert.equal(unescapeStr(`≈`), `≈`);
  });
});

// test('synchronous passing test', (t) => {
//     // This test passes because it does not throw an exception.
//     assert.strictEqual(1, 1);
//   });

//   test('synchronous failing test', (t) => {
//     // This test fails because it throws an exception.
//     assert.strictEqual(1, 2);
//   });

//   test('asynchronous passing test', async (t) => {
//     // This test passes because the Promise returned by the async
//     // function is not rejected.
//     assert.strictEqual(1, 1);
//   });

//   test('asynchronous failing test', async (t) => {
//     // This test fails because the Promise returned by the async
//     // function is rejected.
//     assert.strictEqual(1, 2);
//   });

//   test('failing test using Promises', (t) => {
//     // Promises can be used directly as well.
//     return new Promise((resolve, reject) => {
//       setImmediate(() => {
//         reject(new Error('this will cause the test to fail'));
//       });
//     });
//   });

//   test('callback passing test', (t, done) => {
//     // done() is the callback function. When the setImmediate() runs, it invokes
//     // done() with no arguments.
//     setImmediate(done);
//   });

//   test('callback failing test', (t, done) => {
//     // When the setImmediate() runs, done() is invoked with an Error object and
//     // the test fails.
//     setImmediate(() => {
//       done(new Error('callback failure'));
//     });
//   });
