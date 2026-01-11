# 🚀 FRAUDULINK Setup Guide

Complete setup instructions for getting Fraudulink running on your machine.

## Step-by-Step Setup

### 1. Environment Setup

Create a `.env` file in the root directory with your API keys:

```bash
# Create .env file
touch .env
```

Add the following to your `.env` file:

```env
# GEMINI AI API KEY (Required)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# ELEVENLABS API KEY (Optional - for voice warnings)
ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key_here
```

### 2. Get Your API Keys

#### Gemini API Key (Required) 🔑

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file
5. **Free tier includes**: 60 requests per minute, adequate for development

#### ElevenLabs API Key (Optional) 🔊

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for a free account
3. Navigate to your profile settings
4. Copy your API key
5. Paste it in your `.env` file

**Note**: Without ElevenLabs, voice warnings will display as text alerts instead of audio.

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- Scikit-learn & NLTK (ML model)
- Google Generative AI (Gemini)
- ElevenLabs (voice synthesis)
- Other dependencies

### 4. Test Audio Files (Optional)

If you want to use the sample audio buttons:

1. Navigate to the `test_audio/` directory
2. Add two audio files:
   - `test.wav` - A sample scam call recording
   - `ham1.wav` - A sample legitimate call recording
3. See `test_audio/README.md` for more details

**These are optional** - users can still upload their own files or paste text.

### 5. Run the Application

```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:8080
 * Debug mode: on
```

### 6. Open in Browser

Navigate to: **http://localhost:8080**

## Troubleshooting

### "GEMINI_API_KEY not set" Error

- Check that your `.env` file exists in the root directory
- Verify the key is correctly formatted: `GEMINI_API_KEY=your_key_here`
- No quotes around the key value
- No extra spaces

### "ModuleNotFoundError" Error

```bash
pip install -r requirements.txt
```

Make sure you're in the project root directory.

### Port Already in Use

If port 8080 is already in use, edit `app.py` and change the last line:

```python
app.run(debug=True, port=8081)  # Change to any available port
```

### Audio Upload Fails

- Check file size (max 16MB)
- Verify file format (MP3, WAV, M4A, MP4, WebM, OGG)
- Check browser console for errors (F12)

### Gemini API Quota Exceeded

The free tier has limits. If you hit them:
- Wait 1 minute between requests
- Reduce the number of Gemini features enabled
- Wait until the next day for quota reset

## Verification Checklist

- [ ] `.env` file created with valid API keys
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Flask server running on port 8080
- [ ] Can access http://localhost:8080 in browser
- [ ] CSS and JavaScript files loading (check browser console)
- [ ] Text analysis works
- [ ] Audio upload works (if Gemini key is valid)
- [ ] Results display properly

## Next Steps

1. **Test the application**: Try analyzing some sample text
2. **Enable Gemini**: Check the "Include Gemini AI Analysis" option
3. **Try different languages**: Select from 18+ supported languages
4. **Upload audio**: Test the audio transcription feature
5. **Customize**: Edit `static/css/style.css` to personalize the theme

## Development Tips

- Use `debug=True` in `app.py` for auto-reload during development
- Check browser console (F12) for JavaScript errors
- Check terminal for Flask/Python errors
- CSS changes require a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Security Best Practices

- ✅ Never commit `.env` file to git
- ✅ Use `.env.example` for documentation
- ✅ Don't share API keys publicly
- ✅ Rotate API keys if exposed
- ✅ Use environment variables in production

---

Need help? Check the main [README.md](README.md) for more information.
