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
# ============== Routes ==============

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html', languages=SUPPORTED_LANGUAGES)

@app.route('/about')
def about():
    """About/Mission page"""
    return render_template('about.html', languages=SUPPORTED_LANGUAGES)

@app.route('/team')
def team():
    """Team page"""
    return render_template('team.html', languages=SUPPORTED_LANGUAGES)

@app.route('/test-audio/<filename>')
def serve_test_audio(filename):
    """Serve test audio files"""
    return send_from_directory('test_audio', filename)


    @app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze text for scam indicators with multi-language output"""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    text = data['text'].strip()
    if not text:
        return jsonify({'error': 'Text cannot be empty'}), 400
    
    output_lang = data.get('output_language', 'en')
    output_lang_name = SUPPORTED_LANGUAGES.get(output_lang, 'English')
    
    # Analyze with ML model
    result = detector.analyze(text)
    
    # Get Gemini analysis, translated using FREE Google Translate
    if data.get('include_gemini', False):
        gemini_data = get_full_gemini_analysis(
            text, result['is_scam'], result['confidence'], result['risk_level'],
            output_language=output_lang_name,
            output_lang_code=output_lang
        )
        result.update(gemini_data)
    
    # Translate UI labels using FREE Google Translate
    if output_lang != 'en':
        result['verdict_text'] = translate_text(
            'Potential Scam Detected' if result['is_scam'] else 'Appears Safe',
            output_lang_name,
            output_lang
        )
        result['risk_level_text'] = translate_text(
            f"{result['risk_level'].capitalize()} Risk",
            output_lang_name,
            output_lang
        )
    
    result['output_language'] = output_lang_name
    return jsonify(result)

    def translate_text(text: str, target_language: str, target_code: str = 'en') -> str:
    """Translate text using Gemini AI"""
    if target_language == 'English' or target_code == 'en':
        return text
    try:
        prompt = f"Translate this text to {target_language}. Output ONLY the translation, nothing else:\n\n{text}"
        return call_gemini(prompt).strip().strip('"')
    except Exception as e:
        print(f"Translation error: {e}")
        return text
@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio file using Gemini with auto language detection"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    target_lang = request.form.get('target_language', 'en')
    target_lang_name = SUPPORTED_LANGUAGES.get(target_lang, 'English')
    
    allowed_extensions = {'.mp3', '.wav', '.m4a', '.mp4', '.webm', '.ogg', '.aac', '.flac'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        return jsonify({'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'}), 400
    
    if not GEMINI_API_KEY:
        return jsonify({'error': 'Gemini API key not configured'}), 501
    
    try:
        audio_content = file.read()
        
        mime_types = {
            '.mp3': 'audio/mp3', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
            '.mp4': 'audio/mp4', '.webm': 'audio/webm', '.ogg': 'audio/ogg',
            '.aac': 'audio/aac', '.flac': 'audio/flac'
        }
        mime_type = mime_types.get(file_ext, 'audio/wav')
        audio_b64 = base64.b64encode(audio_content).decode('utf-8')
        
        # Transcribe with language detection
        transcribe_prompt = """Listen to this audio carefully and:
1. Detect what language is being spoken
2. Transcribe the audio word-for-word in its original language

Format your response EXACTLY like this (no extra text):
LANGUAGE: [language name in English]
TRANSCRIPT: [the exact transcription]"""
        
        transcription_result = call_gemini(transcribe_prompt, audio_data=audio_b64, mime_type=mime_type)
        
        # Parse response
        detected_language = "English"
        original_transcript = transcription_result.strip()
        
        lines = transcription_result.strip().split('\n')
        for line in lines:
            if line.startswith("LANGUAGE:"):
                detected_language = line.replace("LANGUAGE:", "").strip()
            elif line.startswith("TRANSCRIPT:"):
                original_transcript = line.replace("TRANSCRIPT:", "").strip()
        
        # Translate to target language using Gemini
        translated_text = original_transcript
        if target_lang != 'en' or detected_language.lower() != 'english':
            # Translate to target language using Gemini
            try:
                translated_text = translate_text(original_transcript, target_lang_name, target_lang)
            except Exception as translate_error:
                print(f"Translation error: {translate_error}")
                translated_text = original_transcript
        
        return jsonify({
            'text': translated_text,
            'original_text': original_transcript,
            'detected_language': detected_language,
            'target_language': target_lang_name,
            'method': 'gemini+google_translate'
        })
        
    except Exception as e:
        error_msg = str(e)
        if 'quota' in error_msg.lower() or '429' in error_msg:
            return jsonify({
                'error': 'API quota exceeded. The free tier has limited daily requests. Please wait a minute and try again, or try again tomorrow.',
                'quota_error': True
            }), 429
        return jsonify({'error': f'Transcription failed: {error_msg}'}), 500

# ============== Gemini AI Analysis ==============

def get_full_gemini_analysis(text: str, is_scam: bool, confidence: float, risk_level: str, output_language: str = "English", output_lang_code: str = "en") -> dict:
    """Get comprehensive Gemini analysis, then translate using FREE Google Translate"""
    result = {}
    
    try:
        classification = "a potential SCAM" if is_scam else "SAFE"
        
        # Get analysis in English (uses less Gemini tokens)
        explanation_prompt = f"""Analyze this phone call transcript classified as {classification}.

