import { useEffect } from 'react';
import { useAnnotationStore } from '../store/annotationStore';

export const useShortcuts = () => {
  const { 
    isPlaying, 
    togglePlay, 
    currentTime, 
    seekTo, 
    selectedSectionId, 
    data, 
    setData 
  } = useAnnotationStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Wenn ein Input-Feld fokussiert ist, Shortcuts ignorieren
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(Math.max(0, currentTime - 1000));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(currentTime + 1000);
          break;
        case 'KeyS':
          if (selectedSectionId) {
            updateSelected('start', currentTime);
          }
          break;
        case 'KeyE':
          if (selectedSectionId) {
            updateSelected('stop', currentTime);
          }
          break;
        case 'KeyA':
          if (selectedSectionId) {
            addEventAtCurrentTime();
          }
          break;
      }
    };

    const updateSelected = (field: 'start' | 'stop', time: number) => {
      const [vIdx, sIdx] = selectedSectionId!.split('-').map(Number);
      const newData = { ...data };
      if (newData.variants[vIdx]?.sections[sIdx]) {
        newData.variants[vIdx].sections[sIdx][field] = Math.round(time);
        setData(newData);
      }
    };

    const addEventAtCurrentTime = () => {
      const [vIdx, sIdx] = selectedSectionId!.split('-').map(Number);
      const newData = { ...data };
      if (newData.variants[vIdx]?.sections[sIdx]) {
        const events = newData.variants[vIdx].sections[sIdx].events || [];
        events.push({
          PlayEventType: "BadAudio", // Default
          start: Math.round(currentTime),
          stop: Math.round(currentTime + 2000)
        });
        newData.variants[vIdx].sections[sIdx].events = events;
        setData(newData);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, togglePlay, currentTime, seekTo, selectedSectionId, data, setData]);
};
