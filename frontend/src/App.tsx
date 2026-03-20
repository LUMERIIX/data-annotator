import React, { useState } from 'react';
import './App.css';
import AudioPlayer from './components/player/AudioPlayer';
import TreeView from './components/annotation/TreeView';
import SchemaRenderer from './components/annotation/SchemaRenderer';
import { useAnnotationStore } from './store/annotationStore';
import { useShortcuts } from './hooks/useShortcuts';

function App() {
  const { audioUrl, setAudioUrl, data, setData } = useAnnotationStore();
  useShortcuts(); // Aktiviert globale Shortcuts

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  const handleSessionUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          setData(json);
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const saveSession = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name || 'session'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <header className="sidebar-header">
          <h2>Annotator</h2>
        </header>
        <nav className="sidebar-nav">
          <section className="media-section">
            <h3>Project</h3>
            <div className="button-group">
              <label htmlFor="session-upload" className="btn-sidebar">Load Session</label>
              <input 
                id="session-upload" 
                type="file" 
                accept=".json" 
                onChange={handleSessionUpload} 
                style={{ display: 'none' }}
              />
              <button className="btn-sidebar" onClick={saveSession}>Save Session</button>
            </div>

            <h3>Media</h3>
            <div className="file-input-container">
              <label htmlFor="audio-upload" className="btn-sidebar">Open Media File</label>
  ...

            {audioUrl && <p className="file-status">File loaded successfully</p>}
          </section>
          <TreeView />
        </nav>
      </aside>
      <main className="main-content">
        <header className="player-header">
          <h1>Play: {audioUrl ? 'Media Loaded' : 'No File Selected'}</h1>
        </header>
        <section className="player-area">
          {audioUrl ? (
            <AudioPlayer url={audioUrl} />
          ) : (
            <div className="waveform-placeholder">
              Please select a media file to start annotating
            </div>
          )}
        </section>
        <section className="annotation-area">
          <SchemaRenderer />
        </section>
      </main>
    </div>
  );
}

export default App;
