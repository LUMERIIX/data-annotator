# Annotator - Versatile Media Annotation Tool

This tool provides a flexible interface for annotating media files (audio/video) based on dynamic JSON schemas (Blueprints).

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
Install dependencies for both the frontend and backend from the root:

```bash
# Install root (if needed) and subprojects
cd frontend && npm install
cd ../backend && npm install
```

### 3. Running the Application

#### **Frontend (Vite + React)**
This starts the UI where you can load audio files and schemas.
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### **Backend (Express + TypeScript)**
Optional: Provides future file-system access and persistence services.
```bash
cd backend
npm run dev
```

## 📂 Project Structure
- `frontend/`: The main UI, built with React, Zustand, and WaveSurfer.js.
- `backend/`: Node.js server for local file system operations.
- `shared/`: Shared JSON schemas and types.

## ⌨️ Keyboard Shortcuts
- **Space**: Play/Pause
- **Arrow Left/Right**: Seek (Step size configurable in UI or via shortcuts)
- **Shift + Arrow**: Large Seek (5x Step size)
- **Alt + Arrow**: Fine Seek (0.1x Step size)
- **+ / -**: Increase / Decrease base seek step size
- **Key S**: Set Section Start to current playback position
- **Key E**: Set Section End to current playback position
- **Key A**: Add a new Event at the current position
- **Key N**: Add a new Section at the current position

## 🛠 Features
- **Dynamic Schema Rendering**: Automatically generates forms from JSON schemas.
- **Interactive Waveform**: Visualizes sections and events as draggable regions.
- **Multiple Seek Modes**: Configure base seek step (100ms - 10s) and use modifiers for precision.
- **Hierarchical Navigation**: Manage complex data structures (Play -> Variant -> Section).
- **Persistence**: Save and load sessions as JSON files.
