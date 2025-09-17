import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30 // 30 requests per minute
});
app.use(limiter);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = admin.firestore();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Auth middleware
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No authentication token' });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// Chat endpoint (streaming)
app.post('/api/chat', authenticate, async (req, res) => {
  try {
    const { prompt, chatId } = req.body;
    const userId = req.user.uid;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Store user message
    const chatRef = db.collection('users').doc(userId)
      .collection('chats').doc(chatId);
    
    await chatRef.set({
      messages: admin.firestore.FieldValue.arrayUnion({
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      }),
      updatedAt: Date.now()
    }, { merge: true });

    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Generate streaming response
    const result = await model.generateContentStream(prompt);
    let fullResponse = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // Store AI response
    await chatRef.set({
      messages: admin.firestore.FieldValue.arrayUnion({
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
      }),
      updatedAt: Date.now()
    }, { merge: true });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Get chat history
app.get('/api/chats', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const chatsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('chats')
      .orderBy('updatedAt', 'desc')
      .get();

    const chats = [];
    chatsSnapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() });
    });

    res.json(chats);
  } catch (error) {
    console.error('Get Chats Error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create new chat
app.post('/api/chats/new', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const chatRef = db.collection('users').doc(userId)
      .collection('chats').doc();

    await chatRef.set({
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    res.json({ id: chatRef.id });
  } catch (error) {
    console.error('New Chat Error:', error);
    res.status(500).json({ error: 'Failed to create new chat' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});