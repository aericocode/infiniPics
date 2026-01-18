/**
 * InfiniPics - Image Slot Management
 * Creating, loading, removing image slots and drag/drop handling
 */

function addImageSlot() {
    const index = State.imageSlots.length;
    const container = document.getElementById('imageContainer');
    
    const wrapper = document.createElement('div');
    wrapper.className = 'image-wrapper';
    wrapper.id = `imageWrapper-${index}`;
    wrapper.dataset.index = index;
    wrapper.innerHTML = `
        <div class="image-content ${State.scalingMode}" id="content-${index}">
            <div class="image-placeholder" id="placeholder-${index}" onclick="triggerFolderInput(${index})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="3"/>
                </svg>
                <span>Drop folder here</span>
            </div>
            <img id="image-${index}" style="display:none;" alt="Slideshow image">
        </div>
        <div class="image-overlay" id="overlay-${index}"
             onmouseenter="showOverlay(${index})"
             onmousemove="showOverlay(${index})"
             onmouseleave="scheduleHideOverlay(${index})">
            <div class="overlay-top">
                <span class="image-label" id="label-${index}">Slot ${index + 1}</span>
                <div class="overlay-buttons">
                    <button onclick="removeImages(${index}); event.stopPropagation();" title="Clear">✕</button>
                </div>
            </div>
            
            <!-- Individual Controls (for desync mode) -->
            <div class="individual-controls" id="individualControls-${index}" style="display: none;">
                <span class="individual-index" id="individualIndex-${index}">0 / 0</span>
                <div class="individual-nav-buttons">
                    <button onclick="stepIndividual(${index}, -1); event.stopPropagation();" title="Previous">◀</button>
                    <button onclick="stepIndividual(${index}, 1); event.stopPropagation();" title="Next">▶</button>
                </div>
            </div>
            
            <div class="overlay-bottom">
                <span class="image-count" id="count-${index}">0 images</span>
            </div>
        </div>
        <div class="resize-handle" id="resize-${index}"
             onmousedown="startResize(event, ${index})" style="display: none;"></div>
        <input type="file" class="folder-input" id="folderInput-${index}" 
               webkitdirectory multiple onchange="loadFolder(${index}, this.files)">
    `;
    
    // Add drag handlers to the wrapper
    wrapper.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        wrapper.classList.add('drag-over');
    });
    
    wrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        wrapper.classList.add('drag-over');
    });
    
    wrapper.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!wrapper.contains(e.relatedTarget)) {
            wrapper.classList.remove('drag-over');
        }
    });
    
    wrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        wrapper.classList.remove('drag-over');
        document.body.classList.remove('dragging-file');
        State.dragCounter = 0;
        
        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
            handleDroppedItems(index, items);
        }
    });
    
    container.appendChild(wrapper);
    
    State.imageSlots.push({
        index,
        images: [],
        loaded: false,
        currentIndex: 0,
        gridSpan: { col: 1, row: 1 },
        interval: null,
        folderName: ''
    });
    
    document.getElementById('slotCount').value = State.imageSlots.length;
    recalculateLayout();
    
    // Update desync UI for new slot
    if (State.isDesynced) {
        const individualControls = document.getElementById(`individualControls-${index}`);
        if (individualControls) {
            individualControls.style.display = 'flex';
        }
    }
}

