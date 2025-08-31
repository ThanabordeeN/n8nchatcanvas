import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// SQLite database setup
const dbPath = join(__dirname, '..', 'chat.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Create sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_user BOOLEAN NOT NULL,
      html_content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
    )
  `);

  console.log('Database tables initialized.');
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chat API is running' });
});

// Get all sessions
app.get('/api/sessions', (req, res) => {
  db.all(`
    SELECT s.*, COUNT(m.id) as message_count
    FROM sessions s
    LEFT JOIN messages m ON s.id = m.session_id
    GROUP BY s.id
    ORDER BY s.last_activity DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching sessions:', err);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
    res.json(rows);
  });
});

// Get messages for a specific session
app.get('/api/sessions/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;

  db.all(`
    SELECT * FROM messages
    WHERE session_id = ?
    ORDER BY created_at ASC
  `, [sessionId], (err, rows) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
    res.json(rows);
  });
});

// Create new session
app.post('/api/sessions', (req, res) => {
  const sessionId = 'sess-' + Math.random().toString(36).substring(2, 10);

  db.run(`
    INSERT INTO sessions (id) VALUES (?)
  `, [sessionId], function(err) {
    if (err) {
      console.error('Error creating session:', err);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    res.json({
      sessionId,
      message: 'Session created successfully'
    });
  });
});

// Send message and get response
app.post('/api/chat', async (req, res) => {
  const { chatInput, sessionId } = req.body;

  if (!chatInput || !sessionId) {
    return res.status(400).json({ error: 'chatInput and sessionId are required' });
  }

  try {
    // Update session last activity
    db.run(`
      UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?
    `, [sessionId]);

    // Save user message
    const userMessageId = 'msg-' + Math.random().toString(36).substring(2, 10);
    db.run(`
      INSERT INTO messages (id, session_id, content, is_user)
      VALUES (?, ?, ?, ?)
    `, [userMessageId, sessionId, chatInput, true]);

    // Call n8n webhook
    const n8nResponse = await fetch('https://n8n.2edge.co/webhook-test/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput, sessionId })
    });

    const result = await n8nResponse.json();
    console.log('N8N Response:', result);

    // Process response
    let botResponse = '';
    let htmlContent = null;

    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];
      if (firstItem.output) {
        if (typeof firstItem.output === 'object' && firstItem.output !== null) {
          botResponse = firstItem.output.output || 'ขออภัย ฉันไม่สามารถตอบคำถามนี้ได้ในขณะนี้';
          htmlContent = firstItem.output.html_code;
        } else if (typeof firstItem.output === 'string') {
          botResponse = firstItem.output;
        }
      }
    } else if (result && typeof result === 'object' && !Array.isArray(result)) {
      if ('output' in result && 'html_code' in result) {
        botResponse = result.output;
        htmlContent = result.html_code;
      } else if ('output' in result) {
        if (typeof result.output === 'object' && result.output !== null) {
          botResponse = result.output.output || 'ขออภัย ฉันไม่สามารถตอบคำถามนี้ได้ในขณะนี้';
          htmlContent = result.output.html_code;
        } else if (typeof result.output === 'string') {
          botResponse = result.output;
        }
      }
    } else if (typeof result === 'string') {
      botResponse = result;
    }

    // Ensure botResponse is a string
    if (typeof botResponse === 'object' && botResponse !== null) {
      botResponse = JSON.stringify(botResponse, null, 2);
    } else if (botResponse === null || botResponse === undefined) {
      botResponse = 'ขออภัย ฉันไม่สามารถตอบคำถามนี้ได้ในขณะนี้';
    }

    // Save bot response
    const botMessageId = 'msg-' + Math.random().toString(36).substring(2, 10);
    db.run(`
      INSERT INTO messages (id, session_id, content, is_user, html_content)
      VALUES (?, ?, ?, ?, ?)
    `, [botMessageId, sessionId, botResponse, false, htmlContent]);

    res.json({
      output: botResponse,
      html_code: htmlContent,
      messageId: botMessageId
    });

  } catch (error) {
    console.error('Error processing chat:', error);

    // Save error message
    const errorMessageId = 'msg-' + Math.random().toString(36).substring(2, 10);
    const errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';

    db.run(`
      INSERT INTO messages (id, session_id, content, is_user)
      VALUES (?, ?, ?, ?)
    `, [errorMessageId, sessionId, errorMessage, false]);

    res.status(500).json({
      error: 'Internal server error',
      output: errorMessage
    });
  }
});

// Delete session and all its messages
app.delete('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  db.run(`
    DELETE FROM sessions WHERE id = ?
  `, [sessionId], function(err) {
    if (err) {
      console.error('Error deleting session:', err);
      return res.status(500).json({ error: 'Failed to delete session' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Chat API server running on port ${PORT}`);
});

// Graceful shutdown
let isShuttingDown = false;

process.on('SIGINT', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  db.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  db.close(() => {
    process.exit(1);
  });
});

export default app;
