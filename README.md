# Chat Application

A real-time group chat application built with Node.js, Express, Socket.IO, and MySQL. Features an iPhone-style interface with anonymous messaging capabilities.

![Chat App Preview]
<img width="207" height="689" alt="image" src="https://github.com/user-attachments/assets/0da91d21-8a39-4743-8f0a-6460cc394ffc" />
<img width="218" height="688" alt="image" src="https://github.com/user-attachments/assets/3ef55aeb-e3a2-4c20-b2bc-657a54ab70a3" />


## Features

- 💬 Real-time messaging with Socket.IO
- 👤 Anonymous mode toggle
- 📱 iPhone-style responsive UI
- 💾 MySQL database storage
- ⚡ Instant message delivery
- 👥 Multi-user support
- 📝 Message timestamps
- ✅ Read receipts

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)

### Installation

1. **Clone/Download the project**
   ```bash
   mkdir chat-app
   cd chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install express mysql2 socket.io cors
   ```

3. **Setup MySQL**
   - Ensure MySQL is running
   - Update credentials in `server.js`:
   ```javascript
   const dbConfig = {
     host: 'localhost',
     user: 'root',           // Your MySQL username
     password: 'your_password', // Your MySQL password
     database: 'chat_app'
   };
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## File Structure

```
chat-app/
├── server.js          # Backend server with API routes
├── package.json       # Dependencies and scripts
├── public/
│   └── index.html     # Frontend (HTML + CSS + JS)
└── README.md          # This file
```

## Usage

### Basic Chat
1. Open the application in your browser
2. Start typing in the message input
3. Press Enter or click send button
4. Messages appear instantly

### Anonymous Mode
1. Click the red user icon (👤) in top-right corner
2. See "Now you're appearing as Anonymous!" message
3. Your messages will show as "Anonymous"
4. Click again to return to normal mode

### Multi-User Testing
1. Open multiple browser tabs/windows
2. Send messages from different tabs
3. See real-time updates across all windows

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups/:groupId` | Get group information |
| GET | `/api/groups/:groupId/messages` | Get all messages |
| POST | `/api/groups/:groupId/messages` | Send new message |

## Database Schema

The application automatically creates these tables:

- **users** - User profiles (Anonymous, Abhay Shukla, Kirtidan Gadhvi)
- **groups** - Chat groups (Fun Friday Group)
- **messages** - All chat messages with timestamps
- **group_members** - User-group relationships

## Configuration

### Environment Variables (Optional)
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chat_app
```

### Default Settings
- Server runs on port 3000
- Database: chat_app
- Sample data is automatically loaded

## Troubleshooting

### Common Issues

**MySQL Connection Error**
```bash
# Check if MySQL is running
mysql -u root -p
```

**Port 3000 in use**
```bash
# Change port in server.js
const PORT = process.env.PORT || 3001;
```

**Database Creation Fails**
- Ensure MySQL user has CREATE privileges
- Check connection credentials in server.js

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Real-time:** Socket.IO
- **Frontend:** HTML5, CSS3, JavaScript
- **Styling:** iPhone-style responsive design

## Sample Data

The application comes with pre-loaded messages:
- "Someone order Bornvita!!"
- "hahahahah!!"
- "I'm Excited For this Event! Ho-Ho"
- "Hi Guysss 👋"
- And more...

## License

MIT License - Feel free to use and modify.

---

**Made with ❤️ for real-time communication**
