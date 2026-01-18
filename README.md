# 🖼️ InfiniPics

**Synchronized Multi-Folder Slideshow**

View images from multiple folders side-by-side, perfectly synchronized. Drop in your folders and watch the 1st, 2nd, 3rd... image from each folder display together.

**[Launch InfiniPics](https://aericocode.github.io/infiniPics/)** — no install, no uploads, just open and drop your folder of images


---

## Features

- **Synchronized Slideshow** — View corresponding images from each folder together (1st images, then 2nd, etc.)
- **Offset Mode** — Stagger transitions so slots change one at a time for a cascading effect
- **Infinite Looping** — Shorter folders automatically loop to match the longest
- **Flexible Layouts** — Auto-grid adapts to your window, or choose presets (1×1 up to 6×4)
- **Resizable Panels** — Drag corners to make individual slots span multiple grid cells
- **Variable Speed** — 0.05s to 10s delay between transitions
- **Drag & Drop** — Simply drop folders onto slots to load images
- **Multiple Formats** — Supports JPG, PNG, GIF, and WebP

---

## How to Use

### Loading Images

1. **Set the number of slots** using the number input in the toolbar
2. **Drag and drop** a folder onto any slot to load its images
3. Repeat for each slot you want to populate

### Playback Controls

| Control | Action |
|---------|--------|
| **Play/Pause** | Start or stop the slideshow |
| **Prev/Next** | Step through images manually |
| **Speed slider** | Adjust transition delay (0.05s–10s) |
| **Loop** | Toggle infinite looping on/off |
| **Offset** | Enable staggered transitions between slots |

### Layout Options

- **Auto** — Automatically calculates optimal grid based on window size
- **Presets** — Choose fixed layouts like 2×2, 3×3, 4×3, etc.
- **Scale Mode**:
  - *Fit* — Shows entire image, may letterbox
  - *Fill* — Fills the slot, may crop edges
- **Resize panels** — Drag the corner handle to span multiple cells; double-click to reset

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` `→` | Previous / Next image |
| `↑` `↓` | Faster / Slower |
| `Home` | Jump to first image |
| `End` | Jump to last image |
| `R` | Toggle loop |
| `O` | Toggle offset mode |
| `F` | Toggle fullscreen |
| `Esc` | Close modals |

---

## Privacy & Security

InfiniPics is designed with privacy in mind:

- ✅ **100% Local** — All processing happens in your browser
- ✅ **No Uploads** — Images never leave your device
- ✅ **Offline Ready** — Works without internet once loaded
- ✅ **Zero Tracking** — No analytics, cookies, or external requests
- ✅ **Open Source** — Inspect the code yourself

---

## Project Structure

```
infinipics/
├── index.html          # Main HTML
├── css/
│   └── main.css        # Styles
├── images/
│   └── favicon.svg     # App icon
└── js/
    ├── state.js        # Global state management
    ├── utils.js        # Utility functions
    ├── layout.js       # Grid layout & resizing
    ├── playback.js     # Slideshow playback logic
    ├── slots.js        # Image slot management
    ├── keyboard.js     # Keyboard shortcuts
    └── main.js         # Initialization
```

---

## Running Locally

Just open `index.html` in your browser. No build step or server required.

---

Made with 🌿 by [aericode](https://ko-fi.com/aericode)
