/**
 * InfiniPics - Playback Controls
 * Slideshow play, pause, navigation
 */

function togglePlay() {
    State.isPlaying = !State.isPlaying;
    const btn = document.getElementById('playBtn');
    
    if (State.isPlaying) {
        btn.innerHTML = '⏸ Pause';
        startSlideshow();
    } else {
        btn.innerHTML = '▶ Play';
        stopSlideshow();
    }
}

function startSlideshow() {
    stopSlideshow(); // Clear any existing interval
    
    if (State.isDesynced) {
        // In desync mode, each slot manages its own interval
        State.imageSlots.forEach((slot, i) => {
            if (slot.loaded && slot.images.length > 0) {
                startIndividualSlideshow(i);
            }
        });
    } else if (State.isOffset) {
        // In offset mode, stagger the transitions
        State.offsetIndex = 0;
        startOffsetSlideshow();
    } else {
        // Sync mode: single global interval
        State.slideInterval = setInterval(() => {
            advanceMasterIndex();
        }, State.slideDelay);
    }
}

function stopSlideshow() {
    // Clear global interval
    if (State.slideInterval) {
        clearInterval(State.slideInterval);
        State.slideInterval = null;
    }
    
    // Clear all individual intervals
    State.imageSlots.forEach((slot, i) => {
        if (slot.interval) {
            clearInterval(slot.interval);
            slot.interval = null;
        }
    });
}

function startOffsetSlideshow() {
    // Calculate delay per slot (divide total delay by number of loaded slots)
    const loadedSlots = State.imageSlots.filter(s => s.loaded && s.images.length > 0);
    if (loadedSlots.length === 0) return;
    
    const delayPerSlot = State.slideDelay / loadedSlots.length;
    
    State.slideInterval = setInterval(() => {
        advanceOffsetSlot();
    }, delayPerSlot);
}

function advanceOffsetSlot() {
    // Find loaded slots
    const loadedSlotIndices = [];
    State.imageSlots.forEach((slot, i) => {
        if (slot.loaded && slot.images.length > 0) {
            loadedSlotIndices.push(i);
        }
    });
    
    if (loadedSlotIndices.length === 0) return;
    
    // Get current slot to advance
    const slotIndex = loadedSlotIndices[State.offsetIndex % loadedSlotIndices.length];
    const slot = State.imageSlots[slotIndex];
    
    // Advance this slot's index
    let newIndex = slot.currentIndex + 1;
    
    if (!State.isLooping && newIndex >= slot.images.length) {
        newIndex = slot.images.length - 1;
    } else {
        newIndex = newIndex % slot.images.length;
    }
    
    slot.currentIndex = newIndex;
    showImage(slotIndex, newIndex);
    
    // Update master index when we complete a full cycle
    if (State.offsetIndex % loadedSlotIndices.length === loadedSlotIndices.length - 1) {
        State.masterIndex++;
        if (!State.isLooping && State.masterIndex >= State.maxImages) {
            State.masterIndex = State.maxImages - 1;
            State.isPlaying = false;
            document.getElementById('playBtn').innerHTML = '▶ Play';
            stopSlideshow();
            return;
        }
        updateIndexDisplay();
    }
    
    State.offsetIndex++;
}

function startIndividualSlideshow(index) {
    const slot = State.imageSlots[index];
    if (!slot || !slot.loaded) return;
    
    // Clear existing interval for this slot
    if (slot.interval) {
        clearInterval(slot.interval);
    }
    
    slot.interval = setInterval(() => {
        advanceSlotIndex(index);
    }, State.slideDelay);
}

function advanceMasterIndex() {
    State.masterIndex++;
    
    // Check if we've exceeded all folders
    if (!State.isLooping && State.masterIndex >= State.maxImages) {
        State.masterIndex = State.maxImages - 1;
        State.isPlaying = false;
        document.getElementById('playBtn').innerHTML = '▶ Play';
        stopSlideshow();
        return;
    }
    
    // Update all slots
    State.imageSlots.forEach((slot, i) => {
        if (slot.loaded && slot.images.length > 0) {
            const imgIndex = State.masterIndex % slot.images.length;
            showImage(i, imgIndex);
        }
    });
    
    updateIndexDisplay();
}

