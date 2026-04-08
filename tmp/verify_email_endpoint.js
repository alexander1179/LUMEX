const axios = require('axios');

async function testEndpoint() {
  try {
    const response = await axios.post('http://localhost:3000/send-payment-email', {
      email: 'test@example.com',
      userName: 'Test User',
      amount: 10,
      credits: 5,
      paymentId: 'TEST-123'
    });
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Error Response:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testEndpoint();
