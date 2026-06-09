const fs = require('fs');

const css = fs.readFileSync('d:/day1/riwayat-v2/next-app/src/app/admin/admin.css', 'utf8');

const splitPoint1 = css.indexOf('/* ═══════════════════════════════════════════════\r\n   DASHBOARD LAYOUT');
let sp1 = splitPoint1 !== -1 ? splitPoint1 : css.indexOf('/* ═══════════════════════════════════════════════\n   DASHBOARD LAYOUT');

const splitPoint2 = css.indexOf('/* ═══════════════════════════════════════════════\r\n   LIVE ORDERS');
let sp2 = splitPoint2 !== -1 ? splitPoint2 : css.indexOf('/* ═══════════════════════════════════════════════\n   LIVE ORDERS');

const splitPoint3 = css.indexOf('/* ═══════════════════════════════════════════════\r\n   TABLES');
let sp3 = splitPoint3 !== -1 ? splitPoint3 : css.indexOf('/* ═══════════════════════════════════════════════\n   TABLES');

const splitPoint4 = css.indexOf('/* ═══════════════════════════════════════════════\r\n   MENU MANAGEMENT');
let sp4 = splitPoint4 !== -1 ? splitPoint4 : css.indexOf('/* ═══════════════════════════════════════════════\n   MENU MANAGEMENT');

if (sp1 === -1 || sp2 === -1 || sp3 === -1 || sp4 === -1) {
    console.log("Could not find all split points!");
    console.log({sp1, sp2, sp3, sp4});
    process.exit(1);
}

const loginCss = css.substring(0, sp1);
const shellCss = css.substring(sp1, sp2);
const ordersCss = css.substring(sp2, sp3);
const tablesCss = css.substring(sp3, sp4);
const restCss = css.substring(sp4);

fs.mkdirSync('d:/day1/riwayat-v2/next-app/src/app/admin/admin_styles', { recursive: true });
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/admin/admin_styles/login.css', loginCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/admin/admin_styles/shell.css', shellCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/admin/admin_styles/orders.css', ordersCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/admin/admin_styles/tables.css', tablesCss);
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/admin/admin_styles/rest.css', restCss);

const newAdminCss = `@import './admin_styles/login.css';
@import './admin_styles/shell.css';
@import './admin_styles/orders.css';
@import './admin_styles/tables.css';
@import './admin_styles/rest.css';
`;

fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/admin/admin.css', newAdminCss);
console.log('Admin split successful');