function advanceSlotIndex(index) {
    const slot = State.imageSlots[index];
    if (!slot || !slot.loaded || slot.images.length === 0) return;
    
    slot.currentIndex++;
    
    if (!State.isLooping && slot.currentIndex >= slot.images.length) {
        slot.currentIndex = slot.images.length - 1;
        // Stop this slot's interval
        if (slot.interval) {
            clearInterval(slot.interval);
            slot.interval = null;
        }
        return;
    }
    
    const imgIndex = slot.currentIndex % slot.images.length;
    showImage(index, imgIndex);
    updateIndividualDisplay(index);
}

function showImage(slotIndex, imageIndex) {
    const slot = State.imageSlots[slotIndex];
    if (!slot || !slot.loaded || slot.images.length === 0) return;
    
    const img = document.getElementById(`image-${slotIndex}`);
    const actualIndex = imageIndex % slot.images.length;
    img.src = slot.images[actualIndex].url;
    
    if (State.isDesynced || State.isOffset) {
        slot.currentIndex = imageIndex;
    }
}

function stepImage(direction) {
    if (State.isDesynced) {
        // Step all slots
        State.imageSlots.forEach((slot, i) => {
            if (slot.loaded && slot.images.length > 0) {
                let newIndex = slot.currentIndex + direction;
                if (State.isLooping) {
                    newIndex = (newIndex + slot.images.length) % slot.images.length;
                } else {
                    newIndex = Math.max(0, Math.min(slot.images.length - 1, newIndex));
                }
                showImage(i, newIndex);
                slot.currentIndex = newIndex;
                updateIndividualDisplay(i);
            }
        });
    } else {
        let newIndex = State.masterIndex + direction;
        if (State.isLooping) {
            if (newIndex < 0) newIndex = State.maxImages - 1;
            else if (newIndex >= State.maxImages) newIndex = 0;
        } else {
            newIndex = Math.max(0, Math.min(State.maxImages - 1, newIndex));
        }
        State.masterIndex = newIndex;
        
        State.imageSlots.forEach((slot, i) => {
            if (slot.loaded && slot.images.length > 0) {
                const imgIndex = State.masterIndex % slot.images.length;
                showImage(i, imgIndex);
                slot.currentIndex = imgIndex;
            }
        });
        
        updateIndexDisplay();
    }
    
    showToast(`Image ${direction > 0 ? '+1' : '-1'}`);
}

function stepIndividual(index, direction) {
    const slot = State.imageSlots[index];
    if (!slot || !slot.loaded || slot.images.length === 0) return;
    
    let newIndex = slot.currentIndex + direction;
    if (State.isLooping) {
        newIndex = (newIndex + slot.images.length) % slot.images.length;
    } else {
        newIndex = Math.max(0, Math.min(slot.images.length - 1, newIndex));
    }
    
    showImage(index, newIndex);
    slot.currentIndex = newIndex;
    updateIndividualDisplay(index);
}

function goToImage(index) {
    if (State.isDesynced) return;
    
    State.masterIndex = index;
    
    State.imageSlots.forEach((slot, i) => {
        if (slot.loaded && slot.images.length > 0) {
            const imgIndex = State.masterIndex % slot.images.length;
            showImage(i, imgIndex);
        }
    });
    
    updateIndexDisplay();
}

function toggleLoop() {
    State.isLooping = !State.isLooping;
    document.getElementById('loopBtn').classList.toggle('active', State.isLooping);
    showToast(`Loop: ${State.isLooping ? 'ON' : 'OFF'}`);
}

// Logarithmic slider conversion functions
// Maps slider position (0-100) to speed (0.05s - 10s) with midpoint at 2s
function sliderToSpeed(position) {
    const p = position / 100; // Normalize to 0-1
    const min = 0.05;
    const mid = 2;
    const max = 10;
    
    if (p <= 0.5) {
        // First half: 0.05 to 2 (logarithmic)
        const t = p * 2; // 0 to 1
        return min * Math.pow(mid / min, t);
    } else {
        // Second half: 2 to 10 (logarithmic)
        const t = (p - 0.5) * 2; // 0 to 1
        return mid * Math.pow(max / mid, t);
    }
}

