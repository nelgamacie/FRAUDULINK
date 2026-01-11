# Test Audio Files

This directory should contain sample audio files for testing the application.

## Required Files

The application expects these files (referenced in `index.html`):

- **test.wav** - A sample scam call audio file
- **ham1.wav** - A sample legitimate (safe) call audio file

## Audio Format Requirements

- **Supported formats**: MP3, WAV, M4A, MP4, WebM, OGG
- **Maximum file size**: 16MB
- **Recommended format**: WAV or MP3 for best compatibility

## How to Add Test Files

1. Record or obtain sample audio files (scam and legitimate calls)
2. Name them as `test.wav` and `ham1.wav` (or update the filenames in `templates/index.html` if using different names)
3. Place them in this directory

## Alternative: Use Your Own Samples

You can modify the sample button filenames in `templates/index.html` (around line 190-200) to point to your own audio files:

```html
<button class="sample-btn" data-audio="your-scam-sample.mp3">
<button class="sample-btn" data-audio="your-safe-sample.mp3">
```

## Note

These sample files are optional. Users can still:
- Upload their own audio files
- Paste text transcripts directly
- Use the drag & drop feature

The sample buttons will show an error if the files don't exist, but the app will still function normally.
