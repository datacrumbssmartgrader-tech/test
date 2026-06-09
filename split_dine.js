const fs = require('fs');

const css = fs.readFileSync('d:/day1/riwayat-v2/next-app/src/app/dine.css', 'utf8');

const splitPoint1 = css.indexOf('/* ═══════════════════════════════════════════════\r\n   MENU HEADER BLOCK');
let sp1 = splitPoint1 !== -1 ? splitPoint1 : css.indexOf('/* ═══════════════════════════════════════════════\n   MENU HEADER BLOCK');

const splitPoint2 = css.indexOf('/* ═══════════════════════════════════════════════\r\n   TRACKER SCREEN');
let sp2 = splitPoint2 !== -1 ? splitPoint2 : css.indexOf('/* ═══════════════════════════════════════════════\n   TRACKER SCREEN');

const splitPoint3 = css.indexOf('/* ═══════════════════════════════════════════════\r\n   BILL SCREEN');
let sp3 = splitPoint3 !== -1 ? splitPoint3 : css.indexOf('/* ═══════════════════════════════════════════════\n   BILL SCREEN');

const splitPoint4 = css.indexOf('/* ═══════════════════════════════════════════════\r\n   BOTTOM NAV');
let sp4 = splitPoint4 !== -1 ? splitPoint4 : css.indexOf('/* ═══════════════════════════════════════════════\n   BOTTOM NAV');

const splitPoint5 = css.indexOf('/* ═══════════════════════════════════════════════\r\n   BOTTOM SHEETS');
let sp5 = splitPoint5 !== -1 ? splitPoint5 : css.indexOf('/* ═══════════════════════════════════════════════\n   BOTTOM SHEETS');

if (sp1 === -1 || sp2 === -1 || sp3 === -1 || sp4 === -1 || sp5 === -1) {
    console.log("Could not find all split points!");
    process.exit(1);
}

const baseCss = css.substring(0, sp1);
const menuCss = css.substring(sp1, sp2);
const trackerCss = css.substring(sp2, sp3);
const billCss = css.substring(sp3, sp4);
const navCss = css.substring(sp4, sp5);
const sheetsCss = css.substring(sp5);

fs.mkdirSync('d:/day1/riwayat-v2/next-app/src/app/dine_styles', { recursive: true });
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/dine_styles/base.css', baseCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/dine_styles/menu.css', menuCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/dine_styles/tracker.css', trackerCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/dine_styles/bill.css', billCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/dine_styles/nav.css', navCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/dine_styles/sheets.css', sheetsCss);

const newDineCss = `@import './theme.css';
@import './dine_styles/base.css';
@import './dine_styles/menu.css';
@import './dine_styles/tracker.css';
@import './dine_styles/bill.css';
@import './dine_styles/nav.css';
@import './dine_styles/sheets.css';
`;

fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/dine.css', newDineCss);
console.log('Dine split successful');
