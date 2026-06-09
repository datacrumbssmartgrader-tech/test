const fs = require('fs');

const css = fs.readFileSync('d:/day1/riwayat-v2/next-app/src/app/globals.css', 'utf8');

// The file has a section starting with /* ═══════════════════════════════════════════════
//    NAVBAR
//    ═══════════════════════════════════════════════ */
// We will split the file here. Everything before is base.css, everything after is landing.css.

const splitIndex = css.indexOf('/* ═══════════════════════════════════════════════\r\n   NAVBAR');
let splitIndex2 = css.indexOf('/* ═══════════════════════════════════════════════\n   NAVBAR');
if (splitIndex === -1) splitIndex2 = css.indexOf('/* ═══════════════════════════════════════════════');

const actualSplit = splitIndex !== -1 ? splitIndex : splitIndex2;

if (actualSplit === -1) {
    console.log("Could not find the split point!");
    process.exit(1);
}

const baseCss = css.substring(0, actualSplit);
const landingCss = css.substring(actualSplit);

fs.mkdirSync('d:/day1/riwayat-v2/next-app/src/app/globals', { recursive: true });
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/globals/base.css', baseCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/globals/landing.css', landingCss);

const newGlobals = `@import './theme.css';
@import './globals/base.css';
@import './globals/landing.css';
`;

fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/globals.css', newGlobals);
console.log('Split successful');
