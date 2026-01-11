/**
 * Fraudulink - Frontend JavaScript
 * Handles UI interactions, API calls, and dynamic content
 */

// ============================================
// STATE MANAGEMENT
// ============================================
let currentAudioFile = null;
let isAnalyzing = false;

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Text Input
    transcriptInput: document.getElementById('transcript-input'),
    charCounter: document.getElementById('char-counter'),
    
    // Audio Upload
    audioInput: document.getElementById('audio-input'),
    uploadZone: document.getElementById('upload-zone'),
    filePreview: document.getElementById('file-preview'),
    fileName: document.getElementById('file-name'),
    removeFileBtn: document.getElementById('remove-file'),
    
    // Options
    geminiToggle: document.getElementById('gemini-toggle'),
    outputLanguage: document.getElementById('output-language'),
    
    // Analyze Button
    analyzeBtn: document.getElementById('analyze-btn'),
    
    // Results
    resultsSection: document.getElementById('results-section'),
    resultsContent: document.getElementById('results-content'),
    verdictCard: document.getElementById('verdict-card'),
    verdictIcon: document.getElementById('verdict-icon'),
    verdictStatus: document.getElementById('verdict-status'),
    confidenceValue: document.getElementById('confidence-value'),
    riskFill: document.getElementById('risk-fill'),
    riskLevelText: document.getElementById('risk-level-text'),
    
    // Gemini Results
    explanationCard: document.getElementById('explanation-card'),
    explanationText: document.getElementById('explanation-text'),
    scamTypeCard: document.getElementById('scam-type-card'),
    scamTypeText: document.getElementById('scam-type-text'),
    tacticsCard: document.getElementById('tactics-card'),
    tacticsText: document.getElementById('tactics-text'),
    tipsCard: document.getElementById('tips-card'),
    tipsText: document.getElementById('tips-text'),
    
    // Transcription
    transcriptionCard: document.getElementById('transcription-card'),
    transcriptionText: document.getElementById('transcription-text'),
    detectedLangBadge: document.getElementById('detected-lang-badge'),
    originalTextSection: document.getElementById('original-text-section'),
    originalText: document.getElementById('original-text'),
    
    // Voice Warning
    voiceBtn: document.getElementById('voice-btn'),
    voiceBtnText: document.getElementById('voice-btn-text'),
    warningAudio: document.getElementById('warning-audio')
};

