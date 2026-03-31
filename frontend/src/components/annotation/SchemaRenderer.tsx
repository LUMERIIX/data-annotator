import React from 'react';
import Form from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { useAnnotationStore } from '../../store/annotationStore';

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

    return (
      <div className="schema-renderer">
        <h2>Project Settings</h2>
        <Form
          schema={rootSchema}
          validator={validator}
          formData={data}
          onChange={handleRootChange}
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

    return (
      <div className="schema-renderer">
        <h2>Edit Variant: {selectedVariant.name}</h2>
        <Form
          schema={variantSchema}
          validator={validator}
          formData={selectedVariant}
          onChange={handleVariantChange}
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

  return (
    <div className="schema-renderer">
      <h2>Edit Section: {selectedSection.name}</h2>
      <Form
        schema={sectionSchema}
        validator={validator}
        formData={selectedSection}
        onChange={handleFormChange}
      />
    </div>
  );
};



export default SchemaRenderer;
