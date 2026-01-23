# Translation Prompts for AI CLI

Sử dụng prompts này với AI CLI (Claude, ChatGPT, etc.) để generate các file translation JSON.

---

## Prompt 1: Translate Base i18n Data

```
I need you to translate this English i18n JSON file into [LANGUAGE_NAME] ([LANGUAGE_CODE]).

**Source file:** `_data/i18n/en.json`

**Target language:** [LANGUAGE_NAME] ([LANGUAGE_CODE])
**Target file:** `_data/i18n/[LANGUAGE_CODE].json`

**Important rules:**
1. Keep the exact same JSON structure and keys
2. Only translate the VALUES, never translate the keys
3. For format names (MP4, MP3, WEBM, MKV, OGG, OPUS, WAV) - keep them as-is (these are technical terms)
4. For quality options like "MP4 - 1080p", "MP3 - 320kbps" - keep the format and numbers, translate only descriptive parts if any
5. Maintain HTML entities if present (like &copy; for ©)
6. Keep punctuation marks and spacing consistent
7. Use natural, native-speaker language for the target language
8. For button labels and UI text, use common conventions in that language

**Source JSON:**

```json
{
  "nav": {
    "home": "YouTube Downloader",
    "youtubeToMp4": "YouTube to MP4 Converter",
    "youtubeToMp3": "YouTube to MP3 Converter",
    "youtubeShorts": "YouTube Shorts Downloader",
    "language": "English"
  },
  "hero": {
    "placeholder": "Search or paste link here...",
    "pasteLabel": "Paste from clipboard",
    "clearLabel": "Clear input",
    "submitButton": "Start",
    "termsText": "By using our service you are accepting our",
    "termsLink": "Terms of Use"
  },
  "formatSelector": {
    "autoSubmit": "Auto submit",
    "autoSubmitTooltip": "Automatically submit when pasting URL or keyword",
    "formats": {
      "mp4": "MP4",
      "mp3": "MP3"
    },
    "quality": {
      "videoLabel": "Video quality",
      "audioLabel": "Audio quality"
    },
    "options": {
      "mp4": {
        "1080p": "MP4 - 1080p",
        "720p": "MP4 - 720p",
        "480p": "MP4 - 480p",
        "360p": "MP4 - 360p",
        "240p": "MP4 - 240p",
        "144p": "MP4 - 144p",
        "webm": "WEBM",
        "mkv": "MKV"
      },
      "mp3": {
        "320kbps": "MP3 - 320kbps",
        "256kbps": "MP3 - 256kbps",
        "192kbps": "MP3 - 192kbps",
        "128kbps": "MP3 - 128kbps",
        "ogg": "OGG",
        "opus": "OPUS",
        "wav": "WAV"
      }
    }
  },
  "status": {
    "processing": "Processing...",
    "preparing": "Preparing...",
    "merging": "Merging...",
    "zipping": "Zipping...",
    "ready": "Ready 100%",
    "completed": "Completed",
    "failed": "Failed"
  },
  "buttons": {
    "download": "Download",
    "tryAgain": "Try Again",
    "cancel": "Cancel",
    "seeMore": "see more",
    "seeLess": "see less",
    "bulkDownload": "Download Selected"
  },
  "gallery": {
    "title": "Gallery",
    "noItems": "No gallery items to display",
    "selected": "selected",
    "selectAll": "Select All",
    "deselectAll": "Deselect All"
  },
  "mobile": {
    "menuToggleLabel": "Open navigation menu",
    "menuCloseLabel": "Close navigation menu",
    "langButtonLabel": "Select language"
  },
  "footer": {
    "copyright": "© 2025 y2mate",
    "about": "About",
    "contact": "Contact",
    "terms": "Terms of Service",
    "privacy": "Privacy Policy"
  },
  "errors": {
    "invalidUrl": "Please enter a valid URL",
    "networkError": "Network error. Please try again.",
    "processingError": "Processing failed. Please try again.",
    "timeout": "Request timeout. Please try again.",
    "downloadExpired": "Download link expired",
    "conversionFailed": "Conversion failed"
  },
  "messages": {
    "downloadReady": "Your download is ready",
    "processing": "Processing your request...",
    "pleaseWait": "Please wait..."
  }
}
```

Please provide ONLY the complete translated JSON with no additional explanation.
```

