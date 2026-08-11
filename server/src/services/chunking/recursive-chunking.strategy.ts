/**
 * Recursive Character Text Splitting Strategy — Phase 7: RAG Foundation.
 *
 * Splits extracted document text into semantically coherent chunks using
 * a recursive separator hierarchy. Tries splitting at paragraph boundaries
 * first, then sentences, then words — falling back to hard character splits
 * only when text cannot be split otherwise.
 *
 * Separator hierarchy:
 *   1. Double newline   (\n\n)  — paragraph break
 *   2. Single newline   (\n)    — line break
 *   3. Period+space     (. )    — sentence boundary
 *   4. Comma+space      (, )    — clause boundary
 *   5. Space            ( )     — word boundary
 *   6. Empty string     ('')    — hard character split (last resort)
 *
 * Structure-aware metadata extraction:
 *   PDF:  pageNumber estimated via \n\f page-feed characters
 *   XLSX: sheetName from ExtractedDocumentMetadata.sheetNames[0]
 *   TXT/MD: sectionHeading detected via leading '#' characters
 *
 * Guarantees:
 *   - No empty chunks (minChunkLength enforced)
 *   - No exact-duplicate chunks within the same document version
 *   - Overlap preserved between adjacent chunks for boundary context
 *   - Chunk count bounded by chunkSize (no unbounded micro-chunks)
 */

import type { IChunkingStrategy, RawChunk, ChunkingConfig } from './chunking.interface';
import type { ExtractedDocumentContent } from '../processing/processor.interface';

export class RecursiveChunkingStrategy implements IChunkingStrategy {
  readonly strategyName = 'recursive-character';

  /**
   * Separator hierarchy ordered by semantic preference.
   * We try paragraph breaks first, then sentence breaks, then words.
   */
  private readonly SEPARATORS = ['\n\n', '\n', '. ', ', ', ' ', ''];

  chunk(content: ExtractedDocumentContent, config: ChunkingConfig): RawChunk[] {
    const { extractedText, metadata } = content;
    const { chunkSize, chunkOverlap, minChunkLength } = config;

    if (!extractedText || extractedText.trim().length === 0) {
      return [];
    }

    // Split the full text into raw text segments using recursive splitting
    const textSegments = this.splitRecursive(extractedText, chunkSize, chunkOverlap);

    // Build RawChunk objects with metadata, filtering noise
    const seenTexts = new Set<string>(); // deduplicate within this document version
    const chunks: RawChunk[] = [];
    let chunkIndex = 0;

    for (const segment of textSegments) {
      const trimmed = segment.text.trim();

      // Guard: skip empty or too-short chunks
      if (trimmed.length < minChunkLength) continue;

      // Guard: skip exact duplicates (e.g. repeated headers)
      const dedupeKey = trimmed.toLowerCase().replace(/\s+/g, ' ');
      if (seenTexts.has(dedupeKey)) continue;
      seenTexts.add(dedupeKey);

      chunks.push({
        chunkIndex,
        text: trimmed,
        tokenCount: this.estimateTokens(trimmed),
        characterCount: trimmed.length,
        startOffset: segment.startOffset,
        endOffset: segment.endOffset,
        pageNumber: this.estimatePageNumber(extractedText, segment.startOffset),
        sheetName: metadata.sheetNames?.[0],
        sectionHeading: this.detectSectionHeading(extractedText, segment.startOffset),
      });

      chunkIndex++;
    }

    return chunks;
  }

  // ─── Core Recursive Splitter ─────────────────────────────────────────────────

  private splitRecursive(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
  ): Array<{ text: string; startOffset: number; endOffset: number }> {
    return this.splitWithSeparators(text, this.SEPARATORS, chunkSize, chunkOverlap, 0);
  }

