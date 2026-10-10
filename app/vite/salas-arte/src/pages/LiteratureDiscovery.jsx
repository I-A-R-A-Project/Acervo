import { useCallback, useEffect, useState } from 'react'

export const FEEDS = [
  {
    id: 'ao3',
    source: 'Archive of Our Own',
    label: 'AO3 news',
    format: 'RSS',
    url: 'https://archiveofourown.org/admin_posts.rss',
    api: '/api/feeds/ao3',
  },
  {
    id: 'standard-ebooks-atom',
    source: 'Standard Ebooks',
    label: 'New releases',
    format: 'RSS / Atom',
    url: 'https://standardebooks.org/feeds/atom/new-releases',
    api: '/api/feeds/standard-ebooks/atom',
  },
  {
    id: 'standard-ebooks-blog',
    source: 'Standard Ebooks',
    label: 'Standard Ebooks blog',
    format: 'RSS / Atom',
    url: 'https://standardebooks.org/feeds/atom/blog',
    api: '/api/feeds/standard-ebooks/blog',
  },
  {
    id: 'standard-ebooks-opds',
    source: 'Standard Ebooks',
    label: 'OPDS catalog · Patrons Circle',
    format: 'OPDS 2.0 · access required',
    url: 'https://standardebooks.org/feeds/opds',
    api: '/api/feeds/standard-ebooks/opds',
  },
  {
    id: 'gutenberg-rss',
    source: 'Project Gutenberg',
    label: 'New and updated ebooks',
    format: 'RSS',
    url: 'https://www.gutenberg.org/cache/epub/feeds/today.rss',
    api: '/api/feeds/gutenberg/rss',
  },
  {
    id: 'gutenberg-opds',
    source: 'Project Gutenberg',
    label: 'OPDS catalog',
    format: 'OPDS',
    url: 'https://www.gutenberg.org/ebooks/search.opds/',
    api: '/api/feeds/gutenberg/opds',
  },
]

const SOURCES = [
  {
    name: 'Standard Ebooks',
    description: 'Public new-release feeds; full feeds require Patrons Circle access.',
    links: [
      { label: 'Browse ebooks', href: 'https://standardebooks.org/ebooks' },
      { label: 'Bulk downloads', href: 'https://standardebooks.org/bulk-downloads', action: 'download' },
      { label: 'Help', href: 'https://standardebooks.org/help' },
      { label: 'Blog', href: 'https://standardebooks.org/blog' },
      { label: 'Feeds and access details', href: 'https://standardebooks.org/feeds' },
      { label: 'OPDS catalog · Patrons Circle', href: 'https://standardebooks.org/feeds/opds', action: 'feed' },
      { label: 'Donate', href: 'https://standardebooks.org/donate', action: 'donate' },
    ],
  },
  {
    name: 'Archive of Our Own',
    description: 'Fanworks and news from the AO3 team.',
    links: [
      { label: 'AO3 news', href: 'https://archiveofourown.org/admin_posts' },
      { label: 'Donate to AO3', href: 'https://archiveofourown.org/donate', action: 'donate' },
    ],
  },
  {
    name: 'Open Library',
    description: 'Developer information for the Open Library catalog.',
    links: [
      { label: 'Developer Center', href: 'https://openlibrary.org/developers' },
      {
        label: 'Support Open Library',
        href: 'https://archive.org/donate/?platform=ol&origin=olwww-TopNavDonateButton',
        action: 'donate',
      },
    ],
  },
  {
    name: 'Project Gutenberg',
    description: 'A public-domain library with RSS feeds and an OPDS catalog.',
    links: [
      { label: 'Browse ebooks', href: 'https://www.gutenberg.org/ebooks/' },
      { label: 'Offline catalogs and RSS / OPDS feeds', href: 'https://www.gutenberg.org/ebooks/offline_catalogs.html', action: 'feed' },
      { label: 'Donate', href: 'https://www.gutenberg.org/donate/', action: 'donate' },
      { label: 'Linking policy', href: 'https://www.gutenberg.org/policy/linking.html' },
      { label: 'Robot access policy', href: 'https://www.gutenberg.org/policy/robot_access.html' },
    ],
  },
]

