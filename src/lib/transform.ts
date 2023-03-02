// needs fxparser.min.js
// Steven's code here,  <srl295@gmail.com>
// see https://docs.google.com/document/d/1FoV37ymU3VR0bI_V8H4cnN0Q5gkorTJa2hWHpw3NT6w/edit# for more

import { XMLParser } from "fast-xml-parser";

function unescapeStr(str) {
    str = str.replaceAll(/\\u{([0-9a-f]+)}/g, (a, b) => String.fromCodePoint(Number.parseInt(b, 16)));
    return str;
}

function replaceOneVar(xml, vname) {
    for (const v of xml.keyboard.variables.variable) {
        const id = v['@_id'];
        if (id === vname) {
            const value = unescapeStr(v['@_value']);
            return value;
        }
    }
    console.error(`Not found: \\\${${vname}}`);
    return "";
}

function replaceVar(xml, str) {
    str = str.replaceAll(/\\\${([0-9a-zA-Z_]+)}/g, (a, b) => replaceOneVar(xml, b));
    return str;

}

function unescapeMatch(xml, str) {
    // unescape
    str = unescapeStr(str);
    // match vars
    str = replaceVar(xml, str);
    return str;
}

function applyMatch(xml, re, transform, source) {
    const toString = unescapeMatch(xml, transform['@_to']);
    return source.replaceAll(re, toString);
}

function getRegex(xml, transform) {
    return new RegExp(transform['@_from'], 'g');
}

function processGroup(xml, group, source) {
    for (let transform of group.transform) {
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

function process(xml, source) {
    let str = source;
    if (!source) return source; /* quick exit on empty */
    for (let group of xml.keyboard.transforms[0].transformGroup) {
        str = processGroup(xml, group, str);
    }
    return str;
}


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
 * Do the XML Transform
 * @param xml XML source for traansforms. entire keyboard file.
 * @param source source text
 * @returns target text
 */
export default function processTransform(xml: string, source: string) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        isArray,
    });
    const j = parser.parse(xml);

    const target = process(j, source);
    return target;
}
