// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './environment-local.env' });

const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "jokesdb";
const COLLECTION_NAME = process.env.COLLECTION_NAME || "jokestable";

// Enable CORS ADDED
app.use(cors());

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
  console.log('✅ Created uploads directory');
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// MongoDB client
const client = new MongoClient(MONGO_URI);

async function startServer() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("✅ MongoDB connected successfully!");
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Seed sample jokes if collection is empty
    const count = await collection.countDocuments();
    if (count === 0) {
      await collection.insertMany([
        { title: "Joke 1", description: "This is a fantastic Joke 1" },
        { title: "Joke 2", description: "This is a hilarious Joke 2" },
        { title: "Joke 3", description: "This is a super funny Joke 3" },
      ]);
      console.log("✅ Sample jokes inserted!");
    }

    // Routes

    // Default route
    app.get('/', (req, res) => res.send('Hello World'));

    // Test route
    app.get('/test', (req, res) => res.send('Hello Test'));

    // GET all jokes
    app.get('/jokes', async (req, res) => {
      try {
        const jokes = await collection.find({}).toArray();
        res.json(jokes);
      } catch (err) {
        console.error("Error fetching jokes:", err);
        res.status(500).send("Error fetching jokes");
      }
    });

    // POST a new joke
    app.post('/jokes', async (req, res) => {
      try {
        const { title, description } = req.body;
        if (!title || !description) {
          return res.status(400).json({ message: "title and description are required" });
        }
        const result = await collection.insertOne({ title, description });
        res.status(201).json({ message: "Joke added successfully!", joke: { title, description } });
      } catch (err) {
        console.error("Error adding joke:", err);
        res.status(500).send("Error adding joke");
      }
    });

    // POST /upload - single file upload
    app.post('/upload', upload.single('file'), (req, res) => {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      console.log('File uploaded:', req.file.filename);
      res.status(201).json({ message: "File uploaded successfully", filename: req.file.filename });
    });

    // Start server
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}

// Start everything
startServer();