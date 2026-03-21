import { describe, it, expect, beforeEach } from 'vitest';
import { useAnnotationStore } from '../store/annotationStore';

describe('AnnotationStore', () => {
  beforeEach(() => {
    useAnnotationStore.setState({
      selectedSectionId: "0-0",
      currentTime: 1234,
      data: {
        name: "Test Play",
        variants: [
          {
            name: "V1",
            sections: [
              { name: "S1", start: 0, stop: 1000, events: [], cues: [] }
            ]
          }
        ]
      }
    });
  });

  it('should update start/stop using manual data manipulation (Shortcut simulation)', () => {
    const { data, setData, currentTime } = useAnnotationStore.getState();
    
    // Simulate Shortcut 'S'
    const newDataS = JSON.parse(JSON.stringify(data));
    newDataS.variants[0].sections[0].start = Math.round(currentTime);
    setData(newDataS);
    expect(useAnnotationStore.getState().data.variants[0].sections[0].start).toBe(1234);

    // Simulate Shortcut 'E'
    useAnnotationStore.setState({ currentTime: 5678 });
    const newDataE = JSON.parse(JSON.stringify(useAnnotationStore.getState().data));
    newDataE.variants[0].sections[0].stop = Math.round(useAnnotationStore.getState().currentTime);
    setData(newDataE);
    expect(useAnnotationStore.getState().data.variants[0].sections[0].stop).toBe(5678);
  });

  it('should guarantee immutability on setData', () => {
    const { data, setData } = useAnnotationStore.getState();
    const originalData = data;
    
    const newData = JSON.parse(JSON.stringify(data));
    newData.name = "Changed";
    setData(newData);
    
    expect(useAnnotationStore.getState().data).not.toBe(originalData);
    expect(useAnnotationStore.getState().data.name).toBe("Changed");
  });
});