  private splitWithSeparators(
    text: string,
    separators: string[],
    chunkSize: number,
    chunkOverlap: number,
    baseOffset: number,
  ): Array<{ text: string; startOffset: number; endOffset: number }> {
    // If text fits in one chunk, return it directly
    if (text.length <= chunkSize) {
      return [{ text, startOffset: baseOffset, endOffset: baseOffset + text.length }];
    }

    // Try each separator in priority order
    for (let i = 0; i < separators.length; i++) {
      const separator = separators[i]!;
      const parts = separator === '' ? this.splitByCharacters(text, chunkSize) : text.split(separator);

      if (parts.length <= 1) continue; // this separator didn't split — try next

      return this.mergeAndSplit(parts, separator, chunkSize, chunkOverlap, baseOffset);
    }

    // Absolute fallback: force split by character count
    return this.splitByCharacters(text, chunkSize).map((t, i) => ({
      text: t,
      startOffset: baseOffset + i * chunkSize,
      endOffset: baseOffset + i * chunkSize + t.length,
    }));
  }

  /**
   * Merges split parts back into chunks of approximately chunkSize,
   * adding chunkOverlap context from the previous chunk's tail.
   */
  private mergeAndSplit(
    parts: string[],
    separator: string,
    chunkSize: number,
    chunkOverlap: number,
    baseOffset: number,
  ): Array<{ text: string; startOffset: number; endOffset: number }> {
    const results: Array<{ text: string; startOffset: number; endOffset: number }> = [];
    let currentChunk = '';
    let currentOffset = baseOffset;
    let chunkStartOffset = baseOffset;

    for (const part of parts) {
      const candidate = currentChunk ? currentChunk + separator + part : part;

      if (candidate.length > chunkSize && currentChunk.length > 0) {
        // Emit current chunk
        results.push({
          text: currentChunk,
          startOffset: chunkStartOffset,
          endOffset: chunkStartOffset + currentChunk.length,
        });

        // Start new chunk with overlap from tail of previous chunk
        const overlap = this.getOverlapText(currentChunk, chunkOverlap);
        currentOffset = chunkStartOffset + currentChunk.length - overlap.length;
        chunkStartOffset = currentOffset;
        currentChunk = overlap ? overlap + separator + part : part;
      } else {
        currentChunk = candidate;
      }

      currentOffset += part.length + separator.length;
    }

    // Emit remaining text
    if (currentChunk.trim().length > 0) {
      results.push({
        text: currentChunk,
        startOffset: chunkStartOffset,
        endOffset: chunkStartOffset + currentChunk.length,
      });
    }

    return results;
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (overlapSize <= 0 || text.length <= overlapSize) return text;
    return text.slice(-overlapSize);
  }

  private splitByCharacters(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // ─── Metadata Extraction Helpers ─────────────────────────────────────────────

  /**
   * Estimates PDF page number by counting \f (form-feed) characters before the offset.
   * This is a heuristic — proper PDF page tracking requires pdf-parse with page data.
   * Returns undefined for non-PDF documents.
   */
  private estimatePageNumber(
    fullText: string,
    offset: number,
  ): number | undefined {
    const textBefore = fullText.slice(0, offset);
    const pageFeeds = (textBefore.match(/\f/g) ?? []).length;
    return pageFeeds > 0 ? pageFeeds + 1 : undefined;
  }

  /**
   * Detects the nearest Markdown/text section heading above the chunk offset.
   * Looks back up to 500 characters for a line starting with '#'.
   */
  private detectSectionHeading(
    fullText: string,
    offset: number,
  ): string | undefined {
    const lookbackStart = Math.max(0, offset - 500);
    // Include initial line of the chunk itself in case the chunk begins with a heading
    const lookbackEnd = Math.min(fullText.length, offset + 100);
    const lookbackText = fullText.slice(lookbackStart, lookbackEnd);
    const lines = lookbackText.split('\n');

    // Find the last heading line before or at the start of this chunk
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]?.trim() ?? '';
      if (line.startsWith('#')) {
        return line.replace(/^#+\s*/, '').trim() || undefined;
      }
    }

    return undefined;
  }

  /**
   * Approximates token count using the ~4 chars/token rule of thumb.
   * Accurate enough for safety checks — not used for billing.
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
