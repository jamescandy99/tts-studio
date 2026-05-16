const API = '';

let allVoices = {};
let selectedVoice = 'en-US-AndrewNeural';
let selectedPreset = null;
let selectedLanguage = 'en-US';
let selectedNarrator = 'male';

let languageCatalog = {
    'en-US': {
        label: 'English',
        native_label: 'English',
        sample_text: 'Welcome to TTS Studio.',
    },
    'my-MM': {
        label: 'Burmese',
        native_label: 'မြန်မာဘာသာ',
        sample_text: 'မင်္ဂလာပါ။ TTS Studio မှ ကြိုဆိုပါတယ်။',
    },
};

let narratorCatalog = {
    'en-US': {
        male: {
            label: 'Male',
            voice: 'en-US-AndrewNeural',
            rate: '+0%',
            pitch: '+0Hz',
            description: 'Clear adult male English narrator',
        },
        female: {
            label: 'Female',
            voice: 'en-US-EmmaNeural',
            rate: '+0%',
            pitch: '+0Hz',
            description: 'Natural adult female English narrator',
        },
        baby_girl: {
            label: 'Young Baby Girl',
            voice: 'en-US-AnaNeural',
            rate: '+8%',
            pitch: '+18Hz',
            description: 'Bright childlike English girl narrator',
        },
        young_boy: {
            label: 'Young Boy',
            voice: 'en-US-EricNeural',
            rate: '+6%',
            pitch: '+12Hz',
            description: 'Youthful English boy-style narrator',
        },
    },
    'my-MM': {
        male: {
            label: 'Male',
            voice: 'my-MM-ThihaNeural',
            rate: '+0%',
            pitch: '+0Hz',
            description: 'Clear adult male Burmese narrator',
        },
        female: {
            label: 'Female',
            voice: 'my-MM-NilarNeural',
            rate: '+0%',
            pitch: '+0Hz',
            description: 'Natural adult female Burmese narrator',
        },
        baby_girl: {
            label: 'Young Baby Girl',
            voice: 'my-MM-NilarNeural',
            rate: '+8%',
            pitch: '+18Hz',
            description: 'Childlike Burmese girl narrator using a brighter tone',
        },
        young_boy: {
            label: 'Young Boy',
            voice: 'my-MM-ThihaNeural',
            rate: '+6%',
            pitch: '+12Hz',
            description: 'Youthful Burmese boy-style narrator using a brighter tone',
        },
    },
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadNarrators();
    await loadVoices();
    setupEventListeners();
    applyNarratorSelection();
    updateCharCount();
});

async function loadNarrators() {
    try {
        const res = await fetch(`${API}/api/narrators`);
        const data = await res.json();
        languageCatalog = data.languages;
        narratorCatalog = data.narrators;
        renderLanguageOptions();
        renderNarratorOptions();
    } catch (e) {
        console.error('Failed to load narrator presets:', e);
    }
}

async function loadVoices() {
    try {
        const res = await fetch(`${API}/api/voices`);
        const data = await res.json();
        allVoices = data.voices;
        renderVoiceList();
    } catch (e) {
        console.error('Failed to load voices:', e);
    }
}

function renderLanguageOptions() {
    const languageSelect = document.getElementById('languageSelect');
    languageSelect.innerHTML = '';

    Object.entries(languageCatalog).forEach(([locale, language]) => {
        const opt = document.createElement('option');
        opt.value = locale;
        opt.textContent = language.label === language.native_label
            ? language.label
            : `${language.label} / ${language.native_label}`;
        languageSelect.appendChild(opt);
    });

    languageSelect.value = selectedLanguage;
}

function renderNarratorOptions() {
    const narratorSelect = document.getElementById('narratorSelect');
    narratorSelect.innerHTML = '<option value="">Custom Voice</option>';

    const narrators = narratorCatalog[selectedLanguage] || {};
    Object.entries(narrators).forEach(([id, narrator]) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = narrator.label;
        narratorSelect.appendChild(opt);
    });

    if (selectedNarrator === null) {
        narratorSelect.value = '';
    } else if (selectedNarrator && narrators[selectedNarrator]) {
        narratorSelect.value = selectedNarrator;
    } else {
        selectedNarrator = 'male';
        narratorSelect.value = narrators.male ? 'male' : '';
    }
}

