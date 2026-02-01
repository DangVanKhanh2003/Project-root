
import os
import re

BASE_DIR = r"f:\downloader\Project-root\apps\ssvid.cc"

MAIN_PAGES = [
    "index",
    "youtube-to-mp3",
    "youtube-to-mp4",
    "youtube-shorts-downloader"
]

INFO_PAGES = [
    "about",
    "contact",
    "terms",
    "policy",
    "dmca",
    "faq"
]

# Drawer: Add Converter Links
DRAWER_LINKS = """
                <nav class="drawer-nav" aria-label="Mobile">
                    <a href="/" class="drawer-link">Home</a>
                    <a href="/youtube-to-mp3" class="drawer-link">YouTube to MP3</a>
                    <a href="/youtube-to-mp4" class="drawer-link">YouTube to MP4</a>
                    <a href="/youtube-shorts-downloader" class="drawer-link">YouTube Shorts</a>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
                    <a href="/about" class="drawer-link">About</a>
                    <a href="/faq" class="drawer-link">FAQ</a>
                    <a href="/contact" class="drawer-link">Contact</a>
                    <a href="/terms" class="drawer-link">Terms</a>
                    <a href="/policy" class="drawer-link">Privacy</a>
                    <a href="/dmca" class="drawer-link">DMCA</a>
                </nav>
"""

# Footer: Add Converter Links
FOOTER_CONTENT = """
    <footer>
        <div class="container">
            <div class="footer-links" style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <a href="/youtube-to-mp3" style="color: inherit; text-decoration: none;">YouTube to MP3</a>
                <a href="/youtube-to-mp4" style="color: inherit; text-decoration: none;">YouTube to MP4</a>
                <a href="/youtube-shorts-downloader" style="color: inherit; text-decoration: none;">YouTube Shorts</a>
            </div>
            <div class="footer-links" style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <a href="/about" style="color: inherit; text-decoration: none;">About</a>
                <a href="/contact" style="color: inherit; text-decoration: none;">Contact</a>
                <a href="/terms" style="color: inherit; text-decoration: none;">Terms</a>
                <a href="/policy" style="color: inherit; text-decoration: none;">Privacy Policy</a>
                <a href="/dmca" style="color: inherit; text-decoration: none;">DMCA</a>
                <a href="/faq" style="color: inherit; text-decoration: none;">FAQ</a>
            </div>
            <div class="copyright">© 2026 SSVid. All rights reserved.</div>
        </div>
    </footer>
"""

def update_file(filename):
    file_path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(file_path):
        print(f"File not found: {filename}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Mobile Drawer Links
    content = re.sub(
        r'<nav class="drawer-nav" aria-label="Mobile">[\s\S]*?</nav>',
        DRAWER_LINKS.strip(),
        content
    )

    # 2. Update Footer
    content = re.sub(
        r'<footer>[\s\S]*?</footer>',
        FOOTER_CONTENT.strip(),
        content
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated nav in {filename}")

if __name__ == "__main__":
    for f in MAIN_PAGES + INFO_PAGES:
        update_file(f)
