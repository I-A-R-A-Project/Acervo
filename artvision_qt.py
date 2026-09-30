import json
import os
import sys
import threading
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from PyQt6.QtCore import QTimer, QUrl, Qt
from PyQt6.QtGui import QAction
from PyQt6.QtWidgets import QApplication, QMainWindow, QTabBar, QTabWidget, QVBoxLayout, QWidget

# The wrapper is commonly launched as ``python ArtVision\artvision_qt.py``.
# Add the repository root so shared browser utilities remain importable.
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from web_common.nav.navbar import BasicNavbar, address_to_url, bind_navigation, save_web_page
from web_common.storage.history import HistoryDialog, HistoryStore
from web_common.browser.tabs import create_profiled_web_view
from web_common.browser.web_profiles import build_web_profile

ARTVISION_ROOT = Path(__file__).resolve().parent
ARTVISION_APP_ROOT = ARTVISION_ROOT / "artvision-app"
ARTVISION_DIST = ARTVISION_APP_ROOT / "dist"
PROFILE_DIR = Path.home() / ".artvision_qt"
ARTVISION_PORT = 8765


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        super().__init__(*args, directory=str(directory), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        rel_path = parsed.path.strip("/")
        root_dir = Path(self.directory)
        candidate = (root_dir / rel_path).resolve()

        if parsed.path in ("", "/"):
            self.path = "/index.html"
        elif not (candidate.is_file() and candidate.is_relative_to(root_dir)):
            self.path = "/index.html"

        super().do_GET()


class ArtVisionHttpServer:
    def __init__(self, directory: Path):
        self.directory = directory
        self.server = None
        self.thread = None

    def start(self):
        if self.server is not None:
            return

        # localStorage is scoped by origin, so the port must stay stable between launches.
        self.server = ThreadingHTTPServer(("127.0.0.1", ARTVISION_PORT), lambda *args, **kwargs: SpaHandler(*args, directory=self.directory, **kwargs))
        port = self.server.server_address[1]
        self.url = f"http://127.0.0.1:{port}/"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def stop(self):
        if self.server is not None:
            self.server.shutdown()
            self.server.server_close()
            self.server = None


class ArtVisionWindow(QMainWindow):
    def __init__(self, initial_path="/literatura", initial_urls=None, max_source_tabs=2):
        super().__init__()
        self.setWindowTitle("Salas de Arte")
        self.resize(1280, 820)
        self.max_source_tabs = max_source_tabs
        self.pending_source_urls = list(initial_urls or [])
        self.active_source_tabs = set()

        PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        self.history = HistoryStore(str(PROFILE_DIR / "history.db"))
        self.history_session_id = self.history.new_session_id()
        self.profile = build_web_profile(
            "ArtVisionProfile",
            self,
            str(PROFILE_DIR / "storage"),
            str(PROFILE_DIR / "cache"),
        )

        self.server = ArtVisionHttpServer(ARTVISION_DIST if ARTVISION_DIST.exists() else ARTVISION_APP_ROOT)
        self.server.start()

        self.tabs = QTabWidget()
        self.tabs.setTabsClosable(True)
        self.tabs.tabCloseRequested.connect(self.close_tab)
        self.tabs.currentChanged.connect(self._update_app_tab_controls)

        self.navbar = BasicNavbar(self)
        bind_navigation(
            self.navbar,
            self.current_view,
            address_handler=self.navigate_to_address,
            history_handler=self.show_history,
            save_handler=lambda: save_web_page(self.current_view()),
        )

        self.add_tab_action = QAction("+", self)
        self.add_tab_action.setToolTip("New tab")
        self.add_tab_action.triggered.connect(self.new_blank_tab)
        self.navbar.addAction(self.add_tab_action)

        self.capture_action = QAction("Save from tab", self)
        self.capture_action.setToolTip("Capture the current page metadata and send it to the catalog")
        self.capture_action.triggered.connect(self.capture_current_tab)
        self.navbar.addAction(self.capture_action)

        self.artvision_app_tab = self.new_tab(self.server.url, title="Salas de Arte")
        self.artvision_app_tab.setProperty("artvision_app", True)
        self.artvision_app_tab.setUrl(QUrl(f"{self.server.url}{initial_path.lstrip('/')}"))
        self.tabs.tabBar().setTabButton(
            self.tabs.indexOf(self.artvision_app_tab),
            QTabBar.ButtonPosition.RightSide,
            None,
        )
        self.tabs.setCurrentWidget(self.artvision_app_tab)
        self._open_next_source_tabs()

        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.navbar)
        layout.addWidget(self.tabs)
        self.setCentralWidget(container)

        self._was_opened = False
        self._update_app_tab_controls(self.tabs.currentIndex())

    def closeEvent(self, event):
        self.server.stop()
        super().closeEvent(event)

    def current_view(self):
        widget = self.tabs.currentWidget()
        return widget if widget is not None else None

    def new_tab(self, url, title="New tab"):
        view = create_profiled_web_view(self.profile, self, url)
        page = view.page()
        page.profile().setHttpCacheType(page.profile().HttpCacheType.DiskHttpCache)
        index = self.tabs.addTab(view, title)
        self.tabs.setCurrentIndex(index)
        view.urlChanged.connect(lambda qurl, current=view: self._sync_address(current, qurl))
        view.loadFinished.connect(
            lambda ok, current=view: self._record_history(current, ok)
        )
        view.titleChanged.connect(lambda title_text, current=view: self._sync_title(current, title_text))
        return view

    def _record_history(self, view, ok):
        url = view.url()
        if not ok or url.isEmpty() or url.toString().startswith(self.server.url):
            return
        self.history.add_history(
            url.toString(),
            view.title() or url.toString(),
            self.history_session_id,
        )

    def show_history(self):
        dialog = HistoryDialog(
            self.history,
            on_open=lambda url: self.new_tab(url, title="Historial"),
        )
        dialog.exec()

    def new_blank_tab(self):
        self.new_tab("https://example.com", title="New tab")

    def open_source_tab(self, url):
        view = self.new_tab(url, title="Cargando...")
        self.active_source_tabs.add(view)
        host = QUrl(url).host().lower()
        wait_ms = 30000 if "archiveofourown.org" in host else 8000
        view.loadFinished.connect(
            lambda ok, current=view, delay=wait_ms: self._capture_after_delay(current, ok, delay),
            type=Qt.ConnectionType.SingleShotConnection,
        )
        return view

    def _open_next_source_tabs(self):
        while self.pending_source_urls and len(self.active_source_tabs) < self.max_source_tabs:
            self.open_source_tab(self.pending_source_urls.pop(0))

    def _capture_after_delay(self, view, ok, delay):
        if not ok:
            self.close_view_tab(view)
            return
        QTimer.singleShot(delay, lambda: self.capture_view(view, auto_save=True))

    def close_tab(self, index):
        if index == self.tabs.indexOf(self.artvision_app_tab) or self.tabs.count() <= 1:
            return
        widget = self.tabs.widget(index)
        self.tabs.removeTab(index)
        widget.deleteLater()
        self.active_source_tabs.discard(widget)
        self._open_next_source_tabs()

    def close_view_tab(self, view):
        self.active_source_tabs.discard(view)
        index = self.tabs.indexOf(view)
        if index >= 0:
            self.close_tab(index)
        self._open_next_source_tabs()

    def navigate_to_address(self, text):
        if self.current_view() is self.artvision_app_tab:
            return
        url = address_to_url(text)
        if url is not None:
            self.current_view().setUrl(url)

    def _sync_address(self, view, url):
        if self.current_view() is view:
            self.navbar.address_bar.setText(url.toString())

    def _update_app_tab_controls(self, index):
        app_tab = getattr(self, "artvision_app_tab", None)
        is_app = app_tab is not None and self.tabs.widget(index) is app_tab
        self.navbar.address_bar.setEnabled(not is_app)
        if is_app:
            self.navbar.address_bar.setText(f"{self.server.url}literatura")

    def _sync_title(self, view, title_text):
        index = self.tabs.indexOf(view)
        if index >= 0:
            self.tabs.setTabText(index, title_text[:30] or "Nueva pestaña")


    def capture_current_tab(self):
        view = self.current_view()
        if view is None or view is self.artvision_app_tab:
            return
        self.capture_view(view)

    def capture_view(self, view, auto_save=False):
        if view is None or view is self.artvision_app_tab:
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

            return { title: '', author: '', source: host, sourceId: host, url: base, summary: '' };
          } catch (error) {
            return { title: '', author: '', source: '', sourceId: '', url: String(window.location.href || ''), summary: '' };
          }
        })();
        '''

        def _on_result(result):
            if not result:
                if auto_save:
                    self.close_view_tab(view)
                return
            payload = {
                "type": "artvision-autofill",
                "title": result.get("title") or "",
                "author": result.get("author") or "",
                "authorUrl": result.get("authorUrl") or "",
                "source": result.get("source") or "",
                "sourceId": result.get("sourceId") or "",
                "url": result.get("url") or "",
                "summary": result.get("summary") or "",
                "autoSave": auto_save,
            }
            if auto_save and not payload["title"]:
                self.close_view_tab(view)
                return
            target_url = QUrl(f"{self.server.url.rstrip('/')}/literatura")
            def _dispatch_autofill():
                payload_json = json.dumps(payload)
                js = (
                    "(() => {"
                    "  const targetPath = '/literatura';"
                    "  const currentPath = new URL(window.location.href).pathname || '/';"
                    "  if (currentPath !== targetPath) {"
                    "    window.history.pushState({}, '', targetPath);"
                    "    window.dispatchEvent(new PopStateEvent('popstate'));"
                    "  }"
                    "  const send = () => window.dispatchEvent(new MessageEvent('message', { data: " + payload_json + " }));"
                    "  if (document.readyState === 'loading') {"
                    "    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(send), { once: true });"
                    "  } else {"
                    "    requestAnimationFrame(() => requestAnimationFrame(send));"
                    "  }"
                    "})();"
                )
                self.artvision_app_tab.page().runJavaScript(js)
                if auto_save:
                    QTimer.singleShot(0, lambda: self.close_view_tab(view))

            self.tabs.setCurrentWidget(self.artvision_app_tab)
            if self.artvision_app_tab.url().toString() != target_url.toString():
                self.artvision_app_tab.loadFinished.connect(
                    lambda _ok: _dispatch_autofill(),
                    type=Qt.ConnectionType.SingleShotConnection,
                )
                self.artvision_app_tab.setUrl(target_url)
            else:
                QTimer.singleShot(250, _dispatch_autofill)

        view.page().runJavaScript(script, _on_result)


if __name__ == "__main__":
    import sys

    app = QApplication(sys.argv)
    app.setApplicationName("Salas de Arte")
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", default="/literatura", help="Ruta inicial de Salas de Arte")
    parser.add_argument("--url", action="append", default=[], help="URL externa para abrir en una pestaña")
    parser.add_argument(
        "--max-source-tabs",
        type=int,
        choices=(1, 2),
        default=2,
        help="Cantidad máxima de páginas externas cargando a la vez",
    )
    args = parser.parse_args()

    window = ArtVisionWindow(
        initial_path=args.path,
        initial_urls=args.url,
        max_source_tabs=args.max_source_tabs,
    )
    window.show()
    sys.exit(app.exec())
