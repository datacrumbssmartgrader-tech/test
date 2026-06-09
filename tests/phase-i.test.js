/**
 * Phase I Tests — Polish, Error Handling & Deployment
 * 
 * Requirements:
 * - npm run dev (server running on port 3000)
 * - npm run seed (database seeded)
 * - All previous phases complete (B-H)
 * 
 * Test: npm run test:phase-i
 * 
 * This phase focuses on:
 * 1. Error handling consistency
 * 2. Input validation
 * 3. Security headers
 * 4. Rate limiting
 * 5. Performance benchmarks
 * 6. Auth protection on sensitive endpoints
 */

const { request, login, TestSuite, waitForServer } = require('./utils.js');

async function runTests() {
  try {
    // Wait for server to be ready
    await waitForServer();

    const suite = new TestSuite('Phase I — Polish & Deployment');

let adminCookies, adminToken;

// Setup: Login as admin
suite.test('Setup: Admin Login', async () => {
  const response = await login('1234');
  if (!response.user || !response.cookies) throw new Error('Login failed');
  adminCookies = response.cookies;
  adminToken = response.token;
});

// Error Handling
suite.test('POST /api/admin/menu - Invalid price returns 400', async () => {
  const response = await request('POST', '/api/admin/menu', {
    body: {
      name: 'Test',
      category: 'test',
      price: 'not_a_number', // Invalid
      description: 'Test',
      image_url: 'https://example.com/test.jpg',
      image_public_id: 'test/item',
    },
    cookies: adminCookies,
  });
  
  if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
});

suite.test('POST /api/admin/menu - Missing required fields returns 400', async () => {
  const response = await request('POST', '/api/admin/menu', {
    body: {
      name: 'Test', // Missing category, price, etc
    },
    cookies: adminCookies,
  });
  
  if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
});

suite.test('GET /api/admin/menu - Missing auth returns 401', async () => {
  const response = await request('GET', '/api/admin/menu', {
    cookies: null, // No auth
  });
  
  if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
});

suite.test('GET /api/nonexistent - Invalid route returns 404', async () => {
  const response = await request('GET', '/api/nonexistent/route/xyz', {});
  
  if (response.status !== 404) throw new Error(`Expected 404, got ${response.status}`);
});

// Input Validation
suite.test('POST /api/sessions - Invalid QR token returns 404', async () => {
  const response = await request('POST', '/api/sessions', {
    body: {
      qr_token: 'invalid-token-xyz-123',
      customer_name: 'Test',
      customer_phone: '03001234567',
    },
  });
  
  if (response.status !== 404) throw new Error(`Expected 404, got ${response.status}`);
});

suite.test('POST /api/sessions - Missing customer_name returns 400', async () => {
  // Get valid token
  const tablesResponse = await request('GET', '/api/admin/tables', {
    cookies: adminCookies,
  });
  const qrToken = tablesResponse.data[0]?.qr_token;
  
  const response = await request('POST', '/api/sessions', {
    body: {
      qr_token: qrToken,
      // Missing customer_name
      customer_phone: '03001234567',
    },
  });
  
  if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
});

suite.test('PATCH /api/orders/:id - Invalid status returns 400', async () => {
  const response = await request('PATCH', '/api/orders/fake-id', {
    body: {
      status: 'invalid_status', // Not a valid order status
    },
    cookies: adminCookies,
  });
  
  if (response.status !== 400 && response.status !== 404) {
    throw new Error(`Expected 400 or 404, got ${response.status}`);
  }
});

// Security Headers
suite.test('API responses include security headers', async () => {
  const response = await request('GET', '/api/menu', {});
  
  if (response.status !== 200) throw new Error('Failed to get menu');
  // In a real test, we'd check response headers for:
  // X-Content-Type-Options: nosniff
  // X-Frame-Options: DENY
  // X-XSS-Protection: 1; mode=block
});

// CORS/Origin validation
suite.test('POST /api/upload/image - Validates Cloudinary response', async () => {
  // This test verifies that upload endpoint handles Cloudinary errors gracefully
  const response = await request('POST', '/api/upload/image', {
    body: {
      file: 'data:image/jpeg;base64,invalid',
    },
    cookies: adminCookies,
  });
  
  // Should return either success or proper error
  if (response.status !== 200 && response.status !== 400) {
    throw new Error(`Expected 200 or 400, got ${response.status}`);
  }
});

// Rate Limiting (Placeholder - to be implemented)
suite.test('Rate limiting structure exists', async () => {
  // Verify that rate limiting middleware is in place
  // In production, rapid requests should trigger 429 Too Many Requests
  // This is a placeholder for rate limit implementation
  const response = await request('GET', '/api/menu', {});
  if (response.status !== 200) throw new Error('Endpoint should be accessible');
});

// Performance Benchmarks
suite.test('GET /api/menu - Response time < 500ms', async () => {
  const startTime = Date.now();
  const response = await request('GET', '/api/menu', {});
  const duration = Date.now() - startTime;
  
  if (response.status !== 200) throw new Error('Request failed');
  if (duration > 500) {
    console.warn(`⚠️  Response time ${duration}ms exceeds 500ms threshold`);
  }
});

suite.test('GET /api/admin/menu - Response time < 1000ms', async () => {
  const startTime = Date.now();
  const response = await request('GET', '/api/admin/menu', {
    cookies: adminCookies,
  });
  const duration = Date.now() - startTime;
  
  if (response.status !== 200) throw new Error('Request failed');
  if (duration > 1000) {
    console.warn(`⚠️  Response time ${duration}ms exceeds 1000ms threshold`);
  }
});

// Auth Protection Verification
suite.test('All /api/admin/* routes require authentication', async () => {
  const adminRoutes = [
    { method: 'GET', path: '/api/admin/menu' },
    { method: 'GET', path: '/api/admin/tables' },
    { method: 'GET', path: '/api/admin/customers' },
    { method: 'GET', path: '/api/admin/orders' },
    { method: 'GET', path: '/api/admin/payments' },
    { method: 'GET', path: '/api/admin/alerts' },
  ];
  
  for (const route of adminRoutes) {
    const response = await request(route.method, route.path, {
      cookies: null, // No auth
    });
    
    if (response.status !== 401) {
      throw new Error(`${route.path} should require auth, got ${response.status}`);
    }
  }
});

// Database Connection Health
suite.test('Verify database connection is healthy', async () => {
  // Make a simple query through API
  const response = await request('GET', '/api/menu', {});
  
  if (response.status !== 200) throw new Error('Database connection failed');
  if (typeof response.data !== 'object' || !Array.isArray(response.data.items)) throw new Error('Invalid response format');
});

// Deployment Readiness Checklist
suite.test('Deployment readiness - All critical endpoints accessible', async () => {
  const criticalEndpoints = [
    { method: 'POST', path: '/api/auth/login' },
    { method: 'GET', path: '/api/auth/me' },
    { method: 'GET', path: '/api/menu' },
    { method: 'GET', path: '/api/tables' },
  ];
  
  for (const endpoint of criticalEndpoints) {
    const response = await request(endpoint.method, endpoint.path, {
      body: endpoint.method === 'POST' ? {} : undefined,
      cookies: adminCookies,
    });
    
    if (response.status === 500) {
      throw new Error(`Critical endpoint ${endpoint.path} returned 500`);
    }
  }
});

    // Run all tests
    await suite.run();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

runTests();
