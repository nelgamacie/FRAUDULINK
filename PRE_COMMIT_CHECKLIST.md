# ✅ Pre-Commit Checklist

Before committing and running the application, verify:

## 1. Environment Setup

- [ ] Create `.env` file from `.env.example`
- [ ] Add your `GEMINI_API_KEY` (required)
- [ ] Add your `ELEVENLABS_API_KEY` (optional)

```bash
cp .env.example .env
# Edit .env with your actual API keys
```

## 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## 3. Optional Assets

### Test Audio Files (Optional)
- [ ] Add `test_audio/test.wav` (scam sample)
- [ ] Add `test_audio/ham1.wav` (safe sample)

**Note**: Sample buttons will show an error if files don't exist, but the app still works.

### Hero Image (Optional)
- [ ] Add an image to `static/images/hero.jpg`
- [ ] Update `templates/about.html` line 571 if you add one

**Note**: A placeholder is shown if no image is added.

## 4. Verify File Structure

```
FRAUDULINK/
├── .env                    ← YOU NEED TO CREATE THIS
├── .env.example            ✓
├── .gitignore              ✓
├── app.py                  ✓
├── requirements.txt        ✓
├── ml_model/
│   ├── detector.py         ✓
│   ├── model.pkl           ✓
│   └── vectorizer.pkl      ✓
├── static/
│   ├── css/style.css       ✓
│   ├── js/app.js           ✓
│   └── images/             ✓ (empty, optional)
├── templates/
│   ├── index.html          ✓
│   ├── about.html          ✓
│   └── team.html           ✓
└── test_audio/             ✓ (empty, optional)
```

## 5. Test Run

```bash
python app.py
```

Should show:
```
 * Running on http://127.0.0.1:8080
```

Open: http://localhost:8080

## 6. Quick Tests

- [ ] Homepage loads without errors
- [ ] CSS styling appears correctly
- [ ] Can switch between Text/Audio tabs
- [ ] Can type in text input
- [ ] Character counter works
- [ ] Navigation links work (About, Team)

## 7. With API Keys Configured

- [ ] Text analysis works
- [ ] Gemini analysis works (if enabled)
- [ ] Audio upload accepts files
- [ ] Audio transcription works
- [ ] Voice warning plays (if ElevenLabs key added)

## Common Issues

### Missing .env file
```bash
cp .env.example .env
# Add your keys
```

### Port in use
Edit `app.py` last line:
```python
app.run(debug=True, port=8081)  # Change port
```

### Module not found
```bash
pip install -r requirements.txt
```

## What's Safe to Commit

✅ **DO COMMIT**:
- All Python files (.py)
- HTML templates
- CSS and JavaScript files
- Requirements.txt
- README.md, SETUP.md, docs
- .gitignore
- .env.example
- Empty directories with README files

❌ **DO NOT COMMIT**:
- `.env` (contains your API keys!)
- `__pycache__/` (auto-generated)
- `.vscode/`, `.idea/` (IDE settings)
- Personal audio files (unless you want to)
- Large media files

## Ready to Commit?

If all checks pass:

```bash
git add .
git commit -m "feat: complete Fraudulink scam detection platform"
git push
```

---

**Need help?** See [SETUP.md](SETUP.md) for detailed setup instructions.
