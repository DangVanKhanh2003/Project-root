
/**
 * Adjusts the width of a select element to fit its selected option's text.
 * +18px accounts for the dropdown arrow space (background-image arrow).
 */
export function autoResizeSelect(select: HTMLSelectElement): void {
    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption) return;

    const span = document.createElement('span');
    span.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none';

    const computed = window.getComputedStyle(select);
    span.style.font = computed.font;
    span.style.fontWeight = computed.fontWeight;
    span.style.fontSize = computed.fontSize;
    span.style.fontFamily = computed.fontFamily;

    span.textContent = selectedOption.text;

    document.body.appendChild(span);
    select.style.width = (span.offsetWidth + 12) + 'px';
    span.remove();
}
