import type { ComponentDef, ComponentPack } from '../types'
import type { IconProps } from '../themes/types'
import { fmt } from './constants'

/* ---- Icons (line style, tinted by node accent via currentColor) ---- */

function Svg({ size = 26, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  )
}

const shield = (inner: React.ReactNode) => (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
    {inner}
  </Svg>
)

const AccessGuardIcon = shield(<><circle cx="12" cy="10.5" r="1.7" /><path d="M12 12.2v3M12 15.2h2" /></>) // shield + key
const PrivacyGuardIcon = shield(<><path d="M8.5 11.5c1-1.5 2.2-2.2 3.5-2.2s2.5.7 3.5 2.2c-1 1.5-2.2 2.2-3.5 2.2s-2.5-.7-3.5-2.2Z" /><circle cx="12" cy="11.5" r=".7" /></>) // shield + eye
const DataShieldIcon = shield(<path d="M9 11.5l2 2 3.5-3.8" />) // shield + check

const hex = (inner: React.ReactNode) => (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z" />
    {inner}
  </Svg>
)

const DataHiveIcon = hex(<><ellipse cx="12" cy="9.5" rx="3.5" ry="1.4" /><path d="M8.5 9.5v4c0 .8 1.6 1.4 3.5 1.4s3.5-.6 3.5-1.4v-4" /></>) // hex + cylinder
const KnowledgeHiveIcon = hex(<><circle cx="9.5" cy="9.5" r="1.2" /><circle cx="15" cy="11" r="1.2" /><circle cx="11" cy="14.5" r="1.2" /><path d="M10.4 10.2 14 10.8M10 13.6l.6-2.9M13.9 12l-2 2" /></>) // hex + graph
const AgentHiveIcon = hex(<><rect x="9" y="9" width="6" height="5" rx="1" /><path d="M12 7.5V9M10.5 14v1.4M13.5 14v1.4M10.8 11.2h.01M13.2 11.2h.01" /></>) // hex + robot
const ToolHiveIcon = hex(<path d="M13.8 8.6a2 2 0 0 0-2.7 2.4l-2.3 2.3 1.4 1.4 2.3-2.3a2 2 0 0 0 2.4-2.7l-1.1 1.1-1-.1-.1-1 1.1-1.1Z" />) // hex + wrench

const GenAiIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4a3 3 0 0 0-3 3 2.5 2.5 0 0 0-1 4.8A2.6 2.6 0 0 0 9 16.5a3 3 0 0 0 3 2V4Z" />
    <path d="M12 4a3 3 0 0 1 3 3 2.5 2.5 0 0 1 1 4.8A2.6 2.6 0 0 1 15 16.5a3 3 0 0 1-3 2" />
    <path d="M18.5 5.5l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5.5-1.3Z" />
  </Svg>
)

const LlmGatewayIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3v18M18 3v18" />
    <path d="M6 12h12M14.5 9.5 18 12l-3.5 2.5M9.5 9.5 6 12l3.5 2.5" />
  </Svg>
)

const AssemblyLineIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
    <path d="M7 12h3M14 12h3" />
    <path d="M4 17h16" />
  </Svg>
)

const ComplianceIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M9 3.5h6v2H9zM8.5 12l2 2 4-4" />
  </Svg>
)

const OmniChannelIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M6 6a9 9 0 0 0 0 12M18 6a9 9 0 0 1 0 12" />
  </Svg>
)

/* ---- Components ----
 * Orion is an enterprise GenAI platform (Layer 3 orchestration core). Each layer
 * is modelled as a throughput stage so a deployment's capacity/bottleneck can be
 * reasoned about the same way as core infrastructure.
 */
const ORION = '#4f7cff'

