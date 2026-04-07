import React from 'react';
import Form from '@rjsf/core';
import type { RJSFSchema, WidgetProps, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { useAnnotationStore } from '../../store/annotationStore';

const TimecodeWidget = (props: WidgetProps) => {
  const { value, onChange, disabled, readonly, id, label, schema, name } = props;
  const currentTime = useAnnotationStore((state) => state.currentTime);

  const handleSetCurrentTime = () => {
    const timeValue = Math.round(currentTime);
    if (schema.type === 'string') {
      onChange(String(timeValue));
    } else {
      onChange(timeValue);
    }
  };

  const fieldName = (name || '').toLowerCase();
  const fieldLabel = (label || '').toLowerCase();

  // Very broad heuristic to catch anything that might be a time/code field
  const isTimeField = 
    fieldName.includes('start') || 
    fieldName.includes('stop') || 
    fieldName.includes('time') || 
    fieldName.includes('ms') ||
    fieldLabel.includes('start') || 
    fieldLabel.includes('stop') || 
    fieldLabel.includes('time') || 
    fieldLabel.includes('ms');
  return (
    <div className="timecode-input-group">
      <input
        type={schema.type === 'string' ? 'text' : 'number'}
        id={id}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            onChange(undefined);
          } else if (schema.type === 'string') {
            onChange(val);
          } else {
            onChange(Number(val));
          }
        }}
        disabled={disabled || readonly}
      />
      {isTimeField && (
        <button
          type="button"
          className="btn-timecode"
          onClick={handleSetCurrentTime}
          disabled={disabled || readonly}
          title={`SET TO CURRENT TIME (${Math.round(currentTime)}ms)`}
        >
          SET MS
        </button>
      )}
    </div>
  );
};

const widgets = {
  timecode: TimecodeWidget,
};

// Recursively generates uiSchema to apply the timecode widget where appropriate
const generateUiSchema = (schema: any, definitions: any, depth = 0): UiSchema => {
  if (depth > 10) return {}; // Prevent infinite recursion
  const uiSchema: any = {};
  
  // Resolve $ref if present
  let resolvedSchema = schema;
  if (schema.$ref) {
    const refKey = schema.$ref.split('/').pop();
    resolvedSchema = definitions?.[refKey] || schema;
  }

  // Handle properties of an object
  if (resolvedSchema.properties) {
    for (const key in resolvedSchema.properties) {
      const prop = resolvedSchema.properties[key];
      
      // Resolve property $ref if present
      let propResolved = prop;
      if (prop.$ref) {
        const refKey = prop.$ref.split('/').pop();
        propResolved = definitions?.[refKey] || prop;
      }

      const isTimeCandidate = 
        key.toLowerCase().includes('start') || 
        key.toLowerCase().includes('stop') || 
        key.toLowerCase().includes('time') || 
        key.toLowerCase().includes('duration') || 
        key.toLowerCase().includes('delay') ||
        key.toLowerCase().includes('ms') ||
        key.toLowerCase().includes('situation');

      if ((propResolved.type === 'integer' || propResolved.type === 'number' || propResolved.type === 'string') && isTimeCandidate) {
        uiSchema[key] = { 'ui:widget': 'timecode' };
      } else if (propResolved.type === 'object') {
        uiSchema[key] = generateUiSchema(propResolved, definitions, depth + 1);
      } else if (propResolved.type === 'array' && propResolved.items) {
        uiSchema[key] = { 
          items: generateUiSchema(propResolved.items, definitions, depth + 1) 
        };
      }
    }
  }
  
  return uiSchema;
};

const SchemaRenderer: React.FC = () => {
  const { schema, data, selectedSectionId, setData } = useAnnotationStore();

  if (!schema) {
    return (
      <div className="schema-renderer-empty">
        <p>No schema loaded. Please load a JSON schema in the sidebar to start annotating.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="schema-renderer-empty">
        <p>No session data loaded. Please load or create a session to start annotating.</p>
      </div>
    );
  }

  // Handle Root Selection (no section selected)
  if (!selectedSectionId) {
    const handleRootChange = ({ formData }: any) => {
      setData(formData);
    };

    // We exclude 'variants' from the root form to avoid duplicate UI (it's managed in TreeView)
    const rootSchema = JSON.parse(JSON.stringify(schema));
    if (rootSchema.properties && rootSchema.properties.variants) {
      delete rootSchema.properties.variants;
    }

    const uiSchema = generateUiSchema(rootSchema, schema.definitions);

    return (
      <div className="schema-renderer">
        <h2>Project Settings</h2>
        <Form
          schema={rootSchema}
          uiSchema={uiSchema}
          validator={validator}
          formData={data}
          onChange={handleRootChange}
          widgets={widgets}
        />
      </div>
    );
  }

  // Handle Variant Selection
  if (selectedSectionId.startsWith('v-')) {
    const vIdx = Number(selectedSectionId.split('-')[1]);
    const selectedVariant = data.variants?.[vIdx];

    if (!selectedVariant) {
      return <p>Selected variant not found.</p>;
    }

    const handleVariantChange = ({ formData }: any) => {
      const newData = JSON.parse(JSON.stringify(data));
      if (newData.variants[vIdx]) {
        newData.variants[vIdx] = formData;
        setData(newData);
      }
    };

    // Extract Variant definition
    // We exclude 'sections' from the variant form to avoid duplicate UI
    const variantSchema: RJSFSchema = schema.definitions?.PlayVariant ? {
      ...JSON.parse(JSON.stringify(schema.definitions.PlayVariant)),
      definitions: schema.definitions,
    } : schema;

    if (variantSchema.properties && variantSchema.properties.sections) {
      delete variantSchema.properties.sections;
    }

    const uiSchema = generateUiSchema(variantSchema, schema.definitions);

    return (
      <div className="schema-renderer">
        <h2>Edit Variant: {selectedVariant.name}</h2>
        <Form
          schema={variantSchema}
          uiSchema={uiSchema}
          validator={validator}
          formData={selectedVariant}
          onChange={handleVariantChange}
          widgets={widgets}
        />
      </div>
    );
  }

  // Handle Section Selection
  const [vIdx, sIdx] = selectedSectionId.split('-').map(Number);

  const selectedSection = data.variants?.[vIdx]?.sections?.[sIdx];

  if (!selectedSection) {
    return <p>Selected section not found.</p>;
  }

  const handleFormChange = ({ formData }: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    if (newData.variants[vIdx]?.sections[sIdx]) {
      newData.variants[vIdx].sections[sIdx] = formData;
      setData(newData);
    }
  };

  // Extract Section definition
  const sectionSchema: RJSFSchema = schema.definitions?.Section ? {
    ...schema.definitions.Section,
    definitions: schema.definitions,
  } : schema;

  const uiSchema = generateUiSchema(sectionSchema, schema.definitions);

  return (
    <div className="schema-renderer">
      <h2>Edit Section: {selectedSection.name}</h2>
      <Form
        schema={sectionSchema}
        uiSchema={uiSchema}
        validator={validator}
        formData={selectedSection}
        onChange={handleFormChange}
        widgets={widgets}
      />
    </div>
  );
};



export default SchemaRenderer;
