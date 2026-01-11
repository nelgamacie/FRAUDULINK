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

# ============== API Endpoints ==============

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Fraudulink API",
        "version": "1.0.0"
    }

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Analyze text for scam indicators.
    
    Args:
        request: TextAnalysisRequest with the text to analyze
        
    Returns:
        AnalysisResponse with detection results
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # Analyze with ML model
    result = detector.analyze(request.text)
    
    response = AnalysisResponse(
        is_scam=result['is_scam'],
        confidence=result['confidence'],
        label=result['label'],
        risk_level=result['risk_level'],
        original_text=result['original_text'],
        processed_text=result['processed_text']
    )
    
    # Add Gemini explanation if requested
    if request.include_gemini_analysis:
        gemini_explanation = await get_gemini_explanation(
            request.text, 
            result['is_scam'], 
            result['confidence']
        )
        response.gemini_explanation = gemini_explanation
    
    return response

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file to text using Whisper.
    
    Args:
        file: Audio file (mp3, wav, m4a, mp4)
        
    Returns:
        Transcribed text
    """
    # Check file extension
    allowed_extensions = {'.mp3', '.wav', '.m4a', '.mp4', '.webm', '.ogg'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        import whisper
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Load Whisper model and transcribe
        model = whisper.load_model("base")
        result = model.transcribe(tmp_path)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        return {
            "text": result["text"],
            "language": result.get("language", "unknown")
        }
        
    except ImportError:
        raise HTTPException(
            status_code=501, 
            detail="Whisper not installed. Install with: pip install openai-whisper"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-audio")
async def analyze_audio(file: UploadFile = File(...), include_gemini: bool = False):
    """
    Full pipeline: Transcribe audio and analyze for scams.
    
    Args:
        file: Audio file to analyze
        include_gemini: Whether to include Gemini AI explanation
        
    Returns:
        Complete analysis results including transcription
    """
    # First transcribe
    transcription_result = await transcribe_audio(file)
    text = transcription_result["text"]
    
    # Then analyze
    analysis_request = TextAnalysisRequest(
        text=text,
        include_gemini_analysis=include_gemini
    )
    analysis_result = await analyze_text(analysis_request)
    
    return {
        "transcription": transcription_result,
        "analysis": analysis_result
    }

# ============== Gemini AI Integration ==============

async def get_gemini_explanation(text: str, is_scam: bool, confidence: float) -> str:
    """
    Get an explanation from Gemini AI about why the text is/isn't a scam.
    
    Args:
        text: The original text
        is_scam: Whether it was classified as a scam
        confidence: Confidence level of the classification
        
    Returns:
        Explanation string from Gemini
    """
    try:
        import google.generativeai as genai
        
        # Configure Gemini (API key should be in environment)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return "Gemini API key not configured. Set GEMINI_API_KEY environment variable."
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        classification = "a potential SCAM" if is_scam else "SAFE"
        
        prompt = f"""Analyze this phone call transcript and explain why it might be {classification}.
        
Transcript: "{text}"

Classification: {classification} (Confidence: {confidence:.0%})

Provide a brief, helpful explanation (2-3 sentences) about:
1. What specific indicators suggest this is {classification}
2. What the caller might be trying to do (if scam)
3. One actionable tip for the user

Keep the response concise and user-friendly."""

        response = model.generate_content(prompt)
        return response.text
        
    except ImportError:
        return "Gemini SDK not installed. Install with: pip install google-generativeai"
    except Exception as e:
        return f"Error getting Gemini explanation: {str(e)}"


@app.post("/api/gemini/explain")
async def explain_with_gemini(request: GeminiExplanationRequest):
    """
    Get Gemini AI explanation for a scam analysis result.
    """
    explanation = await get_gemini_explanation(
        request.text,
        request.is_scam,
        request.confidence
    )
    return {"explanation": explanation}



