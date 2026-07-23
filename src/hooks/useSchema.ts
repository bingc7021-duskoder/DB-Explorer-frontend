import { useState, useEffect, useCallback } from 'react';
import { SchemaMetadata, TableMetadata } from '../types';
import { schemaService } from '../services/schemaService';

export const useSchema = () => {
  const [schema, setSchema] = useState<SchemaMetadata | null>(null);
  const [mermaidSyntax, setMermaidSyntax] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<TableMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await schemaService.getSchemaMetadata();
      setSchema(data);
      const syntax = schemaService.generateMermaidSyntax(data);
      setMermaidSyntax(syntax);
    } catch (err: any) {
      console.error('Failed to load schema metadata from backend:', err);
      setError(err?.message || 'Unable to fetch database schema metadata from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return {
    schema,
    mermaidSyntax,
    selectedTable,
    setSelectedTable,
    isLoading,
    error,
    refreshSchema: fetchSchema,
  };
};
