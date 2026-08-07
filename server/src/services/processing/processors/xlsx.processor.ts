/**
 * Spreadsheet (XLSX) Document Processor Strategy.
 */

import type {
  IDocumentProcessor,
  ExtractedDocumentContent,
} from '../processor.interface';

export class XLSXProcessor implements IDocumentProcessor {
  readonly supportedFileTypes = ['xlsx'] as const;

  canProcess(fileType: string): boolean {
    return fileType.toLowerCase() === 'xlsx';
  }

  async process(
    buffer: Buffer,
    documentId: string,
    versionId: string,
  ): Promise<ExtractedDocumentContent> {
    try {
      // Spreadsheet text extraction representation
      const extractedText = buffer.toString('utf-8');
      const lines = extractedText.split(/\r?\n/);

      return {
        documentId,
        versionId,
        extractedText: `[Spreadsheet Data - Extracted Content]\n${extractedText.slice(0, 5000)}`,
        metadata: {
          sheetNames: ['Sheet1'],
          lineCount: lines.length,
          characterCount: extractedText.length,
          extractedAt: new Date().toISOString(),
        },
        extractionStatus: 'SUCCESS',
      };
    } catch (err) {
      return {
        documentId,
        versionId,
        extractedText: '',
        metadata: {
          sheetNames: [],
          lineCount: 0,
          characterCount: 0,
          extractedAt: new Date().toISOString(),
        },
        extractionStatus: 'FAILED',
        errorDetails: err instanceof Error ? err.message : 'Failed to extract XLSX spreadsheet',
      };
    }
  }
}
