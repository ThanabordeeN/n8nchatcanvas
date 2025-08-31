// Simple test script to verify API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check response:', healthData);

    // Test creating a session
    console.log('\n2. Testing session creation...');
    const sessionResponse = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const sessionData = await sessionResponse.json();
    console.log('Session creation response:', sessionData);

    const sessionId = sessionData.sessionId;

    // Test sending a message
    console.log('\n3. Testing chat message...');
    const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: 'Hello, this is a test message',
        sessionId: sessionId
      })
    });
    const chatData = await chatResponse.json();
    console.log('Chat response:', chatData);

    // Test getting messages
    console.log('\n4. Testing message retrieval...');
    const messagesResponse = await fetch(`${BASE_URL}/api/sessions/${sessionId}/messages`);
    const messagesData = await messagesResponse.json();
    console.log('Messages response:', messagesData);

    console.log('\n✅ All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