function cleanFeedText(value) {
  if (!value) return ''
  return new DOMParser().parseFromString(value, 'text/html').body.textContent.trim()
}

function localName(element) {
  return element.localName || element.nodeName.split(':').pop()
}

function childrenNamed(element, name) {
  return [...element.children].filter((child) => localName(child) === name)
}

function descendantText(element, name) {
  return [...element.getElementsByTagName('*')]
    .find((child) => localName(child) === name)
    ?.textContent?.trim() || ''
}

function safeLink(value, baseUrl = 'https://www.gutenberg.org') {
  if (!value) return ''
  try {
    const url = new URL(value, baseUrl)
    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function parseXmlFeed(xml, baseUrl) {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  if (document.querySelector('parsererror')) {
    throw new Error('The feed response could not be parsed as XML.')
  }

  const entries = [...document.getElementsByTagName('*')]
    .filter((element) => ['item', 'entry'].includes(localName(element)))

  return entries.map((entry) => {
    const title = descendantText(entry, 'title')
    const links = childrenNamed(entry, 'link')
    const preferredLink = links.find((link) => link.getAttribute('rel') === 'alternate')
      || links.find((link) => link.getAttribute('rel') === 'subsection')
      || links.find((link) => !link.getAttribute('rel') || link.getAttribute('rel') === 'related')
      || links[0]
    const link = safeLink(preferredLink?.getAttribute('href') || preferredLink?.textContent?.trim(), baseUrl)
      || safeLink(descendantText(entry, 'id'), baseUrl)
      || safeLink(descendantText(entry, 'guid'), baseUrl)
    const description = descendantText(entry, 'description')
      || descendantText(entry, 'summary')
      || descendantText(entry, 'content')
    const author = descendantText(entry, 'name') || descendantText(entry, 'author')
    const date = descendantText(entry, 'pubDate')
      || descendantText(entry, 'published')
      || descendantText(entry, 'updated')
    const downloads = links
      .filter((linkNode) => linkNode.getAttribute('rel') === 'enclosure'
        || linkNode.getAttribute('rel')?.includes('acquisition'))
      .map((linkNode) => ({
        label: linkNode.getAttribute('title') || 'Download',
        href: safeLink(linkNode.getAttribute('href'), baseUrl),
      }))
      .filter((download) => download.href)

    return title && link
      ? { title, link, description: cleanFeedText(description), author, date, downloads }
      : null
  }).filter(Boolean)
}

function parseOpdsJson(json, baseUrl) {
  const catalog = JSON.parse(json)
  const publications = [...(catalog.publications || []), ...(catalog.books || [])]
  const navigation = catalog.navigation || []

  return [...publications, ...navigation].map((entry) => {
    const title = entry.metadata?.title || entry.title || ''
    const link = safeLink(entry.links?.find((item) => item.rel === 'alternate')?.href
      || entry.links?.find((item) => item.rel === 'subsection')?.href
      || entry.links?.[0]?.href
      || entry.url, baseUrl)
    const authors = entry.metadata?.author || entry.authors || []
    const author = (Array.isArray(authors) ? authors : [authors])
      .map((item) => typeof item === 'string' ? item : item?.name || '')
      .filter(Boolean)
      .join(', ')
    const description = entry.metadata?.description || entry.summary || entry.content || ''
    const date = entry.metadata?.modified || entry.metadata?.published || entry.updated || ''
    const downloads = (entry.links || [])
      .filter((item) => item.rel?.includes('acquisition'))
      .map((item) => ({ label: item.title || 'Download', href: safeLink(item.href, baseUrl) }))
      .filter((item) => item.href)

    return title && link
      ? { title, link, description: cleanFeedText(description), author, date, downloads }
      : null
  }).filter(Boolean)
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function FeedPosts({ activeFeed }) {
  const [posts, setPosts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const loadFeed = useCallback(async (signal) => {
    setStatus('loading')
    setError('')

    try {
      const response = await fetch(activeFeed.api, { signal })
      if (!response.ok) {
        if (response.status === 401 && activeFeed.id === 'standard-ebooks-opds') {
          throw new Error('The full Standard Ebooks OPDS catalog requires Patrons Circle access. Open the original catalog to authenticate in your reader.')
        }
        throw new Error(`${activeFeed.source} returned HTTP ${response.status}.`)
      }
      const body = await response.text()
      const baseUrl = new URL(activeFeed.url)
      const entries = activeFeed.id === 'standard-ebooks-opds' && response.headers.get('content-type')?.includes('json')
        ? parseOpdsJson(body, baseUrl)
        : parseXmlFeed(body, baseUrl)
      setPosts(entries.map((post) => ({ ...post, source: activeFeed.source })))
      setStatus('ready')
    } catch (cause) {
      if (cause.name === 'AbortError') return
      setError(cause.message || 'The feed could not be loaded.')
      setStatus('error')
    }
  }, [activeFeed])

  useEffect(() => {
    const controller = new AbortController()
    loadFeed(controller.signal)
    return () => controller.abort()
  }, [loadFeed, refreshKey])

  return (
    <section className="literature-posts" aria-labelledby="literature-posts-title">
      <div className="literature-section-heading">
        <div>
          <span className="literature-eyebrow">{activeFeed.format}</span>
          <h1 id="literature-posts-title">{activeFeed.label}</h1>
          <p>{activeFeed.source} · <a href={activeFeed.url} target="_blank" rel="noreferrer">Open original feed</a></p>
        </div>
        <button
          className="literature-refresh"
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {status === 'loading' && <p className="literature-feed-message" role="status">Loading the feed…</p>}
      {status === 'error' && <p className="literature-feed-message is-error" role="alert">{error}</p>}
      {status === 'ready' && posts.length === 0 && (
        <p className="literature-feed-message">There are no items in this feed right now.</p>
      )}
      {posts.length > 0 && (
        <div className="literature-post-list">
          {posts.map((post) => (
            <article className="literature-post-card" key={`${post.link}-${post.title}`}>
              <h2><a href={post.link} target="_blank" rel="noreferrer">{post.title}</a></h2>
              {(post.author || post.date) && (
                <p className="literature-post-meta">
                  {post.author && <span>{post.author}</span>}
                  {post.author && post.date && <span aria-hidden="true"> · </span>}
                  {post.date && <time>{formatDate(post.date)}</time>}
                </p>
              )}
              {post.description && <p className="literature-post-description">{post.description}</p>}
              {post.downloads.length > 0 && (
                <div className="literature-post-downloads">
                  {post.downloads.map((download) => (
                    <a href={download.href} key={download.href} target="_blank" rel="noreferrer">{download.label}</a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function LiteratureDiscoverySidebar({ activeFeedId, onSelectFeed }) {
  const sources = SOURCES.map((source) => ({
    ...source,
    feeds: FEEDS.filter((feed) => feed.source === source.name),
  }))

  return (
    <section className="discovery-source-section">
      <h1>Libraries and communities</h1>
      {sources.map((source) => (
        <section className="discovery-source" key={source.name}>
          <h2>{source.name}</h2>
          {source.feeds.map((feed) => (
            <button
              className="discovery-feed-link"
              type="button"
              key={feed.id}
              aria-current={activeFeedId === feed.id ? 'page' : undefined}
              onClick={() => onSelectFeed(feed.id)}
            >
              <span>{feed.label}</span>
              <span>{feed.format}</span>
            </button>
          ))}
          <p>{source.description}</p>
          <div className="discovery-source-links">
            {source.links.map((link) => (
              <a
                className={link.action ? `is-${link.action}` : ''}
                href={link.href}
                key={link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      ))}
    </section>
  )
}

export default function LiteratureDiscovery({ activeFeedId }) {
  const activeFeed = FEEDS.find((feed) => feed.id === activeFeedId) || FEEDS[0]
  return (
    <div className="discovery-feed">
      <FeedPosts activeFeed={activeFeed} />
    </div>
  )
}
