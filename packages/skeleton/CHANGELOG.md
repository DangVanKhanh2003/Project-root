# Changelog

All notable changes to Skeleton.css will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-14

### Added
- Initial release of Skeleton.css
- Core shimmer animation system
- 8 skeleton component variants:
  - `.skeleton` - Base class
  - `.skeleton-text` - Text lines with 5 width modifiers
  - `.skeleton-title` - Title headings
  - `.skeleton-subtitle` - Subtitle text
  - `.skeleton-thumbnail` - Container-based thumbnails
  - `.skeleton-img` - Fixed 16:9 aspect ratio images
  - `.skeleton-button` - Button placeholders
  - `.skeleton-avatar` - Circular avatars
- Full responsive support with 7 breakpoints:
  - Extra Small Mobile (0-350px)
  - Small Mobile (351-599px)
  - Tablet (600-839px)
  - Desktop (840-1239px)
  - Large Desktop (1240-1919px)
  - 2K Display (1920-2559px)
  - 4K Display (2560px+)
- CSS Custom Properties for theming:
  - Colors (dark and light)
  - Animation duration and easing
  - Border radius (4 variants)
- Accessibility features:
  - `prefers-reduced-motion` support
  - Disabled pointer events on skeleton elements
  - Proper cursor states
- UX protection:
  - No hover effects on skeletons
  - Non-selectable skeleton content
  - Mobile-optimized with desktop-only modifier
- Utility classes:
  - `.skeleton-container` - Wrapper container
  - `.skeleton-group` - Vertical grouping
  - `.skeleton-group--inline` - Horizontal grouping
  - `.skeleton-card` - Card pattern
  - `.skeleton-list-item` - List item pattern
- Complete documentation:
  - Comprehensive README.md
  - Interactive demo.html with customization controls
  - Code examples for all components
  - Integration examples (React, Vue, Vanilla JS)
- Performance optimizations:
  - GPU-accelerated animations with `will-change`
  - File size: ~9KB uncompressed, ~3KB minified (estimated)
  - 60fps smooth animations
- Zero dependencies - Pure CSS solution

### Technical Details
- Mobile-first responsive design (only `min-width` media queries)
- CSS3 animations with `@keyframes shimmer`
- Linear gradient background with animated position
- Aspect ratio support for image skeletons
- Em-based heights for typography scaling
- Browser support: Chrome 76+, Firefox 75+, Safari 14+, Edge 79+

---

## Future Roadmap

### [1.1.0] - Planned
- [ ] Additional skeleton variants (input fields, chips, badges)
- [ ] Dark theme presets
- [ ] Minified version (skeleton.min.css)
- [ ] RTL (Right-to-Left) support
- [ ] Additional animation styles (pulse, wave)

### [1.2.0] - Planned
- [ ] CSS Grid layout patterns
- [ ] More complex composite patterns (comment thread, product grid)
- [ ] Custom animation timing functions
- [ ] Extended color scheme options

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - See LICENSE file for details
