// Author: Steven R. Loomis, Code Hive Tx, LLC
// Copyright © 2023 Code Hive Tx, LLC
// SPDX-License-Identifier: Unicode-DFS-2016
// Distributed under the Unicode terms of use, see LICENSE file
// see https://docs.google.com/document/d/1FoV37ymU3VR0bI_V8H4cnN0Q5gkorTJa2hWHpw3NT6w/edit# for more

import { XMLParser } from "fast-xml-parser";


const DEBUG = true; // TODO

const MARK_BASE : number = 0xF700; // U+F7XX, PUA

interface KeyboardTransform {
    '@_from': string;
    '@_to': string;
}

interface KeyboardTransformSettings {
    '@_matchAll'?: boolean;
}

interface KeyboardVariable {
    '@_id': string;
    '@_value': string;
}

interface KeyboardVariables {
    variable: KeyboardVariable[];
}

interface KeyboardTransformGroup {
    transformSettings?: KeyboardTransformSettings;
    transform: KeyboardTransform[];
}

interface KeyboardTransforms {
    type: string;
    transformGroup: KeyboardTransformGroup[];
}

interface Keyboard {
    variables: KeyboardVariables;
    transforms: KeyboardTransforms[];
}

interface KeyboardDocument {
    keyboard: Keyboard;
}

/**
 * Unescape an escaped string
 * @param str input string such as '\u017c'
 * @returns
 */
export function unescapeStr(str : string) : string {
    str = str.replace(/\\u{([0-9a-fA-F]+)}/g, (a: any, b: string) =>
        String.fromCodePoint(Number.parseInt(b, 16)));
    return str;
}

/**
 * Convert "… \m{a} … " form into an escaped string
 * @param str
 * @returns
 */
export function decodeMark(str : string) : string {
    str = str.replace(/\\m{([0-9A-Za-z_]+)}/g, (a: any, b: string) => {
        if (b.length !== 1) { // TODO: fail if >32
            throw Error(`TODO: this implementation only supports the form \\m{_} where _ is a single character, not \\{${b}}`)
        }
        return String.fromCodePoint(MARK_BASE | (b.codePointAt(0) || 0));
    });
    return str;
}

/**
 * Utility function for replaceVar
 * @param xml xml blob
 * @param vname
 * @returns
 */
function fetchVarValue(xml : KeyboardDocument, vname : string) {
    for (const v of xml.keyboard.variables.variable) {
        const id = v['@_id'];
        if (id === vname) {
            // the variable value is unescaped
            const value = unescapeStr(v['@_value']);
            return value;
        }
    }
    throw new Error(`Not found: variable ${vname}`);
    // return "";
}

/**
 * Replace a single variable
 * @param xml
 * @param str
 * @returns
 */
function replaceVar(xml : KeyboardDocument, str : string) {
    str = str.replace(/\\\${([0-9a-zA-Z_]+)}/g, (a : any, b : string) => fetchVarValue(xml, b));
    return str;
}

/**
 * Process a match string.  It needs to be unescaped, then variable-replaced.
 * @param xml
 * @param str
 * @returns
 */
function unescapeMatch(xml : KeyboardDocument, str : string) {
    // process marks
    str = decodeMark(str); // TODO: for final, would need more context to serialize the marks
    // unescape
    str = unescapeStr(str);
    // match vars
    str = replaceVar(xml, str);
    return str;
}

function unescapeFrom(xml: KeyboardDocument, str: string) {
    return unescapeMatch(xml, str); // TODO: special processing for from
}


// Matches that the raw FROM is of the form: (\${var})
const MATCH_FROM_VAR_MAP = /\(\\\${([0-9A-Za-z_]+)}\)/;

// Matches that the TO side is a mapping
const MATCH_TO_VAR_MAP = /\\\${([0-9]):([^}]*)}/; // \${#:var} => #, var

/**
 * Utility function to apply a matched string
 * @param xml``
 * @param re
 * @param transform the transform entry from XML
 * @param source
 * @returns modified string
 */
