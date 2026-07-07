import type { ComponentDef, ComponentPack } from '../types'
import type { IconProps } from '../themes/types'

function Svg({ size = 26, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  )
}

const VmIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 20h8M12 17v3" />
    <rect x="6.5" y="7.5" width="4" height="3" rx="0.5" />
    <path d="M13 8h4M13 11h4" />
  </Svg>
)

const ClusterIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="14" y="3.5" width="7" height="7" rx="1.2" />
    <rect x="3" y="13.5" width="7" height="7" rx="1.2" />
    <rect x="14" y="13.5" width="7" height="7" rx="1.2" />
  </Svg>
)

const BoundaryIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="3 3" />
    <path d="M9 9h6v6H9z" />
  </Svg>
)

/**
 * Containers/boundaries — nodes that visually wrap other components. They carry
 * no traffic themselves; drop components inside to model "runs on this VM",
 * "inside this cluster", or "within this trust/network boundary".
 */
const components: ComponentDef[] = [
  {
    type: 'container.vm',
    label: 'VM / Host',
    category: 'Containers',
    group: 'Layout',
    accent: '#7f8db5',
    blurb: 'A virtual machine or host. Drop components inside to show they run on it.',
    icon: VmIcon,
    isContainer: true,
    defaultSize: { width: 320, height: 220 },
    fields: [
      { key: 'cpuCount', label: 'vCPUs', type: 'number', unit: 'cores', min: 1, step: 1 },
      { key: 'memoryGB', label: 'Memory', type: 'number', unit: 'GB', min: 1, step: 1 },
      { key: 'storageGB', label: 'Storage', type: 'number', unit: 'GB', min: 0, step: 10 },
      { key: 'hosts', label: 'Host count', type: 'number', unit: '×', min: 1, step: 1 },
      { key: 'os', label: 'OS', type: 'select', options: ['Linux', 'Windows', 'Container OS'] },
    ],
    defaults: { cpuCount: 8, memoryGB: 32, storageGB: 200, hosts: 1, os: 'Linux' },
    capacity: null,
    monthlyCost: (c) => Math.round((c.cpuCount * 12 + c.memoryGB * 4 + c.storageGB * 0.1) * c.hosts),
  },
  {
    type: 'container.cluster',
    label: 'Cluster / Node pool',
    category: 'Containers',
    group: 'Layout',
    accent: '#6f7fb0',
    blurb: 'A Kubernetes/compute cluster. Group the workloads scheduled onto it.',
    icon: ClusterIcon,
    isContainer: true,
    defaultSize: { width: 380, height: 260 },
    fields: [
      { key: 'orchestrator', label: 'Orchestrator', type: 'select', options: ['Kubernetes', 'ECS', 'Nomad', 'Swarm'] },
      { key: 'nodes', label: 'Nodes', type: 'number', unit: '×', min: 1, step: 1 },
      { key: 'vcpuPerNode', label: 'vCPU / node', type: 'number', unit: 'cores', min: 1, step: 1 },
      { key: 'memPerNodeGB', label: 'Memory / node', type: 'number', unit: 'GB', min: 1, step: 1 },
    ],
    defaults: { orchestrator: 'Kubernetes', nodes: 3, vcpuPerNode: 8, memPerNodeGB: 32 },
    capacity: null,
    monthlyCost: (c) => Math.round((c.vcpuPerNode * 12 + c.memPerNodeGB * 4) * c.nodes),
  },
  {
    type: 'container.boundary',
    label: 'Boundary / Zone',
    category: 'Containers',
    group: 'Layout',
    accent: '#8a7fb0',
    blurb: 'A logical boundary — VPC, subnet, namespace, region, or trust zone.',
    icon: BoundaryIcon,
    isContainer: true,
    defaultSize: { width: 420, height: 300 },
    fields: [
      { key: 'kind', label: 'Kind', type: 'select', options: ['VPC', 'Subnet', 'Namespace', 'Region', 'Trust boundary', 'Availability zone'] },
      { key: 'zone', label: 'Zone / region', type: 'text' },
    ],
    defaults: { kind: 'VPC', zone: 'primary' },
    capacity: null,
  },
]

export const containersPack: ComponentPack = {
  id: 'containers',
  name: 'Layout',
  description: 'Containers and boundaries to group components.',
  components,
}
