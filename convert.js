const fs = require('fs');

// 1. Copy admin.ts to adminClient.ts and wrap in initAdmin()
let tsCode = fs.readFileSync('d:/day1/riwayat-v2/project/src/admin.ts', 'utf8');
const insertIndex = tsCode.indexOf('const loginScreen');
const before = tsCode.substring(0, insertIndex);
const after = tsCode.substring(insertIndex);
const newTsCode = before + 'export function initAdmin() {\n' + after + '\n}\n';
fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/admin/adminClient.ts', newTsCode);

// 2. Convert admin.html to JSX and save as page.tsx
let htmlCode = fs.readFileSync('d:/day1/riwayat-v2/project/admin.html', 'utf8');

// Extract body content
const bodyStart = htmlCode.indexOf('<body>') + 6;
const bodyEnd = htmlCode.indexOf('</body>');
let jsx = htmlCode.substring(bodyStart, bodyEnd);

// Remove script tags
jsx = jsx.replace(/<script.*?>.*?<\/script>/gs, '');

// Convert to JSX
jsx = jsx.replace(/class=/g, 'className=');
jsx = jsx.replace(/for=/g, 'htmlFor=');
jsx = jsx.replace(/<!--(.*?)-->/gs, '{/*$1*/}');

// Convert style attributes
jsx = jsx.replace(/style="([^"]*)"/g, (match, styleStr) => {
    const obj = {};
    styleStr.split(';').forEach(rule => {
        if (!rule.trim()) return;
        const [key, val] = rule.split(':').map(s => s.trim());
        const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
        obj[camelKey] = val;
    });
    return 'style={' + JSON.stringify(obj) + '}';
});

// Self-close input and img tags
jsx = jsx.replace(/<(input|img|hr|br)([^>]*?)(?<!\/)>/g, '<$1$2 />');

const pageCode = `"use client";
import React, { useEffect } from "react";
import "./admin.css";
import { initAdmin } from "./adminClient";

export default function AdminPage() {
  useEffect(() => {
    initAdmin();
  }, []);

  return (
    <>
      ${jsx}
    </>
  );
}
`;

fs.writeFileSync('d:/day1/riwayat-v2/next-app/src/app/admin/page.tsx', pageCode);

// 3. Copy admin.css
fs.copyFileSync('d:/day1/riwayat-v2/project/src/admin.css', 'd:/day1/riwayat-v2/next-app/src/app/admin/admin.css');

console.log('Conversion successful');
