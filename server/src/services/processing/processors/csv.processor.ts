/**
 * CSV Document Processor Strategy.
 */

import type {
  IDocumentProcessor,
  ExtractedDocumentContent,
} from '../processor.interface';

export class CSVProcessor implements IDocumentProcessor {
  readonly supportedFileTypes = ['csv'] as const;

  canProcess(fileType: string): boolean {
    return fileType.toLowerCase() === 'csv';
  }

  async process(
    buffer: Buffer,
    documentId: string,
    versionId: string,
  ): Promise<ExtractedDocumentContent> {
    try {
      const rawContent = buffer.toString('utf-8');
      const lines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

      const characterCount = rawContent.length;
      const lineCount = lines.length;

      // Extract basic header and row sample for normalized structure
      const formattedLines = lines.map((line, idx) => `[Row ${idx + 1}] ${line.replace(/,/g, ' | ')}`);
      const extractedText = formattedLines.join('\n');

      return {
        documentId,
        versionId,
        extractedText,
        metadata: {
          lineCount,
          characterCount,
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
          lineCount: 0,
          characterCount: 0,
          extractedAt: new Date().toISOString(),
        },
        extractionStatus: 'FAILED',
        errorDetails: err instanceof Error ? err.message : 'Failed to extract CSV data',
      };
    }
  }
}
