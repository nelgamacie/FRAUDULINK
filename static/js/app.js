/**
 * Fraudulink - Frontend JavaScript
 * Handles UI interactions, API calls, and dynamic content
 */

// ============================================
// STATE MANAGEMENT
// ============================================
let currentAudioFile = null;
let isAnalyzing = false;
let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTime = null;
let recordingTimer = null;
let audioContext = null;
let analyser = null;

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
    warningAudio: document.getElementById('warning-audio'),
    
    // Recording
    recordZone: document.getElementById('record-zone'),
    recordVisualizer: document.getElementById('record-visualizer'),
    recordStatus: document.getElementById('record-status'),
    recordStatusText: document.getElementById('record-status-text'),
    recordTimer: document.getElementById('record-timer'),
    startRecordBtn: document.getElementById('start-record-btn'),
    stopRecordBtn: document.getElementById('stop-record-btn'),
    recordedPreview: document.getElementById('recorded-preview'),
    recordedDuration: document.getElementById('recorded-duration'),
    playRecordedBtn: document.getElementById('play-recorded-btn'),
    discardRecordedBtn: document.getElementById('discard-recorded-btn'),
    recordedAudio: document.getElementById('recorded-audio')
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
// LIVE RECORDING
// ============================================

// Initialize recording functionality after DOM is ready
function initRecording() {
    const startBtn = document.getElementById('start-record-btn');
    const stopBtn = document.getElementById('stop-record-btn');
    const playBtn = document.getElementById('play-recorded-btn');
    const discardBtn = document.getElementById('discard-recorded-btn');
    const recordZone = document.getElementById('record-zone');
    const recordStatus = document.getElementById('record-status');
    const recordStatusText = document.getElementById('record-status-text');
    const recordTimerEl = document.getElementById('record-timer');
    const recordedPreview = document.getElementById('recorded-preview');
    const recordedDuration = document.getElementById('recorded-duration');
    const recordedAudioEl = document.getElementById('recorded-audio');
    const recordVisualizer = document.getElementById('record-visualizer');
    
    let localStream = null;
    
    console.log('Initializing recording...', { startBtn, stopBtn });
    
    if (!startBtn) {
        console.log('Start button not found, skipping recording init');
        return;
    }
    
    // Start Recording
    startBtn.addEventListener('click', async () => {
        console.log('Start recording clicked');
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Got microphone access');
            
            // Set up audio context for visualization
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(localStream);
            source.connect(analyser);
            analyser.fftSize = 256;
            
            // Set up MediaRecorder - try different mime types
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/mp4';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/ogg';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = '';  // Let browser choose
                    }
                }
            }
            console.log('Using mime type:', mimeType || 'browser default');
            
            const options = mimeType ? { mimeType } : {};
            mediaRecorder = new MediaRecorder(localStream, options);
            recordedChunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
                console.log('Data available:', e.data.size);
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                console.log('Recording stopped, chunks:', recordedChunks.length);
                const actualMimeType = mimeType || 'audio/webm';
                const blob = new Blob(recordedChunks, { type: actualMimeType });
                const audioURL = URL.createObjectURL(blob);
                
                if (recordedAudioEl) {
                    recordedAudioEl.src = audioURL;
                }
                
                // Create file from blob for upload
                const extension = actualMimeType.split('/')[1] || 'webm';
                currentAudioFile = new File([blob], `recording.${extension}`, { type: actualMimeType });
                console.log('Created audio file:', currentAudioFile.name, currentAudioFile.size);
                
                // Show preview
                const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
                if (recordedDuration) {
                    recordedDuration.textContent = `Recording: ${formatTime(duration)}`;
                }
                if (recordZone) recordZone.style.display = 'none';
                if (recordedPreview) recordedPreview.style.display = 'flex';
                
                // Clean up stream
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                }
                if (audioContext) {
                    audioContext.close();
                    audioContext = null;
                }
            };
            
            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            recordingStartTime = Date.now();
            console.log('Recording started');
            
            // Update UI
            startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'flex';
            if (recordStatus) recordStatus.classList.add('recording');
            if (recordStatusText) recordStatusText.textContent = 'Recording...';
            if (recordZone) recordZone.classList.add('recording');
            
            // Start timer
            updateRecordingTimer();
            recordingTimer = setInterval(updateRecordingTimer, 1000);
            
            // Start visualizer
            animateVisualizerLocal();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please ensure you have granted permission.\n\nError: ' + error.message);
        }
    });
    
    // Stop Recording
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            console.log('Stop recording clicked');
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                
                // Reset UI
                startBtn.style.display = 'flex';
                stopBtn.style.display = 'none';
                if (recordStatus) recordStatus.classList.remove('recording');
                if (recordStatusText) recordStatusText.textContent = 'Recording complete';
                if (recordZone) recordZone.classList.remove('recording');
                
                // Stop timer
                clearInterval(recordingTimer);
            }
        });
    }
    
    // Play recorded audio
    if (playBtn && recordedAudioEl) {
        playBtn.addEventListener('click', () => {
            if (recordedAudioEl.paused) {
                recordedAudioEl.play();
                playBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                `;
            } else {
                recordedAudioEl.pause();
                playBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                `;
            }
        });
        
        recordedAudioEl.addEventListener('ended', () => {
            playBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
            `;
        });
    }
    
    // Discard recording
    if (discardBtn) {
        discardBtn.addEventListener('click', () => {
            currentAudioFile = null;
            recordedChunks = [];
            if (recordedAudioEl) recordedAudioEl.src = '';
            if (recordedPreview) recordedPreview.style.display = 'none';
            if (recordZone) recordZone.style.display = 'flex';
            if (recordTimerEl) recordTimerEl.textContent = '00:00';
            if (recordStatusText) recordStatusText.textContent = 'Ready to record';
        });
    }
    
    // Update recording timer display
    function updateRecordingTimer() {
        if (recordingStartTime && recordTimerEl) {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            recordTimerEl.textContent = formatTime(elapsed);
        }
    }
    
    // Animate visualizer bars
    function animateVisualizerLocal() {
        if (!analyser || !recordVisualizer) return;
        
        const bars = recordVisualizer.querySelectorAll('.visualizer-bars span');
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        function draw() {
            if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
            
            analyser.getByteFrequencyData(dataArray);
            
            bars.forEach((bar, index) => {
                const value = dataArray[index * 10] || 0;
                const height = Math.max(4, (value / 255) * 40);
                bar.style.height = `${height}px`;
            });
            
            requestAnimationFrame(draw);
        }
        
        draw();
    }
    
    console.log('Recording initialized ✓');
}

// Format seconds to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Initialize recording when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRecording);
} else {
    initRecording();
}

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
    } else if (activeTab === 'audio') {
        if (!currentAudioFile) {
            alert('Please upload an audio file');
            return;
        }
        await analyzeAudio(currentAudioFile);
    } else if (activeTab === 'record') {
        if (!currentAudioFile) {
            alert('Please record audio first');
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
    
    // Auto-play voice warning after analysis completes
    setTimeout(() => {
        playVoiceWarning(result);
    }, 500);
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
