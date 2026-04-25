import os
import uuid
import asyncio
from pathlib import Path

import edge_tts
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(title="TTS Studio", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path("/home/ubuntu/repos/tts-app/output")
OUTPUT_DIR.mkdir(exist_ok=True)

STATIC_DIR = Path(__file__).parent.parent / "static"


PLATFORM_PRESETS = {
    "youtube": {
        "label": "YouTube Narration",
        "rate": "+0%",
        "pitch": "+0Hz",
        "voice": "en-US-GuyNeural",
        "description": "Clear, professional narration voice for YouTube videos",
    },
    "tiktok": {
        "label": "TikTok Voiceover",
        "rate": "+10%",
        "pitch": "+5Hz",
        "voice": "en-US-JennyNeural",
        "description": "Energetic, upbeat voice for short-form TikTok content",
    },
    "facebook": {
        "label": "Facebook Stories",
        "rate": "+0%",
        "pitch": "+0Hz",
        "voice": "en-US-AriaNeural",
        "description": "Warm, conversational voice for Facebook stories and reels",
    },
    "podcast": {
        "label": "Podcast Style",
        "rate": "-5%",
        "pitch": "-2Hz",
        "voice": "en-US-DavisNeural",
        "description": "Calm, measured tone ideal for podcast-style content",
    },
    "dramatic": {
        "label": "Dramatic / Cinematic",
        "rate": "-10%",
        "pitch": "-5Hz",
        "voice": "en-US-GuyNeural",
        "description": "Slow, dramatic delivery for cinematic intros and trailers",
    },
}


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    voice: str = "en-US-GuyNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"
    platform: str | None = None


class BatchTTSRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1)
    voice: str = "en-US-GuyNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"


@app.get("/", response_class=HTMLResponse)
async def index():
    index_path = STATIC_DIR / "index.html"
    return HTMLResponse(content=index_path.read_text())


@app.get("/api/voices")
async def list_voices():
    voices = await edge_tts.list_voices()
    grouped: dict[str, list[dict]] = {}
    for v in voices:
        lang = v["Locale"]
        entry = {
            "id": v["ShortName"],
            "name": v["FriendlyName"].replace("Microsoft Server Speech Text to Speech Voice ", "").strip("()"),
            "gender": v["Gender"],
            "locale": lang,
        }
        grouped.setdefault(lang, []).append(entry)
    return {"voices": grouped, "total": len(voices)}


@app.get("/api/presets")
async def get_presets():
    return {"presets": PLATFORM_PRESETS}


@app.post("/api/synthesize")
async def synthesize(req: TTSRequest):
    if req.platform and req.platform in PLATFORM_PRESETS:
        preset = PLATFORM_PRESETS[req.platform]
        req.voice = preset["voice"]
        req.rate = preset["rate"]
        req.pitch = preset["pitch"]

    file_id = str(uuid.uuid4())
    output_path = OUTPUT_DIR / f"{file_id}.mp3"

    try:
        communicate = edge_tts.Communicate(
            text=req.text,
            voice=req.voice,
            rate=req.rate,
            pitch=req.pitch,
        )
        await communicate.save(str(output_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {e}")

    file_size = output_path.stat().st_size
    duration_estimate = round(len(req.text.split()) / 2.5, 1)

    return {
        "file_id": file_id,
        "filename": f"{file_id}.mp3",
        "size_bytes": file_size,
        "estimated_duration_seconds": duration_estimate,
        "download_url": f"/api/download/{file_id}",
    }


@app.post("/api/batch")
async def batch_synthesize(req: BatchTTSRequest):
    results = []
    for i, text in enumerate(req.texts):
        if not text.strip():
            continue
        file_id = str(uuid.uuid4())
        output_path = OUTPUT_DIR / f"{file_id}.mp3"
        try:
            communicate = edge_tts.Communicate(
                text=text.strip(),
                voice=req.voice,
                rate=req.rate,
                pitch=req.pitch,
            )
            await communicate.save(str(output_path))
            results.append({
                "index": i,
                "file_id": file_id,
                "text_preview": text.strip()[:80],
                "download_url": f"/api/download/{file_id}",
            })
        except Exception:
            results.append({"index": i, "error": f"Failed to generate segment {i}"})
    return {"results": results}


@app.get("/api/download/{file_id}")
async def download(file_id: str):
    output_path = OUTPUT_DIR / f"{file_id}.mp3"
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=str(output_path),
        media_type="audio/mpeg",
        filename=f"tts-audio-{file_id[:8]}.mp3",
    )


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def start():
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    start()
