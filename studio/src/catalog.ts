import type { ComponentDef, ComponentType, GlobalAssumptions } from './types'

export const DEFAULT_GLOBALS: GlobalAssumptions = {
  rpsPerUser: 0.05, // ~1 request every 20s per active user
  peakRatio: 3,
  targetUsers: 10_000,
  writeRatio: 0.2,
}

/**
 * Component catalog. Each entry defines the configurable fields (with sensible
 * defaults so a system can be simulated immediately), and a capacity model that
 * returns the sustainable requests/sec the component can serve.
 *
 * Capacity heuristics are drawn from capacity-planning-guide.md:
 *   ~200-250 RPS/instance · target utilization 0.6 · cache hit 80-85%
 *   write ratio 15-20% · peak 3-4x · read replicas scale reads.
 */
export const CATALOG: Record<ComponentType, ComponentDef> = {
  client: {
    type: 'client',
    label: 'Users / Client',
    category: 'Entry',
    accent: '#9bb4ff',
    blurb: 'Traffic source. Represents the end-user population that drives load.',
    fields: [
      { key: 'platform', label: 'Platform', type: 'select', options: ['Web', 'Mobile', 'API consumer', 'IoT'] },
    ],
    defaults: { platform: 'Web' },
    capacity: null,
  },

  cdn: {
    type: 'cdn',
    label: 'CDN / Edge',
    category: 'Edge',
    accent: '#5fd0c3',
    blurb: 'Caches and serves static assets at the edge, absorbing read traffic.',
    fields: [
      { key: 'maxRps', label: 'Edge capacity', type: 'number', unit: 'req/s', min: 0, step: 1000, help: 'Aggregate requests/sec the edge fleet can serve.' },
      { key: 'offload', label: 'Static offload', type: 'number', unit: '%', min: 0, step: 5, help: 'Fraction of traffic fully served at the edge (does not reach origin).' },
    ],
    defaults: { maxRps: 1_000_000, offload: 60 },
    capacity: (c) => ({ rps: c.maxRps, note: `Edge fleet rated at ${fmt(c.maxRps)} req/s.` }),
    outflowMultiplier: (c) => 1 - clamp01((c.offload ?? 0) / 100),
  },

  lb: {
    type: 'lb',
    label: 'Load Balancer',
    category: 'Networking',
    accent: '#6ea8fe',
    blurb: 'Distributes traffic across downstream instances. Rarely the bottleneck.',
    fields: [
      { key: 'maxThroughput', label: 'Max throughput', type: 'number', unit: 'req/s', min: 0, step: 1000 },
      { key: 'algorithm', label: 'Algorithm', type: 'select', options: ['Round robin', 'Least connections', 'IP hash'] },
    ],
    defaults: { maxThroughput: 100_000, algorithm: 'Round robin' },
    capacity: (c) => ({ rps: c.maxThroughput, note: `LB rated at ${fmt(c.maxThroughput)} req/s.` }),
    monthlyCost: () => 25,
  },

  apiGateway: {
    type: 'apiGateway',
    label: 'API Gateway',
    category: 'Networking',
    accent: '#7c9cff',
    blurb: 'Routing, auth, and rate limiting at the API edge.',
    fields: [
      { key: 'rateLimit', label: 'Rate limit', type: 'number', unit: 'req/s', min: 0, step: 100, help: 'Aggregate sustained request ceiling across all routes.' },
      { key: 'routes', label: 'Routes', type: 'number', unit: 'routes', min: 0, step: 1 },
      { key: 'instances', label: 'Instances', type: 'number', unit: '×', min: 1, step: 1 },
    ],
    defaults: { rateLimit: 5_000, routes: 50, instances: 2 },
    capacity: (c) => ({
      rps: c.rateLimit * c.instances,
      note: `${fmt(c.rateLimit)} req/s × ${c.instances} instance(s) = ${fmt(c.rateLimit * c.instances)} req/s.`,
    }),
    monthlyCost: (c) => 40 * c.instances,
  },

  idp: {
    type: 'idp',
    label: 'Identity Provider',
    category: 'Security',
    accent: '#c08bff',
    blurb: 'Authenticates users and issues tokens (OIDC/SAML).',
    fields: [
      { key: 'authRps', label: 'Auth capacity', type: 'number', unit: 'req/s', min: 0, step: 100 },
      { key: 'instances', label: 'Instances', type: 'number', unit: '×', min: 1, step: 1 },
      { key: 'tokenTtlMin', label: 'Token TTL', type: 'number', unit: 'min', min: 1, step: 5, help: 'Longer tokens => fewer auth calls.' },
    ],
    defaults: { authRps: 2_000, instances: 2, tokenTtlMin: 60 },
    capacity: (c) => ({
      rps: c.authRps * c.instances,
      note: `${fmt(c.authRps)} auth/s × ${c.instances} instance(s) = ${fmt(c.authRps * c.instances)} req/s.`,
    }),
    monthlyCost: (c) => 60 * c.instances,
  },

  server: {
    type: 'server',
    label: 'App Server / VM',
    category: 'Compute',
    accent: '#5bd98a',
    blurb: 'Runs application logic. Capacity scales with cores × instances.',
    fields: [
      { key: 'cpuCount', label: 'vCPUs', type: 'number', unit: 'cores', min: 1, step: 1 },
      { key: 'memoryGB', label: 'Memory', type: 'number', unit: 'GB', min: 1, step: 1 },
      { key: 'storageGB', label: 'Storage', type: 'number', unit: 'GB', min: 0, step: 10 },
      { key: 'rpsPerCore', label: 'Throughput / core', type: 'number', unit: 'req/s', min: 1, step: 5, help: '~50 req/s per core for typical I/O-bound APIs.' },
      { key: 'instances', label: 'Instances', type: 'number', unit: '×', min: 1, step: 1 },
      { key: 'utilization', label: 'Target utilization', type: 'number', unit: '0-1', min: 0.1, step: 0.05, help: 'Run below 1.0 for latency headroom (guide: ~0.6).' },
    ],
    defaults: { cpuCount: 4, memoryGB: 8, storageGB: 50, rpsPerCore: 50, instances: 3, utilization: 0.6 },
    capacity: (c) => {
      const raw = c.cpuCount * c.rpsPerCore * c.instances
      const rps = raw * c.utilization
      return {
        rps,
        note: `${c.cpuCount} vCPU × ${c.rpsPerCore} req/s × ${c.instances} inst × ${c.utilization} util = ${fmt(rps)} req/s.`,
      }
    },
    monthlyCost: (c) => Math.round((c.cpuCount * 12 + c.memoryGB * 4 + c.storageGB * 0.1) * c.instances),
  },

  cache: {
    type: 'cache',
    label: 'Cache',
    category: 'Data',
    accent: '#ff9f6e',
    blurb: 'In-memory cache. Hit ratio is the biggest lever on database load.',
    fields: [
      { key: 'engine', label: 'Engine', type: 'select', options: ['Redis', 'Memcached', 'Valkey'] },
      { key: 'memoryGB', label: 'Memory', type: 'number', unit: 'GB', min: 1, step: 1 },
      { key: 'maxOps', label: 'Max ops', type: 'number', unit: 'ops/s', min: 0, step: 10000 },
      { key: 'hitRatio', label: 'Hit ratio', type: 'number', unit: '0-1', min: 0, step: 0.05, help: 'Only misses pass through to downstream stores.' },
    ],
    defaults: { engine: 'Redis', memoryGB: 16, maxOps: 100_000, hitRatio: 0.85 },
    capacity: (c) => ({ rps: c.maxOps, note: `${fmt(c.maxOps)} ops/s in-memory.` }),
    // Cache-aside: only the miss fraction continues to downstream (e.g. DB).
    outflowMultiplier: (c) => 1 - clamp01(c.hitRatio),
    monthlyCost: (c) => Math.round(c.memoryGB * 15),
  },

  queue: {
    type: 'queue',
    label: 'Message Queue',
    category: 'Messaging',
    accent: '#ffcf66',
    blurb: 'Buffers work for async processing, smoothing spikes.',
    fields: [
      { key: 'engine', label: 'Engine', type: 'select', options: ['Kafka', 'RabbitMQ', 'SQS', 'NATS'] },
      { key: 'maxThroughput', label: 'Throughput', type: 'number', unit: 'msg/s', min: 0, step: 1000 },
      { key: 'partitions', label: 'Partitions', type: 'number', unit: '×', min: 1, step: 1 },
    ],
    defaults: { engine: 'Kafka', maxThroughput: 50_000, partitions: 12 },
    capacity: (c) => ({ rps: c.maxThroughput, note: `${fmt(c.maxThroughput)} msg/s across ${c.partitions} partition(s).` }),
    monthlyCost: () => 120,
  },

  db: {
    type: 'db',
    label: 'Database',
    category: 'Data',
    accent: '#ff7a7a',
    blurb: 'Primary datastore. Read replicas scale read throughput.',
    fields: [
      { key: 'engine', label: 'Engine', type: 'select', options: ['PostgreSQL', 'MySQL', 'MongoDB', 'DynamoDB', 'Cassandra'] },
      { key: 'maxQps', label: 'Primary QPS', type: 'number', unit: 'q/s', min: 0, step: 500, help: 'Sustainable queries/sec on the primary.' },
      { key: 'readReplicas', label: 'Read replicas', type: 'number', unit: '×', min: 0, step: 1 },
      { key: 'storageGB', label: 'Storage', type: 'number', unit: 'GB', min: 0, step: 50 },
    ],
    defaults: { engine: 'PostgreSQL', maxQps: 5_000, readReplicas: 1, storageGB: 200 },
    capacity: (c, g) => {
      // Writes hit only the primary; reads spread across primary + replicas.
      const readCap = c.maxQps * (1 + c.readReplicas)
      const writeCap = c.maxQps / Math.max(g.writeRatio, 0.001)
      const rps = Math.min(readCap / Math.max(1 - g.writeRatio, 0.001), writeCap)
      return {
        rps,
        note: `Primary ${fmt(c.maxQps)} q/s + ${c.readReplicas} replica(s); split ${Math.round((1 - g.writeRatio) * 100)}% read / ${Math.round(g.writeRatio * 100)}% write => ${fmt(rps)} req/s.`,
      }
    },
    monthlyCost: (c) => Math.round((300 + c.storageGB * 0.2) * (1 + c.readReplicas)),
  },

  vectorDb: {
    type: 'vectorDb',
    label: 'Vector DB',
    category: 'Data',
    accent: '#ff6ec7',
    blurb: 'Stores embeddings for similarity search (RAG retrieval).',
    fields: [
      { key: 'engine', label: 'Engine', type: 'select', options: ['Pinecone', 'Weaviate', 'Qdrant', 'Milvus', 'pgvector'] },
      { key: 'vectors', label: 'Vectors', type: 'number', unit: 'count', min: 0, step: 100000 },
      { key: 'dim', label: 'Dimensions', type: 'number', unit: 'd', min: 1, step: 64 },
      { key: 'maxQps', label: 'Query capacity', type: 'number', unit: 'q/s', min: 0, step: 100 },
      { key: 'replicas', label: 'Replicas', type: 'number', unit: '×', min: 1, step: 1 },
    ],
    defaults: { engine: 'Qdrant', vectors: 1_000_000, dim: 768, maxQps: 2_000, replicas: 2 },
    capacity: (c) => ({ rps: c.maxQps * c.replicas, note: `${fmt(c.maxQps)} q/s × ${c.replicas} replica(s) = ${fmt(c.maxQps * c.replicas)} req/s.` }),
    monthlyCost: (c) => Math.round((c.vectors * c.dim * 4 / 1e9) * 50 + 80) * c.replicas,
  },

  llm: {
    type: 'llm',
    label: 'LLM Service',
    category: 'AI',
    accent: '#b98bff',
    blurb: 'Hosted or self-hosted model inference. Bound by TPM and RPM limits.',
    fields: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['Claude', 'OpenAI', 'Self-hosted', 'Custom'] },
      { key: 'tpm', label: 'Token limit', type: 'number', unit: 'tok/min', min: 0, step: 100000 },
      { key: 'rpm', label: 'Request limit', type: 'number', unit: 'req/min', min: 0, step: 100 },
      { key: 'tokensPerReq', label: 'Tokens / request', type: 'number', unit: 'tok', min: 1, step: 100, help: 'Input + output tokens for an average call.' },
    ],
    defaults: { provider: 'Claude', tpm: 2_000_000, rpm: 1_000, tokensPerReq: 2_500 },
    capacity: (c) => {
      const byTokens = c.tpm / Math.max(c.tokensPerReq, 1) / 60
      const byReq = c.rpm / 60
      const rps = Math.min(byTokens, byReq)
      const bound = byTokens < byReq ? 'token-bound' : 'request-bound'
      return {
        rps,
        note: `min(${fmt(c.tpm)} tok/min ÷ ${fmt(c.tokensPerReq)} tok, ${fmt(c.rpm)} req/min) ÷ 60 = ${rps.toFixed(2)} req/s (${bound}).`,
      }
    },
    monthlyCost: () => 0, // usage-based; tracked separately
  },

  objectStore: {
    type: 'objectStore',
    label: 'Object Store',
    category: 'Data',
    accent: '#8fd3ff',
    blurb: 'Blob storage for files, media, and backups (S3-style).',
    fields: [
      { key: 'maxRps', label: 'Request rate', type: 'number', unit: 'req/s', min: 0, step: 500, help: 'Per-prefix request ceiling (S3 ~5,500 GET/s).' },
      { key: 'storageTB', label: 'Storage', type: 'number', unit: 'TB', min: 0, step: 1 },
    ],
    defaults: { maxRps: 5_500, storageTB: 5 },
    capacity: (c) => ({ rps: c.maxRps, note: `${fmt(c.maxRps)} req/s per prefix.` }),
    monthlyCost: (c) => Math.round(c.storageTB * 1024 * 0.023),
  },
}

export const CATALOG_LIST: ComponentDef[] = Object.values(CATALOG)

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'k'
  return String(Math.round(n))
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
