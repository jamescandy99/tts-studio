# TTS Studio 🎙️

A professional Text-to-Speech web application built for content creators on **YouTube**, **TikTok**, and **Facebook**.

![Python](https://img.shields.io/badge/Python-3.10+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **300+ Natural Voices** — Powered by Microsoft Edge TTS with voices in 60+ languages
- **Platform Presets** — One-click voice settings optimized for YouTube narration, TikTok voiceovers, Facebook stories, podcasts, and dramatic/cinematic content
- **Adjustable Controls** — Fine-tune speech rate (-50% to +50%) and pitch (-20Hz to +20Hz)
- **Batch Processing** — Split long scripts by paragraph and generate individual audio segments
- **Instant Download** — Download generated MP3 files ready to use in your video editor
- **Character & Duration Estimator** — Know how long your voiceover will be before generating
- **Voice Search & Filter** — Search by name, filter by language, see gender labels
- **Responsive Design** — Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites

- Python 3.10+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd tts-app

# Install dependencies
pip install -e .

# Run the app
python -m app.main
```

The app will be available at **http://localhost:8000**

### Using Docker (optional)

```bash
docker build -t tts-studio .
docker run -p 8000:8000 tts-studio
```

## Usage

1. **Choose a Platform Preset** or select a custom voice from the sidebar
2. **Type or paste your script** in the text area
3. **Adjust rate and pitch** using the sliders
4. **Click "Generate Speech"** to create your audio
5. **Preview and download** the MP3 file

### Batch Mode

For longer scripts, separate paragraphs with blank lines and click **"Batch Generate"** to create individual audio files for each paragraph.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/voices` | GET | List all available voices |
| `/api/presets` | GET | Get platform presets |
| `/api/synthesize` | POST | Generate speech from text |
| `/api/batch` | POST | Batch generate from paragraphs |
| `/api/download/{id}` | GET | Download generated audio |

## Tech Stack

- **Backend:** Python, FastAPI, edge-tts
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **TTS Engine:** Microsoft Edge TTS (free, no API key required)

## Creator Tips

- **YouTube:** Keep narration at 130-160 words/min for clarity
- **TikTok:** Aim for 15-60 second clips for maximum engagement
- **Facebook:** Add pauses with `...` for natural-sounding breaks
- Use batch mode to split long scripts into manageable segments

## License

MIT
