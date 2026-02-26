// Test script for OpenClaw agent ingestion
// Run with: node scripts/test-openclaw-ingest.js

const openClawPayload = {
  "businessName": "TechVentures Inc",
  "description": "A cutting-edge technology consulting firm specializing in AI solutions and digital transformation.",
  "services": [
    "AI Consulting",
    "Cloud Migration",
    "Custom Software Development",
    "Data Analytics"
  ],
  "contactInfo": {
    "email": "hello@techventures.com",
    "phone": "+1-555-TECH",
    "website": "https://techventures.com"
  }
};

async function testOpenClawIngest() {
    const baseUrl = 'http://localhost:3000/api/webhooks/ingest';

    console.log('🚀 Simulating OpenClaw Agent sending data to WebGen...');
    console.log('Payload:', JSON.stringify(openClawPayload, null, 2));

    try {
        const startTime = Date.now();
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(openClawPayload)
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        if (response.ok) {
            const result = await response.json();
            console.log('\n✅ Success! Webhook accepted the data.');
            console.log(`⏱️ Response time: ${duration}ms`);
            console.log('Response:', JSON.stringify(result, null, 2));
            console.log('\n👉 The project has been queued. The AI generator should be processing it now.');
            console.log('   Check the Dashboard to see the new project.');
        } else {
            console.error('\n❌ Error: Webhook rejected the data.');
            console.error(`Status: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Response:', errorText);
        }
    } catch (error) {
        console.error('\n❌ Network Error:', error.message);
        console.error('Make sure the Next.js server is running on http://localhost:3000');
    }
}

testOpenClawIngest();
