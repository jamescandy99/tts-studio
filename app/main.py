import os
import re
import uuid
import asyncio
import unicodedata
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

OUTPUT_DIR = Path(os.environ.get("TTS_OUTPUT_DIR", Path(__file__).parent.parent / "output"))
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


SCRIPT_TO_LOCALE: dict[str, str] = {
    "MYANMAR": "my-MM",
    "THAI": "th-TH",
    "CJK": "zh-CN",
    "HANGUL": "ko-KR",
    "HIRAGANA": "ja-JP",
    "KATAKANA": "ja-JP",
    "DEVANAGARI": "hi-IN",
    "ARABIC": "ar-SA",
    "HEBREW": "he-IL",
    "BENGALI": "bn-IN",
    "TAMIL": "ta-IN",
    "TELUGU": "te-IN",
    "KANNADA": "kn-IN",
    "MALAYALAM": "ml-IN",
    "GUJARATI": "gu-IN",
    "GEORGIAN": "ka-GE",
    "ARMENIAN": "hy-AM",
    "ETHIOPIC": "am-ET",
    "KHMER": "km-KH",
    "LAO": "lo-LA",
    "SINHALA": "si-LK",
    "TIBETAN": "bo-CN",
    "GREEK": "el-GR",
    "CYRILLIC": "ru-RU",
}

DEFAULT_VOICES: dict[str, str] = {
    "my-MM": "my-MM-ThihaNeural",
    "th-TH": "th-TH-PremwadeeNeural",
    "zh-CN": "zh-CN-XiaoxiaoNeural",
    "ko-KR": "ko-KR-SunHiNeural",
    "ja-JP": "ja-JP-NanamiNeural",
    "hi-IN": "hi-IN-SwaraNeural",
    "ar-SA": "ar-SA-ZariyahNeural",
    "he-IL": "he-IL-HilaNeural",
    "bn-IN": "bn-IN-TanishaaNeural",
    "ta-IN": "ta-IN-PallaviNeural",
    "te-IN": "te-IN-ShrutiNeural",
    "kn-IN": "kn-IN-SapnaNeural",
    "ml-IN": "ml-IN-SobhanaNeural",
    "gu-IN": "gu-IN-DhwaniNeural",
    "ka-GE": "ka-GE-EkaNeural",
    "am-ET": "am-ET-MekdesNeural",
    "km-KH": "km-KH-SreymomNeural",
    "lo-LA": "lo-LA-KeomanyNeural",
    "si-LK": "si-LK-ThiliniNeural",
    "el-GR": "el-GR-AthinaNeural",
    "ru-RU": "ru-RU-SvetlanaNeural",
}


def detect_script(text: str) -> str | None:
    script_counts: dict[str, int] = {}
    for ch in text:
        if ch.isspace() or unicodedata.category(ch).startswith("P"):
            continue
        name = unicodedata.name(ch, "")
        if "MYANMAR" in name:
            script_counts["MYANMAR"] = script_counts.get("MYANMAR", 0) + 1
        elif "THAI" in name:
            script_counts["THAI"] = script_counts.get("THAI", 0) + 1
        elif "CJK" in name:
            script_counts["CJK"] = script_counts.get("CJK", 0) + 1
        elif "HANGUL" in name:
            script_counts["HANGUL"] = script_counts.get("HANGUL", 0) + 1
        elif "HIRAGANA" in name:
            script_counts["HIRAGANA"] = script_counts.get("HIRAGANA", 0) + 1
        elif "KATAKANA" in name:
            script_counts["KATAKANA"] = script_counts.get("KATAKANA", 0) + 1
        elif "DEVANAGARI" in name:
            script_counts["DEVANAGARI"] = script_counts.get("DEVANAGARI", 0) + 1
        elif "ARABIC" in name:
            script_counts["ARABIC"] = script_counts.get("ARABIC", 0) + 1
        elif "HEBREW" in name:
            script_counts["HEBREW"] = script_counts.get("HEBREW", 0) + 1
        elif "BENGALI" in name:
            script_counts["BENGALI"] = script_counts.get("BENGALI", 0) + 1
        elif "TAMIL" in name:
            script_counts["TAMIL"] = script_counts.get("TAMIL", 0) + 1
        elif "TELUGU" in name:
            script_counts["TELUGU"] = script_counts.get("TELUGU", 0) + 1
        elif "KANNADA" in name:
            script_counts["KANNADA"] = script_counts.get("KANNADA", 0) + 1
        elif "MALAYALAM" in name:
            script_counts["MALAYALAM"] = script_counts.get("MALAYALAM", 0) + 1
        elif "GUJARATI" in name:
            script_counts["GUJARATI"] = script_counts.get("GUJARATI", 0) + 1
        elif "GEORGIAN" in name:
            script_counts["GEORGIAN"] = script_counts.get("GEORGIAN", 0) + 1
        elif "ARMENIAN" in name:
            script_counts["ARMENIAN"] = script_counts.get("ARMENIAN", 0) + 1
        elif "ETHIOPIC" in name:
            script_counts["ETHIOPIC"] = script_counts.get("ETHIOPIC", 0) + 1
        elif "KHMER" in name:
            script_counts["KHMER"] = script_counts.get("KHMER", 0) + 1
        elif "LAO" in name:
            script_counts["LAO"] = script_counts.get("LAO", 0) + 1
        elif "SINHALA" in name:
            script_counts["SINHALA"] = script_counts.get("SINHALA", 0) + 1
        elif "GREEK" in name and "LATIN" not in name:
            script_counts["GREEK"] = script_counts.get("GREEK", 0) + 1
        elif "CYRILLIC" in name:
            script_counts["CYRILLIC"] = script_counts.get("CYRILLIC", 0) + 1

    if not script_counts:
        return None
    return max(script_counts, key=script_counts.get)


def get_voice_for_text(text: str, current_voice: str) -> str:
    script = detect_script(text)
    if script is None:
        return current_voice

    locale = SCRIPT_TO_LOCALE.get(script)
    if locale is None:
        return current_voice

    if current_voice.startswith(locale.split("-")[0]):
        return current_voice

    return DEFAULT_VOICES.get(locale, current_voice)


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

    resolved_voice = get_voice_for_text(req.text, req.voice)

    file_id = str(uuid.uuid4())
    output_path = OUTPUT_DIR / f"{file_id}.mp3"

    try:
        communicate = edge_tts.Communicate(
            text=req.text,
            voice=resolved_voice,
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
        "voice_used": resolved_voice,
    }


@app.post("/api/batch")
async def batch_synthesize(req: BatchTTSRequest):
    results = []
    for i, text in enumerate(req.texts):
        if not text.strip():
            continue
        file_id = str(uuid.uuid4())
        output_path = OUTPUT_DIR / f"{file_id}.mp3"
        resolved_voice = get_voice_for_text(text.strip(), req.voice)
        try:
            communicate = edge_tts.Communicate(
                text=text.strip(),
                voice=resolved_voice,
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
