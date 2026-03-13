export function addRippleEffect(element: HTMLElement): void {
  element.addEventListener('click', function (event: MouseEvent) {
    if (this.classList.contains('is-disabled')) return;

    const oldRipple = this.querySelector('.ripple');
    if (oldRipple) {
      oldRipple.remove();
    }

    const rect = this.getBoundingClientRect();
    const circle = document.createElement('span');
    const diameter = Math.max(this.clientWidth, this.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    this.appendChild(circle);

    setTimeout(() => {
      circle.remove();
    }, 400);
  });
}
