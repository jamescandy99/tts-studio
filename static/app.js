const API = '';
let allVoices = {};
let selectedVoice = 'en-US-GuyNeural';
let selectedPreset = null;
let selectedNarrator = 'male';
let narratorData = {};

document.addEventListener('DOMContentLoaded', () => {
    loadVoices();
    loadNarrators();
    setupEventListeners();
    updateCharCount();
});

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

async function loadNarrators() {
    try {
        const res = await fetch(`${API}/api/narrators`);
        narratorData = await res.json();
        updateNarratorLabels();
    } catch (e) {
        console.error('Failed to load narrators:', e);
    }
}

function updateNarratorLabels() {
    const targetLang = document.getElementById('targetLang').value;
    const narrators = narratorData.narrators && narratorData.narrators[targetLang];
    if (!narrators) return;

    document.querySelectorAll('.narrator-btn').forEach(btn => {
        const key = btn.dataset.narrator;
        const config = narrators[key];
        if (config) {
            const labelEl = btn.querySelector('.narrator-label');
            if (targetLang === 'my-MM') {
                const enLabels = {male: 'Boy', female: 'Girl', baby_boy: 'Baby Boy', baby_girl: 'Baby Girl'};
                labelEl.textContent = `${enLabels[key]} (${config.label})`;
            } else {
                labelEl.textContent = config.label;
            }
        }
    });
}

function renderVoiceList(filter = '') {
    const container = document.getElementById('voiceSelect');
    container.innerHTML = '';
    const filterLower = filter.toLowerCase();

    const langSelect = document.getElementById('langFilter');
    const selectedLang = langSelect ? langSelect.value : '';

    const languages = Object.keys(allVoices).sort();

    if (langSelect && langSelect.options.length <= 1) {
        languages.forEach(lang => {
            const opt = document.createElement('option');
            opt.value = lang;
            opt.textContent = lang;
            langSelect.appendChild(opt);
        });
    }

    const filteredLangs = selectedLang ? [selectedLang] : languages;

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
            div.onclick = () => selectVoice(v.id, div);
            container.appendChild(div);
        });
    });
}

function selectVoice(voiceId, element) {
    selectedVoice = voiceId;
    document.querySelectorAll('.voice-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
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

    document.querySelectorAll('.narrator-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedNarrator = btn.dataset.narrator;
            document.querySelectorAll('.narrator-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    document.getElementById('swapLangBtn').addEventListener('click', () => {
        const src = document.getElementById('sourceLang');
        const tgt = document.getElementById('targetLang');
        const tmp = src.value;
        src.value = tgt.value;
        tgt.value = tmp;
        updateNarratorLabels();
    });

    document.getElementById('targetLang').addEventListener('change', updateNarratorLabels);

    document.getElementById('useTranslationBtn').addEventListener('click', () => {
        const translated = document.getElementById('translatedText').textContent;
        if (translated) {
            document.getElementById('textInput').value = translated;
            updateCharCount();
            const src = document.getElementById('sourceLang');
            const tgt = document.getElementById('targetLang');
            const tmp = src.value;
            src.value = tgt.value;
            tgt.value = tmp;
            updateNarratorLabels();
            document.getElementById('translationPreview').style.display = 'none';
        }
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

function updateCharCount() {
    const text = document.getElementById('textInput').value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const estDuration = (words / 2.5).toFixed(1);
    document.getElementById('charCount').textContent = `${chars}/10000 chars | ~${words} words | ~${estDuration}s`;
}

async function translateText() {
    const text = document.getElementById('textInput').value.trim();
    if (!text) {
        showStatus('Please enter some text first.', 'error');
        return;
    }

    const btn = document.getElementById('translateBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Translating...';
    hideStatus();

    const sourceLang = document.getElementById('sourceLang').value;
    const targetLang = document.getElementById('targetLang').value;

    try {
        const res = await fetch(`${API}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                source_lang: sourceLang,
                target_lang: targetLang,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Translation failed');
        }

        const data = await res.json();
        document.getElementById('translatedText').textContent = data.translated_text;
        document.getElementById('translationPreview').style.display = 'block';
        showStatus('Translation complete!', 'success');
    } catch (e) {
        showStatus(`Error: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>🔄</span> Translate';
    }
}

async function translateAndSpeak() {
    const text = document.getElementById('textInput').value.trim();
    if (!text) {
        showStatus('Please enter some text first.', 'error');
        return;
    }

    const btn = document.getElementById('translateSpeakBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Translating & Generating...';
    hideStatus();

    const sourceLang = document.getElementById('sourceLang').value;
    const targetLang = document.getElementById('targetLang').value;

    try {
        const transRes = await fetch(`${API}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                source_lang: sourceLang,
                target_lang: targetLang,
            }),
        });

        if (!transRes.ok) {
            const err = await transRes.json();
            throw new Error(err.detail || 'Translation failed');
        }

        const transData = await transRes.json();
        document.getElementById('translatedText').textContent = transData.translated_text;
        document.getElementById('translationPreview').style.display = 'block';

        const rate = `${parseInt(document.getElementById('rateSlider').value) >= 0 ? '+' : ''}${document.getElementById('rateSlider').value}%`;
        const pitch = `${parseInt(document.getElementById('pitchSlider').value) >= 0 ? '+' : ''}${document.getElementById('pitchSlider').value}Hz`;

        const synthRes = await fetch(`${API}/api/synthesize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: transData.translated_text,
                voice: selectedVoice,
                rate: rate,
                pitch: pitch,
                language: targetLang,
                narrator: selectedNarrator,
            }),
        });

        if (!synthRes.ok) {
            const err = await synthRes.json();
            throw new Error(err.detail || 'Speech generation failed');
        }

        const synthData = await synthRes.json();
        showResult(synthData);
        showStatus(`Translated and generated speech with ${synthData.voice_used}!`, 'success');
    } catch (e) {
        showStatus(`Error: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>🌐</span> Translate & Speak';
    }
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

    const targetLang = document.getElementById('targetLang').value;

    const body = {
        text: text,
        voice: selectedVoice,
        rate: rate,
        pitch: pitch,
        language: targetLang,
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
        const voiceInfo = data.voice_used !== selectedVoice && !selectedPreset
            ? ` (auto-detected voice: ${data.voice_used})`
            : data.voice_used !== body.voice
            ? ` (auto-switched to ${data.voice_used} for your text's language)`
            : '';
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
    const targetLang = document.getElementById('targetLang').value;

    try {
        const res = await fetch(`${API}/api/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                texts: paragraphs,
                voice: selectedVoice,
                rate: rate,
                pitch: pitch,
                language: targetLang,
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
