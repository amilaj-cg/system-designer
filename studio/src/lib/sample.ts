import { getDef } from '../catalog'
import type { ComponentType, DesignEdge, DesignNode } from '../types'

let n = 0
function node(type: ComponentType, label: string, x: number, y: number, cfg: Record<string, any> = {}): DesignNode {
  n += 1
  return {
    id: `s${n}`,
    type: 'component',
    position: { x, y },
    data: { type, label, config: { ...getDef(type).defaults, ...cfg } },
  }
}
function edge(a: string, b: string): DesignEdge {
  return { id: `e-${a}-${b}`, source: a, target: b, animated: true }
}

/** A small but realistic RAG-style web app to show the studio off. */
export function sampleDesign(): { nodes: DesignNode[]; edges: DesignEdge[] } {
  n = 0
  const nodes = [
    node('client', 'Web & Mobile users', 0, 180),
    node('cdn', 'CloudFront edge', 200, 180),
    node('lb', 'Public ALB', 400, 180),
    node('apiGateway', 'API Gateway', 580, 180, { rateLimit: 8000, instances: 2 }),
    node('idp', 'Auth (OIDC)', 580, 0),
    node('server', 'API service', 780, 180, { cpuCount: 8, instances: 4, rpsPerCore: 60 }),
    node('cache', 'Redis cache', 980, 40, { hitRatio: 0.85 }),
    node('db', 'PostgreSQL', 1180, 40, { maxQps: 6000, readReplicas: 2 }),
    node('vectorDb', 'Qdrant', 980, 200, { maxQps: 2500, replicas: 2 }),
    node('llm', 'Claude', 1180, 200, { tpm: 2_000_000, rpm: 1000, tokensPerReq: 2500 }),
    node('queue', 'Kafka', 980, 340),
    node('objectStore', 'S3 assets', 1180, 340),
  ]
  const id = Object.fromEntries(nodes.map((nd) => [nd.data.label, nd.id]))
  const edges = [
    edge(id['Web & Mobile users'], id['CloudFront edge']),
    edge(id['CloudFront edge'], id['Public ALB']),
    edge(id['Public ALB'], id['API Gateway']),
    edge(id['API Gateway'], id['Auth (OIDC)']),
    edge(id['API Gateway'], id['API service']),
    edge(id['API service'], id['Redis cache']),
    edge(id['Redis cache'], id['PostgreSQL']),
    edge(id['API service'], id['Qdrant']),
    edge(id['API service'], id['Claude']),
    edge(id['API service'], id['Kafka']),
    edge(id['API service'], id['S3 assets']),
  ]
  return { nodes, edges }
}
