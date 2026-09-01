import json
import os
import sys
import threading
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

from web_common.navbar import BasicNavbar, address_to_url, bind_navigation, save_web_page
from web_common.tabs import create_profiled_web_view
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
        self.tabs.currentChanged.connect(self._update_app_tab_controls)

        self.navbar = BasicNavbar(self)
        bind_navigation(
            self.navbar,
            self.current_view,
            address_handler=self.navigate_to_address,
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

        self.artvision_app_tab = self.new_tab(self.server.url, title="ArtVision")
        self.artvision_app_tab.setProperty("artvision_app", True)
        self.artvision_app_tab.setUrl(QUrl(f"{self.server.url}literatura"))
        self.tabs.tabBar().setTabButton(
            self.tabs.indexOf(self.artvision_app_tab),
            QTabBar.ButtonPosition.RightSide,
            None,
        )
        self.tabs.setCurrentWidget(self.artvision_app_tab)

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
        view.titleChanged.connect(lambda title_text, current=view: self._sync_title(current, title_text))
        return view

    def new_blank_tab(self):
        self.new_tab("https://example.com", title="New tab")

    def close_tab(self, index):
        if index == self.tabs.indexOf(self.artvision_app_tab) or self.tabs.count() <= 1:
            return
        widget = self.tabs.widget(index)
        self.tabs.removeTab(index)
        widget.deleteLater()

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

        script = r'''
        (() => {
          try {
            const base = document.baseURI || window.location.href;
            const parsedUrl = new URL(base);
            const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();
            const titleNode = document.querySelector('h1.work-title[itemprop="name"], tr th + td[itemprop="headline"], h2.title.heading, h1[data-testid="title"]');
            const fallbackTitleNode = document.querySelector('meta[property="og:title"], meta[name="twitter:title"], meta[name="citation_title"]');
            let title = titleNode?.textContent?.trim() || fallbackTitleNode?.content || document.title || 'Untitled';
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
              const workTitle = document.querySelector('h1.work-title[itemprop="name"]');
              if (workTitle) title = workTitle.textContent;
              const link = document.querySelector('a[href*="/authors/"]');
              if (link) { author = link.textContent; authorUrl = link.href; }
            }
            if (host === 'gutenberg.org' || host === 'www.gutenberg.org') {
              const bookTitle = document.querySelector('tr th + td[itemprop="headline"]');
              if (bookTitle) title = bookTitle.textContent;
              const link = document.querySelector('a[href*="/ebooks/author/"]');
              if (link) { author = link.textContent; authorUrl = link.href; }
            }
            const rawTitle = String(title).trim();
            if (host === 'wattpad.com' || host === 'www.wattpad.com') {
              const storyTitle = document.querySelector('h1[data-testid="title"]');
              if (storyTitle) title = storyTitle.textContent;
              const match = rawTitle.match(/^(.*?)\s+-\s+([^-]+?)\s+-\s+Wattpad$/i);
              if (match) { title = match[1].trim(); author = match[2].trim(); }
              if (!authorUrl && author) authorUrl = `https://www.wattpad.com/user/${encodeURIComponent(author)}`;
            }
            if (host === 'archiveofourown.org' || host === 'www.archiveofourown.org') {
              const workTitle = document.querySelector('h2.title.heading');
              if (workTitle) title = workTitle.textContent;
              const link = document.querySelector('a[href*="/users/"]');
              if (link) { author = link.textContent; authorUrl = link.href; }
              const parts = String(title).replace(/\s*\[?Archive of Our Own\]?\s*$/i, '').split(' - ').map((part) => part.trim()).filter(Boolean);
              if (!author && parts.length >= 2) {
                author = parts[1];
                authorUrl = `https://archiveofourown.org/users/${encodeURIComponent(author)}`;
              }
              if (parts.length >= 2) title = parts[0];
            }
            const cleanedTitle = String(title).replace(/\s*\[?Archive of Our Own\]?\s*$/i, '').trim();
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
    app.setApplicationName("ArtVision")
    window = ArtVisionWindow()
    window.show()
    sys.exit(app.exec())
