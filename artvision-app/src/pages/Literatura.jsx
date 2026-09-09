import { useEffect, useRef, useState } from 'react'
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
const SCRIPT_IMPORT_BATCH = 'books.txt-script'

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
      items: Array.isArray(group.items)
        ? group.items.filter((item) => !/^lit-\d+$/.test(item.id))
        : [],
    }))
  } catch {
    return EMPTY_GROUPS
  }
}

function saveStoredGroups(groups) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  } catch (error) {
    console.error('Could not save the literature catalog', error)
  }
}

function mergeImportedBook(groups, entry) {
  let found = false
  const next = groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.titleUrl !== entry.titleUrl) return item
      found = true
      return {
        ...item,
        ...entry,
        id: item.id,
        tags: [...new Set([...(item.tags || []), ...(entry.tags || [])])],
      }
    }),
  }))
  if (found) return next
  return next.map((group) => group.id === 'poesia'
    ? { ...group, items: [entry, ...group.items] }
    : group)
}

function sourceIdForUrl(url) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, '')
    const matches = [
      path.match(/\/books\/(OL\d+M)/i),
      path.match(/\/ebooks\/(\d+)/i),
      path.match(/\/cache\/epub\/(\d+)/i),
      path.match(/\/works\/(\d+)/i),
      path.match(/\/story\/(\d+)/i),
    ]
    const match = matches.find(Boolean)
    return match ? match[1] : parsed.hostname.replace(/^www\./i, '')
  } catch {
    return 'manual'
  }
}

