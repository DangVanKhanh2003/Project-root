/**
 * Wave SVG Animation
 * Initializes hover-triggered wave animation on SVG logo elements.
 */

function initWaveSvg(svg: SVGSVGElement | null): void {
    if (!svg) return;

    const lines = Array.from(svg.querySelectorAll<SVGPathElement>('.wave-line'));
    const centerXs = lines.map((p) => {
        const d = p.getAttribute('d');
        return d ? parseFloat(d.split(' ')[1]) : 0;
    });

    let animating = false;
    let hovering = false;

    function removeWave(): void {
        lines.forEach((p) => p.classList.remove('run-wave'));
    }

    svg.addEventListener('mouseenter', (e: MouseEvent) => {
        hovering = true;
        if (animating) return;
        animating = true;

        const rect = svg.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;

        let closest = 0;
        let minDist = Infinity;
        centerXs.forEach((x, i) => {
            const dist = Math.abs(mouseX - x);
            if (dist < minDist) {
                minDist = dist;
                closest = i;
            }
        });

        let maxDelay = 0;
        lines.forEach((p, i) => {
            const delay = Math.abs(i - closest) * 0.05;
            if (delay > maxDelay) maxDelay = delay;
            p.style.animationDelay = delay + 's';
            p.classList.add('run-wave');
        });

        setTimeout(() => {
            animating = false;
            if (!hovering) removeWave();
        }, maxDelay * 1000 + 500);
    });

    svg.addEventListener('mouseleave', () => {
        hovering = false;
        if (!animating) removeWave();
    });
}

export function initWaveAnimation(): void {
    initWaveSvg(document.getElementById('wave-svg-1') as unknown as SVGSVGElement | null);
    initWaveSvg(document.getElementById('wave-svg-2') as unknown as SVGSVGElement | null);
}
