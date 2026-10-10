import { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))
const literatureFeedProxies = {
  '/api/feeds/ao3': {
    target: 'https://archiveofourown.org',
    rewrite: () => '/admin_posts.rss',
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  },
  '/api/feeds/standard-ebooks/atom': {
    target: 'https://standardebooks.org',
    rewrite: () => '/feeds/atom/new-releases',
    headers: { Accept: 'application/atom+xml, application/xml' },
  },
  '/api/feeds/standard-ebooks/blog': {
    target: 'https://standardebooks.org',
    rewrite: () => '/feeds/atom/blog',
    headers: { Accept: 'application/atom+xml, application/xml' },
  },
  '/api/feeds/standard-ebooks/opds': {
    target: 'https://standardebooks.org',
    rewrite: () => '/feeds/opds',
    headers: { Accept: 'application/opds+json' },
  },
  '/api/feeds/gutenberg/rss': {
    target: 'https://www.gutenberg.org',
    rewrite: () => '/cache/epub/feeds/today.rss',
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  },
  '/api/feeds/gutenberg/opds': {
    target: 'https://www.gutenberg.org',
    rewrite: () => '/ebooks/search.opds/',
    headers: { Accept: 'application/atom+xml;profile=opds-catalog, application/atom+xml, application/xml' },
  },
}

for (const proxy of Object.values(literatureFeedProxies)) {
  proxy.changeOrigin = true
  proxy.headers['User-Agent'] = 'Acervo Literature RSS reader'
}

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
  server: {
    proxy: literatureFeedProxies,
  },
  preview: {
    proxy: literatureFeedProxies,
  },
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
