import json
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from PyQt6.QtCore import QTimer, QUrl
from PyQt6.QtGui import QAction
from PyQt6.QtWebEngineCore import QWebEnginePage
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWidgets import QApplication, QMainWindow, QTabWidget, QVBoxLayout, QWidget

# The wrapper is commonly launched as ``python ArtVision\artvision_qt.py``.
# Add the repository root so shared browser utilities remain importable.
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from web_common.navbar import BasicNavbar, address_to_url, save_web_page
from web_common.web_profiles import build_web_profile

ARTVISION_ROOT = Path(__file__).resolve().parent
ARTVISION_APP_ROOT = ARTVISION_ROOT / "artvision-app"
ARTVISION_DIST = ARTVISION_APP_ROOT / "dist"
PROFILE_DIR = Path.home() / ".artvision_qt"


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

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), lambda *args, **kwargs: SpaHandler(*args, directory=self.directory, **kwargs))
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
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ArtVision")
        self.resize(1280, 820)

        PROFILE_DIR.mkdir(parents=True, exist_ok=True)
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

        self.navbar = BasicNavbar(self)
        self.navbar.on_back = lambda: self.current_view().back()
        self.navbar.on_forward = lambda: self.current_view().forward()
        self.navbar.on_reload = lambda: self.current_view().reload()
        self.navbar.on_stop = lambda: self.current_view().stop()
        self.navbar.on_address_bar_enter = self.navigate_to_address
        self.navbar.on_save_page = lambda: save_web_page(self.current_view())

        self.add_tab_action = QAction("+", self)
        self.add_tab_action.setToolTip("New tab")
        self.add_tab_action.triggered.connect(self.new_blank_tab)
        self.navbar.addAction(self.add_tab_action)

        self.capture_action = QAction("Save from tab", self)
        self.capture_action.setToolTip("Capture the current page metadata and send it to the catalog")
        self.capture_action.triggered.connect(self.capture_current_tab)
        self.navbar.addAction(self.capture_action)

        self.artvision_app_tab = self.new_tab(self.server.url, title="ArtVision")
        self.tabs.setCurrentWidget(self.artvision_app_tab)

        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.navbar)
        layout.addWidget(self.tabs)
        self.setCentralWidget(container)

        self._was_opened = False

    def closeEvent(self, event):
        self.server.stop()
        super().closeEvent(event)

    def current_view(self):
        widget = self.tabs.currentWidget()
        return widget if widget is not None else None

    def new_tab(self, url, title="New tab"):
        view = QWebEngineView(self)
        page = QWebEnginePage(self.profile, view)
        view.setPage(page)
        page.profile().setHttpCacheType(page.profile().HttpCacheType.DiskHttpCache)
        index = self.tabs.addTab(view, title)
        self.tabs.setCurrentIndex(index)
        view.urlChanged.connect(lambda qurl, current=view: self._sync_address(current, qurl))
        view.titleChanged.connect(lambda title_text, current=view: self._sync_title(current, title_text))
        if isinstance(url, str):
            view.setUrl(QUrl(url))
        else:
            view.setUrl(url)
        return view

    def new_blank_tab(self):
        self.new_tab("https://example.com", title="New tab")

    def close_tab(self, index):
        if self.tabs.count() <= 1:
            return
        widget = self.tabs.widget(index)
        self.tabs.removeTab(index)
        widget.deleteLater()

    def navigate_to_address(self, text):
        url = address_to_url(text)
        if url is not None:
            self.current_view().setUrl(url)

    def _sync_address(self, view, url):
        if self.current_view() is view:
            self.navbar.address_bar.setText(url.toString())

    def _sync_title(self, view, title_text):
        index = self.tabs.indexOf(view)
        if index >= 0:
            self.tabs.setTabText(index, title_text[:30] or "Nueva pestaña")

    def capture_current_tab(self):
        view = self.current_view()
        if view is None or view is self.artvision_app_tab:
            return

        script = r'''
        (() => {
          try {
            const base = document.baseURI || window.location.href;
            const parsedUrl = new URL(base);
            const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();
            const titleNode = document.querySelector('meta[property="og:title"], meta[name="twitter:title"], meta[name="citation_title"]');
            let title = titleNode?.content || document.title || document.querySelector('h1')?.innerText || 'Untitled';
            let author = document.querySelector('meta[name="author"], meta[property="article:author"], meta[name="twitter:creator"]')?.content ||
              document.querySelector('[rel="author"]')?.textContent ||
              document.querySelector('a[rel~="author"]')?.textContent ||
              document.querySelector('meta[name="byl"]')?.content ||
              '';
            let authorUrl = document.querySelector('meta[name="author"], meta[property="article:author"]')?.content || '';
            const authorLink = document.querySelector('a[rel~="author"], a.author, a[href*="/authors/"], a[href*="/author/"], a[href*="/user/"], a[href*="/users/"]');
            if (authorLink) {
              author = author || authorLink.textContent;
              authorUrl = authorLink.href;
            }
            if (host === 'openlibrary.org' || host === 'www.openlibrary.org') {
              const link = document.querySelector('a[href*="/authors/"]');
              if (link) { author = link.textContent; authorUrl = link.href; }
            }
            if (host === 'gutenberg.org' || host === 'www.gutenberg.org') {
              const link = document.querySelector('a[href*="/ebooks/author/"]');
              if (link) { author = link.textContent; authorUrl = link.href; }
            }
            const rawTitle = String(title).trim();
            const cleanedTitle = rawTitle.replace(/\s*\[?Archive of Our Own\]?\s*$/i, '').trim();
            if (host === 'wattpad.com' || host === 'www.wattpad.com') {
              const match = rawTitle.match(/^(.*?)\s+-\s+([^-]+?)\s+-\s+Wattpad$/i);
              if (match) { title = match[1].trim(); author = match[2].trim(); }
              if (!authorUrl && author) authorUrl = `https://www.wattpad.com/user/${encodeURIComponent(author)}`;
            }
            if (host === 'archiveofourown.org' || host === 'www.archiveofourown.org') {
              const link = document.querySelector('a[href*="/users/"]');
              if (link) { author = link.textContent; authorUrl = link.href; }
              const parts = cleanedTitle.split(' - ').map((part) => part.trim()).filter(Boolean);
              if (!author && parts.length >= 2) {
                author = parts[1];
                authorUrl = `https://archiveofourown.org/users/${encodeURIComponent(author)}`;
              }
              if (parts.length >= 2) title = parts[0];
            }
            const sourceId = parsedUrl.pathname.match(/\/books\/(OL\d+M)|\/ebooks\/(\d+)|\/works\/(\d+)|\/story\/(\d+)/i);
            return {
              title: cleanedTitle || rawTitle,
              author: String(author).trim(),
              authorUrl: String(authorUrl || '').trim(),
              source: host,
              sourceId: sourceId ? (sourceId[1] || sourceId[2] || sourceId[3] || sourceId[4]) : host,
              url: String(base).trim()
            };
          } catch (error) {
            return { title: '', author: '', source: '', url: String(window.location.href || '') };
          }
        })();
        '''

        def _on_result(result):
            if not result:
                return
            payload = {
                "type": "artvision-autofill",
                "title": result.get("title") or "",
                "author": result.get("author") or "",
                "authorUrl": result.get("authorUrl") or "",
                "source": result.get("source") or "",
                "sourceId": result.get("sourceId") or "",
                "url": result.get("url") or "",
            }
            self.tabs.setCurrentWidget(self.artvision_app_tab)
            QTimer.singleShot(500, lambda: self.artvision_app_tab.page().runJavaScript(
                "window.dispatchEvent(new MessageEvent('message', { data: %s }));" % json.dumps(payload)
            ))

        view.page().runJavaScript(script, _on_result)


if __name__ == "__main__":
    import sys

    app = QApplication(sys.argv)
    app.setApplicationName("ArtVision")
    window = ArtVisionWindow()
    window.show()
    sys.exit(app.exec())
