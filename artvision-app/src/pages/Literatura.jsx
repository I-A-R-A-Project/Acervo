import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Literatura.css'

const FONTS = 'Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500&family=Courier+Prime:wght@400;700'

const SPINE_COLORS = ['forest', 'burgundy', 'navy', 'mustard', 'plum']
const COLOR_VARS = { forest: 'var(--forest)', burgundy: 'var(--burgundy)', navy: 'var(--navy)', mustard: 'var(--mustard)', plum: 'var(--plum)' }

const STORAGE_KEY = 'artvision-literatura-groups'

const EMPTY_GROUPS = [
  { id: 'poesia', label: 'Poetry', items: [] },
  { id: 'novela', label: 'Novel', items: [] },
  { id: 'ensayo', label: 'Essay', items: [] },
  { id: 'teatro', label: 'Theater', items: [] },
]

function loadStoredGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_GROUPS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return EMPTY_GROUPS
    return parsed.map((group) => ({
      ...group,
      items: group.items.filter((item) => !/^lit-\d+$/.test(item.id)),
    }))
  } catch {
    return EMPTY_GROUPS
  }
}

function sourceIdForUrl(url) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, '')
    const matches = [
      path.match(/\/books\/(OL\d+M)/i),
      path.match(/\/ebooks\/(\d+)/i),
      path.match(/\/works\/(\d+)/i),
      path.match(/\/story\/(\d+)/i),
    ]
    const match = matches.find(Boolean)
    return match ? match[1] : parsed.hostname.replace(/^www\./i, '')
  } catch {
    return 'manual'
  }
}

function linkFor(value, fallback = '') {
  if (!value) return fallback
  return value.startsWith('http') ? value : `https://${value}`
}

function bookStyle(book) {
  const h = hashId(book.id)
  const width = 40 + (h % 5) * 6
  const height = 168 + ((h >> 3) % 6) * 8
  const color = SPINE_COLORS[h % SPINE_COLORS.length]
  return { width, height, color }
}

function callNumberFor(book) {
  const shelfCode = book.groupLabel.slice(0, 3).toUpperCase()
  const num = (hashId(book.id) % 900) + 100
  return `LIT/${shelfCode} ${num}.${book.id.slice(-2)}`
}

function parseArchiveOfOurOwnTitle(rawTitle) {
  if (!rawTitle) return { title: '', author: '' }

  const cleaned = rawTitle
    .replace(/\s*\[?Archive of Our Own\]?\s*$/i, '')
    .replace(/\s*[-–—]\s*$/g, '')
    .trim()

  const parts = cleaned.split(' - ').map((part) => part.trim()).filter(Boolean)
  if (parts.length === 0) return { title: '', author: '' }

  if (parts.length >= 4 && /^(chapter|part|episode|scene)\b/i.test(parts[1])) {
    return { title: parts[0], author: parts[2] || '' }
  }

  if (parts.length >= 2) {
    const second = parts[1]
    const looksLikeFandom = /^(fandom|author|archive of our own|work)$/i.test(second)
    return {
      title: parts[0],
      author: looksLikeFandom ? parts[2] || '' : second,
    }
  }

  return { title: cleaned, author: '' }
}

async function fetchMetadataFromUrl(url) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()

    if (host.includes('openlibrary.org')) {
      const match = parsed.pathname.match(/\/books\/(OL\d+M)\//i)
      if (match) {
        const id = match[1]
        const res = await fetch(`https://openlibrary.org/api/books?bibkeys=OLID:${id}&jscmd=data&format=json`)
        if (!res.ok) return null
        const data = await res.json()
        const entry = data[`OLID:${id}`]
        if (!entry) return null
        return {
          title: entry.title || '',
          author: entry.authors?.[0]?.name || '',
          source: 'OpenLibrary',
          sourceId: id,
          titleUrl: url,
          authorUrl: linkFor(entry.authors?.[0]?.url || ''),
        }
      }
    }

    if (host.includes('gutenberg.org')) {
      const match = parsed.pathname.match(/\/ebooks\/(\d+)/i)
      if (match) {
        const id = match[1]
        const res = await fetch(`https://gutendex.com/books/${id}`)
        if (!res.ok) return null
        const data = await res.json()
        return {
          title: data.title || '',
          author: data.authors?.[0]?.name || '',
          source: 'Project Gutenberg',
          sourceId: `ebook-${id}`,
          titleUrl: url,
          authorUrl: data.authors?.[0]?.url || '',
        }
      }
    }

    if (host.includes('wattpad.com')) {
      const titleFromPath = decodeURIComponent(parsed.pathname.replace(/^\/+|\/+$/g, '')).replace(/^story\/[0-9]+-?/i, '').replace(/-/g, ' ')
      if (titleFromPath) {
        const parts = titleFromPath.split('/').filter(Boolean)
        const author = parts.length > 1 ? parts[0] : ''
        const title = parts.length > 1 ? parts[1] : parts[0]
        return {
          title: title.trim(),
          author: author.trim(),
          source: 'Wattpad',
          sourceId: `story-${parsed.pathname.match(/\/story\/(\d+)/i)?.[1] || 'manual'}`,
          titleUrl: url,
          authorUrl: author ? `https://www.wattpad.com/user/${encodeURIComponent(author)}` : '',
        }
      }
    }

    if (host.includes('archiveofourown.org')) {
      const res = await fetch(url, { mode: 'cors' })
      if (!res.ok) {
        return null
      }

      const html = await res.text()
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
      const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i)
      const title = titleMatch ? titleMatch[1].replace(/\s*\[Archive of Our Own\]\s*$/i, '').trim() : ''
      const parsedTitle = parseArchiveOfOurOwnTitle(title)
      return {
        title: parsedTitle.title || '',
        author: parsedTitle.author || (authorMatch ? authorMatch[1].trim() : '') || '',
        source: 'Archive of Our Own',
        sourceId: `work-${parsed.pathname.match(/\/works\/(\d+)/i)?.[1] || 'manual'}`,
        titleUrl: url,
        authorUrl: '',
      }
    }
  } catch (error) {
    console.warn('Metadata fetch failed', error)
  }

  return null
}

