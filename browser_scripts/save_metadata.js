(() => {
  const cleanText = (value) => String(value || '').replace(/\s+/g, ' ').replace(/\u00A0/g, ' ').trim();
  const stripHtml = (value) => cleanText(String(value || '').replace(/<[^>]+>/g, ' '));

  const saveGutenberg = () => {
    const table = document.querySelector('table.bibrec#about_book_table');
    if (!table) {
      return {
        title: cleanText(document.querySelector('h1')?.textContent || document.title)
          .replace(/\s*[|—-]\s*Project Gutenberg.*$/i, ''),
        author: cleanText(document.querySelector('[itemprop="author"]')?.textContent || ''),
        summary: cleanText(document.querySelector('meta[name="description"]')?.content || ''),
      };
    }

    const rows = [...table.querySelectorAll('tr')];
    const titleRow = rows.find((row) => /^\s*Title\s*$/i.test(row.querySelector('th')?.textContent || ''));
    const authorRow = rows.find((row) => /^\s*Author\s*$/i.test(row.querySelector('th')?.textContent || ''));
    const title = cleanText(stripHtml(titleRow?.querySelector('td')?.innerHTML || ''));
    const author = cleanText(stripHtml(authorRow?.querySelector('td')?.innerHTML || ''));
    const summaryNode = document.querySelector('div.summary-text-container');
    return {
      title,
      author,
      authorUrl: authorRow?.querySelector('a')?.href || '',
      summary: summaryNode ? cleanText(stripHtml(summaryNode.innerHTML)) : '',
    };
  };

  const saveWattpad = () => {
    const titleNode = document.querySelector('h1[data-testid="title"]') || document.querySelector('h1');
    const authorNode = document.querySelector('a[href*="/user/"]');
    const summaryNodes = [...document.querySelectorAll('div.typography-paragraph-small')];
    const summary = summaryNodes
      .map((node) => cleanText(stripHtml(node.innerHTML)))
      .find((text) => text.length > 80 && !/^(Reads|Votes|Parts|Complete|Movie|Print|Fiction|Romance|Tags)/i.test(text)) || '';

    return {
      title: cleanText(titleNode?.textContent || ''),
      author: cleanText(authorNode?.textContent || ''),
      authorUrl: authorNode?.href || '',
      summary,
    };
  };

  const saveAO3 = () => {
    const authorNode = document.querySelector('a[rel="author"]');
    const summaryNode = document.querySelector('div.summary.module blockquote.userstuff p');
    return {
      title: cleanText(document.querySelector('h2.title.heading')?.textContent || ''),
      author: cleanText(authorNode?.textContent || ''),
      authorUrl: authorNode?.href || '',
      summary: cleanText(stripHtml(summaryNode?.innerHTML || '')),
    };
  };

  const saveOpenLibrary = () => {
    const summaryNode = document.querySelector('ol-read-more.book-description p');
    return {
      title: cleanText(
        document.querySelector('h1.work-title[itemprop="name"]')?.textContent
        || document.querySelector('h1')?.textContent
        || document.title.replace(/\s*[|—-]\s*Open Library.*$/i, ''),
      ),
      author: cleanText(
        document.querySelector('a[href*="/authors/"]')?.textContent
        || document.querySelector('[itemprop="author"]')?.textContent
        || '',
      ),
      authorUrl: document.querySelector('a[href*="/authors/"]')?.href || '',
      summary: cleanText(
        stripHtml(summaryNode?.innerHTML || '')
        || document.querySelector('meta[name="description"]')?.content
        || '',
      ),
    };
  };

  try {
    const base = document.baseURI || window.location.href;
    const parsedUrl = new URL(base);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host.includes('gutenberg.org')) {
      const result = saveGutenberg();
      const idMatch = parsedUrl.pathname.match(/\/ebooks\/(\d+)|\/cache\/epub\/(\d+)/i);
      return { ...result, source: host, sourceId: idMatch?.[1] || idMatch?.[2] || host, url: base };
    }
    if (host.includes('wattpad.com')) {
      const result = saveWattpad();
      return { ...result, source: host, sourceId: parsedUrl.pathname.match(/\/story\/(\d+)/i)?.[1] || host, url: base };
    }
    if (host.includes('archiveofourown.org')) {
      const result = saveAO3();
      return { ...result, source: host, sourceId: parsedUrl.pathname.match(/\/works\/(\d+)/i)?.[1] || host, url: base };
    }
    if (host.includes('openlibrary.org')) {
      const result = saveOpenLibrary();
      return { ...result, source: host, sourceId: parsedUrl.pathname.match(/\/books\/(OL\d+M)/i)?.[1] || host, url: base };
    }

    const description = document.querySelector('meta[name="description"]')?.content || '';
    const author = document.querySelector('meta[name="author"]')?.content
      || document.querySelector('[rel="author"]')?.textContent
      || '';
    const authorLink = document.querySelector('a[rel="author"]')?.href || '';
    const title = document.querySelector('meta[property="og:title"]')?.content
      || document.querySelector('h1')?.textContent
      || document.title;
    return {
      title: cleanText(title),
      author: cleanText(author),
      authorUrl: authorLink,
      source: host,
      sourceId: host,
      url: base,
      summary: cleanText(description),
    };
  } catch (error) {
    return { title: '', author: '', source: '', sourceId: '', url: String(window.location.href || ''), summary: '' };
  }
})();
