import React from 'react';
import { useAnnotationStore } from '../../store/annotationStore';

const TreeView: React.FC = () => {
  const { data, selectedSectionId, setSelectedSectionId, setData } = useAnnotationStore();
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const initializeData = () => {
    setData({
      name: "New Project",
      variants: []
    });
  };

  if (!data) {
    return (
      <div className="tree-view-empty">
        <button className="btn-sidebar" onClick={initializeData}>Create New Session</button>
      </div>
    );
  }

  const updateData = (path: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setData(newData);
  };

  const addVariant = () => {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.variants) newData.variants = [];
    newData.variants.push({
      name: `Variant ${newData.variants.length + 1}`,
      duration: 0,
      audio_quality: 2,
      sections: []
    });
    setData(newData);
  };

  const addSection = (vIdx: number) => {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.variants[vIdx].sections) {
      newData.variants[vIdx].sections = [];
    }
    newData.variants[vIdx].sections.push({
      name: `New Section`,
      start: 0,
      stop: 1000,
      events: [],
      cues: []
    });
    setData(newData);
  };

  const removeVariant = (vIdx: number) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.variants.splice(vIdx, 1);
    setData(newData);
  };

  const removeSection = (vIdx: number, sIdx: number) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.variants[vIdx].sections.splice(sIdx, 1);
    setData(newData);
  };

  return (
    <div className="tree-view">
      <div className="tree-header">
        <h3>Structure</h3>
        <button className="btn-small" onClick={addVariant}>+ Variant</button>
      </div>
      <div className="play-node">
        <div 
          className={`project-header ${!selectedSectionId ? 'selected-root' : ''}`}
          onClick={() => setSelectedSectionId(null)}
        >
          <input 
            className="node-input main-title"
            value={data.name || ''} 
            placeholder="Project Name"
            readOnly={editingId !== 'root'}
            onDoubleClick={() => setEditingId('root')}
            onBlur={() => setEditingId(null)}
            onChange={(e) => updateData(['name'], e.target.value)}
          />
        </div>
        <div className="variants-list">
          {(data.variants || []).map((variant: any, vIdx: number) => {
            const vId = `v-${vIdx}`;
            const isVSelected = selectedSectionId === vId;
            return (
              <div key={vId} className={`variant-node ${isVSelected ? 'selected' : ''}`}>
                <div 
                  className="node-label" 
                  onClick={() => setSelectedSectionId(vId)}
                >
                  <input 
                    className="node-input variant-title"
                    value={variant.name || ''} 
                    placeholder="Variant Name"
                    readOnly={editingId !== vId}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingId(vId); }}
                    onBlur={() => setEditingId(null)}
                    onChange={(e) => updateData(['variants', vIdx.toString(), 'name'], e.target.value)}
                  />
                  <div className="node-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-icon" onClick={() => addSection(vIdx)} title="Add Section">+</button>
                    <button className="btn-icon btn-danger" onClick={() => removeVariant(vIdx)} title="Remove Variant">×</button>
                  </div>
                </div>
                <div className="sections-list">
                  {(variant.sections || []).map((section: any, sIdx: number) => {
                    const sId = `${vIdx}-${sIdx}`;
                    const isSSelected = selectedSectionId === sId;
                    return (
                      <div 
                        key={sId} 
                        className={`section-node ${isSSelected ? 'selected' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedSectionId(sId); }}
                      >
                        <input 
                          className="node-input section-title"
                          value={section.name || ''} 
                          placeholder="Section Name"
                          readOnly={editingId !== sId}
                          onDoubleClick={(e) => { e.stopPropagation(); setEditingId(sId); }}
                          onBlur={() => setEditingId(null)}
                          onChange={(e) => updateData(['variants', vIdx.toString(), 'sections', sIdx.toString(), 'name'], e.target.value)}
                        />
                        <button className="btn-icon btn-danger btn-small-icon" onClick={(e) => { e.stopPropagation(); removeSection(vIdx, sIdx); }} title="Remove Section">×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .tree-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .project-header {
          padding: 0.2rem 0.5rem;
          cursor: pointer;
          border-radius: 4px;
        }
        .project-header.selected-root {
          background-color: #646cff;
        }
        .project-header:hover:not(.selected-root) {
          background-color: #333;
        }
        .btn-small {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
        }
        .node-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          padding: 0.1rem 0.3rem;
          cursor: pointer;
          border-radius: 4px;
        }
        .variant-node.selected > .node-label {
          background-color: #444;
          border-left: 3px solid #646cff;
        }
        .node-actions {
          display: flex;
          gap: 0.2rem;
        }
        .btn-icon {
          font-size: 0.8rem;
          padding: 0 0.4rem;
          background: #444;
          border-radius: 4px;
          border: none;
          color: white;
          cursor: pointer;
        }
        .btn-icon:hover {
          background: #555;
        }
        .btn-danger:hover {
          background: #a00;
        }
        .node-input {
          background: transparent;
          border: none;
          color: white;
          width: 100%;
          padding: 0.2rem;
          border-bottom: 1px solid transparent;
          cursor: inherit;
        }
        .node-input:focus {
          outline: none;
          border-bottom: 1px solid var(--accent-color);
          background: rgba(255, 255, 255, 0.05);
        }
        .node-input[readonly] {
          pointer-events: none;
        }
        .main-title {
          font-weight: bold;
          font-size: 1rem;
        }
        .variant-title {
          font-size: 0.9rem;
        }
        .section-title {
          font-size: 0.85rem;
          cursor: pointer;
        }
        .selected .section-title {
          color: white;
        }
        .tree-view {
          margin-top: 1rem;
        }
        .play-node {
          padding-left: 0.5rem;
        }
        .variants-list {
          margin-left: 0.5rem;
          margin-top: 0.5rem;
        }
        .variant-node {
          margin-bottom: 1rem;
        }
        .sections-list {
          margin-left: 0.8rem;
          border-left: 1px solid #444;
          margin-top: 0.2rem;
        }
        .section-node {
          padding: 0.1rem 0.3rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          border-radius: 4px;
        }
        .section-node:hover {
          background-color: #333;
        }
        .section-node.selected {
          background-color: #646cff;
        }
        .btn-small-icon {
          font-size: 0.7rem;
          padding: 0 0.2rem;
          opacity: 0.5;
        }
        .section-node:hover .btn-small-icon {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};


export default TreeView;
