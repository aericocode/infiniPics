/**
 * InfiniPics - Global State
 * Centralized state management for the application
 */

const State = {
    imageSlots: [],
    isPlaying: false,
    isLooping: true,
    isDesynced: false,
    isOffset: true,           // NEW: Offset mode - staggered transitions
    scalingMode: 'native',
    overlayTimeouts: {},
    gridConfig: { cols: 2, rows: 2 },
    dragCounter: 0,
    resizing: null,
    masterIndex: 0,            // Current image index in sync mode
    slideDelay: 1500,          // Delay between slides in ms (default 1.5s)
    slideInterval: null,       // Global interval for sync mode
    maxImages: 0,              // Longest folder image count
    offsetIndex: 0,            // Current slot being updated in offset mode
    pendingSpeed: null,        // Speed waiting for seizure warning confirmation
    seizureWarningDismissed: false // Whether user has dismissed the warning permanently
};

// Make state globally accessible
window.State = State;
