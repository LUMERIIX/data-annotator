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
    isPlaying, setIsPlaying, setCurrentTime, 
    data, setData, selectedSectionId, 
    seekRequest, togglePlayRequest, 
    seekStep, setSeekStep 
  } = useAnnotationStore();
  
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [isReady, setIsReady] = useState(false);

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

  useEffect(() => {
    if (!containerRef.current) return;

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

    // Register Plugins
    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;

    if (spectroRef.current) {
      ws.registerPlugin(
        SpectrogramPlugin.create({
          container: spectroRef.current,
          labels: true,
          height: 100,
          splitChannels: false,
        })
      );
    }

    ws.load(url);

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setIsReady(true);
      syncRegions(regions, data, selectedSectionId);
    });

    ws.on('timeupdate', () => {
      setCurrentTime(ws.getCurrentTime() * 1000);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    regions.on('region-updated', (region) => {
      if (isUpdatingFromStore.current) return;

      const parts = region.id.split('-');
      const vIdx = Number(parts[0]);
      const sIdx = Number(parts[1]);
      
      // WICHTIG: Aktuellen State direkt aus dem Store holen, nicht aus der Closure!
      const currentState = useAnnotationStore.getState();
      const newData = JSON.parse(JSON.stringify(currentState.data));

      if (parts.length === 2) {
        // Section Update
        if (newData.variants[vIdx]?.sections[sIdx]) {
          newData.variants[vIdx].sections[sIdx].start = Math.round(region.start * 1000);
          newData.variants[vIdx].sections[sIdx].stop = Math.round(region.end * 1000);
          currentState.setData(newData);
        }
      } else if (parts.length === 4 && parts[2] === 'e') {
        // Event Update
        const eIdx = Number(parts[3]);
        if (newData.variants[vIdx]?.sections[sIdx]?.events[eIdx]) {
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

  // Sync regions whenever data or selectedId changes (Store -> UI)
  useEffect(() => {
    if (isReady && regionsRef.current && wavesurferRef.current) {
      isUpdatingFromStore.current = true;
      syncRegions(regionsRef.current, data, selectedSectionId);
      isUpdatingFromStore.current = false;
    }
  }, [data, selectedSectionId, isReady]);

  const syncRegions = (regionsPlugin: any, currentData: any, selectedId: string | null) => {
    const existingRegions = regionsPlugin.getRegions();
    const activeIds = new Set<string>();

    currentData.variants.forEach((variant: any, vIdx: number) => {
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
          // Prüfe auf signifikante Änderungen
          const hasMoved = Math.abs(existing.start - regionData.start) > 0.001 || Math.abs(existing.end - regionData.end) > 0.001;
          const hasColorChanged = existing.color !== regionData.color;
          const hasContentChanged = existing.content?.innerText !== regionData.content;

          if (hasMoved || hasColorChanged || hasContentChanged) {
            existing.setOptions(regionData);
          }
        } else {
          regionsPlugin.addRegion(regionData);
        }

        // Events der selektierten Sektion
        if (isSelected && section.events) {
          section.events.forEach((event: any, eIdx: number) => {
            const eId = `${id}-e-${eIdx}`;
            activeIds.add(eId);
            const eventData = {
              id: eId,
              start: event.start / 1000,
              end: event.stop / 1000,
              color: 'rgba(255, 165, 0, 0.4)', // Deutlicheres Orange für Events
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

    // Alte Regionen entfernen
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
        <div ref={containerRef} className="waveform-container" />
        <div ref={spectroRef} className="spectrogram-container" />
      </div>
      
      <div className="player-controls">
        <div className="main-controls">
          <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
          <div className="time-display">
            {wavesurferRef.current ? formatTime(wavesurferRef.current.getCurrentTime()) : '00:00.000'} / {formatTime(duration)}
          </div>
        </div>

        <div className="control-group">
          <div className="seek-step-selector">
            <label>Seek Step:</label>
            <select value={seekStep} onChange={(e) => setSeekStep(Number(e.target.value))}>
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
            />
          </div>
        </div>
      </div>

      <style>{`
        .audio-player { width: 100%; display: flex; flex-direction: column; gap: 1rem; }
        .analyzer-container { border: 1px solid #333; background: #000; border-radius: 8px; overflow: hidden; }
        .waveform-container { border-bottom: 1px solid #222; }
        .spectrogram-container { background: #000; }
        
        .player-controls { display: flex; justify-content: space-between; align-items: center; gap: 2rem; padding: 0.5rem 0; flex-wrap: wrap; }
        .main-controls { display: flex; align-items: center; gap: 1rem; }
        .control-group { display: flex; align-items: center; gap: 2rem; }
        
        .time-display { font-family: monospace; font-size: 1.1rem; color: #aaa; }
        .seek-step-selector, .zoom-control { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #888; }
        .seek-step-selector select { background: #333; color: white; border: 1px solid #555; padding: 0.2rem; border-radius: 4px; }
        
        input[type="range"] { accent-color: var(--accent-color); cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AudioPlayer;
