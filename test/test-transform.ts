import assert from 'node:assert';
import { describe, it } from 'node:test';

import { processTransform, unescapeStr } from '../src/lib/transform.js';
import { readXml } from './util.js';

describe('marks', (t) => {
  describe('marktest.xml', () => {
    const xml = readXml('varmatch');
    it('should substitute successfully', () => {
      const inTxt = 'ac';
      const outTxt = processTransform(xml, inTxt);
      assert.strictEqual(outTxt, '~C'); // C
    });
    it('should handle partial', () => {
      assert.equal(processTransform(xml,
        '_a'),
        '_~~');
      assert.equal(processTransform(xml,
        'c'),
        '~');
      assert.equal(processTransform(xml,
        'a_c'),
        '~~_~');
    });
  });
});
describe('vars', (t) => {
  describe('varmatch.xml', () => {
    const xml = readXml('varmatch');
    it('should substitute xd', () => {
      const inTxt = 'xyzxyz';
      const outTxt = processTransform(xml, inTxt);
      assert.strictEqual(outTxt, 'yyzyyz');
    });
    it('should be able to lowercase', () => {
      const inTxt = 'A';
      const outTxt = processTransform(xml, inTxt);
      assert.strictEqual(outTxt, 'a');
    });
    it('should be able to lowercase again', () => {
      const inTxt = 'BABAFF';
      const outTxt = processTransform(xml, inTxt);
      assert.strictEqual(outTxt, 'babaƒ');
    });
  });
});

describe('subs', (t) => {
  describe('othermatch.xml', () => {
    const xml = readXml('othermatch');
    it('should handle $#', () => {
      assert.equal(processTransform(xml,
        'meのchai'),
        'chai of me');
    });
    it('should handle $$', () => {
      assert.equal(processTransform(xml,
        'SEVEN DOLLAR SPECIAL'),
        'SEVEN $ SPECIAL');
    });
    it('should handle $&', () => {
      assert.equal(processTransform(xml,
        'true, blue, TRUE!'),
        'not-true, not-blue, not-TRUE!');
    });
  });
  describe('hindi', () => {
    const xml = readXml('hindi');
    it('Should handle a simple hindi visual reordering', () => {
      assert.equal(processTransform(xml,
        '\u200C\u093F\u0939'), // ZWNJ + vowel II + consonant HA.  User keys: ि + ह [ZWNJ+II] [HA]
        '\u0939\u093F');  // consonant HA + vowel II
    });
    it('Should handle a hindi visual reordering', () => {
      assert.equal(processTransform(xml,
        '\u200C\u093F\u0939\u0928\u0926\u0940'), // ZWNJ + vowel II + consonant HA …
        'हिनदी');  // Hindi
    });
  });
});


describe('coverage tests', () => {
  it('should do a basic test', () => {
    const inTxt = 'Quack: a big happy string';
    const outTxt = processTransform(readXml('sample0'), inTxt);
    assert.strictEqual(outTxt, `\\\\\\"ubck: b big hbppy string`);
  });

  it('should do a failing test', () => {
    const inTxt = '≈';
    assert.throws(() => processTransform(readXml('fail-badvar'), inTxt));
  });
});

describe('utilities', () => {
  it('should unescapeStr', () => {
    assert.equal(unescapeStr(`\u{22}295=\u{0127}\u{22}`), `"295=ħ"`);
    assert.equal(unescapeStr(`≈`), `≈`);
    assert.equal(unescapeStr(`\\u{200C}(\\u{093f})(\\u{0939})`), `\u200c(\u093f)(\u0939)`);
  });
});
