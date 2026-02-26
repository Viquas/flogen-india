# Run this command to send data to your local WebGen instance
curl -X POST http://localhost:3000/api/webhooks/ingest \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
