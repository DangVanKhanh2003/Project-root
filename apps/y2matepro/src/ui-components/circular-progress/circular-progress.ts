/**
 * CircularProgress - Unified SVG spinner and progress component
 * 3 Modes: EXTRACTING (25% spinner) → SPIRAL-IN (mask transition) → PROGRESS (0-100% fill)
 *
 * WHY: Single SVG component handles extract spinner and conversion progress with smooth transition
 * CONTRACT: Constructor(containerSelector) creates component, various methods control state
 * PRE: Valid container element must exist in DOM
 * POST: SVG rendered with responsive sizing and transition capabilities
 * EDGE: Handles abort during spiral-in, reduced motion preferences
 * USAGE: const cp = new CircularProgress('#container'); cp.startExtractingMode();
 */

const CIRCUMFERENCE = 295.31; // 2π × 47 (circle radius)
const SPIRAL_IN_DURATION = 600; // ms
const SPINNER_ROTATION_SPEED = 1.67; // rotations per second (matches 0.6s per rotation)

export class CircularProgress {
  private container: HTMLElement | null = null;
  private wrapper: HTMLElement | null = null;
  private svg: SVGSVGElement | null = null;
  private spinnerBar: SVGCircleElement | null = null;
  private spinnerGroup: SVGGElement | null = null;
  private wipePath: SVGPathElement | null = null;
  private percentageText: HTMLElement | null = null;

  private currentMode: 'extracting' | 'spiral-in' | 'progress' = 'extracting';
  private currentProgress: number = 0;
  private animationFrameId: number | null = null;
  private isAborted: boolean = false;

  constructor(containerSelector: string) {
    this.container = document.querySelector(containerSelector);

    if (!this.container) {
      console.warn(`CircularProgress: Container not found: ${containerSelector}`);
      return;
    }

    this.render();
  }

  private render(): void {
    if (!this.container) return;

    const html = `
      <div class="circular-progress-wrapper">
        <svg class="spinner-svg" viewBox="0 0 100 100">
          <defs>
            <mask id="wipeMask">
              <rect width="100" height="100" fill="white"/>
              <path id="wipePath" d="M 50 50 L 100 50 Z" fill="black"/>
            </mask>
          </defs>

          <circle class="spinner-bg" cx="50" cy="50" r="47"/>
          <g id="spinnerGroup">
            <circle class="spinner-bar spinning" cx="50" cy="50" r="47"/>
          </g>
        </svg>

        <div class="progress-percentage">0%</div>
      </div>
    `;

    this.container.innerHTML = html;

    // Query elements
    this.wrapper = this.container.querySelector('.circular-progress-wrapper');
    this.svg = this.container.querySelector('.spinner-svg');
    this.spinnerBar = this.container.querySelector('.spinner-bar');
    this.spinnerGroup = this.container.querySelector('#spinnerGroup');
    this.wipePath = this.container.querySelector('#wipePath');
    this.percentageText = this.container.querySelector('.progress-percentage');
  }

  /**
   * Start EXTRACTING mode - 25% spinner with continuous rotation
   *
   * WHY: Show activity during API extract phase with spinning 25% arc
   * CONTRACT: () → void - initializes spinner animation
   * PRE: Component must be rendered
   * POST: Spinner displays 25% arc, rotates continuously, % text hidden
   * EDGE: Safe to call multiple times (resets state)
   * USAGE: circularProgress.startExtractingMode();
   */
  startExtractingMode(): void {
    if (!this.spinnerBar || !this.percentageText || !this.spinnerGroup) return;

    this.currentMode = 'extracting';
    this.currentProgress = 0;
    this.isAborted = false;

    // 25% visible arc (73.83), 75% gap (221.48)
    this.spinnerBar.classList.add('spinning');
    this.spinnerBar.classList.remove('progress-mode');
    this.spinnerBar.style.strokeDasharray = '73.83 221.48';
    this.spinnerBar.style.strokeDashoffset = '0';
    this.spinnerGroup.removeAttribute('mask');

    // Hide percentage text during extracting
    this.percentageText.classList.remove('visible');
    this.percentageText.textContent = '0%';
  }

