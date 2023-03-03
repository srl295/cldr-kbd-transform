import fs from 'node:fs';

/**
 * Read a file, returning the string data
 * @param fn basename of file to read
 * @returns
 */
export function readXml(fn : string) : string {
    const path = `./test/xml/${fn}.xml`;
    console.log(`Reading: ${path}`);
    const sample0 = fs.readFileSync(path, 'utf-8');
    return sample0;
};
