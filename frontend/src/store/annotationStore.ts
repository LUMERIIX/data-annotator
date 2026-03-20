import { create } from 'zustand';
import defaultSchema from '../types/schema.json';

interface AnnotationState {
  audioUrl: string | null;
  schema: any;
  data: any;
  selectedSectionId: string | null;
  isPlaying: boolean;
  currentTime: number;
  seekRequest: number | null; 
  togglePlayRequest: number;
  
  setAudioUrl: (url: string) => void;
  setSchema: (schema: any) => void;
  setData: (data: any) => void;
  setSelectedSectionId: (id: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  seekTo: (time: number) => void;
  togglePlay: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
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
  
  setAudioUrl: (url) => set({ audioUrl: url }),
  setSchema: (schema) => set({ schema }),
  setData: (data) => set({ data }),
  setSelectedSectionId: (id) => set({ selectedSectionId: id }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => set({ currentTime: time }),
  seekTo: (time) => set({ seekRequest: time }),
  togglePlay: () => set((state) => ({ togglePlayRequest: state.togglePlayRequest + 1 })),
}));
