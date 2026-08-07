/**
 * Plain Text & Markdown Document Processor Strategy.
 */

import type {
  IDocumentProcessor,
  ExtractedDocumentContent,
} from '../processor.interface';

export class TXTProcessor implements IDocumentProcessor {
  readonly supportedFileTypes = ['txt', 'md'] as const;

  canProcess(fileType: string): boolean {
    return this.supportedFileTypes.includes(fileType.toLowerCase() as 'txt' | 'md');
  }

  async process(
    buffer: Buffer,
    documentId: string,
    versionId: string,
  ): Promise<ExtractedDocumentContent> {
    try {
      const extractedText = buffer.toString('utf-8');
      const lines = extractedText.split(/\r?\n/);
      const characterCount = extractedText.length;
      const lineCount = lines.length;

      return {
        documentId,
        versionId,
        extractedText,
        metadata: {
          characterCount,
          lineCount,
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
          characterCount: 0,
          lineCount: 0,
          extractedAt: new Date().toISOString(),
        },
        extractionStatus: 'FAILED',
        errorDetails: err instanceof Error ? err.message : 'Failed to extract text from plain text file',
      };
    }
  }
}