function speedToSlider(speed) {
    const min = 0.05;
    const mid = 2;
    const max = 10;
    
    // Clamp speed to valid range
    speed = Math.max(min, Math.min(max, speed));
    
    if (speed <= mid) {
        // First half
        const t = Math.log(speed / min) / Math.log(mid / min);
        return t * 50;
    } else {
        // Second half
        const t = Math.log(speed / mid) / Math.log(max / mid);
        return 50 + t * 50;
    }
}

function updateSpeedDisplay() {
    const slider = document.getElementById('slideSpeed');
    const display = document.getElementById('speedDisplay');
    const speed = sliderToSpeed(parseFloat(slider.value));
    
    display.textContent = speed.toFixed(2) + 's';
    
    // Add warning styling for fast speeds
    if (speed <= 0.5) {
        slider.classList.add('warning');
        display.classList.add('warning');
    } else {
        slider.classList.remove('warning');
        display.classList.remove('warning');
    }
}

function updateSpeed() {
    const speed = sliderToSpeed(parseFloat(document.getElementById('slideSpeed').value));
    
    // Check for seizure warning threshold
    if (speed <= 0.5 && !State.seizureWarningDismissed) {
        State.pendingSpeed = speed;
        showSeizureWarning(speed);
        return;
    }
    
    applySpeed(speed);
}

function applySpeed(speed) {
    State.slideDelay = speed * 1000;
    
    // Restart slideshow with new speed if playing
    if (State.isPlaying) {
        startSlideshow();
    }
    
    showToast(`Speed: ${speed.toFixed(2)}s`);
}

function showSeizureWarning(speed) {
    document.getElementById('seizureSpeed').textContent = speed.toFixed(2) + 's';
    document.getElementById('seizureModal').classList.add('visible');
}

function cancelSpeedChange() {
    document.getElementById('seizureModal').classList.remove('visible');
    // Reset slider to safe speed (0.5s)
    document.getElementById('slideSpeed').value = speedToSlider(0.5);
    updateSpeedDisplay();
    State.pendingSpeed = null;
}

function confirmSpeedChange() {
    if (document.getElementById('dontShowAgain').checked) {
        State.seizureWarningDismissed = true;
    }
    
    document.getElementById('seizureModal').classList.remove('visible');
    
    if (State.pendingSpeed !== null) {
        applySpeed(State.pendingSpeed);
        State.pendingSpeed = null;
    }
}

function updateMaxImages() {
    State.maxImages = 0;
    State.imageSlots.forEach(slot => {
        if (slot.loaded && slot.images.length > State.maxImages) {
            State.maxImages = slot.images.length;
        }
    });
}

function updateIndexDisplay() {
    const display = document.getElementById('indexDisplay');
    if (State.maxImages > 0) {
        display.textContent = `${State.masterIndex + 1} / ${State.maxImages}`;
    } else {
        display.textContent = '0 / 0';
    }
}

function updateIndividualDisplay(index) {
    const slot = State.imageSlots[index];
    const display = document.getElementById(`individualIndex-${index}`);
    if (display && slot && slot.loaded) {
        display.textContent = `${slot.currentIndex + 1} / ${slot.images.length}`;
    }
}

// Toggle desync mode
function toggleDesync() {
    const wasPlaying = State.isPlaying;
    
    // Stop current slideshow
    if (wasPlaying) {
        stopSlideshow();
    }
    
    State.isDesynced = !State.isDesynced;
    const btn = document.getElementById('desyncBtn');
    btn.classList.toggle('active', State.isDesynced);
    
    // Update UI
    updateDesyncUI();
    
    if (State.isDesynced) {
        // Initialize individual indices from master
        State.imageSlots.forEach((slot, i) => {
            if (slot.loaded && slot.images.length > 0) {
                slot.currentIndex = State.masterIndex % slot.images.length;
                updateIndividualDisplay(i);
            }
        });
        showToast('Desync: ON - Folders play independently');
    } else {
        // Snap back to sync
        snapToSync();
        showToast('Sync: ON - Folders synchronized');
    }
    
    // Resume if was playing
    if (wasPlaying) {
        State.isPlaying = true;
        startSlideshow();
    }
}

