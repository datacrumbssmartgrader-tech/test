#!/usr/bin/env node

const { request, waitForServer } = require('./tests/utils.js');

async function test() {
  await waitForServer();
  
  const getRes = await request('GET', '/api/menu', {});
  
  console.log('Status:', getRes.status);
  const items = getRes.data.items || [];
  console.log('Total items:', items.length);
  if (items.length > 0) {
    console.log('\nFirst item properties:');
    const item = items[0];
    console.log(JSON.stringify(item, null, 2));
  }
}

test().catch(console.error);
