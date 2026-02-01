
import os
import re

BASE_DIR = r"f:\downloader\Project-root\apps\ssvid.cc"

MAIN_PAGES = [
    "index.html",
    "youtube-to-mp3.html",
    "youtube-to-mp4.html",
    "youtube-shorts-downloader.html"
]

INFO_PAGES = [
    "about.html",
    "contact.html",
    "terms.html",
    "policy.html",
    "dmca.html",
    "faq.html"
]

DESKTOP_LINKS = """
                <a href="/" class="header-link">Home</a>
                <a href="/about.html" class="header-link">About</a>
"""

def fix_file(filename):
    file_path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(file_path):
        print(f"File not found: {filename}")
        return
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if filename in MAIN_PAGES:
        # Main Pages: Preserve lang-selector
        pattern = r'(<nav class="header-nav" aria-label="Primary">)[\s\S]*?(<div class="lang-selector">)'
        replacement = f'\\1{DESKTOP_LINKS}\\2'
        content = re.sub(pattern, replacement, content)
        
    else:
        # Info Pages: No lang-selector, simple replace
        pattern = r'(<nav class="header-nav" aria-label="Primary">)[\s\S]*?(</nav>)'
        replacement = f'\\1{DESKTOP_LINKS}\\2'
        content = re.sub(pattern, replacement, content)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed header in {filename}")

if __name__ == "__main__":
    for f in MAIN_PAGES + INFO_PAGES:
        fix_file(f)