function renderVoiceList(filter = '') {
    const container = document.getElementById('voiceSelect');
    container.innerHTML = '';
    const filterLower = filter.toLowerCase();

    const langSelect = document.getElementById('langFilter');
    const selectedLang = langSelect ? langSelect.value : '';
    const supportedLanguages = Object.keys(languageCatalog).filter(lang => allVoices[lang]);

    if (langSelect && langSelect.options.length <= 1) {
        supportedLanguages.forEach(lang => {
            const opt = document.createElement('option');
            opt.value = lang;
            opt.textContent = languageCatalog[lang].label;
            langSelect.appendChild(opt);
        });
    }

    const filteredLangs = selectedLang ? [selectedLang] : supportedLanguages;

    filteredLangs.forEach(lang => {
        const voices = allVoices[lang] || [];
        voices.forEach(v => {
            if (filterLower && !v.name.toLowerCase().includes(filterLower) && !v.id.toLowerCase().includes(filterLower)) return;

            const div = document.createElement('div');
            div.className = `voice-option ${v.id === selectedVoice ? 'selected' : ''}`;
            div.innerHTML = `
                <span class="voice-name">${v.name}</span>
                <span class="voice-gender">${v.gender}</span>
            `;
            div.onclick = () => selectVoice(v, div);
            container.appendChild(div);
        });
    });
}

function selectVoice(voice, element) {
    selectedVoice = voice.id;
    selectedLanguage = languageCatalog[voice.locale] ? voice.locale : selectedLanguage;
    selectedNarrator = null;

    document.getElementById('languageSelect').value = selectedLanguage;
    renderNarratorOptions();
    document.getElementById('narratorSelect').value = '';
    document.getElementById('langFilter').value = selectedLanguage;
    document.querySelectorAll('.voice-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    updateNarratorCard();

    if (selectedPreset) {
        clearPreset();
    }
}

function clearPreset() {
    selectedPreset = null;
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
}

function setupEventListeners() {
    document.getElementById('textInput').addEventListener('input', updateCharCount);

    document.getElementById('languageSelect').addEventListener('change', (e) => {
        selectedLanguage = e.target.value;
        if (!selectedNarrator) {
            selectedNarrator = 'male';
        }
        renderNarratorOptions();
        applyNarratorSelection();
    });

    document.getElementById('narratorSelect').addEventListener('change', (e) => {
        selectedNarrator = e.target.value || null;
        applyNarratorSelection();
    });

    document.getElementById('voiceSearch').addEventListener('input', (e) => {
        renderVoiceList(e.target.value);
    });

    document.getElementById('langFilter').addEventListener('change', () => {
        renderVoiceList(document.getElementById('voiceSearch').value);
    });

    document.getElementById('rateSlider').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        document.getElementById('rateValue').textContent = `${val >= 0 ? '+' : ''}${val}%`;
    });

    document.getElementById('pitchSlider').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        document.getElementById('pitchValue').textContent = `${val >= 0 ? '+' : ''}${val}Hz`;
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            selectedPreset = preset;
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
}

function applyNarratorSelection() {
    const narrators = narratorCatalog[selectedLanguage] || {};
    const narrator = selectedNarrator ? narrators[selectedNarrator] : null;

    if (narrator) {
        selectedVoice = narrator.voice;
        setSliderValue('rateSlider', 'rateValue', narrator.rate, '%');
        setSliderValue('pitchSlider', 'pitchValue', narrator.pitch, 'Hz');
    }

    const langFilter = document.getElementById('langFilter');
    if (langFilter) {
        langFilter.value = selectedLanguage;
    }

    clearPreset();
    updateNarratorCard();
    renderVoiceList(document.getElementById('voiceSearch').value);
}

function setSliderValue(sliderId, labelId, formattedValue, suffix) {
    const slider = document.getElementById(sliderId);
    const parsedValue = parseInt(formattedValue.replace(suffix, ''));
    slider.value = parsedValue;
    document.getElementById(labelId).textContent = `${parsedValue >= 0 ? '+' : ''}${parsedValue}${suffix}`;
}

function updateNarratorCard() {
    const language = languageCatalog[selectedLanguage];
    const narrators = narratorCatalog[selectedLanguage] || {};
    const narrator = selectedNarrator ? narrators[selectedNarrator] : null;
    const languageLabel = language ? language.label : selectedLanguage;

    document.getElementById('selectedNarratorLabel').textContent = narrator
        ? `${languageLabel} ${narrator.label}`
        : `${languageLabel} Custom Voice`;
    document.getElementById('selectedNarratorDescription').textContent = narrator
        ? narrator.description
        : 'Using the selected custom voice from the list';
    document.getElementById('selectedVoiceName').textContent = selectedVoice;
}

