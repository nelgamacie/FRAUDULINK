# FRAUDULINK

AI-powered scam call detection platform with multi-language support, real-time audio transcription, and intelligent fraud analysis.

## Features

- **Real-Time Scam Detection** - Advanced ML model trained to identify scam patterns
- **Audio Transcription** - Upload audio files and get automatic transcription in 18+ languages
- **Gemini AI Analysis** - Detailed explanations of why a call is suspicious
- **Multi-Language Support** - Results in 18+ languages including English, Spanish, French, Chinese, Arabic, and more
- **Voice Warnings** - Text-to-speech alerts in your selected language (via ElevenLabs)
- **Risk Assessment** - Visual risk meter and confidence scoring
- **Safety Tips** - Actionable advice to protect yourself from scams

## Quick Start

### Prerequisites

- Python 3.8+
- Gemini API Key (free at [Google AI Studio](https://makersuite.google.com/app/apikey))
- (Optional) ElevenLabs API Key for voice warnings

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd FRAUDULINK
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your API keys
```

4. **Run the application**
```bash
python app.py
```

5. **Open in browser**
```
http://localhost:8080
```

## Project Structure

```
FRAUDULINK/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── ml_model/              # Machine learning model
│   ├── detector.py        # Scam detection logic
│   ├── model.pkl          # Trained ML model
│   └── vectorizer.pkl     # Text vectorizer
├── static/
│   ├── css/
│   │   └── style.css      # Light futuristic theme
│   └── js/
│       └── app.js         # Frontend JavaScript
├── templates/
│   ├── index.html         # Main analysis page
│   ├── about.html         # About/mission page
│   └── team.html          # Team page
└── test_audio/            # Sample audio files (optional)
    └── README.md
```

## API Keys Setup

### Gemini API (Required)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a free API key
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

### ElevenLabs API (Optional)

1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up and get your API key
3. Add to `.env`: `ELEVENLABS_API_KEY=your_key_here`

*Note: Without ElevenLabs, voice warnings will show as text alerts instead.*

## Supported Languages

English, Spanish, French, German, Italian, Portuguese, Chinese (Mandarin), Japanese, Korean, Arabic, Hindi, Russian, Turkish, Vietnamese, Thai, Polish, Dutch, Swedish

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **ML Model**: Scikit-learn, NLTK
- **AI Integration**: Google Gemini 2.0
- **Voice**: ElevenLabs TTS
- **Design**: Light futuristic pastel theme with smooth animations

## Usage

### Text Analysis
1. Navigate to the main page
2. Select "Text Input" tab
3. Paste a call transcript
4. (Optional) Enable Gemini AI analysis
5. Select output language
6. Click "Analyze Transcript"

### Audio Analysis
1. Select "Audio Upload" tab
2. Drag & drop or browse for an audio file
3. Or click a sample audio button
4. (Optional) Enable Gemini AI analysis
5. Select output language
6. Click "Analyze Transcript"

## 🔧 Development

### Adding Test Audio Files

Place sample audio files in the `test_audio/` directory:
- `test.wav` - Sample scam call
- `ham1.wav` - Sample legitimate call

See `test_audio/README.md` for details.

### Customizing the Theme

Edit `static/css/style.css` to customize colors, fonts, and animations. The theme uses CSS variables for easy customization:

```css
:root {
  --accent-primary: #8b6f47;
  --accent-secondary: #a6855d;
  --safe-color: #9fb89a;
  --danger-color: #d4a294;
  /* ... */
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project was developed for SheHacks 2026.

## Team

Visit the [Team Page](/team) to meet the developers.

## Support

For issues or questions:
1. Check the [test_audio/README.md](test_audio/README.md) for audio file setup
2. Verify your `.env` file has valid API keys
3. Check the browser console for JavaScript errors
4. Verify Flask server is running on port 8080

## Security Note

Never commit your `.env` file or expose your API keys. The `.gitignore` file is configured to exclude sensitive files.

---

**Developed January 2026** | Powered by ML + Gemini + ElevenLabs