async function handleDroppedItems(index, items) {
    // Collect all top-level entries first
    const topLevelEntries = [];
    for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
            topLevelEntries.push(entry);
        }
    }
    
    // Separate folders from loose files
    const folders = topLevelEntries.filter(e => e.isDirectory);
    const looseFiles = topLevelEntries.filter(e => e.isFile);
    
    // Helper to get all images from a directory
    const getImagesFromDirectory = async (dirEntry) => {
        const imageFiles = [];
        const dirReader = dirEntry.createReader();
        
        const readAllEntries = () => new Promise((resolve) => {
            const allEntries = [];
            const readBatch = () => {
                dirReader.readEntries((entries) => {
                    if (entries.length === 0) {
                        resolve(allEntries);
                    } else {
                        allEntries.push(...entries);
                        readBatch();
                    }
                });
            };
            readBatch();
        });
        
        const processEntry = async (entry) => {
            if (entry.isFile) {
                return new Promise((resolve) => {
                    entry.file((file) => {
                        if (isValidImage(file)) {
                            imageFiles.push(file);
                        }
                        resolve();
                    });
                });
            } else if (entry.isDirectory) {
                const subEntries = await readAllEntriesFromDir(entry);
                for (const subEntry of subEntries) {
                    await processEntry(subEntry);
                }
            }
        };
        
        const readAllEntriesFromDir = (dir) => {
            const reader = dir.createReader();
            return new Promise((resolve) => {
                const all = [];
                const read = () => {
                    reader.readEntries((entries) => {
                        if (entries.length === 0) {
                            resolve(all);
                        } else {
                            all.push(...entries);
                            read();
                        }
                    });
                };
                read();
            });
        };
        
        const entries = await readAllEntries();
        for (const entry of entries) {
            await processEntry(entry);
        }
        
        return imageFiles;
    };
    
    // Helper to get image from a file entry
    const getImageFromFile = (fileEntry) => new Promise((resolve) => {
        fileEntry.file((file) => {
            resolve(isValidImage(file) ? file : null);
        });
    });
    
    // If we have multiple folders, process each into separate slots
    if (folders.length > 1) {
        let currentSlotIndex = index;
        let loadedCount = 0;
        
        for (const folder of folders) {
            const images = await getImagesFromDirectory(folder);
            
            if (images.length > 0) {
                // Ensure slot exists
                while (currentSlotIndex >= State.imageSlots.length) {
                    addImageSlot();
                }
                
                processImageFiles(currentSlotIndex, images, folder.name);
                loadedCount++;
                currentSlotIndex++;
            }
        }
        
        if (loadedCount > 0) {
            showToast(`Loaded ${loadedCount} folders`);
        } else {
            showToast('No valid images found');
        }
        return;
    }
    
    // Single folder or loose files - original behavior
    const imageFiles = [];
    let folderName = 'Folder';
    
    // Process single folder
    if (folders.length === 1) {
        folderName = folders[0].name;
        const images = await getImagesFromDirectory(folders[0]);
        imageFiles.push(...images);
    }
    
    // Process loose files
    for (const fileEntry of looseFiles) {
        const file = await getImageFromFile(fileEntry);
        if (file) {
            imageFiles.push(file);
        }
    }
    
    if (imageFiles.length > 0) {
        processImageFiles(index, imageFiles, folderName);
    } else {
        showToast('No valid images found');
    }
}

function showOverlay(index) {
    const overlay = document.getElementById(`overlay-${index}`);
    overlay.classList.add('visible');
    if (State.overlayTimeouts[index]) clearTimeout(State.overlayTimeouts[index]);
}

function scheduleHideOverlay(index) {
    State.overlayTimeouts[index] = setTimeout(() => {
        document.getElementById(`overlay-${index}`).classList.remove('visible');
    }, 2500);
}

