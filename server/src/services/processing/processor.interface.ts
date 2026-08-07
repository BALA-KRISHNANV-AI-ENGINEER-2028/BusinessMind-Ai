/**
 * Document Content Extraction Strategy Interface.
 *
 * Defines normalized extracted content format and processor strategy contract.
 * Prepares extracted raw text for future RAG ingestion while keeping Phase 6 free of
 * vector indexing, chunking, or LLM calls.
 */

export interface ExtractedDocumentMetadata {
  pageCount?: number;
  sheetNames?: string[];
  characterCount: number;
  lineCount: number;
  extractedAt: string;
}

export interface ExtractedDocumentContent {
  documentId: string;
  versionId: string;
  extractedText: string;
  metadata: ExtractedDocumentMetadata;
  extractionStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorDetails?: string;
}

export interface IDocumentProcessor {
  readonly supportedFileTypes: ReadonlyArray<string>;

  /**
   * Determines if this processor supports the given file extension/type.
   */
  canProcess(fileType: string): boolean;

  /**
   * Extracts text and structural metadata from raw document buffer.
   */
  process(
    buffer: Buffer,
    documentId: string,
    versionId: string,
  ): Promise<ExtractedDocumentContent>;
}
