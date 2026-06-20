import type { IconProps, IconTheme } from './types'

/**
 * Generic, vendor-neutral line icons. Each draws with `currentColor` so the
 * node chrome can tint it. Community themes (AWS, Azure, GCP, OCI...) register
 * their own packs and override any subset of these — see themes/index.ts.
 */

function Svg({ size = 28, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

const Client = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path d="M8 20h8M12 16v4" />
  </Svg>
)

const Cdn = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17" />
  </Svg>
)

const Lb = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="5" r="2.2" />
    <circle cx="5" cy="19" r="2.2" />
    <circle cx="12" cy="19" r="2.2" />
    <circle cx="19" cy="19" r="2.2" />
    <path d="M12 7.2v3.3M12 10.5 5 16.8M12 10.5v6.3M12 10.5l7 6.3" />
  </Svg>
)

const ApiGateway = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3v18M18 3v18" />
    <path d="M6 8h12M6 16h12" />
    <path d="M9.5 12h5M13 10.5 14.5 12 13 13.5" />
  </Svg>
)

const Idp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
    <path d="M9.5 12.5 11 14l3.5-3.5" />
  </Svg>
)

const Server = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="3.5" width="16" height="7" rx="1.3" />
    <rect x="4" y="13.5" width="16" height="7" rx="1.3" />
    <path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" />
  </Svg>
)

const Cache = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6c0-1.4 3.6-2.5 8-2.5s8 1.1 8 2.5-3.6 2.5-8 2.5S4 7.4 4 6Z" />
    <path d="M4 6v12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V6" />
    <path d="M9 11.5 11 13l4-4" />
  </Svg>
)

const Queue = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="9" width="4" height="6" rx="0.8" />
    <rect x="10" y="9" width="4" height="6" rx="0.8" />
    <rect x="17" y="9" width="4" height="6" rx="0.8" />
    <path d="M7 12h3M14 12h3" />
  </Svg>
)

const Db = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
    <path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13" />
    <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
  </Svg>
)

const VectorDb = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
    <path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13" />
    <path d="M9 13.5 12 11l3 2.5M12 11v5" />
  </Svg>
)

const Llm = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.5A3 3 0 0 0 6 18a3 3 0 0 0 3 2V4Z" />
    <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.5A3 3 0 0 1 18 18a3 3 0 0 1-3 2V4Z" />
    <path d="M9 4h6M9 12h6" />
  </Svg>
)

const ObjectStore = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m12 3 8 4.5L12 12 4 7.5M12 12v9" />
  </Svg>
)

export const defaultTheme: IconTheme = {
  id: 'generic',
  name: 'Generic (line)',
  vendor: 'Generic',
  description: 'Vendor-neutral line icons. The fallback for every component.',
  icons: {
    client: Client,
    cdn: Cdn,
    lb: Lb,
    apiGateway: ApiGateway,
    idp: Idp,
    server: Server,
    cache: Cache,
    queue: Queue,
    db: Db,
    vectorDb: VectorDb,
    llm: Llm,
    objectStore: ObjectStore,
  },
}
