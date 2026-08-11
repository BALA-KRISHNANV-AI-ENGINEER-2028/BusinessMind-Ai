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
| **Dimensions** | `1536` (matches OpenAI `text-embedding-3-small` / mock provider) |
| **Similarity Metric** | `cosine` |

---

## Exact JSON Definition

Copy and paste this exact JSON payload into MongoDB Atlas:

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
