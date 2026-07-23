import axios from 'axios';
import { SchemaMetadata, TableMetadata, ColumnMetadata } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// List of internal application metadata tables to exclude from ER rendering
const EXCLUDED_TABLES = new Set(['app_user', 'app_schema_diagram', 'chat_message']);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const schemaService = {
  /**
   * Fetches JSON database schema metadata from backend API.
   */
  async getSchemaMetadata(): Promise<SchemaMetadata> {
    try {
      // Primary endpoint
      const response = await api.get('/api/schema/metadata');
      return this.transformRawResponseToSchema(response.data);
    } catch (err) {
      console.warn('Primary /api/schema/metadata failed, attempting fallback /api/cache/data...');
      const fallbackResponse = await api.get('/api/cache/data');
      return this.transformRawResponseToSchema(fallbackResponse.data);
    }
  },

  /**
   * Transforms raw PostgreSQL schema stored function output into structured SchemaMetadata object,
   * excluding internal system tables (app_user, app_schema_diagram, chat_message).
   */
  transformRawResponseToSchema(raw: any): SchemaMetadata {
    let rawItems: any[] = [];
    if (typeof raw === 'string') {
      try {
        rawItems = JSON.parse(raw);
      } catch (e) {
        console.error('Could not parse schema JSON string:', e);
      }
    } else if (Array.isArray(raw)) {
      rawItems = raw;
    } else if (raw && typeof raw === 'object' && Array.isArray(raw.tables)) {
      const filteredTables = raw.tables.filter(
        (t: TableMetadata) => !EXCLUDED_TABLES.has(t.tableName.toLowerCase())
      );
      return {
        ...raw,
        tables: filteredTables,
      };
    }

    const tableMap = new Map<string, TableMetadata>();

    for (const item of rawItems) {
      const tableName = item.table_name || item.tableName || 'unknown_table';
      if (EXCLUDED_TABLES.has(tableName.toLowerCase())) {
        continue; // Exclude internal app tables from frontend display
      }

      const colName = item.column_name || item.columnName;
      if (!colName) continue;

      if (!tableMap.has(tableName)) {
        tableMap.set(tableName, {
          tableName,
          columns: [],
          primaryKeys: [],
          foreignKeys: [],
        });
      }

      const table = tableMap.get(tableName)!;
      const dataType = item.data_type || item.dataType || 'text';
      const isNullable = item.is_nullable === 'YES' || item.isNullable === true;
      const constraintType = item.constraint_type || item.constraintType || null;
      const refTable = item.referenced_table || item.referencedTable || null;
      const refCol = item.referenced_column || item.referencedColumn || null;

      const colMeta: ColumnMetadata = {
        columnName: colName,
        dataType,
        isNullable,
        columnDefault: item.column_default || item.columnDefault || null,
        constraintType,
        referencedTable: refTable,
        referencedColumn: refCol,
        maxLength: item.max_length || item.maxLength || null,
        numericPrecision: item.numeric_precision || item.numericPrecision || null,
        numericScale: item.numeric_scale || item.numericScale || null,
      };

      table.columns.push(colMeta);

      if (constraintType === 'PRIMARY KEY') {
        if (!table.primaryKeys.includes(colName)) {
          table.primaryKeys.push(colName);
        }
      }

      if (constraintType === 'FOREIGN KEY' && refTable && !EXCLUDED_TABLES.has(refTable.toLowerCase())) {
        const exists = table.foreignKeys.some(
          (fk) => fk.columnName === colName && fk.referencedTable === refTable
        );
        if (!exists) {
          table.foreignKeys.push({
            columnName: colName,
            referencedTable: refTable,
            referencedColumn: refCol || 'id',
          });
        }
      }
    }

    return {
      tables: Array.from(tableMap.values()),
      rawCount: rawItems.length,
      fetchedAt: new Date().toISOString(),
    };
  },

  /**
   * Generates clean Mermaid.js erDiagram syntax from SchemaMetadata.
   */
  generateMermaidSyntax(schema: SchemaMetadata): string {
    if (!schema || !schema.tables || schema.tables.length === 0) {
      return 'erDiagram\n    NO_TABLES {\n        string info "No schema data loaded"\n    }';
    }

    const lines: string[] = ['erDiagram'];
    const relationshipsSet = new Set<string>();

    // 1. Define Entity Tables & Attributes
    for (const table of schema.tables) {
      lines.push(`    ${table.tableName} {`);
      for (const col of table.columns) {
        // Sanitize data type for Mermaid syntax (strip spaces, special chars)
        const cleanType = col.dataType.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        let keyFlag = '';
        if (table.primaryKeys.includes(col.columnName)) {
          keyFlag = ' PK';
        } else if (col.referencedTable && !EXCLUDED_TABLES.has(col.referencedTable.toLowerCase())) {
          keyFlag = ' FK';
        }

        lines.push(`        ${cleanType} ${col.columnName}${keyFlag}`);
      }
      lines.push('    }');
    }

    // 2. Define Relationships between Entities
    for (const table of schema.tables) {
      for (const fk of table.foreignKeys) {
        if (EXCLUDED_TABLES.has(fk.referencedTable.toLowerCase())) continue;
        const targetTableExists = schema.tables.some((t) => t.tableName === fk.referencedTable);
        if (targetTableExists && table.tableName !== fk.referencedTable) {
          const relKey = `${fk.referencedTable}_to_${table.tableName}_${fk.columnName}`;
          if (!relationshipsSet.has(relKey)) {
            relationshipsSet.add(relKey);
            lines.push(`    ${fk.referencedTable} ||--o{ ${table.tableName} : "${fk.columnName}"`);
          }
        }
      }
    }

    return lines.join('\n');
  },
};