function titleFromUrl(url) {
  try {
    const parsed = new URL(url)
    const slug = parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname
    return decodeURIComponent(slug).replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  } catch {
    return url
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

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function normaliseSummaryText(text) {
  return (text || '')
    .replace(/\s+\(This is an automatically generated summary\.\)/gi, '')
    .replace(/\s+\[.*?\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

        const summaryFromApi = entry.excerpts?.[0]?.excerpt || ''
        const summary = summaryFromApi ? normaliseSummaryText(stripHtml(summaryFromApi)) : ''

        return {
          title: entry.title || '',
          author: entry.authors?.[0]?.name || '',
          summary,
          source: 'OpenLibrary',
          sourceId: id,
          titleUrl: url,
          authorUrl: linkFor(entry.authors?.[0]?.url || ''),
        }
      }

      const html = await fetch(url).then((res) => res.text())
      const summaryMatch = html.match(/<ol-read-more[^>]*class=["'][^"']*book-description[^"']*["'][^>]*>([\s\S]*?)<\/ol-read-more>/i)
      const summary = summaryMatch ? normaliseSummaryText(stripHtml(summaryMatch[1])) : ''
      const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      const authorMatch = html.match(/<meta[^>]*name=["']twitter:data1["'][^>]*content=["']([^"']+)["']/i)

      if (titleMatch || authorMatch || summary) {
        return {
          title: titleMatch ? titleMatch[1].replace(/\s*\|\s*Open Library.*$/i, '').trim() : '',
          author: authorMatch ? authorMatch[1].trim() : '',
          summary,
          source: 'OpenLibrary',
          sourceId: parsed.pathname.split('/').filter(Boolean).slice(-1)[0] || 'manual',
          titleUrl: url,
          authorUrl: '',
        }
      }
    }

    if (host.includes('gutenberg.org')) {
      const html = await fetch(url).then((res) => res.text())
      const bibrecMatch = html.match(/<table[^>]*class=["'][^"']*bibrec[^"']*["'][^>]*id=["']about_book_table["'][^>]*>([\s\S]*?)<\/table>/i)
      const summaryMatch = html.match(/<div[^>]*class=["'][^"']*summary-text-container[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)

      const rows = bibrecMatch ? [...bibrecMatch[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1]) : []
      const titleRow = rows.find((row) => /<th[^>]*>\s*Title\s*<\/th>/i.test(row))
      const authorRow = rows.find((row) => /<th[^>]*>\s*Author\s*<\/th>/i.test(row))

      const title = titleRow ? stripHtml((titleRow.match(/<td[^>]*>([\s\S]*?)<\/td>/i) || [])[1] || '').trim() : ''
      const author = authorRow ? stripHtml((authorRow.match(/<td[^>]*>([\s\S]*?)<\/td>/i) || [])[1] || '').trim() : ''
      const summary = summaryMatch ? normaliseSummaryText(stripHtml(summaryMatch[1])) : ''

      if (title || author || summary) {
        return {
          title,
          author,
          summary,
          source: 'Project Gutenberg',
          sourceId: parsed.pathname.match(/\/ebooks\/(\d+)/i)?.[1] || 'manual',
          titleUrl: url,
          authorUrl: '',
        }
      }
    }

    if (host.includes('wattpad.com')) {
      const html = await fetch(url).then((res) => res.text())
      const titleMatch = html.match(/<h1[^>]*data-testid=["']title["'][^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      const authorMatch = html.match(/<a[^>]*href=["']https?:\/\/www\.wattpad\.com\/user\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/i)
      const summaryMatches = [...html.matchAll(/<div[^>]*class=["'][^"']*typography-paragraph-small[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)]
      const summary = summaryMatches
        .map((match) => normaliseSummaryText(stripHtml(match[1])))
        .filter((text) => text.length > 80 && !/^(Reads|Votes|Parts|Complete|Movie|Print|Fiction|Romance)/i.test(text))
        .sort((a, b) => b.length - a.length)[0] || ''

      const title = titleMatch ? stripHtml(titleMatch[1]).trim() : ''
      const author = authorMatch ? stripHtml(authorMatch[1]).trim() : ''

      return {
        title,
        author,
        summary,
        source: 'Wattpad',
        sourceId: `story-${parsed.pathname.match(/\/story\/(\d+)/i)?.[1] || 'manual'}`,
        titleUrl: url,
        authorUrl: author ? `https://www.wattpad.com/user/${encodeURIComponent(author)}` : '',
      }
    }

    if (host.includes('archiveofourown.org')) {
      const res = await fetch(url, { mode: 'cors' })
      if (!res.ok) return null

      const html = await res.text()
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
      const authorMatch = html.match(/<a[^>]*rel=["']author["'][^>]*href=["'][^"']+["'][^>]*>(.*?)<\/a>/is)
      const summaryMatch = html.match(/<div[^>]*class=["'][^"']*summary\s+module[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
      const title = titleMatch ? titleMatch[1].replace(/\s*\[Archive of Our Own\]\s*$/i, '').trim() : ''
      const parsedTitle = parseArchiveOfOurOwnTitle(title)
      const summary = summaryMatch ? normaliseSummaryText(stripHtml(summaryMatch[1])) : ''
      const author = parsedTitle.author || (authorMatch ? stripHtml(authorMatch[1]).trim() : '') || ''

      return {
        title: parsedTitle.title || '',
        author,
        summary,
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
  const [form, setForm] = useState({ url: '', title: '', author: '', summary: '', source: '', sourceId: '', titleUrl: '', authorUrl: '', shelf: 'poesia' })
  const [fetching, setFetching] = useState(false)
  const handledImport = useRef(false)
  const { active, setActive, query, setQuery, visibleGroups, visibleCount, totalCount, countsByGroup } = useArchiveFilter(groups)

  useEffect(() => {
    saveStoredGroups(groups)
  }, [groups])

  function updateGroups(updater) {
    setGroups((prev) => {
      const next = updater(prev)
      saveStoredGroups(next)
      return next
    })
  }

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${FONTS}&display=swap`
    document.head.appendChild(link)

    const handleBridgeMessage = (event) => {
      const payload = event?.data
      if (!payload || payload.type !== 'artvision-autofill') return
      if (payload.autoSave) {
        if (!payload.url || !payload.title) return
        const parsed = new URL(payload.url)
        const source = payload.source || parsed.hostname.replace(/^www\./i, '')
        const sourceId = payload.sourceId || sourceIdForUrl(payload.url)
        const summary = (payload.summary || '').trim()
        const entry = {
          id: `script-bookmark-${hashId(payload.url)}`,
          title: payload.title || titleFromUrl(payload.url),
          artist: payload.author || source,
          sourceId,
          titleUrl: payload.url,
          authorUrl: payload.authorUrl || '',
          medium: 'bookmark',
          tags: ['bookmark', 'books.txt'],
          license: 'unknown',
          source: `${source} — ${sourceId}`,
          saved: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }),
          summary,
          notes: summary || `Imported from books.txt: ${payload.url}`,
          importBatch: SCRIPT_IMPORT_BATCH,
          capturedAt: new Date().toISOString(),
          metadataComplete: Boolean(payload.title && payload.author && summary),
        }
        updateGroups((prev) => mergeImportedBook(prev, entry))
        setActive('poesia')
        return
      }
      setForm((prev) => ({
        ...prev,
        url: payload.url || prev.url,
        title: payload.title || prev.title,
        author: payload.author || prev.author,
        summary: payload.summary || prev.summary,
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

  useEffect(() => {
    if (handledImport.current) return
    handledImport.current = true

    const params = new URLSearchParams(window.location.search)
    const encodedUrls = params.get('import')
    const removeImported = params.get('removeImported') === '1'

    if (removeImported) {
      updateGroups((prev) => prev.map((group) => ({
        ...group,
        items: group.items.filter((book) => book.importBatch !== SCRIPT_IMPORT_BATCH),
      })))
      return
    }

    if (!encodedUrls) return

    let urls
    try {
      urls = JSON.parse(encodedUrls)
    } catch {
      return
    }

    if (!Array.isArray(urls)) return
    const validUrls = [...new Set(urls.filter((url) => {
      try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    }))]

    Promise.all(validUrls.map(async (url) => {
      const metadata = await fetchMetadataFromUrl(url)
      const parsed = new URL(url)
      const source = metadata?.source || parsed.hostname.replace(/^www\./i, '')
      return {
        id: `script-bookmark-${hashId(url)}`,
        title: metadata?.title || titleFromUrl(url),
        artist: metadata?.author || source,
        sourceId: metadata?.sourceId || sourceIdForUrl(url),
        titleUrl: url,
        authorUrl: metadata?.authorUrl || '',
        medium: 'bookmark',
        tags: ['bookmark', 'books.txt'],
        license: 'unknown',
        source: `${source} — ${metadata?.sourceId || sourceIdForUrl(url)}`,
        saved: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }),
        summary: metadata?.summary || '',
        notes: metadata?.summary || `Imported from books.txt: ${url}`,
        importBatch: SCRIPT_IMPORT_BATCH,
        capturedAt: new Date().toISOString(),
        metadataComplete: Boolean(metadata?.title && metadata?.author && metadata?.summary),
      }
    })).then((entries) => {
      updateGroups((prev) => {
        const existingUrls = new Set(prev.flatMap((group) => group.items.map((item) => item.titleUrl)))
        const freshEntries = entries.filter((entry) => !existingUrls.has(entry.titleUrl))
        if (!freshEntries.length) return prev
        return prev.map((group) => group.id === 'poesia'
          ? { ...group, items: [...freshEntries, ...group.items] }
          : group)
      })
      setActive('poesia')
    })
  }, [setActive])

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
      summary: metadata.summary || prev.summary,
      source: metadata.source || prev.source,
      sourceId: metadata.sourceId || prev.sourceId,
      titleUrl: metadata.titleUrl || prev.titleUrl,
      authorUrl: metadata.authorUrl || prev.authorUrl,
    }))
  }

  function summaryTextFromRecord(entry) {
    if (entry?.summary && entry.summary.trim()) return entry.summary.trim()
    return `Saved from ${entry?.source || 'source'} for later reference.`
  }

  function handleSubmit(event) {
    event.preventDefault()

    const title = form.title.trim()
    const author = form.author.trim() || form.source.trim() || 'Unknown author'
    const source = form.source.trim() || 'Manual bookmark'
    const shelfId = form.shelf || 'poesia'
    const shelf = groups.find((group) => group.id === shelfId) || groups[0]

    if (!title || !form.url.trim()) return

    const summary = (form.summary || '').trim() || summaryTextFromRecord({ source, summary: '' })

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
      notes: summary,
    }

    updateGroups((prev) => prev.map((group) => group.id === shelfId ? { ...group, items: [newEntry, ...group.items] } : group))
    setForm({ url: '', title: '', author: '', summary: '', source: '', sourceId: '', titleUrl: '', authorUrl: '', shelf: shelfId })
    setActive(shelfId)
  }

  function removeBook(bookId) {
    updateGroups((prev) => prev.map((group) => ({
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
                Summary
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                  placeholder="Auto-filled from source summary; edit if needed"
                  rows={3}
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
