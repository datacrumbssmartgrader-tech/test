/**
 * Phase F Tests — Customers Tab & Excel Export
 * 
 * Requirements:
 * - npm run dev (server running on port 3000)
 * - npm run seed (database seeded)
 * - Phase E complete (customers created)
 * 
 * Test: npm run test:phase-f
 */

const { request, login, TestSuite, waitForServer } = require('./utils.js');
const fs = require('fs');
const path = require('path');

async function runTests() {
  try {
    // Wait for server to be ready
    await waitForServer();

    const suite = new TestSuite('Phase F — Customers & Excel Export');

let adminCookies, adminToken;

// Setup: Login as admin
suite.test('Setup: Admin Login', async () => {
  const response = await login('1234');
  if (!response.user || !response.cookies) throw new Error('Login failed');
  adminCookies = response.cookies;
  adminToken = response.token;
});

// Customer List
suite.test('GET /api/admin/customers - List all customers with visit count', async () => {
  const response = await request('GET', '/api/admin/customers', {
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!Array.isArray(response.data)) throw new Error('Should return array');
  
  // Response should include customer data
  if (response.data.length > 0) {
    const customer = response.data[0];
    if (!customer.id) throw new Error('Customer should have id');
    if (!customer.name) throw new Error('Customer should have name');
    if (typeof customer.visit_count !== 'number') throw new Error('Should have visit_count');
  }
});

suite.test('GET /api/admin/customers/:id - Get customer details', async () => {
  // First get a customer
  let response = await request('GET', '/api/admin/customers', {
    cookies: adminCookies,
  });
  
  if (response.data.length === 0) throw new Error('No customers available');
  
  const customerId = response.data[0].id;
  
  response = await request('GET', `/api/admin/customers/${customerId}`, {
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.id) throw new Error('Should return customer data');
  if (!response.data.phone) throw new Error('Customer should have phone');
});

// Excel Export
suite.test('GET /api/admin/customers/export/excel - Export customers to Excel', async () => {
  const response = await request('GET', '/api/admin/customers/export/excel', {
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  // Response should be binary buffer or have file extension indicator
  if (!response.data) throw new Error('Excel export is empty');
});

suite.test('GET /api/admin/orders/export/excel - Export orders to Excel', async () => {
  const response = await request('GET', '/api/admin/orders/export/excel', {
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data) throw new Error('Excel export is empty');
});

suite.test('GET /api/admin/payments/export/excel - Export payments to Excel', async () => {
  const response = await request('GET', '/api/admin/payments/export/excel', {
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data) throw new Error('Excel export is empty');
});

// Customer Search/Filter
suite.test('GET /api/admin/customers?search=Ahmed - Search customers by name', async () => {
  const response = await request('GET', '/api/admin/customers?search=Ahmed', {
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!Array.isArray(response.data)) throw new Error('Should return array');
});

    // Run all tests
    await suite.run();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

runTests();
