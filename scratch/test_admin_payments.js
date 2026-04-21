const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:3000/admin/payments');
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error fetching admin/payments:', err.message);
  }
}
test();
