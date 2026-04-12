# Bicol University Campus Map - AI Navigation System

An intelligent campus navigation system for Bicol University with AI-powered voice commands using ChatGPT.

## Features

- 🗺️ **Interactive Campus Map** - Navigate the Bicol University campus with an interactive map
- 🎤 **Voice Commands** - Use voice to search for destinations (supports browser speech recognition and HuggingFace FastAPI)
- 🤖 **ChatGPT AI Assistant** - Intelligent voice command processing with OpenAI's ChatGPT for natural language understanding
- 🚶 **Route Planning** - Get walking and driving directions between campus locations
- 📍 **Preset Destinations** - Quick access to common campus buildings and facilities
- 📱 **Mobile Friendly** - Responsive design for mobile devices
- 🔄 **QR Code Sharing** - Share routes via QR codes

## AI Voice Assistant

The app integrates ChatGPT to provide intelligent conversational navigation:

- **Conversational Interface**: Click "AI Voice Command" to open a chat window where you can have natural conversations with the AI assistant
- **Natural Language Understanding**: Say "take me to the gym" or "where is the library" and ChatGPT will understand your intent
- **Ongoing Conversation**: Ask follow-up questions, get building information, or request clarifications in a natural chat flow
- **Voice & Text Input**: Use voice commands or type your questions directly in the chat interface
- **Contextual Responses**: Get helpful clarifications when your request is ambiguous
- **Smart Navigation**: AI can trigger navigation to destinations based on your conversation
- **Fallback Support**: If ChatGPT is unavailable, falls back to basic keyword matching

### Conversation Features

- **Multi-turn dialogue**: Continue conversations with context awareness
- **Building information**: Ask about facilities, locations, and campus features
- **Flexible interaction**: Switch between voice input and typing seamlessly
- **Visual feedback**: See your conversation history with timestamps
- **Suggested questions**: Quick-start prompts to get you started

### How It Works

1. User clicks **"AI Voice Command"** button to open the conversation modal
2. User can either:
   - **Type a message** in the text input, or
   - **Click the microphone icon** to speak
3. For voice input:
   - Audio is transcribed using either HuggingFace FastAPI or browser Speech Recognition
   - Transcribed text is sent as a message
4. The message is sent to ChatGPT with full conversation context
5. ChatGPT responds based on:
   - Conversation history
   - Available campus destinations
   - Current navigation status
6. If the AI detects a navigation request, it automatically triggers navigation to that location
7. User can continue the conversation with follow-up questions or new requests

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd bu-map
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory and add your API keys:

```env
# Optional: Public URL for QR code sharing
VITE_PUBLIC_BASE_URL=http://192.168.1.2:5177

# Optional: HuggingFace API for audio transcription
VITE_FASTAPI_TRANSCRIBE_URL=https://veccode-wish.hf.space/transcribe
VITE_HF_API_KEY=hf_your_huggingface_api_key_here

# Required for AI voice assistant: OpenAI API Key
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Getting API Keys:**
- **OpenAI API Key**: Sign up at [OpenAI Platform](https://platform.openai.com/api-keys) and create an API key
- **HuggingFace API Key** (optional): Get from [HuggingFace Settings](https://huggingface.co/settings/tokens)

### 4. Run the development server

```bash
npm run dev
```

TheThe AI conversation modal opens
3. Click the microphone button in the chat to speak or type your message
4. Speak clearly or type: "Take me to [destination]" or "Where is [building name]"
5. The AI assistant will respond and can navigate you to the location

**Example Interactions:**
- "Take me to the gym" → AI navigates to Gym B
- "Where can I find the library?" → AI provides info and offers navigation
- "What buildings are available?" → AI lists all campus locations
- "Tell me about the Computer Studies building" → AI provides details
- "I need to go to class" → AI asks which building and helps clarifydestination]" or "Where is [building name]"
3. The AI assistant will process your command and navigate to the location

**Example Commands:**
- "Take me to the gym"
- "I need to go to the library"
- "Where is the College of Science?"
- "Navigate to the guard house"

### Without AI (Keyword Matching)

If you don't configure the OpenAI API key, the app will still work with basic keyword matching against preset destinations.

## Technology Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Leaflet** for interactive maps
- **OpenAI API** (ChatGPT) for AI-powered voice commands
- **Web Speech API** for browser-based voice recognition
- **TailwindCSS** for styling
- **React Compiler** for optimized performance

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Development Commands

```bash
npm run dev          # Start development server
npm run dev:public   # Start dev server accessible on local network
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Project Structure

```
src/
├── components/        # React components
│   ├── CampusMapView.tsx
│   ├── FloatingActionButtons.tsx
│   └── ...
├── services/         # Business logic and API services
│   ├── chatgpt.ts          # ChatGPT integration
│   ├── routePlanner.ts     # Route planning logic
│   └── ...
├── utils/            # Utility functions
│   ├── voiceRecognition.ts # Voice capture and transcription
│   └── ...
├── types/            # TypeScript type definitions
└── data/             # Static data (preset destinations)
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
