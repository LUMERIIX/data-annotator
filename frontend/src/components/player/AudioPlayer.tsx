import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.js';
import { useAnnotationStore } from '../../store/annotationStore';

interface AudioPlayerProps {
  url: string;
}

const SECTION_COLORS = [
  'rgba(255, 99, 132, 0.3)',
  'rgba(54, 162, 235, 0.3)',
  'rgba(255, 206, 86, 0.3)',
  'rgba(75, 192, 192, 0.3)',
  'rgba(153, 102, 255, 0.3)',
  'rgba(255, 159, 64, 0.3)',
];

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spectroRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const isUpdatingFromStore = useRef(false);

  const { 
    currentTime,
    isPlaying, setIsPlaying, setCurrentTime, seekTo,
    data, selectedSectionId, 
    seekRequest, togglePlayRequest, 
    seekStep, setSeekStep,
    showSpectrogram, setShowSpectrogram
  } = useAnnotationStore();
  
  const [localMs, setLocalMs] = useState(0);

  // Sync localMs with currentTime from store when NOT focused
  useEffect(() => {
    setLocalMs(Math.round(currentTime));
  }, [currentTime]);

  const handleMsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalMs(val);
  };

  const handleMsSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      seekTo(localMs);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleMsBlur = () => {
    seekTo(localMs);
  };
  
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Loading Audio...');

  // Reaction to seekRequest
  useEffect(() => {
    if (isReady && seekRequest !== null && wavesurferRef.current) {
      wavesurferRef.current.setTime(seekRequest.time / 1000);
      setCurrentTime(seekRequest.time);
    }
  }, [seekRequest, isReady, setCurrentTime]);

  // Reaction to togglePlayRequest
  useEffect(() => {
    if (isReady && togglePlayRequest > 0 && wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, [togglePlayRequest, isReady]);

  // Handle Zoom
  useEffect(() => {
    if (isReady && wavesurferRef.current) {
      try {
        wavesurferRef.current.zoom(zoom);
      } catch (e) {
        console.warn("Zoom failed:", e);
      }
    }
  }, [zoom, isReady]);

  // Handle Spectrogram Toggle
  useEffect(() => {
    if (isReady && wavesurferRef.current && showSpectrogram) {
      setLoadingStatus('Generating Spectrogram...');
      setIsLoading(true);
      
      const timer = setTimeout(() => {
        try {
          wavesurferRef.current!.registerPlugin(
            SpectrogramPlugin.create({
              container: spectroRef.current!,
              labels: true,
              height: 100,
              splitChannels: false,
            })
          );
        } catch (err) {
          console.error("Spectrogram error:", err);
        } finally {
          setIsLoading(false);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showSpectrogram, isReady]);

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setIsReady(false);
    setLoadingStatus('Loading Audio...');

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f4a85',
      progressColor: '#383351',
      cursorColor: '#646cff',
      height: 128,
      normalize: true,
      hideScrollbar: false,
      fillParent: true,
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;

    ws.load(url);

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      syncRegions(regions, data, selectedSectionId);
      setIsReady(true);
      setIsLoading(false);
    });

    ws.on('timeupdate', () => {
      setCurrentTime(ws.getCurrentTime() * 1000);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    regions.on('region-updated', (region) => {
      if (isUpdatingFromStore.current) return;
      const currentState = useAnnotationStore.getState();
      if (!currentState.data) return;

      const parts = region.id.split('-');
      const vIdx = Number(parts[0]);
      const sIdx = Number(parts[1]);
      const newData = JSON.parse(JSON.stringify(currentState.data));

      if (parts.length === 2) {
        if (newData.variants?.[vIdx]?.sections?.[sIdx]) {
          newData.variants[vIdx].sections[sIdx].start = Math.round(region.start * 1000);
          newData.variants[vIdx].sections[sIdx].stop = Math.round(region.end * 1000);
          currentState.setData(newData);
        }
      } else if (parts.length === 4 && parts[2] === 'e') {
        const eIdx = Number(parts[3]);
        if (newData.variants?.[vIdx]?.sections?.[sIdx]?.events?.[eIdx]) {
          newData.variants[vIdx].sections[sIdx].events[eIdx].start = Math.round(region.start * 1000);
          newData.variants[vIdx].sections[sIdx].events[eIdx].stop = Math.round(region.end * 1000);
          currentState.setData(newData);
        }
      }
    });

    wavesurferRef.current = ws;

    return () => {
      setIsReady(false);
      ws.destroy();
    };
  }, [url]);

  useEffect(() => {
    if (isReady && regionsRef.current && wavesurferRef.current) {
      isUpdatingFromStore.current = true;
      syncRegions(regionsRef.current, data, selectedSectionId);
      isUpdatingFromStore.current = false;
    }
  }, [data, selectedSectionId, isReady]);

  const syncRegions = (regionsPlugin: any, currentData: any, selectedId: string | null) => {
    const existingRegions = regionsPlugin.getRegions();
    if (!currentData || !currentData.variants) {
      existingRegions.forEach((r: any) => r.remove());
      return;
    }
    const activeIds = new Set<string>();

    currentData.variants.forEach((variant: any, vIdx: number) => {
      if (!variant.sections) return;
      variant.sections.forEach((section: any, sIdx: number) => {
        const id = `${vIdx}-${sIdx}`;
        activeIds.add(id);
        const isSelected = id === selectedId;
        const color = SECTION_COLORS[sIdx % SECTION_COLORS.length];
        
        const regionData = {
          id: id,
          start: section.start / 1000,
          end: section.stop / 1000,
          color: isSelected ? color.replace('0.3', '0.6') : color,
          drag: true,
          resize: true,
          content: section.name,
        };

        const existing = existingRegions.find((r: any) => r.id === id);
        if (existing) {
          const diffStart = Math.abs(existing.start - regionData.start);
          const diffEnd = Math.abs(existing.end - regionData.end);
          if (diffStart > 0.001 || diffEnd > 0.001 || existing.color !== regionData.color || existing.content?.innerText !== regionData.content) {
            existing.setOptions(regionData);
          }
        } else {
          regionsPlugin.addRegion(regionData);
        }

        if (isSelected && section.events) {
          section.events.forEach((event: any, eIdx: number) => {
            const eId = `${id}-e-${eIdx}`;
            activeIds.add(eId);
            const eventData = {
              id: eId,
              start: event.start / 1000,
              end: event.stop / 1000,
              color: 'rgba(255, 165, 0, 0.4)',
              drag: true,
              resize: true,
              content: event.PlayEventType,
            };
            const existingEvent = existingRegions.find((r: any) => r.id === eId);
            if (existingEvent) {
              if (Math.abs(existingEvent.start - eventData.start) > 0.001 || 
                  Math.abs(existingEvent.end - eventData.end) > 0.001 ||
                  existingEvent.content?.innerText !== eventData.content) {
                existingEvent.setOptions(eventData);
              }
            } else {
              regionsPlugin.addRegion(eventData);
            }
          });
        }
      });
    });

    existingRegions.forEach((r: any) => {
      if (!activeIds.has(r.id)) {
        r.remove();
      }
    });
  };

  const togglePlay = () => wavesurferRef.current?.playPause();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="audio-player">
      <div className="analyzer-container">
        {isLoading && (
          <div className="player-loader-overlay">
            <div className="spinner"></div>
            <div className="loader-text">{loadingStatus}</div>
          </div>
        )}
        <div ref={containerRef} className="waveform-container" />
        {showSpectrogram && <div ref={spectroRef} className="spectrogram-container" />}
      </div>
      
      <div className={`player-controls ${isLoading ? 'disabled' : ''}`}>
        <div className="main-controls">
          <button onClick={togglePlay} disabled={isLoading}>{isPlaying ? 'Pause' : 'Play'}</button>
          <div className="time-display">
            {formatTime(currentTime / 1000)} 
            <div className="ms-input-container">
              <input 
                type="number"
                className="ms-input"
                value={localMs}
                onChange={handleMsInput}
                onKeyDown={handleMsSubmit}
                onBlur={handleMsBlur}
                title="Manual timecode entry (ms) - press ENTER to jump"
              />
              <span className="ms-unit">ms</span>
            </div>
            <span className="time-divider">/</span> 
            {formatTime(duration)}
          </div>
        </div>

        <div className="control-group">
          <div className="setting-toggle">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={showSpectrogram} 
                onChange={(e) => setShowSpectrogram(e.target.checked)} 
                disabled={isLoading}
              />
              Spectrogram
            </label>
          </div>

          <div className="seek-step-selector">
            <label>Seek Step:</label>
            <select value={seekStep} onChange={(e) => setSeekStep(Number(e.target.value))} disabled={isLoading}>
              {[100, 500, 1000, 2000, 5000, 10000].map(s => (
                <option key={s} value={s}>{s >= 1000 ? `${s/1000}s` : `${s}ms`}</option>
              ))}
            </select>
          </div>

          <div className="zoom-control">
            <label>Zoom:</label>
            <input 
              type="range" 
              min="0" 
              max="500" 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))} 
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <style>{`
        .audio-player { width: 100%; display: flex; flex-direction: column; gap: 1rem; position: relative; }
        .analyzer-container { border: 1px solid #333; background: #000; border-radius: 8px; overflow: hidden; position: relative; min-height: 130px; }
        .waveform-container { border-bottom: 1px solid #222; min-height: 128px; }
        .spectrogram-container { background: #000; min-height: 100px; border-top: 1px solid #222; }
        
        .player-loader-overlay { 
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
          background: rgba(0,0,0,0.85); z-index: 1000; 
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;
          backdrop-filter: blur(2px);
        }
        
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(100, 108, 255, 0.2);
          border-top-color: var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loader-text { color: var(--accent-color); font-size: 0.9rem; font-weight: 600; letter-spacing: 0.5px; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .player-controls { display: flex; justify-content: space-between; align-items: center; gap: 2rem; padding: 0.5rem 0; flex-wrap: wrap; transition: opacity 0.3s; }
        .player-controls.disabled { opacity: 0.5; pointer-events: none; }
        
        .main-controls { display: flex; align-items: center; gap: 1rem; }
        .control-group { display: flex; align-items: center; gap: 2rem; }
        
        .time-display { 
          font-family: 'JetBrains Mono', 'Roboto Mono', monospace; 
          font-size: 1.1rem; 
          color: #aaa; 
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .ms-input-container {
          display: flex;
          align-items: center;
          background: rgba(100, 108, 255, 0.1);
          padding: 1px 8px;
          border-radius: 6px;
          border: 1px solid rgba(100, 108, 255, 0.3);
          gap: 4px;
        }

        .ms-input {
          background: transparent;
          border: none;
          color: var(--accent-color);
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: bold;
          width: 70px;
          padding: 0;
          text-align: right;
          outline: none;
        }

        .ms-input::-webkit-inner-spin-button,
        .ms-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .ms-unit {
          font-size: 0.75rem;
          color: #666;
          font-weight: normal;
        }

        .time-divider {
          color: #444;
          margin: 0 0.25rem;
        }
        .seek-step-selector, .zoom-control, .setting-toggle { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #888; }
        .seek-step-selector select { background: #333; color: white; border: 1px solid #555; padding: 0.2rem; border-radius: 4px; }
        
        .checkbox-label { cursor: pointer; display: flex; align-items: center; gap: 0.5rem; color: #aaa; }
        .checkbox-label input { accent-color: var(--accent-color); }
        
        input[type="range"] { accent-color: var(--accent-color); cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AudioPlayer;
