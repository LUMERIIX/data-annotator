import { useEffect } from 'react';
import { useAnnotationStore } from '../store/annotationStore';

export const useShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Wenn ein Input-Feld fokussiert ist, Shortcuts ignorieren
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const state = useAnnotationStore.getState();
      const { 
        currentTime, 
        seekStep, 
        selectedSectionId, 
        data, 
        setData, 
        togglePlay, 
        seekTo, 
        increaseSeekStep, 
        decreaseSeekStep 
      } = state;

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
            e.preventDefault();
            updateSelected(state, 'start', currentTime);
          }
          break;
        case 'KeyE':
          if (selectedSectionId) {
            e.preventDefault();
            updateSelected(state, 'stop', currentTime);
          }
          break;
        case 'KeyA':
          if (selectedSectionId) {
            e.preventDefault();
            addEventAtCurrentTime(state);
          }
          break;
        case 'KeyN':
          if (selectedSectionId) {
            e.preventDefault();
            addNewSection(state);
          }
          break;
        case 'Minus':
          e.preventDefault();
          decreaseSeekStep();
          break;
        case 'Equal': // '+' Key is typically Equal
          e.preventDefault();
          increaseSeekStep();
          break;
      }
    };

    const updateSelected = (state: any, field: 'start' | 'stop', time: number) => {
      const { selectedSectionId, data, setData } = state;
      const [vIdx, sIdx] = selectedSectionId!.split('-').map(Number);
      const newData = JSON.parse(JSON.stringify(data));
      if (newData.variants[vIdx]?.sections[sIdx]) {
        newData.variants[vIdx].sections[sIdx][field] = Math.round(time);
        setData(newData);
      }
    };

    const addEventAtCurrentTime = (state: any) => {
      const { selectedSectionId, data, setData, currentTime } = state;
      const [vIdx, sIdx] = selectedSectionId!.split('-').map(Number);
      const newData = JSON.parse(JSON.stringify(data));
      if (newData.variants[vIdx]?.sections[sIdx]) {
        const events = newData.variants[vIdx].sections[sIdx].events || [];
        events.push({
          PlayEventType: "BadAudio",
          start: Math.round(currentTime),
          stop: Math.round(currentTime + 2000)
        });
        newData.variants[vIdx].sections[sIdx].events = events;
        setData(newData);
      }
    };

    const addNewSection = (state: any) => {
      const { selectedSectionId, data, setData, currentTime } = state;
      const [vIdx] = selectedSectionId!.split('-').map(Number);
      const newData = JSON.parse(JSON.stringify(data));
      if (newData.variants[vIdx]) {
        if (!newData.variants[vIdx].sections) newData.variants[vIdx].sections = [];
        newData.variants[vIdx].sections.push({
          name: `New Section`,
          start: Math.round(currentTime),
          stop: Math.round(currentTime + 5000),
          events: [],
          cues: []
        });
        setData(newData);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
