import assert from 'node:assert';
import { describe, it } from 'node:test';

import { processTransform, unescapeStr, decodeMark } from '../src/lib/transform.js';
import { getSampleXml, getSampleSource, getExpectedTarget } from '../src/lib/transform-sample.js';
import { readXml } from './util.js';


describe('french', () => {
  const xml = readXml('fr-sample');
  it('Should handle matchAll=true', () => {
    assert.equal(processTransform(xml,
      'r`esum`e espa~nol'),
      'rèsumè español');
  });
});

describe('marks', () => {
  describe('decodeMark()', () => {
    it('Should be able to decode marks', () => {
      assert.equal(decodeMark(
        '\\m{A}'),
        '\uF741');
    });
  });
  describe('marktest.xml', () => {
    const xml = readXml('marktest');
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
  describe('mark failures', () => {
    it('Should fail on mark problems', () => {
      const inTxt = '≈';
      assert.throws(() => processTransform(readXml('fail-badmark'), inTxt));
    });
    it('Should fail, for now, on TODO mark problems', () => {
      const inTxt = '≈';
      assert.throws(() => processTransform(readXml('fail-todomark'), inTxt));
    });
  });
});
describe('vars', () => {
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

describe('subs', () => {
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

describe('sample', () => {
  it('Should be able to process the sample XML properly', () => {
    const xml = getSampleXml();
    const inTxt = getSampleSource();
    const expectOut = getExpectedTarget();
    const outTxt = processTransform(xml, inTxt);
    assert.equal(outTxt, expectOut, `Expected transform of “${inTxt}”`);
  });
});
