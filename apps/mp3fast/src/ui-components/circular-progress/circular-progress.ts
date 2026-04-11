/**
 * CircularProgress - CSS conic-gradient based spinner and progress component
 * 2 Modes: EXTRACTING (25% spinner rotating) → PROGRESS (0-100% fill)
 *
 * WHY: Native CSS solution with better performance and no pixelation
 * CONTRACT: Constructor(containerSelector) creates component, various methods control state
 * PRE: Valid container element must exist in DOM
 * POST: Circular progress rendered with responsive sizing
 * EDGE: Handles reduced motion preferences
 * USAGE: const cp = new CircularProgress('#container'); cp.startExtractingMode();
 */

export class CircularProgress {
  private container: HTMLElement | null = null;
  private progressCircle: HTMLElement | null = null;
  private percentageText: HTMLElement | null = null;

  private currentMode: 'extracting' | 'progress' | 'merging' = 'extracting';
  private currentProgress: number = 0;

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
        <div class="progress-circle" data-mode="extracting" style="--progress-deg: 90"></div>
        <div class="progress-percentage">0%</div>
      </div>
    `;

    this.container.innerHTML = html;

    // Query elements
    this.progressCircle = this.container.querySelector('.progress-circle');
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
    if (!this.progressCircle || !this.percentageText) return;

    this.currentMode = 'extracting';
    this.currentProgress = 0;

    // Show 25% arc (90 degrees) with rotation animation
    this.progressCircle.setAttribute('data-mode', 'extracting');
    this.progressCircle.style.setProperty('--progress-deg', '90');

    // Hide percentage text during extracting
    this.percentageText.classList.remove('visible');
    this.percentageText.textContent = '0%';
  }

  /**
   * Start SPIRAL-IN transition (legacy - no longer used)
   *
   * WHY: Backward compatibility
   * CONTRACT: (callback:function) → void - calls callback immediately
   * USAGE: circularProgress.startSpiralInTransition(() => startPolling());
   */
  startSpiralInTransition(callback: () => void): void {
    // No animation - call callback immediately
    callback();
  }

  /**
   * Start PROGRESS mode directly
   *
   * WHY: Transition from spinner to progress display
   * CONTRACT: () → void - instant transition to progress mode
   * PRE: Component rendered
   * POST: Ready for progress updates with % text visible
   * USAGE: circularProgress.startProgressMode();
   */
  startProgressMode(): void {
    if (!this.progressCircle || !this.percentageText) return;

    this.currentMode = 'progress';

    // Disable transition temporarily to reset to 0 instantly
    this.progressCircle.style.transition = 'none';

    // Switch to progress mode (0 degrees = 0%)
    this.progressCircle.setAttribute('data-mode', 'progress');
    this.progressCircle.style.setProperty('--progress-deg', '0');

    // Force reflow to apply the instant change
    void this.progressCircle.offsetHeight;

    // Re-enable transition for future updates
    this.progressCircle.style.transition = '';

    // Show percentage text
    this.percentageText.classList.add('visible');
    this.percentageText.textContent = '0%';
  }

  /**
   * Start MERGING mode - 2 quarter circles rotating spinner
   *
   * Phase 3: Show merging spinner when processing reaches 100%
   * WHY: Visual feedback during server-side file merging
   * CONTRACT: () → void - transition to merging spinner
   * PRE: Component rendered, processing complete at 100%
   * POST: Shows 2 rotating quarter circles (90deg arcs), no text
   * EDGE: Safe to call from any state
   * USAGE: circularProgress.startMergingMode();
   */
  startMergingMode(): void {
    if (!this.progressCircle || !this.percentageText) return;

    console.log('[CircularProgress] Phase 3: Starting merging mode');
    this.currentMode = 'merging';

    // Switch to merging mode with 2 quarter circles (90deg each)
    this.progressCircle.setAttribute('data-mode', 'merging');

    // Hide percentage text during merging
    this.percentageText.classList.remove('visible');
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
    if (!this.progressCircle || !this.percentageText) return;

    // Never-backward rule
    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    const newProgress = Math.max(clampedPercent, this.currentProgress);
    this.currentProgress = newProgress;

    // Convert percent to degrees (0-100% = 0-360deg)
    const degrees = (newProgress / 100) * 360;
    const roundedPercent = Math.round(newProgress);


    // Add faster transition class when reaching 100%
    if (roundedPercent === 100) {
      this.progressCircle.classList.add('completing-final');
    }

    this.progressCircle.style.setProperty('--progress-deg', `${Math.round(degrees)}`);

    // Update text
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
   * Abort all ongoing animations (legacy - no-op for CSS)
   *
   * WHY: Backward compatibility
   * CONTRACT: () → void - no-op
   * USAGE: circularProgress.abort();
   */
  abort(): void {
    // No-op: CSS animations are controlled by data-mode attribute
  }

  /**
   * Reset to initial state
   *
   * WHY: Prepare for reuse or cleanup
   * CONTRACT: () → void - resets all state
   * PRE: None
   * POST: Progress at 0%, extracting mode
   * USAGE: circularProgress.reset();
   */
  reset(): void {
    this.currentProgress = 0;
    this.startExtractingMode();
  }

  /**
   * Render SUCCESS state - green circle with tick icon
   *
   * WHY: Visual confirmation when download is ready
   * CONTRACT: () → void - replaces progress with success indicator
   * PRE: Component must be rendered
   * POST: Green stroke circle animates from 0% → 100%, tick gif displayed
   * EDGE: Safe to call from any state
   * USAGE: circularProgress.renderSuccessState();
   */
  renderSuccessState(): void {
    if (!this.container) return;

    this.currentMode = 'progress';

    const html = `
      <div class="circular-progress-wrapper success-indicator">
        <!-- CSS circle for smooth rendering -->
        <div class="success-circle-css"></div>

        <!-- SVG checkmark for smooth path -->
        <svg class="checkmark-svg" viewBox="0 0 100 100">
          <path class="success-checkmark"
                d="M 30 50 L 45 65 L 70 35"
                fill="none" stroke="#1BC012" stroke-width="8"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `;

    this.container.innerHTML = html;

    // Clear references since we replaced the DOM
    this.progressCircle = null;
    this.percentageText = null;
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

    if (this.container) {
      this.container.innerHTML = '';
    }
    this.container = null;
    this.progressCircle = null;
    this.percentageText = null;
  }
}
