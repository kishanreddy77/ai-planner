# AI Planner Buddy

A modern web application that generates personalized daily plans based on your mood, energy level, and goals using AI.

## Features

- 🤖 AI-powered plan generation
- 🎨 Modern, responsive UI
- 📱 Mobile-friendly design
- ✅ Interactive task management
- ⚡ Real-time status updates
- 🔒 Secure API key management

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Python, Flask, Google AI API
- **Styling**: Tailwind CSS
- **Deployment**: Local development environment

## Prerequisites

- Node.js (v16 or higher)
- Python 3.8 or higher
- npm or yarn
- Google AI API key

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-planner
   ```

2. Set up the backend:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Configure the API key:
   - Copy the `.env.example` file to `.env`
   - Add your Google AI API key:
     ```
     GOOGLE_API_KEY=your_api_key_here
     ```

4. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python3 app.py
   ```

2. Start the frontend server (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Usage

1. Open http://localhost:3000 in your browser
2. Select your current mood
3. Choose your energy level (1-5)
4. Enter your available time in hours
5. Select your goals for the day
6. Click "Generate My Plan"
7. View and manage your personalized plan

## Project Structure

```
ai-planner/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   └── app/
│   │       └── page.tsx   # Main application page
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
└── README.md             # Project documentation
```

## Troubleshooting

- **Backend Connection Issues**: Ensure the backend server is running and the API key is correctly set
- **Frontend Not Loading**: Check if both servers are running and ports 3000 and 5001 are available
- **Plan Generation Fails**: Verify your API key and internet connection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 