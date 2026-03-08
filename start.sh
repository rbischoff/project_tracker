#!/bin/bash

echo "🏠 Home Improvement Tracker - Setup & Start"
echo "============================================"

# Backend setup
echo ""
echo "📦 Setting up Python backend..."
cd backend
pip install -r requirements.txt -q
echo "✅ Backend dependencies installed"

# Start backend
echo "🚀 Starting FastAPI backend on http://localhost:8000 ..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Frontend setup
echo ""
echo "📦 Setting up React frontend..."
cd ../frontend
npm install --silent
echo "✅ Frontend dependencies installed"

# Start frontend
echo "🚀 Starting React frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "============================================"
echo "✅ Application is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "============================================"

# Wait and clean up
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
