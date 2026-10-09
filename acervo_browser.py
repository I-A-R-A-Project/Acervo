"""
Acervo Browser - A PyQt6-based web browser for Acervo project.
Combines web browsing with metadata capture functionality.
"""

import json
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from typing import Optional, Callable
from urllib.parse import unquote, urlencode, urlsplit

from PyQt6.QtCore import QUrl
from PyQt6.QtGui import QAction
from PyQt6.QtWidgets import QApplication, QMainWindow, QTabWidget, QVBoxLayout, QWidget

# Add repository root to path for imports
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
ACERVO_ROOT = Path(__file__).resolve().parent
if str(ACERVO_ROOT) not in sys.path:
    sys.path.insert(0, str(ACERVO_ROOT))

from web_common.nav.navbar import BasicNavbar, address_to_url, bind_navigation, save_web_page
from web_common.nav.navigation import active_tab, open_plus_tab
from web_common.storage.history import HistoryDialog, HistoryStore
from web_common.browser.tabs import (
    add_plus_tab,
    configure_tab_widget,
    create_profiled_web_view,
    prepare_tab_widget,
)
from web_common.browser.web_profiles import build_web_profile
from home_page import render_home_page

PROFILE_DIR = Path.home() / ".acervo_browser"
ARTS_PORT = 8765
SCIENCE_PORT = 8766
LOCAL_PAGES_PORT = 8767


class SectionRequestHandler(SimpleHTTPRequestHandler):
    """Serve local sections and send client-side routes back to their SPA."""

    def translate_path(self, path):
        translated = Path(super().translate_path(path)).resolve()
        root = Path(self.directory).resolve()
        try:
            translated.relative_to(root)
        except ValueError:
            return str(root / "__not_found__")
        if translated.exists() or Path(urlsplit(path).path).suffix:
            return str(translated)
        return str(root / "index.html")


class LocalSectionServer:
    def __init__(self, directory: Path, port: int):
        if not (directory / "index.html").is_file():
            raise FileNotFoundError(f"No se encontró el index.html de la sección: {directory}")
        handler = partial(SectionRequestHandler, directory=str(directory))
        self.server = ThreadingHTTPServer(("127.0.0.1", port), handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}/"
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def stop(self):
        self.server.shutdown()
        self.server.server_close()


class LocalPagesRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, routes, **kwargs):
        self.routes = routes
        super().__init__(*args, **kwargs)

    def translate_path(self, path):
        route = unquote(urlsplit(path).path)
        return self.routes.get(route, str(ACERVO_ROOT / "__not_found__"))


class LocalPagesServer:
    def __init__(self, port: int):
        routes = {
            "/bandeja/bandeja.html": str(ACERVO_ROOT / "bandeja" / "bandeja.html"),
            "/social/social.html": str(ACERVO_ROOT / "social" / "social.html"),
            "/spam.html": str(ACERVO_ROOT / "spam.html"),
        }
        handler = partial(LocalPagesRequestHandler, routes=routes)
        self.server = ThreadingHTTPServer(("127.0.0.1", port), handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}/"
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def stop(self):
        self.server.shutdown()
        self.server.server_close()


