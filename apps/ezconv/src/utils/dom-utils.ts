let measurementSpan: HTMLSpanElement | null = null;
let lastFont: string | null = null;

export function autoResizeSelect(select: HTMLSelectElement): void {
    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption) return;

    if (!measurementSpan) {
        measurementSpan = document.createElement('span');
        measurementSpan.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none;top:-9999px';
        document.body.appendChild(measurementSpan);
    }

    const computed = window.getComputedStyle(select);
    const font = computed.font;
    
    // Only update font style if it changed
    if (font !== lastFont) {
        measurementSpan.style.font = font;
        measurementSpan.style.fontWeight = computed.fontWeight;
        measurementSpan.style.fontSize = computed.fontSize;
        measurementSpan.style.fontFamily = computed.fontFamily;
        lastFont = font;
    }

    measurementSpan.textContent = selectedOption.text;
    select.style.width = (measurementSpan.offsetWidth + 12) + 'px';
}
