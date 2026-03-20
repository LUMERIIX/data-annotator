import React from 'react';
import { useAnnotationStore } from '../../store/annotationStore';
const TreeView: React.FC = () => {
  const { data, selectedSectionId, setSelectedSectionId, setData } = useAnnotationStore();

  const addVariant = () => {
    const newData = { ...data };
    newData.variants.push({
      name: `Variant ${newData.variants.length + 1}`,
      duration: 0,
      audio_quality: 2,
      sections: []
    });
    setData(newData);
  };

  const addSection = (vIdx: number) => {
    const newData = { ...data };
    newData.variants[vIdx].sections.push({
      name: `New Section`,
      start: 0,
      stop: 1000,
      events: [],
      cues: []
    });
    setData(newData);
  };

  return (
    <div className="tree-view">
      <div className="tree-header">
        <h3>Structure</h3>
        <button className="btn-small" onClick={addVariant}>+ Variant</button>
      </div>
      <div className="play-node">
        <strong>{data.name || 'Untitled Play'}</strong>
        <div className="variants-list">
          {data.variants.map((variant: any, vIdx: number) => (
            <div key={`v-${vIdx}`} className="variant-node">
              <div className="node-label">
                <span>{variant.name || `Variant ${vIdx + 1}`}</span>
                <button className="btn-icon" onClick={() => addSection(vIdx)}>+</button>
              </div>
              <div className="sections-list">
                {variant.sections.map((section: any, sIdx: number) => {
                  const sectionId = `${vIdx}-${sIdx}`;
                  const isSelected = selectedSectionId === sectionId;
                  return (
                    <div 
                      key={sectionId} 
                      className={`section-node ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSectionId(sectionId)}
                    >
                      {section.name || `Section ${sIdx + 1}`}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .tree-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .btn-small {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
        }
        .node-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-icon {
          font-size: 0.8rem;
          padding: 0 0.3rem;
          background: #444;
        }
        .tree-view {
          margin-top: 1rem;
        }
...

        .play-node {
          padding-left: 0.5rem;
        }
        .variants-list {
          margin-left: 1rem;
          margin-top: 0.5rem;
        }
        .variant-node {
          margin-bottom: 0.5rem;
        }
        .sections-list {
          margin-left: 1rem;
          border-left: 1px solid #444;
        }
        .section-node {
          padding: 0.2rem 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          border-radius: 4px;
        }
        .section-node:hover {
          background-color: #333;
        }
        .section-node.selected {
          background-color: #646cff;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default TreeView;
