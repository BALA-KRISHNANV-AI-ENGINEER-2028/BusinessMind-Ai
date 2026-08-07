/**
 * DOCX Document Processor Strategy.
 */

import type {
  IDocumentProcessor,
  ExtractedDocumentContent,
} from '../processor.interface';

export class DOCXProcessor implements IDocumentProcessor {
  readonly supportedFileTypes = ['docx'] as const;

  canProcess(fileType: string): boolean {
    return fileType.toLowerCase() === 'docx';
  }

  async process(
    buffer: Buffer,
    documentId: string,
    versionId: string,
  ): Promise<ExtractedDocumentContent> {
    try {
      const rawString = buffer.toString('utf-8');
      const extractedText = rawString
        .replace(/<[^>]+>/g, ' ')
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
        errorDetails: err instanceof Error ? err.message : 'Failed to extract DOCX document',
      };
    }
  }
}
