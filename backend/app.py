from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
from datetime import datetime
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Update CORS settings to allow requests from frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"]
    }
})

# Load environment variables
load_dotenv()

# Check if API key exists and log it (masked for security)
api_key = os.getenv('GOOGLE_API_KEY')
if api_key:
    logger.info("Google API key loaded successfully")
    # Log first 7 characters and last 4 characters of the API key for verification
    masked_key = f"{api_key[:7]}...{api_key[-4:]}"
    logger.info(f"API key (masked): {masked_key}")
else:
    logger.error("Google API key not found in environment variables")
    raise ValueError("Google API key not found in environment variables")

# Configure Gemini
genai.configure(api_key=api_key)

try:
    # List available models
    models = genai.list_models()
    logger.info("Available models:")
    for m in models:
        logger.info(f"- {m.name}")
    
    # Use the correct model
    model = genai.GenerativeModel('gemini-1.5-pro')
    logger.info("Model initialized successfully with gemini-1.5-pro")
except Exception as e:
    logger.error(f"Error initializing model: {str(e)}")
    raise

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        logger.info("Health check requested")
        return jsonify({
            "status": "healthy",
            "message": "Backend is running",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

def generate_plan(mood, energy, available_time, goals):
    prompt = f"""
    You are a friendly AI planning assistant. Create a personalized daily schedule based on the following information:

    User's mood: {mood}
    Energy level: {energy}/5
    Available time: {available_time} hours
    Goals: {', '.join(goals)}

    Create a realistic, kind, and flexible schedule that takes into account the user's mood and energy level.
    Format the response as a JSON array of time blocks, where each block has:
    - time: The time slot (e.g., "9:00 AM - 10:00 AM")
    - activity: The activity to do
    - description: A brief description or tip
    - duration: Duration in minutes
    - priority: Priority level (1-3, where 1 is highest)

    Example format:
    [
        {{
            "time": "9:00 AM - 10:00 AM",
            "activity": "Morning Exercise",
            "description": "Start your day with some light stretching",
            "duration": 60,
            "priority": 1
        }}
    ]

    IMPORTANT: Return ONLY the JSON array, no additional text or explanation.
    """

    try:
        logger.info("Generating plan with Gemini")
        response = model.generate_content(prompt)
        # Parse the response text into JSON
        plan_data = json.loads(response.text)
        
        # Ensure we have a list
        if not isinstance(plan_data, list):
            logger.error("Generated plan is not a list")
            return []
            
        # Validate each item has required fields
        validated_plan = []
        for item in plan_data:
            if all(key in item for key in ['time', 'activity', 'description', 'duration', 'priority']):
                validated_plan.append(item)
        
        return validated_plan
    except Exception as e:
        logger.error(f"Failed to generate plan: {str(e)}")
        return []

@app.route('/api/generate-plan', methods=['POST'])
def create_plan():
    try:
        data = request.json
        logger.info(f"Received plan generation request: {data}")
        
        mood = data.get('mood')
        energy = data.get('energy')
        available_time = data.get('available_time')
        goals = data.get('goals', [])

        if not all([mood, energy, available_time]):
            logger.warning("Missing required parameters")
            return jsonify({'error': 'Missing required parameters'}), 400

        plan = generate_plan(mood, energy, available_time, goals)
        return jsonify({'plan': plan})
    except Exception as e:
        logger.error(f"Error in create_plan: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        logger.info("Starting Flask server...")
        app.run(debug=True, port=5001, host='0.0.0.0')
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise 