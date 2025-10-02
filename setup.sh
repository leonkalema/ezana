#!/bin/bash

# Binojo Setup Script
echo "🎮 Setting up Binojo - Peer-to-Peer Checkers Game"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL v8.0 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "✅ Dependencies installed"

# Create backend .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "⚙️  Creating backend environment file..."
    cp backend/.env.example backend/.env
    echo "📝 Please edit backend/.env with your database credentials"
else
    echo "⚙️  Backend .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up your MySQL database:"
echo "   mysql -u root -p -e 'CREATE DATABASE binojo_db;'"
echo "   mysql -u root -p binojo_db < backend/src/database/schema.sql"
echo ""
echo "2. Configure backend/.env with your database credentials"
echo ""
echo "3. Start the application:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "Happy gaming! 🎮"