function applyMatch(xml: KeyboardDocument, re: RegExp, transform: any, source: string) {
    let toString  = decodeMark(transform['@_to']);
    toString      = unescapeMatch(xml, toString);

    const fromStr = transform['@_from']; // raw

    if (!MATCH_FROM_VAR_MAP.test(fromStr) // No source group in From… // TODO: handle >1 group!
        || !MATCH_TO_VAR_MAP.test(toString) ) {  // no ${1:…} map syntax in the TO…
        // no variable group, so do a simple sub
        return source.replace(re, toString);
    }

    const fromList = fromAsList(fromStr, xml); // array

    //getRegex has already setup the right regex for us.

    return source.replace(re, (sub, arg) => {
        const whereInFrom = fromList.indexOf(arg); // TODO: multi char clusters. Etc.
        if (whereInFrom === -1) {
            throw Error(`failed to find ${arg} in ${fromList.join(' ')} while expanding ${fromStr}`);
        }

        return toString.replace(MATCH_TO_VAR_MAP, (subsub, mindex, vname) => { // 'lower'
            // find the variable
            if (mindex != 1) {
                throw Error(`TODO: Only support $\{1: …} matches sorry, not ${mindex}.`);
            }
            const toList = fetchVarValue(xml, vname).split(' '); // throws if failure
            if (whereInFrom >= toList.length) {
                throw Error(`char ${arg} off end of toList ${toList.join('|')}=${vname}`)
            }
            return toList[whereInFrom];// A -> a
        });

        // return `[[ ${sub}, ${arg}, ${toString}, ${fromStr} off=${offset}, str=/${string}/ ]]`
    });
}

/**
 * given a fromStr that is a list, return the list contents
 * @param fromStr
 * @param xml
 * @returns string[]
 */
function fromAsList(fromStr: any, xml: KeyboardDocument) {
    const fromMatch = MATCH_FROM_VAR_MAP.exec(fromStr);

    if (!fromMatch) {
        throw Error(`Failed to parse match from ${fromStr} - expected a single (\\$\{var})`);
    }

    if (fromMatch.length !== 2) {
        throw Error(`TODO: Sorry, need exactly 1 (\\$\{var}) form, not ${fromMatch.length - 1} groups.. ${fromStr}`);
    }
    const fromVar = fromMatch[1]; // from variable
    const fromList = fetchVarValue(xml, fromVar).split(' '); // array
    return fromList;
}

/**
 * Fetch the regex for for the match side
 * @param xml
 * @param transform
 * @returns
 */
function getRegex(xml: KeyboardDocument, transform: KeyboardTransform) {
    // TODO: apply exclusions for \p etc
    let fromStr = transform['@_from'];
    const toStr = transform['@_to']; // to check if it's a map
    const fromIsVar = MATCH_FROM_VAR_MAP.test(fromStr);
    const toIsVar = MATCH_TO_VAR_MAP.test(toStr);

    if (fromIsVar && toIsVar) {
            // it's a set

        const fromList = fromAsList(fromStr, xml); // array
        const newRegexPat = fromStr.replace(MATCH_FROM_VAR_MAP,
            `(${fromList.join('|')})`); // TODO: surely some quoting things needed here
        const fromRegex = new RegExp(newRegexPat, 'g');
        return fromRegex;
    } else {
        // just basic escaping
        fromStr = unescapeFrom(xml, decodeMark(fromStr));
        DEBUG && console.dir({ fromStr });
        // TODO: apply \m for matching
        return new RegExp(fromStr, 'g');
    }
}

/**
 * Process an entire group of transforms
 * @param xml
 * @param group
 * @param source
 * @returns
 */
function processGroup(xml: KeyboardDocument, group: KeyboardTransformGroup, source: string) {
    const matchAll = group?.transformSettings?.['@_matchAll'];
    for (const transform of group.transform) {
        const re = getRegex(xml, transform);
        if (source.match(re)) {
            source = applyMatch(xml, re, transform, source);
            if (!matchAll) {
                return source; // exit on first match if not matchAll
            }
        }
    }
    return source;
}

/**
 * Process the transform, given a parsed XML document
 * @param xml
 * @param source
 * @returns
 */
function process(xml: KeyboardDocument, source: string) {
    let str = source;
    // TODO: only processes 0th transform
    if (xml.keyboard.transforms.length !== 1) {
        throw Error(`TODO: This implementation only supports a single <transforms> element.`);
    }

    for (const group of xml.keyboard.transforms[0].transformGroup) {
        str = processGroup(xml, group, str);
    }
    return str;
}

/**
 * List of elements that are always arrays
 */
const alwaysArray = [
    "keyboard.transforms",
    "keyboard.transforms.transformGroup",
    "keyboard.transforms.transformGroup.transform",
];

/**
 * Loading helper for isArray
 * @param name
 * @param jpath
 * @param isLeafNode
 * @param isAttribute
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isArray = (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) : boolean=> {
    if (alwaysArray.indexOf(jpath) !== -1) return true;
    return false;
};

/**
 * Do the XML Transform given raw XML source
 * @param xml XML source for transforms. entire keyboard file.
 * @param source source text
 * @returns target text
 */
export function processTransform(xml: string, source: string) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        isArray,
    });
    const j : KeyboardDocument = parser.parse(xml);
    const target = process(j, source);
    return target;
}
