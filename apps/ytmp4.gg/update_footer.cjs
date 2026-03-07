const fs = require('fs');
const path = require('path');

const staticFiles = [
    'contact.html',
    'dmca.html',
    'terms-of-use.html'
];

const newFooterLinks = `
            <div class="footer-links"
                style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <a href="/download-youtube-4k-video" style="color: inherit; text-decoration: none;">YouTube HD / 4K</a>
                <a href="/youtube-shorts-mp4" style="color: inherit; text-decoration: none;">Shorts Downloader</a>
                <a href="/youtube-video-cutter" style="color: inherit; text-decoration: none;">Cut Video</a>
                <a href="/download-youtube-playlist" style="color: inherit; text-decoration: none;">Playlist Downloader</a>
                <a href="/multi-youtube-downloader" style="color: inherit; text-decoration: none;">Multi Downloader</a>
                <a href="/download-youtube-channel" style="color: inherit; text-decoration: none;">Channel Downloader</a>
            </div>
`;

const regex = /<div class="footer-links"[\s\S]*?<a href="\/download-youtube-mp3"[\s\S]*?<\/div>/;

for (const file of staticFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(regex, newFooterLinks.trim());

        // Also update mobile drawer in static html if it contains the old links
        const drawerRegex = /<a href="\/download-youtube-mp3" class="drawer-link">Download youtube Mp3<\/a>[\s\S]*?<a href="\/download-youtube-shorts" class="drawer-link">Download Youtube Shorts<\/a>/;
        const newDrawerLinks = `<a href="/download-youtube-4k-video" class="drawer-link">YouTube HD / 4K</a>
                <a href="/youtube-shorts-mp4" class="drawer-link">Shorts Downloader</a>
                <a href="/youtube-video-cutter" class="drawer-link">Cut Video</a>
                <a href="/download-youtube-playlist" class="drawer-link">Playlist Downloader</a>
                <a href="/multi-youtube-downloader" class="drawer-link">Multi Downloader</a>
                <a href="/download-youtube-channel" class="drawer-link">Channel Downloader</a>`;
        content = content.replace(drawerRegex, newDrawerLinks.trim());

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated footer in: ${file}`);
    }
}