const components: ComponentDef[] = [
  {
    type: 'orion.accessGuard',
    label: 'Access Guard',
    category: 'Security',
    accent: '#4f7cff',
    icon: AccessGuardIcon,
    blurb: 'User security layer — authN/authZ, SSO and MFA (KeyCloak/OAuth2/AD) before any data or GenAI component is reached.',
    fields: [
      { key: 'idp', label: 'Identity provider', type: 'select', options: ['KeyCloak', 'Okta', 'Entra ID / AD', 'Auth0'] },
      { key: 'authRps', label: 'Auth capacity', type: 'number', unit: 'req/s', min: 0, step: 500 },
      { key: 'instances', label: 'Instances', type: 'number', unit: '×', min: 1, step: 1 },
      { key: 'mfa', label: 'MFA', type: 'select', options: ['Enabled', 'Optional', 'Disabled'] },
    ],
    defaults: { idp: 'KeyCloak', authRps: 3_000, instances: 2, mfa: 'Enabled' },
    capacity: (c) => ({ rps: c.authRps * c.instances, note: `${fmt(c.authRps)} auth/s × ${c.instances} instance(s) = ${fmt(c.authRps * c.instances)} req/s.` }),
    monthlyCost: (c) => 80 * c.instances,
  },
  {
    type: 'orion.privacyGuard',
    label: 'Privacy Guard',
    category: 'Security',
    accent: '#3f9d78',
    icon: PrivacyGuardIcon,
    blurb: 'Inbound data protection — anonymisation, masking and secure retrieval (ISO 27001 / SOC 2 / GDPR) before prompts reach the models.',
    fields: [
      { key: 'technique', label: 'Technique', type: 'select', options: ['Mask', 'Anonymise', 'Tokenise', 'Redact'] },
      { key: 'throughput', label: 'Throughput', type: 'number', unit: 'req/s', min: 0, step: 500 },
      { key: 'instances', label: 'Instances', type: 'number', unit: '×', min: 1, step: 1 },
      { key: 'piiDetection', label: 'PII detection', type: 'select', options: ['ML + rules', 'Rules only', 'Off'] },
    ],
    defaults: { technique: 'Mask', throughput: 4_000, instances: 2, piiDetection: 'ML + rules' },
    capacity: (c) => ({ rps: c.throughput * c.instances, note: `${fmt(c.throughput)} req/s × ${c.instances} instance(s) = ${fmt(c.throughput * c.instances)} req/s.` }),
    monthlyCost: (c) => 90 * c.instances,
  },
  {
    type: 'orion.dataShield',
    label: 'Data Shield',
    category: 'Security',
    accent: '#3f9d78',
    icon: DataShieldIcon,
    blurb: 'Post-processing controls — filters and validates AI outputs against governance and ethical-AI policy before release.',
    fields: [
      { key: 'throughput', label: 'Throughput', type: 'number', unit: 'req/s', min: 0, step: 500 },
      { key: 'instances', label: 'Instances', type: 'number', unit: '×', min: 1, step: 1 },
      { key: 'checks', label: 'Output checks', type: 'select', options: ['Toxicity + PII + policy', 'PII + policy', 'Policy only'] },
    ],
    defaults: { throughput: 5_000, instances: 2, checks: 'Toxicity + PII + policy' },
    capacity: (c) => ({ rps: c.throughput * c.instances, note: `${fmt(c.throughput)} req/s × ${c.instances} instance(s) = ${fmt(c.throughput * c.instances)} req/s.` }),
    monthlyCost: (c) => 90 * c.instances,
  },
  {
    type: 'orion.dataHive',
    label: 'Data Hive',
    category: 'Data',
    accent: '#2f8f8f',
    icon: DataHiveIcon,
    blurb: 'Data harmonisation engine (Airflow) — integrates and normalises apps, databases and files into a unified, AI-ready schema.',
    fields: [
      { key: 'orchestrator', label: 'Orchestrator', type: 'select', options: ['Airflow', 'Dagster', 'Prefect'] },
      { key: 'sources', label: 'Connected sources', type: 'number', unit: '×', min: 0, step: 1 },
      { key: 'throughput', label: 'Ingest throughput', type: 'number', unit: 'req/s', min: 0, step: 1000 },
      { key: 'workers', label: 'Workers', type: 'number', unit: '×', min: 1, step: 1 },
    ],
    defaults: { orchestrator: 'Airflow', sources: 12, throughput: 8_000, workers: 4 },
    capacity: (c) => ({ rps: c.throughput, note: `Harmonisation plane rated at ${fmt(c.throughput)} req/s across ${c.workers} worker(s).` }),
    monthlyCost: (c) => 60 * c.workers,
  },
  {
    type: 'orion.knowledgeHive',
    label: 'Knowledge Hive',
    category: 'Data',
    accent: '#2f8f8f',
    icon: KnowledgeHiveIcon,
    blurb: 'Knowledge graph + smart-data repositories for contextual reasoning, discovery and enterprise search (RAG retrieval).',
    fields: [
      { key: 'store', label: 'Graph / index', type: 'select', options: ['Neo4j', 'Neptune', 'OpenSearch', 'Hybrid'] },
      { key: 'documents', label: 'Documents', type: 'number', unit: 'count', min: 0, step: 100000 },
      { key: 'maxQps', label: 'Query capacity', type: 'number', unit: 'q/s', min: 0, step: 250 },
      { key: 'replicas', label: 'Replicas', type: 'number', unit: '×', min: 1, step: 1 },
    ],
    defaults: { store: 'Hybrid', documents: 2_000_000, maxQps: 2_500, replicas: 2 },
    capacity: (c) => ({ rps: c.maxQps * c.replicas, note: `${fmt(c.maxQps)} q/s × ${c.replicas} replica(s) = ${fmt(c.maxQps * c.replicas)} req/s.` }),
    monthlyCost: (c) => 120 * c.replicas,
  },
  {
    type: 'orion.genaiEngine',
    label: 'GenAI Engine',
    category: 'AI',
    accent: '#7c5cff',
    icon: GenAiIcon,
    blurb: 'The generative & cognitive core — multimodal/domain models via the LLM Hive (OpenAI, Gemini, Claude, Grok, Qwen, HF) plus BYOM. Bound by TPM/RPM.',
    fields: [
      { key: 'routing', label: 'Model routing', type: 'select', options: ['Cost-aware', 'Latency-aware', 'Quality-first', 'Fixed'] },
      { key: 'tpm', label: 'Token budget', type: 'number', unit: 'tok/min', min: 0, step: 500000 },
      { key: 'rpm', label: 'Request budget', type: 'number', unit: 'req/min', min: 0, step: 100 },
      { key: 'tokensPerReq', label: 'Tokens / request', type: 'number', unit: 'tok', min: 1, step: 100, help: 'Input + output for an average call.' },
    ],
    defaults: { routing: 'Cost-aware', tpm: 3_000_000, rpm: 2_000, tokensPerReq: 3_000 },
    capacity: (c) => {
      const byTokens = c.tpm / Math.max(c.tokensPerReq, 1) / 60
      const byReq = c.rpm / 60
      const rps = Math.min(byTokens, byReq)
      const bound = byTokens < byReq ? 'token-bound' : 'request-bound'
      return { rps, note: `min(${fmt(c.tpm)} tok/min ÷ ${fmt(c.tokensPerReq)} tok, ${fmt(c.rpm)} req/min) ÷ 60 = ${rps.toFixed(2)} req/s (${bound}).` }
    },
    monthlyCost: () => 0,
  },
  {
    type: 'orion.llmGateway',
    label: 'LLM Gateway',
    category: 'AI',
    accent: '#7c5cff',
    icon: LlmGatewayIcon,
    blurb: 'Unified gateway to model providers — routing, quota, failover and caching across OpenAI/Gemini/Claude/self-hosted.',
    fields: [
      { key: 'providers', label: 'Providers', type: 'number', unit: '×', min: 1, step: 1 },
      { key: 'maxRps', label: 'Gateway capacity', type: 'number', unit: 'req/s', min: 0, step: 100 },
      { key: 'cacheHit', label: 'Prompt cache hit', type: 'number', unit: '0-1', min: 0, step: 0.05, help: 'Cached responses do not consume model budget downstream.' },
    ],
    defaults: { providers: 4, maxRps: 2_000, cacheHit: 0.2 },
    capacity: (c) => ({ rps: c.maxRps, note: `Gateway rated at ${fmt(c.maxRps)} req/s across ${c.providers} provider(s).` }),
    outflowMultiplier: (c) => 1 - Math.max(0, Math.min(1, c.cacheHit ?? 0)),
    monthlyCost: () => 150,
  },
  {
    type: 'orion.assemblyLine',
    label: 'Assembly Line',
    category: 'Orchestration',
    accent: '#e08a3c',
    icon: AssemblyLineIcon,
    blurb: 'Staged workflow-orchestration engine (Temporal) that runs the full lifecycle of the lending journeys.',
    fields: [
      { key: 'engine', label: 'Engine', type: 'select', options: ['Temporal', 'Camunda', 'Step Functions'] },
      { key: 'workflowsPerSec', label: 'Workflow starts', type: 'number', unit: 'wf/s', min: 0, step: 50 },
      { key: 'workers', label: 'Workers', type: 'number', unit: '×', min: 1, step: 1 },
      { key: 'stepsPerWorkflow', label: 'Steps / workflow', type: 'number', unit: 'steps', min: 1, step: 1 },
    ],
    defaults: { engine: 'Temporal', workflowsPerSec: 500, workers: 8, stepsPerWorkflow: 12 },
    capacity: (c) => ({ rps: c.workflowsPerSec * c.workers, note: `${fmt(c.workflowsPerSec)} wf/s × ${c.workers} worker(s) = ${fmt(c.workflowsPerSec * c.workers)} req/s.` }),
    monthlyCost: (c) => 70 * c.workers,
  },
  {
    type: 'orion.agentHive',
    label: 'Agent Hive',
    category: 'Orchestration',
    accent: '#e08a3c',
    icon: AgentHiveIcon,
    blurb: 'Orchestrates autonomous AI agents (AgentGateway) that execute workflows, retrieve information and act on enterprise systems.',
    fields: [
      { key: 'gateway', label: 'Runtime', type: 'select', options: ['AgentGateway', 'LangGraph', 'Custom'] },
      { key: 'runsPerSec', label: 'Agent runs', type: 'number', unit: 'runs/s', min: 0, step: 50 },
      { key: 'maxConcurrent', label: 'Max concurrent', type: 'number', unit: 'agents', min: 1, step: 10 },
      { key: 'toolCallsPerRun', label: 'Tool calls / run', type: 'number', unit: '×', min: 0, step: 1 },
    ],
    defaults: { gateway: 'AgentGateway', runsPerSec: 200, maxConcurrent: 200, toolCallsPerRun: 4 },
    capacity: (c) => ({ rps: c.runsPerSec, note: `${fmt(c.runsPerSec)} agent runs/s (≤ ${fmt(c.maxConcurrent)} concurrent).` }),
    monthlyCost: () => 200,
  },
  {
    type: 'orion.toolHive',
    label: 'Tool Hive',
    category: 'Integration',
    accent: '#c96a9b',
    icon: ToolHiveIcon,
    blurb: 'Connects internal/external APIs and hosted AI services via MCP and direct integrations for real-time connectivity and decisioning.',
    fields: [
      { key: 'protocol', label: 'Protocol', type: 'select', options: ['MCP', 'REST', 'gRPC', 'Mixed'] },
      { key: 'connectors', label: 'Connectors', type: 'number', unit: '×', min: 0, step: 1 },
      { key: 'callsPerSec', label: 'Tool calls', type: 'number', unit: 'req/s', min: 0, step: 500 },
    ],
    defaults: { protocol: 'MCP', connectors: 24, callsPerSec: 3_000 },
    capacity: (c) => ({ rps: c.callsPerSec, note: `${fmt(c.callsPerSec)} tool calls/s across ${c.connectors} connector(s).` }),
    monthlyCost: () => 120,
  },
  {
    type: 'orion.compliance',
    label: 'Compliance & Security',
    category: 'Governance',
    accent: '#3f9d78',
    icon: ComplianceIcon,
    blurb: 'Cross-cutting access-control, continuous monitoring, audit and legal-compliance across all data and AI operations.',
    fields: [
      { key: 'auditRetentionDays', label: 'Audit retention', type: 'number', unit: 'days', min: 0, step: 30 },
      { key: 'monitoring', label: 'Monitoring', type: 'select', options: ['Continuous', 'Periodic'] },
      { key: 'frameworks', label: 'Frameworks', type: 'select', options: ['ISO 27001 + SOC 2 + GDPR', 'SOC 2 + GDPR', 'Custom'] },
    ],
    defaults: { auditRetentionDays: 365, monitoring: 'Continuous', frameworks: 'ISO 27001 + SOC 2 + GDPR' },
    capacity: null, // governance overlay — not on the request path
    monthlyCost: () => 200,
  },
  {
    type: 'orion.omniChannel',
    label: 'Omni-channel',
    category: 'Channel',
    accent: '#4f7cff',
    icon: OmniChannelIcon,
    blurb: 'Consistent AI experiences across web, mobile, enterprise apps and API integrations — the channel aggregation entry.',
    fields: [
      { key: 'channels', label: 'Channels', type: 'select', options: ['Web + Mobile + API', 'Web + API', 'API only'] },
      { key: 'maxRps', label: 'Aggregate capacity', type: 'number', unit: 'req/s', min: 0, step: 1000 },
    ],
    defaults: { channels: 'Web + Mobile + API', maxRps: 20_000 },
    capacity: (c) => ({ rps: c.maxRps, note: `Channel layer rated at ${fmt(c.maxRps)} req/s.` }),
    monthlyCost: () => 60,
  },
]

void ORION

export const orionPack: ComponentPack = {
  id: 'orion',
  name: 'Orion Platform',
  description: 'Enterprise GenAI platform layers (Access/Privacy/Data guards, Hives, GenAI Engine, Assembly Line, Agent/Tool Hive).',
  components,
}