function updateCharCount() {
    const text = document.getElementById('textInput').value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const estDuration = (words / 2.5).toFixed(1);
    document.getElementById('charCount').textContent = `${chars}/10000 chars | ~${words} words | ~${estDuration}s`;
}

async function generateSpeech() {
    const text = document.getElementById('textInput').value.trim();
    if (!text) {
        showStatus('Please enter some text first.', 'error');
        return;
    }

    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Generating...';
    hideStatus();

    const rate = `${parseInt(document.getElementById('rateSlider').value) >= 0 ? '+' : ''}${document.getElementById('rateSlider').value}%`;
    const pitch = `${parseInt(document.getElementById('pitchSlider').value) >= 0 ? '+' : ''}${document.getElementById('pitchSlider').value}Hz`;

    const body = {
        text: text,
        voice: selectedVoice,
        rate: rate,
        pitch: pitch,
        language: selectedLanguage,
        narrator: selectedNarrator,
    };

    if (selectedPreset) {
        body.platform = selectedPreset;
    }

    try {
        const res = await fetch(`${API}/api/synthesize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Generation failed');
        }

        const data = await res.json();
        showResult(data);
        const voiceInfo = data.voice_used !== body.voice
            ? ` (voice used: ${data.voice_used})`
            : ` (${data.voice_used})`;
        showStatus(`Audio generated successfully!${voiceInfo}`, 'success');
    } catch (e) {
        showStatus(`Error: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>🔊</span> Generate Speech';
    }
}

async function generateBatch() {
    const text = document.getElementById('textInput').value.trim();
    if (!text) {
        showStatus('Please enter some text first.', 'error');
        return;
    }

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    if (paragraphs.length < 2) {
        showStatus('Batch mode requires multiple paragraphs (separated by blank lines).', 'error');
        return;
    }

    const btn = document.getElementById('batchBtn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    hideStatus();

    const rate = `${parseInt(document.getElementById('rateSlider').value) >= 0 ? '+' : ''}${document.getElementById('rateSlider').value}%`;
    const pitch = `${parseInt(document.getElementById('pitchSlider').value) >= 0 ? '+' : ''}${document.getElementById('pitchSlider').value}Hz`;

    try {
        const res = await fetch(`${API}/api/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                texts: paragraphs,
                voice: selectedVoice,
                rate: rate,
                pitch: pitch,
                language: selectedLanguage,
                narrator: selectedNarrator,
            }),
        });

        if (!res.ok) throw new Error('Batch generation failed');

        const data = await res.json();
        showBatchResults(data.results);
        showStatus(`Generated ${data.results.length} audio segments!`, 'success');
    } catch (e) {
        showStatus(`Error: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Batch Generate (by paragraphs)';
    }
}

function showResult(data) {
    const section = document.getElementById('resultSection');
    section.classList.add('visible');

    const audio = document.getElementById('audioPlayer');
    audio.src = `${API}${data.download_url}`;

    document.getElementById('audioSize').textContent = formatBytes(data.size_bytes);
    document.getElementById('audioDuration').textContent = `~${data.estimated_duration_seconds}s`;

    const dlBtn = document.getElementById('downloadBtn');
    dlBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = `${API}${data.download_url}`;
        a.download = `tts-audio-${data.file_id.slice(0, 8)}.mp3`;
        a.click();
    };
}

function showBatchResults(results) {
    const section = document.getElementById('resultSection');
    section.classList.add('visible');

    const container = document.getElementById('batchResults');
    container.innerHTML = '';

    results.forEach(r => {
        if (r.error) {
            const div = document.createElement('div');
            div.className = 'batch-item';
            div.innerHTML = `<span class="batch-text" style="color:var(--danger)">${r.error}</span>`;
            container.appendChild(div);
            return;
        }

        const div = document.createElement('div');
        div.className = 'batch-item';
        div.innerHTML = `
            <span class="batch-text">${r.text_preview}</span>
            <audio controls src="${API}${r.download_url}" preload="none"></audio>
            <button class="btn-secondary" onclick="downloadFile('${API}${r.download_url}', 'segment-${r.index + 1}.mp3')">Download</button>
        `;
        container.appendChild(div);
    });
}

function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function showStatus(msg, type) {
    const el = document.getElementById('statusMsg');
    el.textContent = msg;
    el.className = `status ${type}`;
}

function hideStatus() {
    document.getElementById('statusMsg').className = 'status';
}
