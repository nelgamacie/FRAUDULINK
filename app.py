"""
Fraudulink - Flask Web Application
AI-powered scam call detection with Gemini AI integration and multi-language support
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import sys
import base64
import time
import requests as http_requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_model.detector import ScamDetector

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize the scam detector
detector = ScamDetector()
# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Using gemini-2.0-flash-exp for audio transcription
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

def call_gemini(prompt: str, audio_data: str = None, mime_type: str = None, max_retries: int = 3) -> str:
    """Call Gemini API directly via HTTP with retry logic for rate limits"""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set in environment")
    
    headers = {"Content-Type": "application/json"}
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    
    if audio_data and mime_type:
        body = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mime_type, "data": audio_data}}
                ]
            }]
        }
    else:
        body = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
    
    last_error = None
    for attempt in range(max_retries):
        try:
            response = http_requests.post(url, headers=headers, json=body, timeout=120)
            
            # Handle rate limiting with detailed error
            if response.status_code == 429:
                error_data = response.json()
                retry_delay = error_data.get('error', {}).get('details', [{}])[-1].get('retryDelay', '60s')
                if attempt < max_retries - 1:
                    wait_time = min((attempt + 1) * 10, 30)  # 10s, 20s, 30s max
                    print(f"Rate limited, waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                else:
                    raise Exception(f"API quota exceeded. Please wait {retry_delay} and try again. Free tier has limited daily requests.")
            
            response.raise_for_status()
            result = response.json()
            return result['candidates'][0]['content']['parts'][0]['text']
            
        except http_requests.exceptions.HTTPError as e:
            last_error = e
            if hasattr(response, 'status_code') and response.status_code == 429 and attempt < max_retries - 1:
                wait_time = min((attempt + 1) * 10, 30)
                time.sleep(wait_time)
                continue
            raise
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1 and "quota" not in str(e).lower():
                time.sleep(2)
                continue
            raise
    
    raise last_error or Exception("Max retries exceeded")

    # Supported languages
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese (Mandarin)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ru': 'Russian',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish'
}

