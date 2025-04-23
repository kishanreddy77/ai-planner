#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists python3; then
    echo "Error: python3 is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed"
    exit 1
fi

# Kill any existing processes on ports 3000 and 5001
echo "Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "Starting backend server..."
cd backend || { echo "Error: Could not find backend directory"; exit 1; }

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv || { echo "Error: Failed to create virtual environment"; exit 1; }
fi

# Activate virtual environment
source venv/bin/activate || { echo "Error: Failed to activate virtual environment"; exit 1; }

# Install requirements if needed
if [ ! -f "venv/lib/python3.13/site-packages/flask" ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt || { echo "Error: Failed to install backend dependencies"; exit 1; }
fi

# Start backend server in background
python3 app.py &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:5001/api/health > /dev/null; then
    echo "Error: Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend server
echo "Starting frontend server..."
cd ../frontend || { echo "Error: Could not find frontend directory"; exit 1; }

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install || { echo "Error: Failed to install frontend dependencies"; exit 1; }
fi

# Start frontend server in background
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Error: Frontend server failed to start"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo "Both servers are running!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5001"
echo "Press Ctrl+C to stop both servers"

# Function to handle cleanup
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 