import { useEffect } from 'react';
import { useAnnotationStore } from '../store/annotationStore';

export const useShortcuts = () => {
  const { 
    isPlaying, 
    togglePlay, 
    currentTime, 
    seekTo, 
    seekStep,
    increaseSeekStep,
    decreaseSeekStep,
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

      let multiplier = 1;
      if (e.shiftKey) multiplier = 5;
      if (e.altKey) multiplier = 0.1;

      const step = seekStep * multiplier;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(Math.max(0, currentTime - step));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(currentTime + step);
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
        case 'KeyN':
          if (selectedSectionId) {
            addNewSection();
          }
          break;
        case 'Minus':
          decreaseSeekStep();
          break;
        case 'Equal': // '+' Key is typically Equal
          increaseSeekStep();
          break;
        case 'NumpadSubtract':
          decreaseSeekStep();
          break;
        case 'NumpadAdd':
          increaseSeekStep();
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

    const addNewSection = () => {
      const [vIdx] = selectedSectionId!.split('-').map(Number);
      const newData = { ...data };
      if (newData.variants[vIdx]) {
        if (!newData.variants[vIdx].sections) newData.variants[vIdx].sections = [];
        newData.variants[vIdx].sections.push({
          name: `New Section`,
          start: Math.round(currentTime),
          stop: Math.round(currentTime + 5000), // Default 5s
          events: [],
          cues: []
        });
        setData(newData);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, togglePlay, currentTime, seekTo, seekStep, increaseSeekStep, decreaseSeekStep, selectedSectionId, data, setData]);
};
