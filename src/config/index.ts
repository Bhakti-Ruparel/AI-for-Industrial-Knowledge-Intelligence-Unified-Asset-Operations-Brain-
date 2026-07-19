// ═══════════════════════════════════════════════════════════════════════════════
// Application Configuration
// ═══════════════════════════════════════════════════════════════════════════════

export const config = {
  app: {
    name: "PlantMind AI",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    env: process.env.NODE_ENV || "development",
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  database: {
    url: process.env.DATABASE_URL || "",
  },
  qdrant: {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY || "",
    collectionName: process.env.QDRANT_COLLECTION || "plantmind_documents",
  },
  neo4j: {
    uri: process.env.NEO4J_URI || "",
    user: process.env.NEO4J_USER || "neo4j",
    password: process.env.NEO4J_PASSWORD || "",
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || "",
    embeddingModel: process.env.HF_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2",
    chatModel: process.env.HF_CHAT_MODEL || "mistralai/Mistral-7B-Instruct-v0.2",
  },
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === "true",
    phone: process.env.WHATSAPP_PHONE || "6358987708",
    provider: process.env.WHATSAPP_PROVIDER || "meta",
  },
  storage: {
    buckets: {
      documents: "industrial-documents",
      equipmentImages: "equipment-images",
      incidentImages: "incident-images",
      avatars: "avatars",
      reports: "reports",
    },
  },
  ai: {
    chunkSize: 1000,
    chunkOverlap: 200,
    topK: 5,
    minConfidence: 0.7,
  },
} as const;
