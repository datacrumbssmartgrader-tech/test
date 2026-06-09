#!/usr/bin/env node

const { request, waitForServer } = require('./tests/utils.js');

async function test() {
  await waitForServer();
  
  const getRes = await request('GET', '/api/menu', {});
  
  console.log('Status:', getRes.status);
  const items = getRes.data.items || [];
  console.log('Total items:', items.length);
  console.log('\nItems with available=false:');
  const unavailable = items.filter(item => item.available === false || item.available === 'false');
  if (unavailable.length > 0) {
    unavailable.forEach(item => {
      console.log(`  - ${item.name} (available: ${item.available})`);
    });
  } else {
    console.log('  None');
  }
  
  console.log('\nItems with hidden=true:');
  const hidden = items.filter(item => item.hidden === true || item.hidden === 'true');
  if (hidden.length > 0) {
    hidden.forEach(item => {
      console.log(`  - ${item.name} (hidden: ${item.hidden})`);
    });
  } else {
    console.log('  None');
  }
}

test().catch(console.error);
