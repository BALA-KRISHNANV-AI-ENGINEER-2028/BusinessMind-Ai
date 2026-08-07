/**
 * PDF Document Processor Strategy.
 */

import type {
  IDocumentProcessor,
  ExtractedDocumentContent,
} from '../processor.interface';

export class PDFProcessor implements IDocumentProcessor {
  readonly supportedFileTypes = ['pdf'] as const;

  canProcess(fileType: string): boolean {
    return fileType.toLowerCase() === 'pdf';
  }

  async process(
    buffer: Buffer,
    documentId: string,
    versionId: string,
  ): Promise<ExtractedDocumentContent> {
    try {
      const rawString = buffer.toString('utf-8');
      // Clean extracted text representation for PDF
      const extractedText = rawString
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        documentId,
        versionId,
        extractedText,
        metadata: {
          pageCount: 1,
          characterCount: extractedText.length,
          lineCount: extractedText.split('\n').length,
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
          pageCount: 0,
          characterCount: 0,
          lineCount: 0,
          extractedAt: new Date().toISOString(),
        },
        extractionStatus: 'FAILED',
        errorDetails: err instanceof Error ? err.message : 'Failed to extract PDF document',
      };
    }
  }
}