function updateSlotCount() {
    const newCount = parseInt(document.getElementById('slotCount').value);
    const currentCount = State.imageSlots.length;
    
    if (newCount > currentCount) {
        for (let i = currentCount; i < newCount; i++) addImageSlot();
        recalculateLayout();
    } else if (newCount < currentCount) {
        const wasPlaying = State.isPlaying;
        
        if (wasPlaying) {
            stopSlideshow();
            State.isPlaying = false;
        }
        
        // Remove slots from the end
        for (let i = currentCount - 1; i >= newCount; i--) {
            const slot = State.imageSlots[i];
            // Clear interval if exists
            if (slot.interval) {
                clearInterval(slot.interval);
            }
            // Revoke object URLs
            slot.images.forEach(img => URL.revokeObjectURL(img.url));
            
            const wrapper = document.getElementById(`imageWrapper-${i}`);
            if (wrapper) wrapper.remove();
            State.imageSlots.splice(i, 1);
        }
        
        document.getElementById('slotCount').value = State.imageSlots.length;
        recalculateLayout();
        updateMaxImages();
        
        // Clamp masterIndex
        if (State.masterIndex >= State.maxImages && State.maxImages > 0) {
            State.masterIndex = State.maxImages - 1;
        }
        
        updateIndexDisplay();
        
        if (wasPlaying) {
            State.isPlaying = true;
            document.getElementById('playBtn').innerHTML = '⏸ Pause';
            startSlideshow();
        }
    }
}

function removeImageSlot(index) {
    const wasPlaying = State.isPlaying;
    
    if (wasPlaying) {
        stopSlideshow();
    }
    
    const slot = State.imageSlots[index];
    if (slot.interval) {
        clearInterval(slot.interval);
    }
    slot.images.forEach(img => URL.revokeObjectURL(img.url));
    
    const wrapper = document.getElementById(`imageWrapper-${index}`);
    if (wrapper) wrapper.remove();
    State.imageSlots.splice(index, 1);
    
    // Rebuild all slots
    document.getElementById('imageContainer').innerHTML = '';
    const oldSlots = [...State.imageSlots];
    State.imageSlots = [];
    oldSlots.forEach((slot, i) => {
        addImageSlot();
        if (slot.loaded && slot.images.length > 0) {
            State.imageSlots[i].images = slot.images;
            State.imageSlots[i].loaded = true;
            State.imageSlots[i].currentIndex = slot.currentIndex;
            State.imageSlots[i].folderName = slot.folderName;
            State.imageSlots[i].gridSpan = slot.gridSpan;
            
            const img = document.getElementById(`image-${i}`);
            const placeholder = document.getElementById(`placeholder-${i}`);
            const label = document.getElementById(`label-${i}`);
            const count = document.getElementById(`count-${i}`);
            
            img.style.display = 'block';
            placeholder.style.display = 'none';
            
            const name = slot.folderName.length > 20 ? slot.folderName.substring(0, 17) + '...' : slot.folderName;
            label.textContent = `${i + 1}: ${name}`;
            count.textContent = `${slot.images.length} images`;
            
            const imgIndex = State.isDesynced ? slot.currentIndex : (State.masterIndex % slot.images.length);
            showImage(i, imgIndex);
        }
    });
    
    document.getElementById('slotCount').value = State.imageSlots.length;
    recalculateLayout();
    updateMaxImages();
    updateIndexDisplay();
    
    if (wasPlaying) {
        State.isPlaying = true;
        document.getElementById('playBtn').innerHTML = '⏸ Pause';
        startSlideshow();
    }
}

function removeImages(index) {
    const slot = State.imageSlots[index];
    
    if (slot.interval) {
        clearInterval(slot.interval);
        slot.interval = null;
    }
    
    // Revoke object URLs
    slot.images.forEach(img => URL.revokeObjectURL(img.url));
    
    const img = document.getElementById(`image-${index}`);
    const placeholder = document.getElementById(`placeholder-${index}`);
    const label = document.getElementById(`label-${index}`);
    const count = document.getElementById(`count-${index}`);
    const individualIndex = document.getElementById(`individualIndex-${index}`);
    
    img.src = '';
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    label.textContent = `Slot ${index + 1}`;
    count.textContent = '0 images';
    if (individualIndex) individualIndex.textContent = '0 / 0';
    
    slot.images = [];
    slot.loaded = false;
    slot.currentIndex = 0;
    slot.folderName = '';
    
    updateMaxImages();
    updateIndexDisplay();
}

function triggerFolderInput(index) {
    document.getElementById(`folderInput-${index}`).click();
}

