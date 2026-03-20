import React from 'react';
import Form from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { useAnnotationStore } from '../../store/annotationStore';

const SchemaRenderer: React.FC = () => {
  const { schema, data, selectedSectionId, setData } = useAnnotationStore();

  if (!selectedSectionId) {
    return <p>Select a section in the sidebar to start annotating.</p>;
  }

  const [vIdx, sIdx] = selectedSectionId.split('-').map(Number);
  const selectedSection = data.variants[vIdx].sections[sIdx];

  const handleFormChange = ({ formData }: any) => {
    const newData = { ...data };
    newData.variants[vIdx].sections[sIdx] = formData;
    setData(newData);
  };

  // Wir extrahieren die Definition für eine Section aus dem Hauptschema
  const sectionSchema: RJSFSchema = {
    ...schema.definitions.Section,
    definitions: schema.definitions, // Referenzen müssen aufgelöst werden
  };

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
