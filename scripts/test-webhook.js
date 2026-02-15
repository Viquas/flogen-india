// Test script for webhook endpoint
// Run with: node scripts/test-webhook.js

const testPayload = {
    businessName: "Acme Corp",
    description: "A leading provider of innovative solutions",
    services: ["Web Development", "Mobile Apps", "Cloud Consulting"],
    contactInfo: {
        email: "contact@acme.com",
        phone: "+1-555-123-4567",
        address: "123 Main St, Tech City",
        website: "https://acme.com"
    }
};

const testBatchPayload = [
    {
        businessName: "Tech Solutions Inc",
        description: "Enterprise software development",
        services: ["ERP Systems", "CRM Integration"],
        contactInfo: { email: "info@techsolutions.com" }
    },
    {
        businessName: "Creative Studio",
        description: "Digital marketing and design agency",
        services: ["Branding", "Social Media", "Website Design"],
        contactInfo: { email: "hello@creativestudio.com" }
    }
];

async function testWebhook() {
    const baseUrl = 'http://localhost:3000/api/webhooks/ingest';

    console.log('Testing single object payload...');
    try {
        const response1 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });
        const result1 = await response1.json();
        console.log('Single object result:', result1);
    } catch (error) {
        console.error('Single object error:', error);
    }

    console.log('\nTesting batch payload...');
    try {
        const response2 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testBatchPayload)
        });
        const result2 = await response2.json();
        console.log('Batch result:', result2);
    } catch (error) {
        console.error('Batch error:', error);
    }
}

testWebhook();
