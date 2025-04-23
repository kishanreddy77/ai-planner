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

def format_time(hour, minute):
    return f"{hour:02d}:{minute:02d}"

def generate_time_slots(start_hour, duration_hours):
    time_slots = []
    current_hour = start_hour
    current_minute = 0
    
    for _ in range(int(duration_hours)):
        time_slots.append(format_time(current_hour, current_minute))
        current_hour += 1
        if current_hour >= 24:
            current_hour = 0
    
    return time_slots

def generate_plan(mood, energy, available_time, goals):
    current_hour = datetime.now().hour
    
    prompt = f"""
    Create a {available_time}-hour schedule for someone who is feeling {mood} with energy level {energy}/5.
    They want to focus on: {', '.join(goals)}.
    Start the schedule from {current_hour}:00.

    Return a JSON array of activities. Each activity must have:
    {{
        "time": "HH:MM",
        "activity": "Activity name",
        "description": "Brief description",
        "duration": minutes (integer),
        "priority": 1 (high), 2 (medium), or 3 (low)
    }}

    Rules:
    1. Use 24-hour time format (e.g., "14:00")
    2. Keep activities between 30-60 minutes
    3. Total duration must not exceed {int(available_time * 60)} minutes
    4. Return only the JSON array, no other text
    """

    try:
        logger.info(f"Generating plan with parameters: mood={mood}, energy={energy}, time={available_time}h, goals={goals}")
        response = model.generate_content(prompt)
        
        if not response.text:
            logger.error("Empty response from AI model")
            raise ValueError("No response from AI model")

        # Clean the response text to ensure it's valid JSON
        cleaned_text = response.text.strip()
        if not cleaned_text.startswith('['):
            cleaned_text = cleaned_text[cleaned_text.find('['):]
        if not cleaned_text.endswith(']'):
            cleaned_text = cleaned_text[:cleaned_text.rfind(']')+1]

        logger.info(f"AI Response: {cleaned_text}")
        
        try:
            plan_data = json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            logger.error(f"Attempted to parse: {cleaned_text}")
            raise ValueError("Invalid plan format received from AI")

        if not isinstance(plan_data, list):
            raise ValueError("AI response is not a list of activities")

        validated_plan = []
        total_duration = 0
        current_time = current_hour * 60  # Convert to minutes

        for item in plan_data:
            try:
                # Validate required fields
                if not all(key in item for key in ['time', 'activity', 'description', 'duration', 'priority']):
                    continue

                # Parse and validate duration
                duration = int(item['duration'])
                if duration < 30 or duration > 120:
                    continue

                # Update time based on current_time
                hours = current_time // 60
                minutes = current_time % 60
                item['time'] = f"{hours:02d}:{minutes:02d}"

                # Validate priority
                item['priority'] = max(1, min(3, int(item['priority'])))

                validated_plan.append(item)
                total_duration += duration
                current_time += duration

            except (ValueError, TypeError) as e:
                logger.error(f"Error validating item {item}: {str(e)}")
                continue

        if not validated_plan:
            raise ValueError("No valid activities could be created")

        logger.info(f"Successfully generated plan with {len(validated_plan)} activities")
        return validated_plan

    except Exception as e:
        logger.error(f"Plan generation failed: {str(e)}")
        raise ValueError(f"Failed to generate plan: {str(e)}")

@app.route('/api/generate-plan', methods=['POST'])
def create_plan():
    try:
        data = request.get_json()
        mood = data.get('mood', '').lower()
        energy = int(data.get('energy', 3))
        available_time = float(data.get('available_time', 1))
        goals = [g.lower() for g in data.get('goals', [])]

        # Input validation
        if not mood:
            return jsonify({'error': 'Mood is required'}), 400
        if not goals:
            return jsonify({'error': 'At least one goal is required'}), 400
        if available_time < 0.5 or available_time > 24:
            return jsonify({'error': 'Available time must be between 0.5 and 24 hours'}), 400
        if energy < 1 or energy > 5:
            return jsonify({'error': 'Energy level must be between 1 and 5'}), 400

        try:
            plan = generate_plan(mood, energy, available_time, goals)
            return jsonify({'plan': plan})
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return jsonify({'error': 'An unexpected error occurred'}), 500

    except Exception as e:
        logger.error(f"Request processing error: {str(e)}")
        return jsonify({'error': 'Invalid request data'}), 400

if __name__ == '__main__':
    try:
        logger.info("Starting Flask server...")
        app.run(debug=True, port=5001, host='0.0.0.0')
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise 