# MongoDB Atlas Vector Search Index Configuration — Phase 7: RAG Foundation

> **IMPORTANT**: MongoDB Atlas Vector Search indexes cannot be created via Mongoose schemas.
> Follow the instructions below to create the index in the MongoDB Atlas UI or via the Atlas Admin API.

---

## Index Specifications

| Attribute | Value |
|-----------|-------|
| **Collection** | `documentchunks` |
| **Index Name** | `document_chunk_vector_index` |
| **Search Type** | Vector Search |
| **Vector Field** | `embedding` |
| **Dimensions** | `768` (Google Gemini `text-embedding-004`) OR `1536` (OpenAI `text-embedding-3-small` / mock provider) |
| **Similarity Metric** | `cosine` |

---

## Exact JSON Definition for Google Gemini (768 Dimensions)

Copy and paste this JSON payload into MongoDB Atlas when using **Google Gemini (`EMBEDDING_PROVIDER=gemini`)**:

```json
{
  "name": "document_chunk_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 768,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "organizationId"
      },
      {
        "type": "filter",
        "path": "knowledgeBaseId"
      },
      {
        "type": "filter",
        "path": "documentId"
      },
      {
        "type": "filter",
        "path": "documentVersionId"
      },
      {
        "type": "filter",
        "path": "embeddingStatus"
      }
    ]
  }
}
```

---

## Exact JSON Definition for OpenAI (1536 Dimensions)

Copy and paste this JSON payload into MongoDB Atlas when using **OpenAI (`EMBEDDING_PROVIDER=openai`)**:

```json
{
  "name": "document_chunk_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 1536,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "organizationId"
      },
      {
        "type": "filter",
        "path": "knowledgeBaseId"
      },
      {
        "type": "filter",
        "path": "documentId"
      },
      {
        "type": "filter",
        "path": "documentVersionId"
      },
      {
        "type": "filter",
        "path": "embeddingStatus"
      }
    ]
  }
}
```

---

## Migration & Re-indexing Procedure (Switching Providers)

If migrating an existing database from OpenAI (1536 dimensions) to Google Gemini (768 dimensions):

1. **Delete / Drop Existing Vector Index**:
   - In MongoDB Atlas Console, go to **Search / Vector Search** for your collection `documentchunks`.
   - Click the three dots next to `document_chunk_vector_index` and select **Delete**.

2. **Recreate Index with Matching Dimensions**:
   - Create a new Vector Search index with the 768-dimension definition shown above.

3. **Re-embed Existing Document Chunks**:
   - Because existing chunks contain 1536-dimensional vectors from OpenAI, they cannot be compared directly against 768-dimensional query vectors.
   - Run the re-embedding script or re-upload documents so that `DocumentChunk` records are re-embedded with Gemini's `text-embedding-004`.

---

## Step-by-Step UI Instructions

1. Log into your [MongoDB Atlas Console](https://cloud.mongodb.com).
2. Select your cluster and navigate to the **Atlas Search** or **Search / Vector Search** tab.
3. Click **Create Search Index**.
4. Choose **JSON Editor** under **Atlas Vector Search**.
5. Select your database (e.g. `businessmind-ai`) and the target collection: `documentchunks`.
6. Paste the JSON definition above into the editor.
7. Click **Next**, then **Create Vector Search Index**.
8. Indexing takes approximately 1–3 minutes. Once the status turns **Active**, vector retrieval is live!

---

## Troubleshooting

- **Local Development / Testing**: If using `EMBEDDING_PROVIDER=mock`, vector search operations fall back gracefully if no Atlas index exists, using mock unit-vector scoring.
- **Dimension Mismatch**: If changing `EMBEDDING_DIMENSIONS` in `.env` (e.g., from `1536` to `512`), you MUST drop and recreate this Atlas Vector Search index with the matching `numDimensions`.
- **Multi-Tenant Security**: The `organizationId` filter field in the index definition ensures compound pre-filtering is hardware-accelerated during vector similarity search.
