/**
 * InfiniPics - Keyboard Shortcuts
 */

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input (but allow range inputs)
        if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
        if (e.target.tagName === 'SELECT') return;
        
        switch (e.key) {
            case ' ':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowLeft': 
                e.preventDefault(); 
                stepImage(-1); 
                break;
            case 'ArrowRight': 
                e.preventDefault(); 
                stepImage(1); 
                break;
            case 'ArrowUp':
                e.preventDefault();
                adjustSpeed(-0.1); // Faster (decrease delay)
                break;
            case 'ArrowDown':
                e.preventDefault();
                adjustSpeed(0.1); // Slower (increase delay)
                break;
            case 'Home':
                e.preventDefault();
                goToImage(0);
                showToast('First image');
                break;
            case 'End':
                e.preventDefault();
                if (State.maxImages > 0) {
                    goToImage(State.maxImages - 1);
                    showToast('Last image');
                }
                break;
            case 'r': 
            case 'R': 
                toggleLoop(); 
                break;
            case 'o':
            case 'O':
                toggleOffset();
                break;
            case 'f': 
            case 'F': 
                toggleFullscreen(); 
                break;
            case 'Escape':
                document.getElementById('shortcutsModal').classList.remove('visible');
                document.getElementById('infoModal').classList.remove('visible');
                document.getElementById('seizureModal').classList.remove('visible');
                break;
        }
    });
}

function adjustSpeed(delta) {
    const slider = document.getElementById('slideSpeed');
    // Adjust slider position (which is 0-100)
    // delta is positive to slow down, negative to speed up
    // Moving slider right = slower, so we add delta to position
    let newPosition = parseFloat(slider.value) + (delta * 50); // Scale delta for slider range
    
    // Clamp to 0-100
    newPosition = Math.max(0, Math.min(100, newPosition));
    
    slider.value = newPosition;
    updateSpeedDisplay();
    updateSpeed();
}

// Export to global scope
window.initKeyboardShortcuts = initKeyboardShortcuts;
window.adjustSpeed = adjustSpeed;
