# Task: Apple HIG Redesign & TV Optimization

## Status: Phase 4 Completed, Phase 5 In Progress

### 1. TV Optimization & Device Context - COMPLETED
- [x] **DeviceContext.tsx**: Added `isTV` detection for WebOS, Tizen, AndroidTV.
- [x] **globals.css**:
    - Injected `.is-tv` class for root targeting.
    - Implemented high-visibility focus rings and scaled transforms for TV navigation.
    - Standardized safe-area padding for oversized TV displays.

### 2. Search & Grid Redesign - COMPLETED
- [x] **SearchResultsClient.tsx**:
    - Implemented clean Apple HIG layout for `!isXX`.
    - Maintained bold/italic TopXX style for `isXX`.
- [x] **MovieGrid.tsx**: Pro header, layout refinement, and loading states for Hồ Phim.
- [x] **HomeSearchBar.tsx**: Redesigned for Hồ Phim (Apple HIG glass-pill).

### 3. Page Redesign (Hồ Phim) - COMPLETED
- [x] **Actor Page**: Redesigned with premium header and HIG-style filmography grid.
- [x] **Library Page**: Replaced bold italic styling with Apple HIG tokens and unified tabs.
- [x] **Search Page**: Refactored to use `SearchResultsClient` for a consistent experience.

### 4. Final Verification & TV Polishing - COMPLETED
- [x] **Cross-device verification**: Standardized safe areas and responsive breakpoints.
- [x] **TV Remote Navigation**: 
    - Fixed `--primary-rgb` for high-visibility focus rings in `globals.css`.
    - Optimized `MovieGrid` columns and spacing for TV viewports.
    - Explicitly disabled BottomNav on TV devices.
- [x] **Performance Audit**: 
    - Disabled expensive `backdrop-filter` effects on TV devices via `.is-tv` global class.
    - Simplified loading animations for low-powered TV browsers.
- [x] **Watch Page Optimization**: Refined player height and layout for mobile/TV accessibility.

### 5. Final HIG Refinements & User Experience - COMPLETED
- [x] **Settings Page**: Full redesign using `apple-glass`, `SF Pro` tokens, and theme-aware surfaces.
- [x] **Watch Page Identity**: Implemented conditional styling (Italic for TopXX, Clean SF Pro Bold for Hồ Phim).
- [x] **Lint Resolution**: Fixed critical TypeScript errors in `WatchPage` (nullish coalesce for optional props) and improved stability.
- [x] **Final Review**: Standardized typography and safe-area handling for mobile/TV consistency.

---

*Last updated: 2026-03-28*
