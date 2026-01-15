/**
 * InfiniVids - Main Initialization
 * Application entry point
 */

function init() {
    const count = parseInt(document.getElementById('slotCount').value);
    State.imageSlots = [];
    
    for (let i = 0; i < count; i++) {
        addImageSlot();
    }
    
    recalculateLayout();
    
    // Initialize speed display
    updateSpeedDisplay();
    
    // Setup event listeners
    window.addEventListener('resize', recalculateLayout);
    setupGlobalDragHandlers();
    initResizeHandlers();
    initKeyboardShortcuts();
    
    console.log('InfiniPics initialized');
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
