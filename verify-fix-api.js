const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch in newer Node
// If node-fetch isn't available, we'll use http module or just rely on native fetch if Node 18+

async function runTest() {
    try {
        console.log('Triggering test generation...');
        // We need the app to be running for this to work via localhost
        // But if the app isn't running, we can't hit the API.
        // Alternatively, we can invoke the handler directly if we mock the request, but that's complex with Next.js

        // Let's assume the user has the app running on localhost:3000
        const response = await fetch('http://localhost:3000/api/generate/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mode: 'json',
                businessName: 'Test Corp',
                description: 'A test business',
                services: ['Testing', 'Verification'],
                contactInfo: { email: 'test@example.com' }
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Success:', data);
        } else {
            console.error('Error:', response.status, await response.text());
        }
    } catch (error) {
        console.error('Failed to run test:', error.message);
        console.log('Ensure the server is running on localhost:3000');
    }
}

// Since we can't guarantee server is running, maybe we just check the file system directly?
// No, the save happens in the API route.
// If I can't run the server, I can't verify the API.
// BUT I can verify the `saveCodeToDisk` function separately!

const { saveCodeToDisk } = require('./lib/file-utils'); // This might fail due to TS/ESM import issues in plain JS
// So let's write a simple TS script and run it with ts-node if available, or just use the logic directly.
