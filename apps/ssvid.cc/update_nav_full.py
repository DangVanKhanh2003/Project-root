
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

# Drawer: Add Converter Links
DRAWER_LINKS = """
                <nav class="drawer-nav" aria-label="Mobile">
                    <a href="/" class="drawer-link">Home</a>
                    <a href="/youtube-to-mp3.html" class="drawer-link">YouTube to MP3</a>
                    <a href="/youtube-to-mp4.html" class="drawer-link">YouTube to MP4</a>
                    <a href="/youtube-shorts-downloader.html" class="drawer-link">YouTube Shorts</a>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
                    <a href="/about.html" class="drawer-link">About</a>
                    <a href="/faq.html" class="drawer-link">FAQ</a>
                    <a href="/contact.html" class="drawer-link">Contact</a>
                    <a href="/terms.html" class="drawer-link">Terms</a>
                    <a href="/policy.html" class="drawer-link">Privacy</a>
                    <a href="/dmca.html" class="drawer-link">DMCA</a>
                </nav>
"""

# Footer: Add Converter Links
FOOTER_CONTENT = """
    <footer>
        <div class="container">
            <div class="footer-links" style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <a href="/youtube-to-mp3.html" style="color: inherit; text-decoration: none;">YouTube to MP3</a>
                <a href="/youtube-to-mp4.html" style="color: inherit; text-decoration: none;">YouTube to MP4</a>
                <a href="/youtube-shorts-downloader.html" style="color: inherit; text-decoration: none;">YouTube Shorts</a>
            </div>
            <div class="footer-links" style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <a href="/about.html" style="color: inherit; text-decoration: none;">About</a>
                <a href="/contact.html" style="color: inherit; text-decoration: none;">Contact</a>
                <a href="/terms.html" style="color: inherit; text-decoration: none;">Terms</a>
                <a href="/policy.html" style="color: inherit; text-decoration: none;">Privacy Policy</a>
                <a href="/dmca.html" style="color: inherit; text-decoration: none;">DMCA</a>
                <a href="/faq.html" style="color: inherit; text-decoration: none;">FAQ</a>
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
