import { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))

function sectionRouteFallback() {
  const install = (server) => {
    server.middlewares.use((request, _response, next) => {
      if (!request.url) return next()

      const queryIndex = request.url.indexOf('?')
      const pathname = queryIndex < 0 ? request.url : request.url.slice(0, queryIndex)
      const query = queryIndex < 0 ? '' : request.url.slice(queryIndex)
      const section = ['/salas-arte', '/salas-ciencia'].find(
        (prefix) =>
          (pathname === prefix || pathname.startsWith(`${prefix}/`)) &&
          extname(pathname) === '',
      )

      if (section) request.url = `${section}/index.html${query}`
      next()
    })
  }

  return {
    name: 'acervo-section-route-fallback',
    configureServer: install,
    configurePreviewServer: install,
  }
}

export default defineConfig({
  plugins: [react(), sectionRouteFallback()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        arte: resolve(root, 'salas-arte/index.html'),
        ciencia: resolve(root, 'salas-ciencia/index.html'),
        bandeja: resolve(root, 'bandeja/bandeja.html'),
        social: resolve(root, 'social/social.html'),
        spam: resolve(root, 'spam.html'),
      },
    },
  },
})
