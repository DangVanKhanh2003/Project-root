
/**
 * Adjusts the width of a select element to fit its selected option's text.
 * @param select - The HTMLSelectElement to resize.
 * @param padding - Extra padding in pixels (default 30 for arrow space and safety).
 */
export function autoResizeSelect(select: HTMLSelectElement, padding: number = 30): void {
    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption) return;

    const span = document.createElement('span');
    span.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none;top:-9999px;';

    // Copy font styles from the select to ensure measurement is accurate
    const computed = window.getComputedStyle(select);
    span.style.font = computed.font;
    span.style.fontWeight = computed.fontWeight;
    span.style.fontSize = computed.fontSize;
    span.style.fontFamily = computed.fontFamily;
    span.style.letterSpacing = computed.letterSpacing;
    span.style.textTransform = computed.textTransform;

    span.textContent = selectedOption.text;

    document.body.appendChild(span);
    const width = span.offsetWidth;
    span.remove();

    select.style.width = `${width + padding}px`;
}
