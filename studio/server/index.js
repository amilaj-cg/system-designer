import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join } from 'node:path'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'data', 'designs')
const DIST = join(ROOT, 'dist')
const PORT = process.env.PORT || 8787

const app = express()
app.use(express.json({ limit: '8mb' }))

await mkdir(DATA_DIR, { recursive: true })

const slug = (s) =>
  (s || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'design'

// List saved designs.
app.get('/api/designs', async (_req, res) => {
  try {
    const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json'))
    const items = await Promise.all(
      files.map(async (f) => {
        const raw = JSON.parse(await readFile(join(DATA_DIR, f), 'utf8'))
        return { id: f.replace(/\.json$/, ''), name: raw.name, savedAt: raw.savedAt, nodes: raw.nodes?.length ?? 0 }
      }),
    )
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// Fetch one design.
app.get('/api/designs/:id', async (req, res) => {
  try {
    const raw = await readFile(join(DATA_DIR, `${slug(req.params.id)}.json`), 'utf8')
    res.type('application/json').send(raw)
  } catch {
    res.status(404).json({ error: 'Not found' })
  }
})

// Save / overwrite a design.
app.put('/api/designs/:id', async (req, res) => {
  try {
    const body = { ...req.body, savedAt: new Date().toISOString() }
    if (body.app !== 'system-designer-studio') return res.status(400).json({ error: 'Invalid design file' })
    await writeFile(join(DATA_DIR, `${slug(req.params.id)}.json`), JSON.stringify(body, null, 2))
    res.json({ ok: true, id: slug(req.params.id) })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// Serve the built SPA (after `npm run build`).
// Hashed assets are immutable and cache forever; the HTML shell must always be
// revalidated so a new build's asset hashes are picked up (avoids stale-cache).
app.use(
  express.static(DIST, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      } else if (filePath.includes(`${join('/', 'assets')}/`) || /\.[0-9a-f]{8,}\.[a-z]+$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    },
  }),
)

// SPA fallback — ONLY for navigation requests. A request that looks like a file
// (has an extension, e.g. a missing /assets/*.js) must 404 rather than receive
// index.html, otherwise the browser rejects HTML served as a JS module (MIME error).
app.get('*', (req, res, next) => {
  if (extname(req.path)) {
    res.status(404).type('txt').send('Not found')
    return
  }
  next()
}, (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(join(DIST, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`System Designer Studio server → http://localhost:${PORT}`)
})
