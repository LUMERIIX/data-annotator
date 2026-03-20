import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { useAnnotationStore } from '../../store/annotationStore';

interface AudioPlayerProps {
  url: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const { isPlaying, setIsPlaying, setCurrentTime, data, setData, selectedSectionId, seekRequest, togglePlayRequest } = useAnnotationStore();
  const [duration, setDuration] = useState(0);

  // Reaction to seekRequest
  useEffect(() => {
    if (seekRequest !== null && wavesurferRef.current) {
      wavesurferRef.current.setTime(seekRequest / 1000);
    }
  }, [seekRequest]);

  // Reaction to togglePlayRequest
  useEffect(() => {
    if (togglePlayRequest > 0 && wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, [togglePlayRequest]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f4a85',
      progressColor: '#383351',
      cursorColor: '#646cff',
      height: 128,
      responsive: true,
      normalize: true,
      backend: 'WebAudio',
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;

    ws.load(url);

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      syncRegions(regions);
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime() * 1000);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    regions.on('region-updated', (region) => {
      const parts = region.id.split('-');
      const vIdx = Number(parts[0]);
      const sIdx = Number(parts[1]);
      const newData = { ...data };

      if (parts.length === 2) {
        // Section Update
        if (newData.variants[vIdx]?.sections[sIdx]) {
          newData.variants[vIdx].sections[sIdx].start = Math.round(region.start * 1000);
          newData.variants[vIdx].sections[sIdx].stop = Math.round(region.end * 1000);
          setData(newData);
        }
      } else if (parts.length === 4 && parts[2] === 'e') {
        // Event Update
        const eIdx = Number(parts[3]);
        if (newData.variants[vIdx]?.sections[sIdx]?.events[eIdx]) {
          newData.variants[vIdx].sections[sIdx].events[eIdx].start = Math.round(region.start * 1000);
          newData.variants[vIdx].sections[sIdx].events[eIdx].stop = Math.round(region.end * 1000);
          setData(newData);
        }
      }
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [url]);

  // Sync regions whenever data changes
  useEffect(() => {
    if (regionsRef.current && wavesurferRef.current) {
      syncRegions(regionsRef.current);
    }
  }, [data, selectedSectionId]);

  const syncRegions = (regions: any) => {
    regions.clearRegions();
    data.variants.forEach((variant: any, vIdx: number) => {
      variant.sections.forEach((section: any, sIdx: number) => {
        const id = `${vIdx}-${sIdx}`;
        const isSelected = id === selectedSectionId;
        
        // Sektions-Region
        regions.addRegion({
          id: id,
          start: section.start / 1000,
          end: section.stop / 1000,
          color: isSelected ? 'rgba(100, 108, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          drag: true,
          resize: true,
          content: section.name,
        });

        // Event-Regionen (nur wenn Sektion ausgewählt ist)
        if (isSelected && section.events) {
          section.events.forEach((event: any, eIdx: number) => {
            regions.addRegion({
              id: `${id}-e-${eIdx}`,
              start: event.start / 1000,
              end: event.stop / 1000,
              color: 'rgba(255, 165, 0, 0.4)', // Orange für Events
              drag: true,
              resize: true,
              content: event.PlayEventType,
            });
          });
        }
      });
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
      <div ref={containerRef} />
      <div className="player-controls">
        <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
        <div className="time-display">
          {wavesurferRef.current ? formatTime(wavesurferRef.current.getCurrentTime()) : '00:00.000'} / {formatTime(duration)}
        </div>
      </div>
      <style>{`
        .audio-player { width: 100%; }
        .player-controls { margin-top: 1rem; display: flex; align-items: center; gap: 1rem; }
        .time-display { font-family: monospace; font-size: 1.1rem; }
      `}</style>
    </div>
  );
};

export default AudioPlayer;