// ============================================
// TAB SWITCHING
// ============================================
elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // Update active tab button
        elements.tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        elements.tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${targetTab}-tab`) {
                content.classList.add('active');
            }
        });
    });
});

// ============================================
// CHARACTER COUNTER
// ============================================
elements.transcriptInput.addEventListener('input', () => {
    const length = elements.transcriptInput.value.length;
    elements.charCounter.textContent = length;
});

// ============================================
// FILE UPLOAD HANDLING
// ============================================

// Click to browse
elements.uploadZone.addEventListener('click', () => {
    elements.audioInput.click();
});

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    elements.uploadZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zone on drag over
['dragenter', 'dragover'].forEach(eventName => {
    elements.uploadZone.addEventListener(eventName, () => {
        elements.uploadZone.classList.add('dragover');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    elements.uploadZone.addEventListener(eventName, () => {
        elements.uploadZone.classList.remove('dragover');
    });
});

// Handle dropped files
elements.uploadZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

// Handle file input change
elements.audioInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// Handle file selection
function handleFileSelect(file) {
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/ogg'];
    const validExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.webm', '.ogg'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        alert('Invalid file type. Please upload an audio file (MP3, WAV, M4A, MP4, WebM, OGG)');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) {
        alert('File too large. Maximum size is 16MB');
        return;
    }
    
    currentAudioFile = file;
    elements.fileName.textContent = file.name;
    elements.uploadZone.style.display = 'none';
    elements.filePreview.style.display = 'flex';
}

// Remove file
elements.removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentAudioFile = null;
    elements.audioInput.value = '';
    elements.uploadZone.style.display = 'flex';
    elements.filePreview.style.display = 'none';
});

// ============================================
// SAMPLE AUDIO BUTTONS
// ============================================
const sampleBtns = document.querySelectorAll('.sample-btn');
sampleBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const audioFileName = btn.dataset.audio;
        try {
            const response = await fetch(`/test-audio/${audioFileName}`);
            const blob = await response.blob();
            const file = new File([blob], audioFileName, { type: 'audio/wav' });
            handleFileSelect(file);
        } catch (error) {
            console.error('Error loading sample audio:', error);
            alert('Could not load sample audio. The file may not exist.');
        }
    });
});

// ============================================
// ANALYZE BUTTON
// ============================================
elements.analyzeBtn.addEventListener('click', async () => {
    if (isAnalyzing) return;
    
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    
    if (activeTab === 'text') {
        const text = elements.transcriptInput.value.trim();
        if (!text) {
            alert('Please enter a transcript to analyze');
            return;
        }
        await analyzeText(text);
    } else {
        if (!currentAudioFile) {
            alert('Please upload an audio file');
            return;
        }
        await analyzeAudio(currentAudioFile);
    }
});

// ============================================
// TEXT ANALYSIS
// ============================================
async function analyzeText(text) {
    setLoading(true);
    hideResults();
    
    const data = {
        text: text,
        include_gemini: elements.geminiToggle.checked,
        output_language: elements.outputLanguage.value
    };
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Analysis failed');
        }
        
        const result = await response.json();
        displayResults(result);
        
    } catch (error) {
        console.error('Analysis error:', error);
        alert('Analysis failed. Please try again.');
    } finally {
        setLoading(false);
    }
}

// ============================================
// AUDIO ANALYSIS
// ============================================
async function analyzeAudio(file) {
    setLoading(true);
    hideResults();
    
    try {
        // Step 1: Transcribe audio
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('target_language', elements.outputLanguage.value);
        
        const transcribeResponse = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });
        
        if (!transcribeResponse.ok) {
            const errorData = await transcribeResponse.json();
            if (errorData.quota_error) {
                alert(errorData.error);
                setLoading(false);
                return;
            }
            throw new Error('Transcription failed');
        }
        
        const transcribeResult = await transcribeResponse.json();
        
        // Step 2: Analyze transcribed text
        const analyzeData = {
            text: transcribeResult.text,
            include_gemini: elements.geminiToggle.checked,
            output_language: elements.outputLanguage.value
        };
        
        const analyzeResponse = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(analyzeData)
        });
        
        if (!analyzeResponse.ok) {
            throw new Error('Analysis failed');
        }
        
        const analyzeResult = await analyzeResponse.json();
        
        // Add transcription data to results
        analyzeResult.transcription = transcribeResult.text;
        analyzeResult.original_transcription = transcribeResult.original_text;
        analyzeResult.detected_language = transcribeResult.detected_language;
        
        displayResults(analyzeResult, true);
        
    } catch (error) {
        console.error('Audio analysis error:', error);
        alert('Audio analysis failed. Please try again.');
    } finally {
        setLoading(false);
    }
}

// ============================================
// DISPLAY RESULTS
// ============================================
function displayResults(result, isAudio = false) {
    // Hide placeholder, show results
    document.querySelector('.results-placeholder').style.display = 'none';
    elements.resultsContent.style.display = 'flex';
    
    // Determine verdict type
    const verdictType = result.is_scam ? 'scam' : 'safe';
    const verdictText = result.is_scam ? 'Potential Scam' : 'Appears Safe';
    
    // Update verdict card
    elements.verdictCard.className = `verdict-card ${verdictType}`;
    elements.verdictStatus.textContent = result.verdict_text || verdictText;
    elements.confidenceValue.textContent = `${Math.round(result.confidence * 100)}%`;
    
    // Update verdict icon
    if (result.is_scam) {
        elements.verdictIcon.innerHTML = '⚠️';
    } else {
        elements.verdictIcon.innerHTML = '✓';
    }
    
    // Animate verdict ring
    const progress = elements.verdictCard.querySelector('.verdict-progress');
    const circumference = 283;
    const offset = circumference - (result.confidence * circumference);
    progress.style.strokeDashoffset = offset;
    
    // Update risk level
    const riskPercent = getRiskPercent(result.risk_level);
    elements.riskFill.style.width = `${riskPercent}%`;
    elements.riskLevelText.textContent = result.risk_level_text || `${result.risk_level.charAt(0).toUpperCase() + result.risk_level.slice(1)} Risk`;
    
    // Show/hide Gemini results
    if (result.gemini_explanation) {
        elements.explanationCard.style.display = 'block';
        elements.explanationText.textContent = result.gemini_explanation;
    } else {
        elements.explanationCard.style.display = 'none';
    }
    
    if (result.scam_type) {
        elements.scamTypeCard.style.display = 'flex';
        elements.scamTypeText.textContent = result.scam_type;
    } else {
        elements.scamTypeCard.style.display = 'none';
    }
    
    if (result.scam_tactics) {
        elements.tacticsCard.style.display = 'block';
        elements.tacticsText.innerHTML = formatList(result.scam_tactics);
    } else {
        elements.tacticsCard.style.display = 'none';
    }
    
    if (result.safety_tips) {
        elements.tipsCard.style.display = 'block';
        elements.tipsText.innerHTML = formatList(result.safety_tips);
    } else {
        elements.tipsCard.style.display = 'none';
    }
    
    // Show transcription for audio
    if (isAudio && result.transcription) {
        elements.transcriptionCard.style.display = 'block';
        elements.transcriptionText.textContent = result.transcription;
        
        if (result.detected_language) {
            elements.detectedLangBadge.textContent = result.detected_language;
            elements.detectedLangBadge.style.display = 'inline-block';
        }
        
        if (result.original_transcription && result.original_transcription !== result.transcription) {
            elements.originalTextSection.style.display = 'block';
            elements.originalText.textContent = result.original_transcription;
        } else {
            elements.originalTextSection.style.display = 'none';
        }
    } else {
        elements.transcriptionCard.style.display = 'none';
    }
    
    // Show voice warning button
    elements.voiceBtn.style.display = 'flex';
    elements.voiceBtn.onclick = () => playVoiceWarning(result);
    
    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// VOICE WARNING
// ============================================
async function playVoiceWarning(result) {
    elements.voiceBtnText.textContent = 'Loading...';
    elements.voiceBtn.disabled = true;
    
    try {
        const response = await fetch('/speak-warning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                is_scam: result.is_scam,
                risk_level: result.risk_level.toUpperCase(),
                language: elements.outputLanguage.value
            })
        });
        
        const data = await response.json();
        
        if (data.audio_base64) {
            // Play audio
            elements.warningAudio.src = `data:audio/mpeg;base64,${data.audio_base64}`;
            elements.warningAudio.play();
            elements.voiceBtnText.textContent = 'Playing...';
            
            elements.warningAudio.onended = () => {
                elements.voiceBtnText.textContent = 'Play Voice Warning';
                elements.voiceBtn.disabled = false;
            };
        } else {
            // No audio available, show text
            alert(data.text);
            elements.voiceBtnText.textContent = 'Play Voice Warning';
            elements.voiceBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Voice warning error:', error);
        alert('Could not generate voice warning');
        elements.voiceBtnText.textContent = 'Play Voice Warning';
        elements.voiceBtn.disabled = false;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setLoading(loading) {
    isAnalyzing = loading;
    if (loading) {
        elements.analyzeBtn.classList.add('loading');
        elements.analyzeBtn.disabled = true;
    } else {
        elements.analyzeBtn.classList.remove('loading');
        elements.analyzeBtn.disabled = false;
    }
}

function hideResults() {
    document.querySelector('.results-placeholder').style.display = 'flex';
    elements.resultsContent.style.display = 'none';
}

function getRiskPercent(riskLevel) {
    const levels = {
        'low': 25,
        'medium': 60,
        'high': 95
    };
    return levels[riskLevel.toLowerCase()] || 50;
}

function formatList(text) {
    // Convert numbered lists and bullet points to HTML
    if (!text) return '';
    
    // Split by lines
    const lines = text.split('\n').filter(line => line.trim());
    
    // Check if it's a numbered list or bullet list
    const hasNumbers = lines.some(line => /^\d+\./.test(line.trim()));
    const hasBullets = lines.some(line => /^[-•*]/.test(line.trim()));
    
    if (hasNumbers || hasBullets) {
        const listItems = lines.map(line => {
            // Remove leading numbers, bullets, or dashes
            const cleaned = line.trim().replace(/^(\d+\.|-|•|\*)\s*/, '');
            return `<li>${cleaned}</li>`;
        }).join('');
        
        return hasNumbers ? `<ol>${listItems}</ol>` : `<ul>${listItems}</ul>`;
    }
    
    // Otherwise just return paragraphs
    return lines.map(line => `<p>${line}</p>`).join('');
}

// ============================================
// INITIALIZE
// ============================================
console.log('Fraudulink initialized ✓');
