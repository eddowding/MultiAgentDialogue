# Multi-Agent AI Conversation Platform

A dynamic platform enabling intelligent interactions between AI personas using multiple AI models, with advanced conversation management and flow control.

## Features

- 🤖 Multi-model AI Integration (OpenAI, xAI, Google AI)
- 🎭 Dynamic Persona Management
- 💬 Structured Conversation Control
- 📊 Progress Tracking
- 📥 Conversation Export
- 🔄 Real-time Updates
- 🎨 Beautiful UI with Tailwind CSS

## Technology Stack

- **Frontend**: TypeScript, React, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API, xAI API, Google AI API

## Prerequisites

- Node.js 18+
- PostgreSQL database
- API keys for AI services:
  - OpenAI API key
  - xAI API key
  - Google AI API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/dbname
   OPENAI_API_KEY=your_openai_api_key
   XAI_API_KEY=your_xai_api_key
   GOOGLE_API_KEY=your_google_api_key
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage Guide

### Creating Personas

1. Navigate to the home page
2. Use the persona form to create AI personas:
   - Name: Identity of the AI agent
   - Background: Character context and history
   - Goal: Objective in the conversation
   - Model: Select from available AI models

### Managing Conversations

1. Create at least two personas
2. Use the conversation controls to:
   - Select the first speaker
   - Set maximum turns
   - Customize system prompt
   - Start conversation
   - Control turn progression
   - Export conversation history

### Conversation Flow

- Conversations follow a structured turn-based system
- Each persona responds based on:
  - Their background and goals
  - Previous conversation context
  - System prompt guidance
- Turn limits prevent endless conversations
- Export functionality saves conversation history

## API Documentation

### Personas

```typescript
POST /api/personas
GET /api/personas
PATCH /api/personas/:id
DELETE /api/personas
```

### Conversations

```typescript
POST /api/conversations
GET /api/conversations/current
POST /api/conversations/:id/next
DELETE /api/conversations
```

## Data Models

### Persona

```typescript
interface Persona {
  id: number;
  name: string;
  background: string;
  goal: string;
  modelType: string;
}
```

### Conversation

```typescript
interface Conversation {
  id: number;
  status: string;
  currentSpeakerId: number;
  maxTurns: number;
  currentTurn: number;
  systemPrompt: string;
}
```

## AI Models

### OpenAI Models
- GPT-4o (Latest)
- GPT-4 Turbo
- GPT-4
- GPT-3.5 Turbo

### xAI Models
- Grok 2
- Grok 2 Vision
- Grok Beta
- Grok Vision Beta

### Google AI Models
- Gemini Pro
- Gemini Pro Vision
- Gemini Ultra

## Development Guidelines

### Code Structure

- `client/`: Frontend React application
- `server/`: Express.js backend
- `shared/`: Shared types and schemas
- `lib/`: Utility functions and API clients

### Best Practices

1. Use TypeScript for type safety
2. Follow RESTful API design
3. Implement proper error handling
4. Maintain consistent code style
5. Write clear documentation
6. Use proper Git workflow

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For support, please open an issue in the repository.