---

## Prompt 2: Translate Page Data (Index)

```
I need you to translate this English page content JSON file into [LANGUAGE_NAME] ([LANGUAGE_CODE]).

**Source file:** `_data/pages/index/en.json`

**Target language:** [LANGUAGE_NAME] ([LANGUAGE_CODE])
**Target file:** `_data/pages/index/[LANGUAGE_CODE].json`

**Important rules:**
1. Keep the exact same JSON structure and keys
2. Only translate the VALUES, never translate the keys
3. Translate naturally for native speakers of the target language
4. Keep HTML tags intact (like <strong>, <a>, <em>)
5. For links like `<a href="/youtube-to-mp4">YouTube to MP4</a>`, translate the link text but keep the href unchanged
6. Maintain SEO best practices - titles should be compelling and descriptive
7. Meta descriptions should be 150-160 characters
8. Keep technical terms like "MP4", "MP3", "YouTube", "Y2Mate" unchanged
9. Adapt idioms and expressions to sound natural in the target language

**Source JSON:**

```json
{
  "seo": {
    "title": "Download YouTube Video Online – MP4 & MP3 | Y2Mate",
    "description": "Download YouTube video online for free with Y2Mate. Download YouTube videos as video or audio (MP4, MP3) — no watermark, no ads, use directly in your browser.",
    "ogTitle": "Y2mate - Free YouTube Downloader - Download YouTube Video Free",
    "ogDescription": "Y2mate YouTube Downloader - free MP3/MP4 conversions (128-320kbps, 360p-1080p). Fast, no limits, no app.",
    "schemaName": "Y2mate - Youtube Video Downloader",
    "schemaDescription": "Y2mate YouTube Downloader - convert to MP3 128-320kbps or MP4 360p-1080p fast. No limits, no app."
  },
  "hero": {
    "title": "Y2Mate - Download YouTube Video"
  },
  "content": {
    "sections": [
      {
        "title": "What Is Y2Mate – YouTube Video Downloader",
        "paragraphs": [
          "Y2Mate is an online tool that allows users to download YouTube videos in various formats and resolutions. The tool is designed for people who need to save YouTube content for offline viewing or personal use.",
          "The tool runs directly in your browser and is compatible with computers, smartphones, and tablets, making it suitable for common youtube video download use cases today."
        ]
      },
      {
        "title": "YouTube Video Downloader Online",
        "paragraphs": [
          "Y2Mate works as an online YouTube downloader, allowing you to download content from YouTube without installing any applications or browser extensions.",
          "After you paste a video link, the system analyzes the content and displays suitable download options. You can choose to download the video for offline viewing or extract audio for personal use."
        ]
      },
      {
        "title": "More Download Options from Y2Mate",
        "paragraphs": [
          "If you need more specialized options, Y2Mate also provides dedicated tools for specific use cases.",
          "You can use the <a href=\"/youtube-to-mp4\">YouTube to MP4</a> tool to download videos and select the appropriate resolution for offline viewing.",
          "If you only need the audio, the <a href=\"/youtube-to-mp3\">YouTube to MP3</a> tool helps convert videos into MP3 format quickly.",
          "For short-form content, the <a href=\"/youtube-short-downloader\">YouTube Shorts Downloader</a> is designed specifically for downloading vertical Shorts videos.",
          "<em>Each tool is built separately to serve a specific purpose, making the overall experience clear and easy to understand.</em>"
        ]
      },
      {
        "title": "Is It Safe to Download YouTube Content with Y2Mate?",
        "paragraphs": [
          "Y2Mate does not require software installation, does not ask for login credentials, and does not collect personal information. All downloads are handled directly within your browser.",
          "Users should download content for personal use only and respect the rights of content creators on YouTube."
        ]
      }
    ]
  },
  "whyChoose": {
    "title": "Why Choose Y2Mate to Download YouTube Content",
    "intro": "There are many websites that allow users to download content from YouTube, but not all of them provide a clear and stable experience. Y2Mate is built to solve common issues people face when downloading YouTube videos.",
    "reasons": [
      "No watermark – downloaded content remains true to the original source",
      "No intrusive ads – no pop-ups or unexpected redirects",
      "Clean downloads – files are clear and easy to use",
      "No registration required – access and use instantly",
      "Stable performance – works well with different types of YouTube content"
    ]
  },
  "instructions": {
    "title": "How to Download YouTube Video with Y2Mate",
    "steps": [
      "Copy the video link from YouTube.",
      "Paste the link into the input field on the page.",
      "Click the start button to let the system analyze the content.",
      "Choose the format you need and download it to your device."
    ],
    "note": "The entire process runs directly in your browser and does not require installing any software."
  }
}
```

Please provide ONLY the complete translated JSON with no additional explanation.
```

