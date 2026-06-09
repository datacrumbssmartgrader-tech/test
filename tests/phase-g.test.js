/**
 * Phase G Tests — Alerts & Payments
 * 
 * Requirements:
 * - npm run dev (server running on port 3000)
 * - npm run seed (database seeded)
 * - Phase E complete (orders created)
 * 
 * Test: npm run test:phase-g
 */

const { request, login, TestSuite, waitForServer } = require('./utils.js');

async function runTests() {
  try {
    // Wait for server to be ready
    await waitForServer();

    const suite = new TestSuite('Phase G — Alerts & Payments');

let adminCookies, adminToken, sessionId, orderId, alertId, paymentId;

// Setup: Login as admin
suite.test('Setup: Admin Login', async () => {
  const response = await login('1234');
  if (!response.user || !response.cookies) throw new Error('Login failed');
  adminCookies = response.cookies;
  adminToken = response.token;
});

// Setup: Create a session and order
suite.test('Setup: Create session and order', async () => {
  // Get QR token
  let response = await request('GET', '/api/admin/tables', {
    cookies: adminCookies,
  });
  const qrToken = response.data[0]?.qr_token;
  
  // Create session
  response = await request('POST', '/api/sessions', {
    body: {
      qr_token: qrToken,
      customer_name: 'Ali Ahmed',
      customer_phone: '03009876543',
    },
  });
  sessionId = response.data.session_id;
  
  // Create order
  const menuResponse = await request('GET', '/api/menu', {});
  const itemId = menuResponse.data.items[0].id;
  
  response = await request('POST', '/api/orders', {
    body: {
      session_id: sessionId,
      items: [{ menu_item_id: itemId, quantity: 1 }],
    },
  });
  orderId = response.data.order_id;
});

// Alerts
suite.test('POST /api/admin/alerts - Create waiter alert', async () => {
  if (!sessionId) throw new Error('sessionId not set');
  
  const response = await request('POST', '/api/admin/alerts', {
    body: {
      session_id: sessionId,
      alert_type: 'waiter',
      message: 'Customer needs assistance',
    },
    cookies: adminCookies,
  });
  
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Expected 201/200, got ${response.status}`);
  }
  if (!response.data.alert_id) throw new Error('Should return alert_id');
  
  alertId = response.data.alert_id;
});

suite.test('GET /api/admin/alerts - List active alerts', async () => {
  const response = await request('GET', '/api/admin/alerts', {
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!Array.isArray(response.data)) throw new Error('Should return array');
});

suite.test('PATCH /api/admin/alerts/:id - Mark alert as resolved', async () => {
  if (!alertId) throw new Error('alertId not set');
  
  const response = await request('PATCH', `/api/admin/alerts/${alertId}`, {
    body: { status: 'resolved' },
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.data.status !== 'resolved') throw new Error('Alert should be resolved');
});

suite.test('DELETE /api/admin/alerts/:id - Delete alert', async () => {
  if (!alertId) throw new Error('alertId not set');
  
  // First create a new alert to delete
  const createResponse = await request('POST', '/api/admin/alerts', {
    body: {
      session_id: sessionId,
      alert_type: 'bill',
      message: 'To be deleted',
    },
    cookies: adminCookies,
  });
  
  const idToDelete = createResponse.data.alert_id;
  const response = await request('DELETE', `/api/admin/alerts/${idToDelete}`, {
    cookies: adminCookies,
  });
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Expected 200/204, got ${response.status}`);
  }
});

// Payments
suite.test('POST /api/sessions/:id/payment - Record payment for session', async () => {
  if (!sessionId) throw new Error('sessionId not set');
  
  const response = await request('POST', `/api/sessions/${sessionId}/payment`, {
    body: {
      amount: 5000,
      payment_method: 'cash',
      notes: 'Paid in full',
    },
  });
  
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Expected 201/200, got ${response.status}`);
  }
  if (!response.data.payment_id) throw new Error('Should return payment_id');
  if (response.data.amount !== 5000) throw new Error('Amount should be 5000');
  
  paymentId = response.data.payment_id;
});

suite.test('GET /api/admin/payments - List all payments', async () => {
  const response = await request('GET', '/api/admin/payments', {
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!Array.isArray(response.data)) throw new Error('Should return array');
});

suite.test('GET /api/sessions/:id/payment - Get session payment', async () => {
  if (!sessionId) throw new Error('sessionId not set');
  
  const response = await request('GET', `/api/sessions/${sessionId}/payment`, {});
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.payment_id) throw new Error('Should return payment data');
});

suite.test('PATCH /api/admin/payments/:id - Update payment status', async () => {
  if (!paymentId) throw new Error('paymentId not set');
  
  const response = await request('PATCH', `/api/admin/payments/${paymentId}`, {
    body: { status: 'confirmed' },
    cookies: adminCookies,
  });
  
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.data.status !== 'confirmed') throw new Error('Status should be confirmed');
});

    // Run all tests
    await suite.run();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

runTests();
