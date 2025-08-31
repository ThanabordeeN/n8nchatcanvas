# Chat Application with SQLite Backend

A full-stack chat application with SQLite database for storing chat history and sessions.

## Features

- **Real-time chat** with N8N webhook integration
- **SQLite database** for persistent chat history
- **Session management** with unique session IDs
- **HTML canvas rendering** for dynamic content
- **Modern React frontend** with Shadcn UI components
- **Express.js backend** with RESTful API

## Database Schema

### Sessions Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  html_content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
);
```

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Sessions
- `GET /api/sessions` - Get all sessions with message counts
- `POST /api/sessions` - Create new session
- `DELETE /api/sessions/:sessionId` - Delete session and all messages

### Messages
- `GET /api/sessions/:sessionId/messages` - Get messages for a session
- `POST /api/chat` - Send message and get AI response

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start both frontend and backend:
```bash
npm run dev:full
```

Or run them separately:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

## Usage

1. **Frontend** will be available at `http://localhost:5173/`
2. **Backend API** will be available at `http://localhost:3001/`

### Chat Features

- **New Session**: Automatically created when you start chatting
- **Chat History**: Persisted in SQLite database
- **HTML Rendering**: Dynamic content displayed in canvas
- **Session Management**: Each conversation is stored separately

### Database

The SQLite database file `chat.db` will be created automatically in the project root when you first run the server.

## Development

### Frontend Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend Scripts
- `npm run server` - Start Express server
- `npm run server:dev` - Start with auto-reload (requires nodemon)

### Full Stack
- `npm run dev:full` - Start both frontend and backend concurrently

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3001
NODE_ENV=development
```

## Project Structure

```
n8nchatcanvas/
├── server/
│   └── server.js          # Express.js backend server
├── src/
│   ├── components/
│   │   ├── ui/           # Shadcn UI components
│   │   └── Chat.tsx      # Main chat component
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── App.tsx           # Main React app
│   └── index.css         # Tailwind CSS styles
├── chat.db               # SQLite database (auto-generated)
├── package.json
└── vite.config.ts
```

## Technologies Used

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn UI** for components
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **SQLite3** for database
- **CORS** for cross-origin requests
- **Helmet** for security

### Database
- **SQLite** for data persistence
- Automatic table creation
- Foreign key relationships
- Timestamp tracking
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