function loadFolder(index, files) {
    if (!files || files.length === 0) return;
    
    // Filter to only valid image files
    const imageFiles = Array.from(files).filter(isValidImage);
    
    if (imageFiles.length === 0) {
        showToast('No valid images found');
        return;
    }
    
    // Get folder name from path
    let folderName = 'Folder';
    if (files[0].webkitRelativePath) {
        folderName = files[0].webkitRelativePath.split('/')[0];
    }
    
    processImageFiles(index, imageFiles, folderName);
}

function isValidImage(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];
    return validTypes.includes(file.type);
}   

function processImageFiles(index, imageFiles, folderName) {
    const slot = State.imageSlots[index];
    
    // Clear existing images
    if (slot.interval) {
        clearInterval(slot.interval);
        slot.interval = null;
    }
    slot.images.forEach(img => URL.revokeObjectURL(img.url));

    let naturalSort = (a, b) => {
        const ax = [], bx = [];
        
        a.name.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
            ax.push([$1 || Infinity, $2 || ""]);
        });
        b.name.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
            bx.push([$1 || Infinity, $2 || ""]);
        });
        
        while (ax.length && bx.length) {
            const an = ax.shift();
            const bn = bx.shift();
            const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
            if (nn) return nn;
        }
        
        return ax.length - bx.length;
    }
    
    // Sort files naturally
    imageFiles.sort(naturalSort);
    
    // Create object URLs
    slot.images = imageFiles.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
    }));
    
    slot.loaded = true;
    slot.folderName = folderName;
    
    // Set initial index
    if (State.isDesynced) {
        slot.currentIndex = 0;
    } else {
        slot.currentIndex = State.masterIndex % slot.images.length;
    }
    
    // Update UI
    const img = document.getElementById(`image-${index}`);
    const placeholder = document.getElementById(`placeholder-${index}`);
    const label = document.getElementById(`label-${index}`);
    const count = document.getElementById(`count-${index}`);
    
    img.style.display = 'block';
    placeholder.style.display = 'none';
    
    const name = folderName.length > 20 ? folderName.substring(0, 17) + '...' : folderName;
    label.textContent = `${index + 1}: ${name}`;
    count.textContent = `${slot.images.length} images`;
    
    // Show first image (or synced image)
    showImage(index, slot.currentIndex);
    
    updateMaxImages();
    updateIndexDisplay();
    updateIndividualDisplay(index);
    
    // Start individual slideshow if playing in desync mode
    if (State.isPlaying && State.isDesynced) {
        startIndividualSlideshow(index);
    }
    
    showToast(`Loaded: ${folderName} (${slot.images.length} images)`);
}

// Global drag handlers
function setupGlobalDragHandlers() {
    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        State.dragCounter++;
        document.body.classList.add('dragging-file');
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    });

    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        State.dragCounter--;
        if (State.dragCounter === 0) {
            document.body.classList.remove('dragging-file');
        }
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        State.dragCounter = 0;
        document.body.classList.remove('dragging-file');
        
        const wrapper = e.target.closest('.image-wrapper');
        if (!wrapper && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            // Find first empty slot or use first slot
            let targetIndex = State.imageSlots.findIndex(s => !s.loaded);
            if (targetIndex === -1) targetIndex = 0;
            handleDroppedItems(targetIndex, e.dataTransfer.items);
        }
    });
}

// Export to global scope
window.addImageSlot = addImageSlot;
window.handleDroppedItems = handleDroppedItems;
window.showOverlay = showOverlay;
window.scheduleHideOverlay = scheduleHideOverlay;
window.updateSlotCount = updateSlotCount;
window.removeImageSlot = removeImageSlot;
window.removeImages = removeImages;
window.triggerFolderInput = triggerFolderInput;
window.loadFolder = loadFolder;
window.processImageFiles = processImageFiles;
window.setupGlobalDragHandlers = setupGlobalDragHandlers;