class AcervoBrowser(QMainWindow):
    """Main browser window for Acervo with metadata capture capabilities."""

    def __init__(
        self,
        initial_url: Optional[str] = None,
        profile_name: str = "acervo",
        initial_urls: Optional[list[str]] = None,
        test_batch: bool = False,
        remove_test_imports: bool = False,
    ):
        super().__init__()
        
        self.setWindowTitle("Acervo Browser")
        self.resize(1200, 800)

        self.section_servers = [
            LocalSectionServer(ACERVO_ROOT / "salas-arte" / "dist", ARTS_PORT),
            LocalSectionServer(ACERVO_ROOT / "salas-ciencia" / "dist", SCIENCE_PORT),
        ]
        self.pages_server = LocalPagesServer(LOCAL_PAGES_PORT)
        self.test_batch = test_batch
        self.source_queue = []
        self.source_tab = None
        self.arts_url, self.science_url = (
            server.url for server in self.section_servers
        )
        self.local_url = self.pages_server.url

        # Setup storage
        PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        storage_path = PROFILE_DIR / "storage"
        cache_path = PROFILE_DIR / "cache"
        downloads_path = PROFILE_DIR / "downloads"

        # Build web profile
        self.profile = build_web_profile(
            name=profile_name,
            parent=self,
            storage_path=storage_path,
            cache_path=cache_path,
            download_path=downloads_path,
        )

        # Setup history
        history_db = PROFILE_DIR / "history.db"
        self.history = HistoryStore(history_db)
        self.history_session_id = self.history.new_session_id()

        # Create tabs widget
        self.tabs = QTabWidget(self)
        prepare_tab_widget(self.tabs)
        self.plus_widget = add_plus_tab(self.tabs)
        configure_tab_widget(
            self.tabs,
            close_tab=self.close_tab,
            plus_widget=self.plus_widget,
            current_changed=self._on_tab_changed,
            tab_bar_clicked=lambda index: open_plus_tab(
                self.tabs, index, self.plus_widget, self.new_blank_tab
            ),
        )

        # Create navbar
        self.navbar = BasicNavbar(self)
        bind_navigation(
            self.navbar,
            self.current_view,
            address_handler=self.navigate_to_address,
            history_handler=self.show_history,
            save_handler=lambda: save_web_page(self.current_view()),
        )

        # Add "Save from tab" action
        self.capture_action = QAction("Save from tab", self)
        self.capture_action.setToolTip("Capture the current page metadata")
        self.capture_action.triggered.connect(self.capture_current_tab)
        self.navbar.addAction(self.capture_action)

        # Setup initial tab
        if remove_test_imports:
            self.new_tab(
                f"{self.arts_url}literatura?removeImported=1",
                title="Remove test imports",
            )
        else:
            urls = initial_urls or ([initial_url] if initial_url else [])
            if urls:
                self.source_queue = list(urls[1:])
                self.source_tab = self.new_tab(urls[0], title="Source 1")
            else:
                self.new_tab(title="Inicio")

        # Layout
        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.navbar)
        layout.addWidget(self.tabs)
        self.setCentralWidget(container)

    def current_view(self) -> Optional:
        """Get the current web view."""
        return active_tab(self.tabs, self.plus_widget)

    def new_tab(self, url: Optional[str] = None, title: str = "Nueva pestaña") -> Optional:
        """Create a new tab."""
        view = create_profiled_web_view(self.profile, self, url)
        page = view.page()
        page.profile().setHttpCacheType(page.profile().HttpCacheType.DiskHttpCache)
        
        plus_index = self.tabs.indexOf(self.plus_widget)
        index = self.tabs.insertTab(plus_index, view, title)
        self.tabs.setCurrentIndex(index)
        
        # Connect signals
        view.urlChanged.connect(lambda qurl, current=view: self._sync_address(current, qurl))
        view.loadFinished.connect(lambda ok, current=view: self._record_history(current, ok))
        view.titleChanged.connect(lambda title_text, current=view: self._sync_title(current, title_text))
        if url is None:
            view.setHtml(
                render_home_page(
                    arts_url=self.arts_url,
                    science_url=self.science_url,
                    tray_url=f"{self.local_url}bandeja/bandeja.html",
                    social_url=f"{self.local_url}social/social.html",
                    spam_url=f"{self.local_url}spam.html",
                ),
                QUrl("about:blank"),
            )
        
        return view

    def new_blank_tab(self):
        """Create a new blank tab."""
        self.new_tab(title="Inicio")

    def close_tab(self, index: int):
        """Close a tab by index."""
        widget = self.tabs.widget(index)
        if widget is None or widget is self.plus_widget:
            return
        self.tabs.removeTab(index)
        widget.deleteLater()
        if self.tabs.count() == 1:
            self.new_blank_tab()

    def _record_history(self, view, ok: bool):
        """Record visited URLs in history."""
        url = view.url()
        if not ok or url.isEmpty() or url.toString() == "about:blank":
            return
        self.history.add_history(
            url.toString(),
            view.title() or url.toString(),
            self.history_session_id,
        )

    def _sync_address(self, view, url):
        """Sync address bar with current view's URL."""
        if self.current_view() is view:
            value = url.toString()
            self.navbar.address_bar.setText("" if value == "about:blank" else value)

    def _sync_title(self, view, title_text: str):
        """Sync tab title with page title."""
        index = self.tabs.indexOf(view)
        if index >= 0:
            self.tabs.setTabText(index, title_text[:30] or "New tab")

    def _on_tab_changed(self, index: int):
        """Handle tab change."""
        view = self.current_view()
        if view:
            url = view.url().toString()
            self.navbar.address_bar.setText("" if url == "about:blank" else url)

    def navigate_to_address(self, text: str):
        """Navigate to an address entered in the address bar."""
        url = address_to_url(text)
        if url is not None:
            view = self.current_view()
            if view:
                view.setUrl(url)

    def show_history(self):
        """Show history dialog."""
        dialog = HistoryDialog(
            self.history,
            on_open=lambda url: self.new_tab(url, title="From History"),
        )
        dialog.exec()

    def capture_current_tab(self):
        """Capture metadata from the current tab."""
        view = self.current_view()
        if view is None:
            return
        self.capture_view(
            view,
            callback=lambda metadata: self._save_capture_to_literature(metadata, view),
        )

    def _save_capture_to_literature(self, metadata, source_view):
        """Send captured metadata to Literature in the shared browser profile."""
        source_url = metadata.get("url", "")
        try:
            is_web_url = urlsplit(source_url).scheme.lower() in {"http", "https"}
        except ValueError:
            is_web_url = False
        if not is_web_url:
            print("No se guardó: la pestaña actual no tiene una URL http(s) válida.")
            return

        params = {"capture": json.dumps(metadata, ensure_ascii=False)}
        if self.test_batch:
            params["testImport"] = "1"
        url = f"{self.arts_url}literatura?{urlencode(params)}"
        self.new_tab(url, title="Saved to Literature")
        if self.source_queue and self.tabs.indexOf(source_view) >= 0:
            next_url = self.source_queue.pop(0)
            source_view.setUrl(QUrl(next_url))
            print(f"Captura guardada; cargando siguiente fuente ({len(self.source_queue)} en cola).")

    def capture_view(self, view, callback: Optional[Callable] = None):
        """Extract metadata from a web page."""
        if view is None:
            return

        script = r'''
        (() => {
          const cleanText = (value) => String(value || '').replace(/\s+/g, ' ').replace(/\u00A0/g, ' ').trim();
          const stripHtml = (value) => cleanText(String(value || '').replace(/<[^>]+>/g, ' '));

          const extractGutenberg = () => {
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

          const extractWattpad = () => {
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

          const extractAO3 = () => {
            const authorNode = document.querySelector('a[rel="author"]');
            const summaryNode = document.querySelector('div.summary.module blockquote.userstuff p');
            return {
              title: cleanText(document.querySelector('h2.title.heading')?.textContent || ''),
              author: cleanText(authorNode?.textContent || ''),
              authorUrl: authorNode?.href || '',
              summary: cleanText(stripHtml(summaryNode?.innerHTML || '')),
            };
          };

          const extractOpenLibrary = () => {
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
              const result = extractGutenberg();
              const idMatch = parsedUrl.pathname.match(/\/ebooks\/(\d+)|\/cache\/epub\/(\d+)/i);
              return { ...result, source: host, sourceId: idMatch?.[1] || idMatch?.[2] || host, url: base };
            }
            if (host.includes('wattpad.com')) {
              const result = extractWattpad();
              return { ...result, source: host, sourceId: parsedUrl.pathname.match(/\/story\/(\d+)/i)?.[1] || host, url: base };
            }
            if (host.includes('archiveofourown.org')) {
              const result = extractAO3();
              return { ...result, source: host, sourceId: parsedUrl.pathname.match(/\/works\/(\d+)/i)?.[1] || host, url: base };
            }
            if (host.includes('openlibrary.org')) {
              const result = extractOpenLibrary();
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
        '''

        def _on_result(result):
            if not result:
                return
            
            metadata = {
                "title": result.get("title") or "",
                "author": result.get("author") or "",
                "authorUrl": result.get("authorUrl") or "",
                "source": result.get("source") or "",
                "sourceId": result.get("sourceId") or "",
                "url": result.get("url") or "",
                "summary": result.get("summary") or "",
            }
            
            if callback:
                callback(metadata)
            else:
                # Default action: print metadata
                print("Captured Metadata:")
                print(json.dumps(metadata, indent=2, ensure_ascii=False))

        view.page().runJavaScript(script, _on_result)

    def closeEvent(self, event):
        """Clean up on close."""
        for server in self.section_servers:
            server.stop()
        self.pages_server.stop()
        super().closeEvent(event)


def main():
    """Main entry point."""
    import argparse
    
    app = QApplication(sys.argv)
    app.setApplicationName("Acervo Browser")
    
    parser = argparse.ArgumentParser(description="Acervo Browser - Web browser with metadata capture")
    parser.add_argument(
        "--url",
        action="append",
        help="URL to test; may be repeated and loaded sequentially after each capture",
    )
    parser.add_argument("--profile", default="acervo", help="Profile name for storage")
    parser.add_argument(
        "--test-batch",
        action="store_true",
        help="Mark items saved with 'Save from tab' so the test cleanup script can remove them",
    )
    parser.add_argument(
        "--remove-test-imports",
        action="store_true",
        help="Open Literature and remove only items imported by the source-test scripts",
    )
    args = parser.parse_args()
    
    browser = AcervoBrowser(
        profile_name=args.profile,
        initial_urls=args.url,
        test_batch=args.test_batch,
        remove_test_imports=args.remove_test_imports,
    )
    browser.show()
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
