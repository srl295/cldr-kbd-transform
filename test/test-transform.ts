import assert from 'node:assert';
import { describe, it } from 'node:test';

import { processTransform, unescapeStr } from '../src/lib/transform.js';
import { readXml } from './util.js';


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
  });
});
