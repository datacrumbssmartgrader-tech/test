/**
 * Phase E Tests — Orders, Sessions & Customer Matching
 * 
 * Requirements:
 * - npm run dev (server running on port 3000)
 * - npm run seed (database seeded)
 * - Phase D complete (tables working)
 * 
 * Test: npm run test:phase-e
 */

const { request, login, TestSuite, waitForServer } = require('./utils.js');

async function runTests() {
  try {
    // Wait for server to be ready
    await waitForServer();

    const suite = new TestSuite('Phase E — Orders & Sessions');

let adminCookies, adminToken, sessionId, orderId, tableId, qrToken, customerId;

// Setup: Login as admin
suite.test('Setup: Admin Login', async () => {
  const response = await login('1234');
  if (!response.user || !response.cookies) throw new Error('Login failed');
  adminCookies = response.cookies;
  adminToken = response.token;
});

// Get table QR token for customer flow
suite.test('Setup: Get valid QR token from table', async () => {
  const response = await request('GET', '/api/admin/tables', {
    cookies: adminCookies,
  });
  if (response.status !== 200) throw new Error('Failed to get tables');
  
  const table = response.data[0];
  tableId = table.id;
  qrToken = table.qr_token;
  if (!qrToken) throw new Error('No QR token available');
});

// Customer Matching
suite.test('POST /api/sessions - Create session with customer match', async () => {
  if (!qrToken) throw new Error('qrToken not set');
  
  const response = await request('POST', '/api/sessions', {
    body: {
      qr_token: qrToken,
      customer_name: 'Ahmed Khan',
      customer_phone: '03001234567',
      customer_email: 'ahmed@example.com',
    },
  });
  
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Expected 201/200, got ${response.status}`);
  }
  if (!response.data.session_id) throw new Error('Should return session_id');
  if (!response.data.customer_id) throw new Error('Should return customer_id');
  
  sessionId = response.data.session_id;
  customerId = response.data.customer_id;
});

// Order Creation
suite.test('POST /api/orders - Place order for session', async () => {
  if (!sessionId) throw new Error('sessionId not set');
  
  // Get a menu item ID first
  const menuResponse = await request('GET', '/api/menu', {});
  if (menuResponse.status !== 200) throw new Error('Failed to get menu');
  if (!menuResponse.data.items || menuResponse.data.items.length === 0) throw new Error('No menu items');
  
  const itemId = menuResponse.data.items[0].id;
  
  const response = await request('POST', '/api/orders', {
    body: {
      session_id: sessionId,
      items: [
        { menu_item_id: itemId, quantity: 2, special_instructions: 'Less spicy' },
      ],
    },
  });
  
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Expected 201/200, got ${response.status}`);
  }
  if (!response.data.order_id) throw new Error('Should return order_id');
  
  orderId = response.data.order_id;
});

// Order Status Updates
suite.test('GET /api/sessions/:session_id/orders - Retrieve session orders', async () => {
  if (!sessionId) throw new Error('sessionId not set');

  const response = await request('GET', `/api/sessions/${sessionId}/orders`, {});
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  // Route returns { closed_at, orders } shape (Issue 15)
  if (!response.data || !Array.isArray(response.data.orders)) throw new Error('Should return { orders: [] }');
  if (response.data.orders.length === 0) throw new Error('Should have at least one order');
});

suite.test('PATCH /api/orders/:id - Update order status to "kitchen"', async () => {
  if (!orderId) throw new Error('orderId not set');
  
  const response = await request('PATCH', `/api/orders/${orderId}`, {
    body: { status: 'kitchen' },
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.data.status !== 'kitchen') throw new Error('Status should be "kitchen"');
});

suite.test('PATCH /api/orders/:id - Update order status to "ready"', async () => {
  if (!orderId) throw new Error('orderId not set');
  
  const response = await request('PATCH', `/api/orders/${orderId}`, {
    body: { status: 'ready' },
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.data.status !== 'ready') throw new Error('Status should be "ready"');
});

suite.test('PATCH /api/orders/:id - Update order status to "served"', async () => {
  if (!orderId) throw new Error('orderId not set');
  
  const response = await request('PATCH', `/api/orders/${orderId}`, {
    body: { status: 'served' },
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.data.status !== 'served') throw new Error('Status should be "served"');
});

suite.test('GET /api/admin/customers - List all customers', async () => {
  const response = await request('GET', '/api/admin/customers', {
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
