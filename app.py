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