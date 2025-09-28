const express = require('express');
const mysql = require('mysql2/promise');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD,
  database: 'chat_app'
};

// Initialize database
async function initDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS chat_app');
    await connection.end();

    // Connect to the chat_app database
    const db = await mysql.createConnection(dbConfig);

    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        is_anonymous BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`messages\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        message_type ENUM('text', 'system') DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id),
        FOREIGN KEY (user_id) REFERENCES \`users\`(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`group_members\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id),
        FOREIGN KEY (user_id) REFERENCES \`users\`(id),
        UNIQUE KEY unique_membership (group_id, user_id)
      )
    `);

    // Insert sample data
    await db.execute(`
      INSERT IGNORE INTO \`groups\` (id, name, avatar_url) VALUES 
      (1, 'Fun Friday Group', '🎉')
    `);

    await db.execute(`
      INSERT IGNORE INTO \`users\` (id, username, display_name, avatar_url, is_anonymous) VALUES 
      (1, 'anonymous1', 'Anonymous', '👤', TRUE),
      (2, 'abhay_shukla', 'Abhay Shukla', '👨‍💼', FALSE),
      (3, 'kirtidan_gadhvi', 'Kirtidan Gadhvi', '👨‍💻', FALSE)
    `);

    await db.execute(`
      INSERT IGNORE INTO \`group_members\` (group_id, user_id) VALUES 
      (1, 1), (1, 2), (1, 3)
    `);

    // Insert sample messages
    await db.execute(`
      INSERT IGNORE INTO \`messages\` (id, group_id, user_id, content, created_at) VALUES 
      (1, 1, 1, 'Someone order Bornvita!!', '2020-08-20 11:35:00'),
      (2, 1, 1, 'hahahahah!!', '2020-08-20 11:38:00'),
      (3, 1, 1, 'I''m Excited For this Event! Ho-Ho', '2020-08-20 11:56:00'),
      (4, 1, 2, 'Hi Guysss 👋', '2020-08-20 12:31:00'),
      (5, 1, 1, 'Hello!', '2020-08-20 12:35:00'),
      (6, 1, 1, 'Yessss!!!!!!!', '2020-08-20 12:42:00'),
      (7, 1, 2, 'Maybe I am not attending this event!', '2020-08-20 13:36:00'),
      (8, 1, 3, 'We have Surprise For you!!', '2020-08-20 11:35:00')
    `);

    await db.end();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API Routes
app.get('/api/groups/:groupId/messages', async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);
    const [messages] = await db.execute(`
      SELECT m.*, u.display_name, u.avatar_url, u.is_anonymous 
      FROM \`messages\` m 
      JOIN \`users\` u ON m.user_id = u.id 
      WHERE m.group_id = ? 
      ORDER BY m.created_at ASC
    `, [req.params.groupId]);
    
    await db.end();
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/groups/:groupId', async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);
    const [groups] = await db.execute(
      'SELECT * FROM \`groups\` WHERE id = ?', 
      [req.params.groupId]
    );
    
    await db.end();
    if (groups.length > 0) {
      res.json(groups[0]);
    } else {
      res.status(404).json({ error: 'Group not found' });
    }
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

app.post('/api/groups/:groupId/messages', async (req, res) => {
  try {
    const { content, userId } = req.body;
    const db = await mysql.createConnection(dbConfig);
    
    const [result] = await db.execute(
      'INSERT INTO \`messages\` (group_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.groupId, userId, content]
    );

    const [newMessage] = await db.execute(`
      SELECT m.*, u.display_name, u.avatar_url, u.is_anonymous 
      FROM \`messages\` m 
      JOIN \`users\` u ON m.user_id = u.id 
      WHERE m.id = ?
    `, [result.insertId]);

    await db.end();

    // Emit to all connected clients
    io.emit('new_message', newMessage[0]);
    
    res.json(newMessage[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});