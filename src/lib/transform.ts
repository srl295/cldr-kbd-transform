// Author: Steven R. Loomis, Code Hive Tx, LLC
// Copyright © 2023 Code Hive Tx, LLC
// SPDX-License-Identifier: Unicode-DFS-2016
// Distributed under the Unicode terms of use, see LICENSE file
// see https://docs.google.com/document/d/1FoV37ymU3VR0bI_V8H4cnN0Q5gkorTJa2hWHpw3NT6w/edit# for more

import { XMLParser } from "fast-xml-parser";

/**
 * type representing the parsed XML from fast-xml-parser
 */
type KeyboardXML = any;

/**
 * Unescape an escaped string
 * @param str input string such as '\u017c'
 * @returns
 */
export function unescapeStr(str : string) : string {
    str = str.replace(/\\u{([0-9a-f]+)}/g, (a: any, b: string) => String.fromCodePoint(Number.parseInt(b, 16)));
    return str;
}

/**
 * Utility function for replaceVar
 * @param xml xml blob
 * @param vname
 * @returns
 */
function replaceOneVar(xml : KeyboardXML, vname : string) {
    for (const v of xml.keyboard.variables.variable) {
        const id = v['@_id'];
        if (id === vname) {
            // the variable value is unescaped
            const value = unescapeStr(v['@_value']);
            return value;
        }
    }
    console.error(`Not found: \\\${${vname}}`);
    return "";
}

/**
 * Replace a single variable
 * @param xml
 * @param str
 * @returns
 */
function replaceVar(xml : KeyboardXML, str : string) {
    str = str.replace(/\\\${([0-9a-zA-Z_]+)}/g, (a : any, b : string) => replaceOneVar(xml, b));
    return str;

}

/**
 * Process a match string.  It needs to be unescaped, then variable-replaced.
 * @param xml
 * @param str
 * @returns
 */
function unescapeMatch(xml : string, str : string) {
    // unescape
    str = unescapeStr(str);
    // match vars
    str = replaceVar(xml, str);
    return str;
}

/**
 * Utility function to apply a matched string
 * @param xml
 * @param re
 * @param transform the transform entry from XML
 * @param source
 * @returns modified string
 */
function applyMatch(xml: KeyboardXML, re: RegExp, transform: any, source: string) {
    const toString = unescapeMatch(xml, transform['@_to']);
    return source.replace(re, toString);
}

/**
 * Fetch the regex for for the match side
 * @param xml
 * @param transform
 * @returns
 */
function getRegex(xml: KeyboardXML, transform: { [x: string]: string | RegExp; }) {
    return new RegExp(transform['@_from'], 'g');
}

/**
 * Process an entire group of transforms
 * @param xml
 * @param group
 * @param source
 * @returns
 */
function processGroup(xml: KeyboardXML, group: { transform: any; }, source: string) {
    for (const transform of group.transform) {
        const re = getRegex(xml, transform);
        if (source.match(re)) {
            console.dir({ matched: transform });
            source = applyMatch(xml, re, transform, source);
            return source; // exit on first match
        }
    }
    // console.log('nomatch in this group');
    return source;
}

/**
 * Process the transform, given a parsed XML document
 * @param xml
 * @param source
 * @returns
 */
function process(xml: { keyboard: { transforms: { transformGroup: any; }[]; }; }, source: string) {
    let str = source;
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
    const j = parser.parse(xml);
    const target = process(j, source);
    return target;
}
