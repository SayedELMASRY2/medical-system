from config.settings import settings

COHERE_API_KEY = settings.cohere_api_key
COHERE_EMBED_MODEL = settings.cohere_embed_model
COHERE_RERANK_MODEL = settings.cohere_rerank_model
EMBEDDING_DIMENSION = settings.embedding_dimension

QDRANT_URL = settings.qdrant_url
QDRANT_API_KEY = settings.qdrant_api_key
COLLECTION_NAME = settings.qdrant_collection

DENSE_VECTOR_NAME = "dense"
SPARSE_VECTOR_NAME = "sparse"

COHERE_INPUT_TYPE_DOCUMENT = "search_document"
COHERE_INPUT_TYPE_QUERY = "search_query"

RERANK_CANDIDATE_K = 25
RERANK_TOP_K = 5
RERANK_MAX_TOKENS_PER_DOC = 4000

PREFETCH_LIMIT = 50
FINAL_LIMIT = 25

QDRANT_REQUEST_TIMEOUT = 180

BM25_MODEL = "qdrant/bm25"
BM25_OPTIONS = {
    "tokenizer": "multilingual",
    "stemmer": {"type": "none"},
    "stopwords": {},
    "ascii_folding": True,
}
