
/**
 * Sample embedded XML. Exposed as a function so it can be part of the unit test.
 * @returns xml
 */
export function getSampleXml() {
    return `
    <!-- sample XML -->
    <keyboard>
        <variables>
          <variable id="left_matras" value="[ि]" />>
          <variable id="consonants" value="[कसतनमह]" />
          <variable id="zwnj" value="\\u{200C}" />
          <variable id="quot" value="\\u{0022}" />
          <variable id="upper" value="A B CC D E" /> <!-- space separated -->
          <variable id="lower" value="a b ç d e" />
        </variables>
    <transforms type="simple">
        <transformGroup>
          <transform from="a" to="b"/>
          <transform from="c" to="d"/>
        </transformGroup>
        <transformGroup>
          <transform from="z" to="\\m{z}" /> <!-- z -> mark -->
        </transformGroup>
        <transformGroup>
          <transform from="q" to="\\u{0022}"/> <!-- quote -->
          <transform from="Q" to="\\\${quot}" />
        </transformGroup>
        <transformGroup>
          <transform from="\\m{z}Z" to="ZZZ!" /> <!-- mark + Z = ZZZ! -->
          <transform from="\\m{z}" to="" /> <!-- otherwise drop mark -->
        </transformGroup>
        <transformGroup>
          <transform from="\\\${zwnj}(\\\${left_matras})(\\\${consonants})" to="$2$1" />
        </transformGroup>
        <transformGroup>
          <transform from="(\\\${upper})" to="\\$\{1:lower}" />
        </transformGroup>
    </transforms> <!-- Only one <transforms> is supported right now. -->
    </keyboard>
    `;
}

/**
 *
 * @returns the source string to show in the UI
 */
export function getSampleSource() {
    return 'CCAFE QUACCK quack zZ: \u200C\u093F\u0939\u0928\u0926\u0940, a big happy string';
}

/**
 *
 * @returns The expected target, for tests
 */
export function getExpectedTarget() {
    return `çaFe QUaçK "ubck ZZZ!: हिनदी, b big hbppy string`;
}