---

## Language List (19 languages)

Use these prompts for each language:

1. **Arabic (ar)** - العربية
2. **Bengali (bn)** - বাংলা
3. **German (de)** - Deutsch
4. **Spanish (es)** - Español
5. **French (fr)** - Français
6. **Hindi (hi)** - हिन्दी
7. **Indonesian (id)** - Indonesia
8. **Italian (it)** - Italiano
9. **Japanese (ja)** - 日本語
10. **Korean (ko)** - 한국어
11. **Burmese (my)** - မြန်မာ
12. **Malay (ms)** - Melayu
13. **Portuguese (pt)** - Português
14. **Russian (ru)** - Русский
15. **Thai (th)** - ไทย
16. **Turkish (tr)** - Türkçe
17. **Urdu (ur)** - اردو
18. **Vietnamese (vi)** - Tiếng Việt (already done)

---

## Usage Instructions

### Method 1: Using Claude CLI / ChatGPT CLI

```bash
# Example for Spanish translation
claude "I need you to translate this English i18n JSON file into Spanish (es)... [paste full prompt]"

# Save output to file
claude "..." > _data/i18n/es.json
```

### Method 2: Batch Processing Script

Create a script to automate for all languages:

```bash
#!/bin/bash

LANGUAGES=(
  "ar:العربية"
  "bn:বাংলা"
  "de:Deutsch"
  "es:Español"
  "fr:Français"
  "hi:हिन्दी"
  "id:Indonesia"
  "it:Italiano"
  "ja:日本語"
  "ko:한국어"
  "my:မြန်မာ"
  "ms:Melayu"
  "pt:Português"
  "ru:Русский"
  "th:ไทย"
  "tr:Türkçe"
  "ur:اردو"
)

for lang in "${LANGUAGES[@]}"; do
  CODE="${lang%%:*}"
  NAME="${lang##*:}"

  echo "Translating to $NAME ($CODE)..."

  # Use AI CLI to translate
  ai-cli "Translate to $NAME ($CODE)... [full prompt]" > "_data/i18n/$CODE.json"

  echo "✓ Created _data/i18n/$CODE.json"
done
```

### Method 3: Manual One-by-One

1. Copy Prompt 1 from above
2. Replace `[LANGUAGE_NAME]` and `[LANGUAGE_CODE]` with target language
3. Paste into Claude CLI or ChatGPT
4. Save output to `_data/i18n/[CODE].json`
5. Repeat for Prompt 2 (page data)

---

## Validation Checklist

After generating translations, verify:

- [ ] JSON syntax is valid (use `node -e "JSON.parse(require('fs').readFileSync('file.json'))"`)
- [ ] All keys match the English version exactly
- [ ] No English text remains (except technical terms)
- [ ] HTML tags are intact
- [ ] Links href attributes unchanged
- [ ] Format names (MP4, MP3, etc.) unchanged
- [ ] Numbers and technical values unchanged

---

## Quick Test Command

```bash
# Validate all JSON files
for file in _data/i18n/*.json; do
  echo "Validating $file..."
  node -e "JSON.parse(require('fs').readFileSync('$file', 'utf-8'))" && echo "✓ Valid" || echo "✗ Invalid"
done
```
