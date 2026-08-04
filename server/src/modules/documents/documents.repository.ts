/**
 * Documents Repository — Placeholder. Phase 5: Implement with Mongoose.
 */

export interface IDocumentsRepository {
  // Phase 5: findById, findByOrg, create, update, delete
  // Phase 6+: initiateProcessing, getSignedUploadUrl
}
export class DocumentsRepository implements IDocumentsRepository {}
export const documentsRepository = new DocumentsRepository();
