---
name: testing-tts-studio
description: How to test the TTS Studio FastAPI frontend, narrator presets, Burmese Unicode input, and HTML font updates.
---

# TTS Studio Testing

Use this skill when validating changes to the TTS Studio app UI, narrator presets, text input, or static HTML/CSS/JS assets.

## Setup

1. From the repo root, install dependencies if needed:
   ```bash
   python -m pip install -e .
   ```
2. Run static checks:
   ```bash
   python -m compileall app && node --check static/app.js
   ```
3. Start the app:
   ```bash
   python -m app.main
   ```
4. Open `http://localhost:8000` in Chrome.

## Narrator Smoke Tests

Use the UI and browser runtime to verify:
- English + Male resolves to `en-US-AndrewNeural`.
- English + Female resolves to `en-US-EmmaNeural`.
- English + Young Baby Girl resolves to `en-US-AnaNeural`.
- English + Young Boy resolves to `en-US-EricNeural`.
- Burmese + Female resolves to `my-MM-NilarNeural`.
- Burmese + Male/Young Boy resolves to `my-MM-ThihaNeural`.
- Burmese + Young Baby Girl resolves to `my-MM-NilarNeural`.

## Burmese Unicode Input

When entering Burmese text through automation, prefer clipboard/script insertion rather than raw GUI typing if Burmese characters are escaped. Verify the textarea value contains real Burmese Unicode and does not include literal `\\u` escape sequences.

Example text:
```text
မင်္ဂလာပါ။ TTS Studio မှ ကြိုဆိုပါတယ်။
```

## HTML Font and Static Asset Checks

For HTML/CSS/JS changes that affect Burmese rendering:
- Confirm the Google Fonts link includes `Noto+Sans+Myanmar`.
- Confirm CSS/JS URLs include a cache-busting query string when browser caching could hide updates.
- Confirm `getComputedStyle(document.body).fontFamily` includes `Noto Sans Myanmar`.
- Confirm dynamically rendered Burmese language options keep `lang="my"`.

## Recording

When performing UI testing, record the browser session and annotate key assertions. Attach the recording and a markdown test report with screenshot evidence when reporting results.