export default function Literatura() {
  const [groups, setGroups] = useState(() => loadStoredGroups())
  const [form, setForm] = useState({ url: '', title: '', author: '', source: '', sourceId: '', titleUrl: '', authorUrl: '', shelf: 'poesia' })
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }, [groups])

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${FONTS}&display=swap`
    document.head.appendChild(link)

    const handleBridgeMessage = (event) => {
      const payload = event?.data
      if (!payload || payload.type !== 'artvision-autofill') return
      setForm((prev) => ({
        ...prev,
        url: payload.url || prev.url,
        title: payload.title || prev.title,
        author: payload.author || prev.author,
        authorUrl: payload.authorUrl || prev.authorUrl,
        source: payload.source || prev.source,
        sourceId: payload.sourceId || prev.sourceId,
        titleUrl: payload.url || prev.titleUrl,
      }))
    }

    window.addEventListener('message', handleBridgeMessage)
    return () => {
      document.head.removeChild(link)
      window.removeEventListener('message', handleBridgeMessage)
    }
  }, [])

  const { active, setActive, query, setQuery, visibleGroups, visibleCount, totalCount, countsByGroup } = useArchiveFilter(groups)
  const [selected, setSelected] = useState(null)
  const open = !!selected

  function selectBook(book, groupLabel) {
    setSelected({ ...book, groupLabel })
  }

  async function handleUrlBlur(event) {
    const value = event.target.value.trim()
    if (!value) return

    setFetching(true)
    const metadata = await fetchMetadataFromUrl(value)
    setFetching(false)

    if (!metadata) return

    setForm((prev) => ({
      ...prev,
      url: value,
      title: metadata.title || prev.title,
      author: metadata.author || prev.author,
      source: metadata.source || prev.source,
      sourceId: metadata.sourceId || prev.sourceId,
      titleUrl: metadata.titleUrl || prev.titleUrl,
      authorUrl: metadata.authorUrl || prev.authorUrl,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const title = form.title.trim()
    const author = form.author.trim() || form.source.trim() || 'Unknown author'
    const source = form.source.trim() || 'Manual bookmark'
    const shelfId = form.shelf || 'poesia'
    const shelf = groups.find((group) => group.id === shelfId) || groups[0]

    if (!title || !form.url.trim()) return

    const newEntry = {
      id: `bookmark-${Date.now()}`,
      title,
      artist: author,
      sourceId: form.sourceId || sourceIdForUrl(form.url.trim()),
      titleUrl: form.titleUrl || form.url.trim(),
      authorUrl: form.authorUrl || '',
      medium: 'bookmark',
      tags: ['bookmark', shelf.label.toLowerCase()],
      license: 'user-saved',
      source: `${source} — ${form.sourceId || sourceIdForUrl(form.url.trim())}`,
      saved: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }),
      notes: `Saved from ${source} for later reference and cross-posting.`,
    }

    setGroups((prev) => prev.map((group) => group.id === shelfId ? { ...group, items: [newEntry, ...group.items] } : group))
    setForm({ url: '', title: '', author: '', source: '', sourceId: '', titleUrl: '', authorUrl: '', shelf: shelfId })
    setActive(shelfId)
  }

  function removeBook(bookId) {
    setGroups((prev) => prev.map((group) => ({
      ...group,
      items: group.items.filter((book) => book.id !== bookId),
    })))
    setSelected(null)
  }

  return (
    <div className="page-literatura">
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <Link className="back" to="/">← ArtVision</Link>
            <span className="mark">Literatura</span>
            <span className="room-title">— la sala de lectura</span>
          </div>
          <div className="search" role="search">
            <input
              type="text"
              placeholder="Search by title, author, or tag…"
              aria-label="Search the catalog"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="topbar-meta">{totalCount} volúmenes catalogados</div>
        </header>

        <aside className="sidebar">
          <h2>Estantes</h2>
          <ShelfList groups={groups} allLabel="Todos los estantes" active={active} onSelect={setActive} counts={countsByGroup} />

          <div className="bookmark-form-wrap">
            <h3>Add bookmark</h3>
            <form className="bookmark-form" onSubmit={handleSubmit}>
              <label>
                Source URL
                <input
                  type="url"
                  value={form.url}
                  onBlur={handleUrlBlur}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://openlibrary.org/books/..."
                  required
                />
              </label>
              <label>
                Title
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Auto-filled from URL"
                  required
                />
              </label>
              <label>
                Author
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="Auto-filled from URL"
                />
              </label>
              <label>
                Source / Platform
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value }))}
                  placeholder="OpenLibrary, Gutenberg, Wattpad..."
                  required
                />
              </label>
              <label>
                Shelf
                <select value={form.shelf} onChange={(e) => setForm((prev) => ({ ...prev, shelf: e.target.value }))}>
                  <option value="poesia">Poetry</option>
                  <option value="novela">Novel</option>
                  <option value="ensayo">Essay</option>
                  <option value="teatro">Theater</option>
                </select>
              </label>
              <button type="submit" disabled={fetching}>{fetching ? 'Loading…' : 'Save bookmark'}</button>
            </form>
          </div>

          <div className="card-index">
            Each spine is a saved piece.<br />
            Click a spine to open its <b>catalog card</b> — author, medium, license, and notes.
          </div>
        </aside>

        <main className="main">
          <div className="main-heading">
            <div>
              <h1>Literature shelf</h1>
              <p>Text references saved from blogs, magazines, and personal publications.</p>
            </div>
            <div className="result-count">{visibleCount} in view</div>
          </div>

          {visibleGroups.map((group, gi) => (
            <div className="shelf-unit" key={group.id}>
              <div className="shelf-unit-label">{group.label} · {group.items.length}</div>
              <div className="shelf-row">
                {group.items.map((book, i) => {
                  const st = bookStyle(book)
                  return (
                    <button
                      key={book.id}
                      className="book"
                      style={{ '--w': `${st.width}px`, '--h': `${st.height}px`, '--spine': COLOR_VARS[st.color], '--i': gi * 3 + i }}
                      aria-pressed={selected?.id === book.id}
                      title={`${book.title} — ${book.artist}`}
                      onClick={() => selectBook(book, group.label)}
                    >
                      <span className="spine-cap" />
                      <span className="spine-band top" />
                      <span className="spine-title">{book.title}</span>
                      <span className="spine-band bottom" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {visibleCount === 0 && <div className="empty-state">There are no volumes in this shelf yet.</div>}
        </main>
      </div>

      <DetailDrawer open={open} onClose={() => setSelected(null)} className="">
        {selected && (
          <article className="catalog-card">
            <button className="card-close" data-autofocus onClick={() => setSelected(null)} aria-label="Close card">✕</button>
            <span className="guide-tab" style={{ background: COLOR_VARS[bookStyle(selected).color] }}>{selected.groupLabel}</span>
            <div className="call-number">{callNumberFor(selected)}</div>
            <h3>
              {selected.titleUrl ? <a href={selected.titleUrl} target="_blank" rel="noreferrer">{selected.title}</a> : selected.title}
            </h3>
            <p className="by">by {selected.authorUrl ? <a href={selected.authorUrl} target="_blank" rel="noreferrer">{selected.artist}</a> : selected.artist}</p>
            <div className="field-row"><span className="k">Medium</span><span className="v">{selected.medium}</span></div>
            <div className="field-row"><span className="k">Category</span><span className="v">Literature — {selected.groupLabel}</span></div>
            <div className="field-row"><span className="k">License</span><span className="v">{selected.license}</span></div>
            <div className="field-row"><span className="k">Source / ID</span><span className="v">{selected.source}</span></div>
            <div className="field-row"><span className="k">Saved</span><span className="v">{selected.saved}</span></div>
            <div className="field-row"><span className="k">Tags</span><span className="v"><span className="tag-row">{selected.tags.map(t => <span className="tag" key={t}>{t}</span>)}</span></span></div>
            <div className="notes-block">{selected.notes || 'No notes yet. Add context for future publishing.'}</div>
            <span className="stamp">{selected.license === 'public domain' ? 'Public domain' : selected.license === 'unknown' ? 'License unconfirmed' : 'Saved reference'}</span>
            <div className="card-actions">
              <button className="btn-danger" onClick={() => removeBook(selected.id)}>Delete bookmark</button>
            </div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
