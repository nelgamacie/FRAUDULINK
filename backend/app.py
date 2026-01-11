"""
Fraudulink Backend API
FastAPI server for scam detection with Gemini AI and ElevenLabs integration
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import sys
import tempfile
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent directory to path for ml_model imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_model.detector import ScamDetector

# Initialize FastAPI app
app = FastAPI(
    title="Fraudulink API",
    description="AI-powered scam call detection API",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the scam detector
detector = ScamDetector()

# ============== Request/Response Models ==============

class TextAnalysisRequest(BaseModel):
    text: str
    include_gemini_analysis: bool = False

class AnalysisResponse(BaseModel):
    is_scam: bool
    confidence: float
    label: str
    risk_level: str
    original_text: str
    processed_text: str
    gemini_explanation: Optional[str] = None
    warning_audio_url: Optional[str] = None

class GeminiExplanationRequest(BaseModel):
    text: str
    is_scam: bool
    confidence: float

class ElevenLabsRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