  /**
   * Start SPIRAL-IN transition - mask wedge sweeps 360° while spinner continues rotating
   *
   * WHY: Smooth visual transition from spinner to progress mode
   * CONTRACT: (callback:function) → void - animates for 600ms then calls callback
   * PRE: Must be in extracting mode, callback required
   * POST: Spinner disappears via mask sweep, transitions to progress mode, callback invoked
   * EDGE: Aborts if isAborted flag set, cleans up animation frame
   * USAGE: circularProgress.startSpiralInTransition(() => startPolling());
   */
  startSpiralInTransition(callback: () => void): void {
    if (!this.spinnerBar || !this.spinnerGroup || !this.wipePath) {
      callback();
      return;
    }

    this.currentMode = 'spiral-in';

    // Get current rotation before stopping animation
    const computedStyle = window.getComputedStyle(this.spinnerBar);
    const transform = computedStyle.transform;
    let currentRotation = 0;

    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      currentRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
      if (currentRotation < 0) currentRotation += 360;
    }

    // Stop CSS animation, use JS animation
    this.spinnerBar.classList.remove('spinning');

    // Apply mask
    this.spinnerGroup.setAttribute('mask', 'url(#wipeMask)');

    const startTime = Date.now();
    const startRotation = currentRotation;

    const animate = () => {
      // Check abort
      if (this.isAborted) {
        this.cleanupAnimation();
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SPIRAL_IN_DURATION, 1);

      // Continue rotation
      const additionalRotation = (elapsed / 1000) * SPINNER_ROTATION_SPEED * 360;
      const rotation = startRotation + additionalRotation;
      if (this.spinnerBar) {
        this.spinnerBar.style.transform = `rotate(${rotation}deg)`;
      }

      // Mask wedge grows from 12h (90°) clockwise
      const startAngle = 90;
      const wipeAngle = progress * 360;
      const endAngle = startAngle + wipeAngle;
      if (this.wipePath) {
        this.wipePath.setAttribute('d', this.describeArc(startAngle, endAngle));
      }

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.transitionToProgressMode();
        callback();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Transition to PROGRESS mode after spiral-in completes
   *
   * WHY: Switch from spinner display to progress bar display
   * CONTRACT: () → void - internal transition after spiral-in
   * PRE: Called automatically by spiral-in animation
   * POST: Full circle stroke, % text visible, ready for progress updates
   * EDGE: Safe to call directly if skipping spiral-in
   * USAGE: Internal - called by startSpiralInTransition()
   */
  private transitionToProgressMode(): void {
    if (!this.spinnerBar || !this.spinnerGroup || !this.percentageText) return;

    this.currentMode = 'progress';

    // Remove mask
    this.spinnerGroup.removeAttribute('mask');

    // Switch to progress mode
    this.spinnerBar.classList.add('progress-mode');
    this.spinnerBar.style.strokeDasharray = `${CIRCUMFERENCE}`;
    this.spinnerBar.style.strokeDashoffset = `${CIRCUMFERENCE}`; // Start at 0%
    this.spinnerBar.style.transform = '';

    // Show percentage text
    this.percentageText.classList.add('visible');
  }

  /**
   * Start PROGRESS mode directly (skip spiral-in)
   *
   * WHY: For cases that don't need spiral-in transition
   * CONTRACT: () → void - instant transition to progress mode
   * PRE: Component rendered
   * POST: Ready for progress updates with % text visible
   * EDGE: Cleans up any ongoing animations
   * USAGE: circularProgress.startProgressMode(); // Direct transition
   */
  startProgressMode(): void {
    this.cleanupAnimation();
    this.transitionToProgressMode();
  }

  /**
   * Update progress with percentage value (polling mode)
   *
   * WHY: Display conversion progress from API polling
   * CONTRACT: (percent:number) → void - updates visual progress
   * PRE: Must be in progress mode, percent in range 0-100
   * POST: Circle fills to percent, % text updated
   * EDGE: Clamps to 0-100, never goes backward
   * USAGE: circularProgress.updateProgress(45); // 45%
   */
  updateProgress(percent: number): void {
    if (this.currentMode !== 'progress') return;
    if (!this.spinnerBar || !this.percentageText) return;

    // Never-backward rule
    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    const newProgress = Math.max(clampedPercent, this.currentProgress);
    this.currentProgress = newProgress;

    // Update stroke-dashoffset (100% = 0 offset, 0% = full circumference)
    const offset = CIRCUMFERENCE - (CIRCUMFERENCE * newProgress / 100);
    this.spinnerBar.style.strokeDashoffset = `${offset}`;

    // Update text
    const roundedPercent = Math.round(newProgress);
    this.percentageText.textContent = `${roundedPercent}%`;
  }

  /**
   * Update progress from byte values (download mode)
   *
   * WHY: Calculate and display progress for RAM download
   * CONTRACT: (loaded:number, total:number) → void - calculates % from bytes
   * PRE: Must be in progress mode, valid byte values
   * POST: Progress updated based on loaded/total ratio
   * EDGE: Handles total=0 (shows 0%), never goes backward
   * USAGE: circularProgress.updateProgressFromBytes(12*1024*1024, 26*1024*1024);
   */
  updateProgressFromBytes(loaded: number, total: number): void {
    if (total === 0) {
      this.updateProgress(0);
      return;
    }

    const percent = (loaded / total) * 100;
    this.updateProgress(percent);
  }

  /**
   * Abort all ongoing animations
   *
   * WHY: Clean cancellation when modal closes during transition
   * CONTRACT: () → void - stops animations immediately
   * PRE: None
   * POST: All animations stopped, abort flag set
   * EDGE: Safe to call multiple times
   * USAGE: circularProgress.abort(); // On modal close
   */
  abort(): void {
    this.isAborted = true;
    this.cleanupAnimation();
  }

  /**
   * Reset to initial state
   *
   * WHY: Prepare for reuse or cleanup
   * CONTRACT: () → void - resets all state
   * PRE: None
   * POST: Progress at 0%, extracting mode
   * EDGE: Cleans up animations first
   * USAGE: circularProgress.reset();
   */
  reset(): void {
    this.cleanupAnimation();
    this.currentProgress = 0;
    this.isAborted = false;
    this.startExtractingMode();
  }

  /**
   * Destroy component and cleanup
   *
   * WHY: Remove from DOM when modal closes
   * CONTRACT: () → void - full cleanup
   * PRE: None
   * POST: Container cleared, all references nulled
   * EDGE: Safe to call multiple times
   * USAGE: circularProgress.destroy();
   */
  destroy(): void {
    this.cleanupAnimation();
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.container = null;
    this.wrapper = null;
    this.svg = null;
    this.spinnerBar = null;
    this.spinnerGroup = null;
    this.wipePath = null;
    this.percentageText = null;
  }

  private cleanupAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Create SVG arc path for wedge mask
   *
   * WHY: Generate path for spiral-in mask animation
   * CONTRACT: (startAngle:number, endAngle:number) → string - returns SVG path
   * PRE: Valid angles in degrees
   * POST: Returns SVG path string for arc wedge
   * EDGE: Handles angles > 360°, large arc flag calculation
   * USAGE: Internal - called by spiral-in animation
   */
  private describeArc(startAngle: number, endAngle: number): string {
    const normalizedEnd = endAngle % 360;
    // Increase mask radius to 52 to fully cover stroke outer edge
    // Circle r=47 + stroke-width 8/2 = 51, so 52 provides 1px margin
    const maskRadius = 52;
    const startPoint = this.polarToCartesian(50, 50, maskRadius, startAngle);
    const endPoint = this.polarToCartesian(50, 50, maskRadius, normalizedEnd);
    const sweepAngle = endAngle - startAngle;
    const largeArcFlag = sweepAngle > 180 ? "1" : "0";

    return [
      "M", 50, 50,
      "L", startPoint.x, startPoint.y,
      "A", maskRadius, maskRadius, 0, largeArcFlag, 1, endPoint.x, endPoint.y,
      "Z"
    ].join(" ");
  }

  private polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): { x: number; y: number } {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
}
