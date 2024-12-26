# Real-time Twilio Voice Assistant

A real-time voice assistant powered by Twilio and OpenAI, featuring WebSocket communication for live transcription and responses.

## Features

- Real-time voice call handling with OpenAI integration
- Live transcription and AI responses via WebSocket
- Easy setup wizard with configuration checklist
- Twilio webhook integration
- Modern UI built with Next.js and Tailwind CSS

## System Requirements

- Node.js 18+
- npm or yarn
- ngrok for local development

## Project Structure

```
realtime-twilio/
├── webapp/               # Next.js frontend application
│   ├── app/             # Next.js app router
│   ├── components/      # React components
│   └── lib/            # Utility functions
│
└── websocket-server/    # TypeScript WebSocket server
    └── src/            # Server source code
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/entranoweb/realtime-twilio.git
   cd realtime-twilio
   ```

2. Install dependencies:
   ```bash
   # Install webapp dependencies
   cd webapp
   npm install

   # Install websocket server dependencies
   cd ../websocket-server
   npm install
   ```

3. Configure environment variables:

   **webapp/.env:**
   ```
   TWILIO_ACCOUNT_SID="your_account_sid"
   TWILIO_AUTH_TOKEN="your_auth_token"
   ```

   **websocket-server/.env:**
   ```
   OPENAI_API_KEY="your_openai_key"
   PUBLIC_URL="your_ngrok_url"
   ```

4. Start the development servers:

   ```bash
   # Start websocket server
   cd websocket-server
   npm run dev

   # In another terminal, start webapp
   cd webapp
   npm run dev
   ```

5. Start ngrok:
   ```bash
   ngrok http 8081
   ```

6. Update the `PUBLIC_URL` in websocket-server/.env with your ngrok URL

7. Configure Twilio webhook:
   - Go to Twilio Console > Phone Numbers > Manage > Active Numbers
   - Set the webhook URL to your ngrok URL + "/twiml"

## Development

- Frontend runs on http://localhost:3000
- WebSocket server runs on http://localhost:8081
- Use ngrok for exposing the webhook endpoint

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
