/**
 * Phase D Tests — QR Code Generation & Table Management
 * 
 * Requirements:
 * - npm run dev (server running on port 3000)
 * - npm run seed (database seeded)
 * 
 * Test: npm run test:phase-d
 */

const { request, login, TestSuite, waitForServer } = require('./utils.js');

async function runTests() {
  try {
    // Wait for server to be ready
    await waitForServer();

    const suite = new TestSuite('Phase D — QR Codes & Tables');

let adminCookies, adminToken, tableId;

// Setup: Login as admin
suite.test('Setup: Admin Login', async () => {
  const response = await login('1234');
  if (!response.user || !response.cookies) throw new Error('Login failed');
  adminCookies = response.cookies;
  adminToken = response.token;
});

// QR Code Generation
suite.test('GET /api/admin/tables - List all tables with QR info', async () => {
  const response = await request('GET', '/api/admin/tables', {
    cookies: adminCookies,
  });
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!Array.isArray(response.data)) throw new Error('Response should be array');
  if (response.data.length === 0) throw new Error('Should have seeded tables');
  
  const table = response.data[0];
  tableId = table.id;
  if (!table.number) throw new Error('Table should have number');
  if (!table.qr_token) throw new Error('Table should have qr_token');
  if (!table.status) throw new Error('Table should have status');
});

suite.test('GET /api/admin/tables/:id/qr - Get QR code image for table', async () => {
  if (!tableId) throw new Error('tableId not set');
  const response = await request('GET', `/api/admin/tables/${tableId}/qr`, {
    cookies: adminCookies,
  });
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  // Response should be binary PNG image or JSON with data URL
  if (!response.data) throw new Error('QR response is empty');
});

suite.test('POST /api/admin/tables/:id/regenerate-qr - Regenerate QR token', async () => {
  if (!tableId) throw new Error('tableId not set');
  
  // Get original token
  let response = await request('GET', '/api/admin/tables', {
    cookies: adminCookies,
  });
  const originalToken = response.data.find(t => t.id === tableId)?.qr_token;
  
  // Regenerate
  response = await request('POST', `/api/admin/tables/${tableId}/regenerate-qr`, {
    body: {},
    cookies: adminCookies,
  });
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.qr_token) throw new Error('Should return new QR token');
  if (response.data.qr_token === originalToken) throw new Error('Token should change');
});

// Table Status Management
suite.test('PATCH /api/admin/tables/:id - Update table status', async () => {
  if (!tableId) throw new Error('tableId not set');
  
  const response = await request('PATCH', `/api/admin/tables/${tableId}`, {
    body: { status: 'active' },
    cookies: adminCookies,
  });
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.data.status !== 'active') throw new Error('Status should be updated');
});

suite.test('PATCH /api/admin/tables/:id - Toggle table disabled', async () => {
  if (!tableId) throw new Error('tableId not set');
  
  const response = await request('PATCH', `/api/admin/tables/${tableId}`, {
    body: { status: 'disabled' },
    cookies: adminCookies,
  });
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.data.status !== 'disabled') throw new Error('Status should be disabled');
});

// Public QR endpoint (no auth required)
suite.test('GET /api/tables/:qr_token - Get table by QR token (public)', async () => {
  // First reset table to empty status
  let response = await request('PATCH', `/api/admin/tables/${tableId}`, {
    body: { status: 'empty' },
    cookies: adminCookies,
  });
  if (response.status !== 200) throw new Error('Failed to reset table status');
  
  // Get the table's QR token again (in case it changed)
  response = await request('GET', '/api/admin/tables', {
    cookies: adminCookies,
  });
  const validTable = response.data.find(t => t.id === tableId);
  const token = validTable?.qr_token;
  if (!token) throw new Error('No QR token found');
  
  // Access via public endpoint
  response = await request('GET', `/api/tables/${token}`, {});
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.id) throw new Error('Should return table data');
  if (!response.data.number) throw new Error('Should have table number');
});

suite.test('GET /api/tables/:qr_token - Invalid token returns 404', async () => {
  const response = await request('GET', '/api/tables/invalid-token-xyz', {});
  if (response.status !== 404) throw new Error(`Expected 404, got ${response.status}`);
});

  // Run all tests
  await suite.run();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

runTests();