Transcript: "{text}"

Provide a clear explanation (2-3 sentences) about:
1. What red flags or safe indicators are present
2. What the caller's likely intent is

Keep it professional and easy to understand."""

        explanation = call_gemini(explanation_prompt).strip()
        
        # Scam tactics (if scam)
        tactics = None
        scam_type = None
        if is_scam:
            tactics_prompt = f"""Based on this scam call, identify manipulation tactics being used.

Transcript: "{text}"

List 2-4 specific tactics in bullet points. Be concise."""

            tactics = call_gemini(tactics_prompt).strip()
            
            # Scam type
            type_prompt = f"""Classify this scam into one category.

Transcript: "{text}"

Choose ONE: IRS/Tax Scam, Tech Support Scam, Bank/Financial Scam, Prize/Lottery Scam, Grandparent Scam, Romance Scam, Utility Scam, Government Impersonation, Investment Scam, Other

Only respond with the category name."""

            scam_type = call_gemini(type_prompt).strip()
        
        # Safety tips
        tips_prompt = f"""Provide 3 actionable safety tips based on this {'scam' if is_scam else 'legitimate'} call.

Transcript: "{text}"

Format as a numbered list. Keep each tip brief."""

        tips = call_gemini(tips_prompt).strip()
        
        # Translate all results to target language using Gemini
        if output_lang_code != 'en':
            try:
                result['gemini_explanation'] = translate_text(explanation, output_language, output_lang_code)
                if tactics:
                    result['scam_tactics'] = translate_text(tactics, output_language, output_lang_code)
                if scam_type:
                    result['scam_type'] = translate_text(scam_type, output_language, output_lang_code)
                result['safety_tips'] = translate_text(tips, output_language, output_lang_code)
            except Exception as translate_err:
                print(f"Translation error: {translate_err}")
                # Fallback to English if translation fails
                result['gemini_explanation'] = explanation
                if tactics:
                    result['scam_tactics'] = tactics
                if scam_type:
                    result['scam_type'] = scam_type
                result['safety_tips'] = tips
        else:
            result['gemini_explanation'] = explanation
            if tactics:
                result['scam_tactics'] = tactics
            if scam_type:
                result['scam_type'] = scam_type
            result['safety_tips'] = tips
        
    except Exception as e:
        result['gemini_error'] = str(e)
    
    return result

# ============== ElevenLabs Voice ==============

@app.route('/speak-warning', methods=['POST'])
def speak_warning():
    """Generate voice warning in selected language"""
    data = request.get_json()
    
    is_scam = data.get('is_scam', False)
    risk_level = data.get('risk_level', 'MEDIUM')
    target_lang = data.get('language', 'en')
    target_lang_name = SUPPORTED_LANGUAGES.get(target_lang, 'English')
    
    # Warning messages
    if is_scam:
        warnings = {
            "HIGH": "Alert! This is a scam. Do not provide any personal information. Hang up immediately and report this call.",
            "MEDIUM": "Warning! This call contains suspicious elements. Be very careful. Do not share sensitive information.",
            "LOW": "Caution. This call has some red flags. Stay alert and verify the caller's identity before proceeding."
        }
        text = warnings.get(risk_level, warnings["MEDIUM"])
    else:
        text = "Good news. This call appears safe. However, always stay vigilant about sharing personal information."
    
    # Translate if not English
    if target_lang != 'en':
        try:
            text = translate_text(text, target_lang_name, target_lang)
        except:
            pass
    
    # Try ElevenLabs
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if api_key:
        try:
            voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": api_key
            }
            payload = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
            }
            
            response = http_requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            
            return jsonify({
                'audio_base64': audio_base64,
                'text': text,
                'language': target_lang_name,
                'method': 'elevenlabs'
            })
        except Exception as e:
            pass
    
    # Return text-only if ElevenLabs unavailable
    return jsonify({
        'text': text,
        'language': target_lang_name,
        'method': 'text_only'
    })
# ============== API Status ==============

@app.route('/api/status')
def api_status():
    """Check API configuration status"""
    return jsonify({
        'gemini_configured': bool(GEMINI_API_KEY),
        'elevenlabs_configured': bool(os.getenv("ELEVENLABS_API_KEY")),
        'model_loaded': True,
        'languages': list(SUPPORTED_LANGUAGES.keys())
    })


if __name__ == '__main__':
    app.run(debug=True, port=8080)
