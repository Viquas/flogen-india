
const payload = {
    businessName: "Test Ingest",
    description: "Testing the ingestion pipeline",
    services: ["Testing"],
    industry: "QA"
};

async function testIngest() {
    try {
        const response = await fetch('http://localhost:3000/api/webhooks/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testIngest();
