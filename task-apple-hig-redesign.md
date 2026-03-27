# Task: Apple HIG Redesign & TV Optimization

## Status: Phase 3 Completed, Phase 4 In Progress

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

### 4. Final Verification & TV Polishing - IN PROGRESS
- [ ] **Cross-device verification**: Test on iOS, Android, and Desktop.
- [ ] **TV Remote Navigation**: Verify focus flow on all interactive 2D grids.
- [ ] **Performance Audit**: Optimize images and animations for low-powered TV browsers.

---

*Last updated: 2026-03-27*
