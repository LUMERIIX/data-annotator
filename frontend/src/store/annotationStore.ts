import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import defaultSchema from '../types/schema.json';

export const SEEK_STEPS = [100, 500, 1000, 2000, 5000, 10000];

interface SeekRequest {
  time: number;
  timestamp: number;
}

interface AnnotationState {
  audioUrl: string | null;
  schema: any;
  data: any;
  selectedSectionId: string | null;
  isPlaying: boolean;
  currentTime: number;
  seekRequest: SeekRequest | null; 
  togglePlayRequest: number;
  seekStep: number;
  showSpectrogram: boolean;
  
  setAudioUrl: (url: string) => void;
  setSchema: (schema: any) => void;
  setData: (data: any) => void;
  setSelectedSectionId: (id: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  seekTo: (time: number) => void;
  setSeekStep: (step: number) => void;
  setShowSpectrogram: (show: boolean) => void;
  increaseSeekStep: () => void;
  decreaseSeekStep: () => void;
  togglePlay: () => void;
  addSectionAtCurrentTime: () => void;
}

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set, get) => ({
      audioUrl: null,
      schema: defaultSchema,
      data: {
        name: "Sample Play",
        language: "German",
        variants: [
          {
            name: "Premiere",
            duration: 3600000,
            audio_quality: 3,
            sections: [
              {
                name: "Act 1, Scene 1",
                start: 0,
                stop: 600000,
                events: [],
                cues: []
              }
            ]
          }
        ]
      },
      selectedSectionId: null,
      isPlaying: false,
      currentTime: 0,
      seekRequest: null,
      togglePlayRequest: 0,
      seekStep: 1000,
      showSpectrogram: false,
      
      setAudioUrl: (url) => set({ audioUrl: url }),
      setSchema: (schema) => set({ schema }),
      setData: (data) => set({ data: JSON.parse(JSON.stringify(data)) }),
      setSelectedSectionId: (id) => set({ selectedSectionId: id }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setCurrentTime: (time) => set({ currentTime: time }),
      seekTo: (time) => set({ seekRequest: { time, timestamp: Date.now() } }),
      setSeekStep: (step) => set({ seekStep: step }),
      setShowSpectrogram: (show) => set({ showSpectrogram: show }),
      increaseSeekStep: () => set((state) => {
        const currentIndex = SEEK_STEPS.indexOf(state.seekStep);
        const nextIndex = Math.min(currentIndex + 1, SEEK_STEPS.length - 1);
        return { seekStep: SEEK_STEPS[nextIndex] };
      }),
      decreaseSeekStep: () => set((state) => {
        const currentIndex = SEEK_STEPS.indexOf(state.seekStep);
        const prevIndex = Math.max(currentIndex - 1, 0);
        return { seekStep: SEEK_STEPS[prevIndex] };
      }),
      togglePlay: () => set((state) => ({ togglePlayRequest: state.togglePlayRequest + 1 })),
      
      addSectionAtCurrentTime: () => {
        const { data, selectedSectionId, currentTime } = get();
        const newData = JSON.parse(JSON.stringify(data));
        
        let vIdx = 0;
        if (selectedSectionId) {
          vIdx = Number(selectedSectionId.split('-')[0]);
        }

        if (newData.variants[vIdx]) {
          if (!newData.variants[vIdx].sections) newData.variants[vIdx].sections = [];
          
          const newSection = {
            name: `New Section ${newData.variants[vIdx].sections.length + 1}`,
            start: Math.round(currentTime),
            stop: Math.round(currentTime + 5000),
            events: [],
            cues: []
          };
          
          newData.variants[vIdx].sections.push(newSection);
          const newSIdx = newData.variants[vIdx].sections.length - 1;
          
          set({ 
            data: newData,
            selectedSectionId: `${vIdx}-${newSIdx}`
          });
        }
      }
    }),
    {
      name: 'annotator-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        data: state.data, 
        schema: state.schema,
        seekStep: state.seekStep,
        showSpectrogram: state.showSpectrogram
      }),
    }
  )
);
