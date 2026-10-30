import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

function jsonDatabasePlugin(): Plugin {
  const dbDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'data')
  const dbFile = path.join(dbDir, 'banco.json')

  const handleMiddleware = (req: any, res: any, next: any) => {
    const url = req.url?.split('?')[0]
    if (url === '/api/banco') {
      if (req.method === 'GET') {
        try {
          if (!fs.existsSync(dbFile)) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'File not found' }))
            return
          }
          const content = fs.readFileSync(dbFile, 'utf-8')
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.statusCode = 200
          res.end(content)
          return
        } catch (err: any) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err?.message || 'Error reading database' }))
          return
        }
      }

      if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: any) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            if (!fs.existsSync(dbDir)) {
              fs.mkdirSync(dbDir, { recursive: true })
            }
            fs.writeFileSync(dbFile, JSON.stringify(parsed, null, 2), 'utf-8')
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.statusCode = 200
            res.end(JSON.stringify({ success: true }))
          } catch (err: any) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err?.message || 'Invalid JSON' }))
          }
        })
        return
      }
    }
    next()
  }

  return {
    name: 'json-database-plugin',
    configureServer(server) {
      server.watcher.unwatch(dbDir)
      server.watcher.unwatch(dbFile)
      server.middlewares.use(handleMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleMiddleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/data/**', '**/data/banco.json'],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    jsonDatabasePlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})