// Toggle offset mode
function toggleOffset() {
    const wasPlaying = State.isPlaying;
    
    // Stop current slideshow
    if (wasPlaying) {
        stopSlideshow();
    }
    
    // Turn off desync if enabling offset
    if (!State.isOffset && State.isDesynced) {
        State.isDesynced = false;
        document.getElementById('desyncBtn').classList.remove('active');
        document.body.classList.remove('desync-mode');
        updateDesyncUI();
    }
    
    State.isOffset = !State.isOffset;
    const btn = document.getElementById('offsetBtn');
    btn.classList.toggle('active', State.isOffset);
    document.body.classList.toggle('offset-mode', State.isOffset);
    
    if (State.isOffset) {
        State.offsetIndex = 0;
        showToast('Offset: ON - Staggered transitions');
    } else {
        showToast('Offset: OFF - Synchronized transitions');
    }
    
    // Resume if was playing
    if (wasPlaying) {
        State.isPlaying = true;
        startSlideshow();
    }
}

function updateDesyncUI() {
    const indexGroup = document.querySelector('.index-group');
    
    if (State.isDesynced) {
        // Disable global index display
        indexGroup.classList.add('disabled');
        document.body.classList.add('desync-mode');
        
        // Show individual controls
        State.imageSlots.forEach((slot, i) => {
            const individualControls = document.getElementById(`individualControls-${i}`);
            if (individualControls) {
                individualControls.style.display = 'flex';
            }
        });
    } else {
        // Enable global index display
        indexGroup.classList.remove('disabled');
        document.body.classList.remove('desync-mode');
        
        // Hide individual controls
        State.imageSlots.forEach((slot, i) => {
            const individualControls = document.getElementById(`individualControls-${i}`);
            if (individualControls) {
                individualControls.style.display = 'none';
            }
        });
    }
}

function snapToSync() {
    // Find longest folder and use its current position
    let longestIndex = -1;
    let longestCount = 0;
    
    State.imageSlots.forEach((slot, i) => {
        if (slot.loaded && slot.images.length > longestCount) {
            longestCount = slot.images.length;
            longestIndex = i;
        }
    });
    
    if (longestIndex >= 0) {
        State.masterIndex = State.imageSlots[longestIndex].currentIndex;
    }
    
    updateMaxImages();
    
    // Sync all slots to master index
    State.imageSlots.forEach((slot, i) => {
        if (slot.loaded && slot.images.length > 0) {
            const imgIndex = State.masterIndex % slot.images.length;
            showImage(i, imgIndex);
        }
    });
    
    updateIndexDisplay();
}

// Export to global scope
window.togglePlay = togglePlay;
window.startSlideshow = startSlideshow;
window.stopSlideshow = stopSlideshow;
window.startOffsetSlideshow = startOffsetSlideshow;
window.advanceOffsetSlot = advanceOffsetSlot;
window.startIndividualSlideshow = startIndividualSlideshow;
window.advanceMasterIndex = advanceMasterIndex;
window.advanceSlotIndex = advanceSlotIndex;
window.showImage = showImage;
window.stepImage = stepImage;
window.stepIndividual = stepIndividual;
window.goToImage = goToImage;
window.toggleLoop = toggleLoop;
window.sliderToSpeed = sliderToSpeed;
window.speedToSlider = speedToSlider;
window.updateSpeedDisplay = updateSpeedDisplay;
window.updateSpeed = updateSpeed;
window.applySpeed = applySpeed;
window.showSeizureWarning = showSeizureWarning;
window.cancelSpeedChange = cancelSpeedChange;
window.confirmSpeedChange = confirmSpeedChange;
window.updateMaxImages = updateMaxImages;
window.updateIndexDisplay = updateIndexDisplay;
window.updateIndividualDisplay = updateIndividualDisplay;
window.toggleDesync = toggleDesync;
window.toggleOffset = toggleOffset;
window.updateDesyncUI = updateDesyncUI;
window.snapToSync = snapToSync;
