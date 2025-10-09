# Binojo - Peer-to-Peer Checkers Game

A modern, real-time checkers game built with SvelteKit, Node.js, Socket.IO, and MySQL. Play with friends through private game codes or find opponents through intelligent matchmaking.

## Features

- **Real-time Gameplay**: Instant moves and live chat with Socket.IO
- **Private Games**: Create games with custom codes and share with friends
- **Smart Matchmaking**: Automatic opponent matching system
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **User Authentication**: Secure registration and login system
- **Game History**: Track your games and moves
- **Live Chat**: Communicate with opponents during games

## Tech Stack

### Frontend
- **SvelteKit** - Modern web framework
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **Socket.IO Client** - Real-time communication
- **Zod** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **MySQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Zod** - Schema validation

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd binojo
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Database Setup

1. **Create MySQL Database**:
   ```sql
   CREATE DATABASE binojo_db;
   ```

2. **Run Database Schema**:
   ```bash
   mysql -u your_username -p binojo_db < backend/src/database/schema.sql
   ```

3. **Create Database User** (optional but recommended):
   ```sql
   CREATE USER 'binojo_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON binojo_db.* TO 'binojo_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 5. Environment Configuration

1. **Backend Environment**:
   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit `backend/.env` with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=binojo_user
   DB_PASSWORD=your_secure_password
   DB_NAME=binojo_db

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   JWT_EXPIRES_IN=7d

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   ```

## Running the Application

### Development Mode

1. **Start the Backend**:
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:3001`

2. **Start the Frontend** (in a new terminal):
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### Production Mode

1. **Build the Backend**:
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Build the Frontend**:
   ```bash
   npm run build
   npm run preview
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Games
- `POST /api/games/create` - Create new game
- `POST /api/games/join` - Join existing game
- `GET /api/games/:gameCode` - Get game details
- `POST /api/games/move` - Make a move
- `GET /api/games/active` - Get user's active games
- `POST /api/games/:gameCode/abandon` - Abandon game

### Matchmaking
- `POST /api/matchmaking/join` - Join matchmaking queue
- `POST /api/matchmaking/leave` - Leave matchmaking queue
- `GET /api/matchmaking/status` - Get queue status
- `GET /api/matchmaking/stats` - Get queue statistics

## Socket.IO Events

### Client to Server
- `join_game` - Join a game room
- `leave_game` - Leave a game room
- `make_move` - Make a game move
- `send_message` - Send chat message
- `join_matchmaking` - Join matchmaking
- `leave_matchmaking` - Leave matchmaking

### Server to Client
- `game_state` - Initial game state
- `game_state_updated` - Game state update
- `move_made` - Move was made
- `player_joined` - Player joined game
- `player_left` - Player left game
- `message_received` - Chat message received
- `match_found` - Matchmaking found opponent

## Testing

### Frontend Tests
```bash
npm run test
```

### Backend Tests
```bash
cd backend
npm run test
```

### Run All Tests
```bash
npm run test && cd backend && npm run test
```

## Game Rules

Binojo follows standard checkers rules:

1. **Objective**: Capture all opponent pieces or block all their moves
2. **Movement**: Pieces move diagonally on dark squares only
3. **Capturing**: Jump over opponent pieces to capture them
4. **Kings**: Pieces reaching the opposite end become kings and can move backward
5. **Multiple Jumps**: If possible, continue jumping with the same piece
6. **Mandatory Captures**: Must capture if a capture move is available

## Project Structure

```
binojo/
├── src/                          # Frontend source
│   ├── lib/
│   │   ├── components/          # Svelte components
│   │   ├── stores/              # Svelte stores
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utility functions
│   └── routes/                  # SvelteKit routes
├── backend/                     # Backend source
│   └── src/
│       ├── controllers/         # Route controllers
│       ├── database/            # Database connection & schema
│       ├── game/                # Game logic
│       ├── middleware/          # Express middleware
│       ├── models/              # Data models
│       ├── routes/              # API routes
│       ├── socket/              # Socket.IO handlers
│       ├── types/               # TypeScript types
│       ├── utils/               # Utility functions
│       └── validation/          # Input validation
└── static/                      # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security Considerations

- Passwords are hashed using bcryptjs with salt rounds of 12
- JWT tokens are used for authentication
- Input validation using Zod schemas
- Rate limiting on API endpoints
- CORS configuration for cross-origin requests
- SQL injection prevention through parameterized queries

## Performance Optimizations

- Connection pooling for MySQL
- Efficient Socket.IO room management
- Optimized game state updates
- Responsive design for mobile devices
- Lazy loading of components

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Socket.IO Connection Failed**:
   - Check if backend is running on correct port
   - Verify CORS configuration
   - Check firewall settings

3. **Frontend Build Errors**:
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify all dependencies are installed

### Development Tips

- Use browser dev tools to debug Socket.IO connections
- Check backend logs for API errors
- Use MySQL Workbench or similar tool for database debugging
- Enable verbose logging in development mode

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments



ssh root@157.180.80.78


cd /path/to/ezana && \
git pull && \
npm install && npm run build && \
cd backend && npm install && npm run build && \
cd .. && \
pm2 restart all