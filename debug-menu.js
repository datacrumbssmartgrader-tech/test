#!/usr/bin/env node

const { request, login, waitForServer } = require('./tests/utils.js');

async function test() {
  await waitForServer();
  const session = await login('1234');
  
  // Create
  const createRes = await request('POST', '/api/admin/menu', {
    body: {
      name: 'Test',
      category: 'grills',
      price: 1000,
      description: 'Test',
      image_url: 'https://example.com/img.jpg',
      image_public_id: 'test-123',
    },
    cookies: session.cookies,
  });
  
  const itemId = createRes.data.item.id;
  console.log('Created item:', itemId);
  
  // Update
  const url = `/api/admin/menu/${itemId}`;
  console.log('Calling PUT:', url);
  
  const updateRes = await request('PUT', url, {
    body: {
      name: 'Updated',
      category: 'grills',
      price: 2000,
      description: 'Updated',
      image_url: 'https://example.com/img2.jpg',
      image_public_id: 'test-456',
    },
    cookies: session.cookies,
  });
  
  console.log('Update Status:', updateRes.status);
  console.log('Update Response:', JSON.stringify(updateRes.data, null, 2));
}

test().catch(console.error);
