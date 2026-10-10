"""
Acervo Browser - A PyQt6-based web browser for Acervo project.
Combines web browsing with metadata capture functionality.
"""

import json
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from typing import Optional, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import unquote, urlencode, urlsplit

from PyQt6.QtCore import QTimer, Qt, QUrl
from PyQt6.QtGui import QAction, QDesktopServices, QKeySequence, QShortcut
from PyQt6.QtWebEngineCore import QWebEnginePage
from PyQt6.QtWidgets import (
    QApplication,
    QDialog,
    QFileDialog,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QMessageBox,
    QPlainTextEdit,
    QPushButton,
    QTabWidget,
    QVBoxLayout,
    QWidget,
)

# Add repository root to path for imports
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
ACERVO_ROOT = Path(__file__).resolve().parent
if str(ACERVO_ROOT) not in sys.path:
    sys.path.insert(0, str(ACERVO_ROOT))

from web_common.nav.navbar import BasicNavbar, address_to_url, bind_navigation, save_web_page
from web_common.nav.local_navigation import (
    handle_special_local_file as dispatch_special_local_file,
    open_local_file as choose_local_file,
    open_local_folder as choose_local_folder,
    open_local_target,
    replace_tab_with_epub,
)
from web_common.nav.navigation import (
    active_tab,
    adjust_zoom,
    new_tab_page,
    open_plus_tab,
    set_zoom,
)
from web_common.storage.history import HistoryDialog, HistoryStore
from web_common.storage.session import (
    SessionAutoSaver,
    load_tab_session,
    restore_tab_metadata,
    save_tab_session,
)
from web_common.browser.tabs import (
    VIDEO_EXTS,
    add_plus_tab,
    close_tab as close_shared_tab,
    configure_tab_widget,
    prepare_tab_widget,
    UnifiedWebTab,
)
from web_common.browser.web_profiles import build_web_profile
from web_common.viewers.epub_tab import EpubTab
from web_common.viewers.video_tab import VideoTab
from web_common.viewers import folder_viewer
from home_page import render_home_page

PROFILE_DIR = Path.home() / ".acervo_browser"
APP_PORT = 8765
BROWSER_SCRIPTS_DIR = ACERVO_ROOT / "browser_scripts"
AO3_FEED_PATH = "/api/feeds/ao3"
AO3_FEED_URL = "https://archiveofourown.org/admin_posts.rss"
MAX_FEED_BYTES = 2 * 1024 * 1024
FEED_PROXY_TARGETS = {
    AO3_FEED_PATH: (
        AO3_FEED_URL,
        "application/rss+xml, application/xml, text/xml",
    ),
    "/api/feeds/standard-ebooks/atom": (
        "https://standardebooks.org/feeds/atom/new-releases",
        "application/atom+xml, application/xml",
    ),
    "/api/feeds/standard-ebooks/blog": (
        "https://standardebooks.org/feeds/atom/blog",
        "application/atom+xml, application/xml",
    ),
    "/api/feeds/standard-ebooks/opds": (
        "https://standardebooks.org/feeds/opds",
        "application/opds+json",
    ),
    "/api/feeds/gutenberg/rss": (
        "https://www.gutenberg.org/cache/epub/feeds/today.rss",
        "application/rss+xml, application/xml, text/xml",
    ),
    "/api/feeds/gutenberg/opds": (
        "https://www.gutenberg.org/ebooks/search.opds/",
        "application/atom+xml;profile=opds-catalog, application/atom+xml, application/xml",
    ),
}


def load_browser_script(name: str) -> str:
    return (BROWSER_SCRIPTS_DIR / name).read_text(encoding="utf-8")


def is_http_url(value: str) -> bool:
    try:
        parsed = urlsplit(value)
        return parsed.scheme.lower() in {"http", "https"} and bool(parsed.netloc)
    except ValueError:
        return False


class SectionRequestHandler(SimpleHTTPRequestHandler):
    """Serve local sections and send client-side routes back to their SPA."""

    def do_GET(self):
        feed_target = FEED_PROXY_TARGETS.get(urlsplit(self.path).path)
        if not feed_target:
            return super().do_GET()

        upstream_url, accept = feed_target
        request = Request(
            upstream_url,
            headers={
                "Accept": accept,
                "User-Agent": "Acervo Literature RSS reader",
            },
        )
        try:
            with urlopen(request, timeout=12) as response:
                content = response.read(MAX_FEED_BYTES + 1)
                content_type = response.headers.get(
                    "Content-Type", "application/xml; charset=utf-8"
                )
        except (HTTPError, URLError, TimeoutError) as error:
            reason = getattr(error, "reason", None)
            status = error.code if isinstance(error, HTTPError) else 502
            self._send_feed_error(
                f"{urlsplit(upstream_url).hostname} feed unavailable: {reason or error}",
                status,
            )
            return

        if len(content) > MAX_FEED_BYTES:
            self._send_feed_error(f"{urlsplit(upstream_url).hostname} feed exceeded the 2 MiB response limit.")
            return

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def _send_feed_error(self, message, status=502):
        content = message.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def translate_path(self, path):
        request_path = unquote(urlsplit(path).path)
        is_art_route = request_path == "/salas-arte" or request_path.startswith(
            "/salas-arte/"
        )
        is_science_route = request_path == "/salas-ciencia" or request_path.startswith(
            "/salas-ciencia/"
        )
        translated = Path(super().translate_path(path)).resolve()
        root = Path(self.directory).resolve()
        try:
            translated.relative_to(root)
        except ValueError:
            return str(root / "__not_found__")
        if translated.exists() or Path(request_path).suffix:
            return str(translated)
        if is_art_route:
            return str(root / "salas-arte" / "index.html")
        if is_science_route:
            return str(root / "salas-ciencia" / "index.html")
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


class AcervoBrowser(QMainWindow):
    """Main browser window for Acervo."""

    def __init__(
        self,
        initial_url: Optional[str] = None,
        profile_name: str = "acervo",
    ):
        super().__init__()
        
        self.setWindowTitle("Acervo Browser")
        self.resize(1200, 800)

        self.section_server = LocalSectionServer(
            ACERVO_ROOT / "app" / "vite" / "dist", APP_PORT
        )
        self.arts_url = f"{self.section_server.url}salas-arte/"
        self.science_url = f"{self.section_server.url}salas-ciencia/"
        self.local_url = self.section_server.url

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
        self.session_file = PROFILE_DIR / "session.json"
        self.archive_cache_dir = PROFILE_DIR / "archives"
        self.archive_cache_dir.mkdir(parents=True, exist_ok=True)
        self.zoom_factor = self._load_zoom_factor()
        self.session_autosaver = SessionAutoSaver(self._save_session)
        self._restoring_session = False
        self._closing = False
        self._pending_download_names = set()

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
        self.tabs.tabBar().tabMoved.connect(lambda _source, _target: self._schedule_session_save())
        self.profile.downloadRequested.connect(self._on_download_requested)

        # Create navbar
        self.navbar = BasicNavbar(self)
        bind_navigation(
            self.navbar,
            self.current_view,
            address_handler=self.navigate_to_address,
            history_handler=self.show_history,
            save_handler=lambda: save_web_page(self.current_view()),
        )

        self.capture_action = QAction("Import", self)
        self.capture_action.setToolTip(
            "Import the current page; Shift-click to import or export multiple links"
        )
        self.capture_action.triggered.connect(self._on_import_action)
        self.navbar.addAction(self.capture_action)

        self.open_file_action = QAction("Abrir archivo", self)
        self.open_file_action.setShortcut(QKeySequence("Ctrl+O"))
        self.open_file_action.triggered.connect(self.open_local_file)
        self.navbar.addAction(self.open_file_action)

        self.open_folder_action = QAction("Abrir carpeta", self)
        self.open_folder_action.setShortcut(QKeySequence("Ctrl+Shift+O"))
        self.open_folder_action.triggered.connect(self.open_local_folder)
        self.navbar.addAction(self.open_folder_action)

        self.downloads_action = QAction("Descargas", self)
        self.downloads_action.triggered.connect(self.open_downloads_folder)
        self.navbar.addAction(self.downloads_action)

        self._build_shortcuts()

        # Prefer an explicitly requested URL; otherwise restore the last session.
        if initial_url:
            self.new_tab(initial_url, title="Source")
        elif not self._restore_session():
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

    def new_tab(
        self,
        url: Optional[str] = None,
        title: str = "Nueva pestaña",
        *,
        load_home: bool = True,
    ) -> Optional:
        """Create a new tab."""
        view = UnifiedWebTab(
            self.profile,
            parent_window=self,
            new_tab_handler=self._handle_new_tab_request,
            new_window_handler=self._handle_new_window_request,
            folder_view_handler=folder_viewer.render_folder_view,
            file_view_handler=folder_viewer.render_file_view,
            special_local_handler=self.handle_special_local_file,
        )
        view.setZoomFactor(self.zoom_factor)
        view.setProperty("_acervo_home", url is None and load_home)
        page = view.page()
        page.profile().setHttpCacheType(page.profile().HttpCacheType.DiskHttpCache)
        
        plus_index = self.tabs.indexOf(self.plus_widget)
        index = self.tabs.insertTab(plus_index, view, title)
        self.tabs.setCurrentIndex(index)
        
        # Connect signals
        view.urlChanged.connect(lambda qurl, current=view: self._sync_address(current, qurl))
        view.loadFinished.connect(lambda ok, current=view: self._record_history(current, ok))
        view.titleChanged.connect(lambda title_text, current=view: self._sync_title(current, title_text))
        view.titleChanged.connect(lambda _title: self._schedule_session_save())
        view.iconChanged.connect(lambda _icon: self._schedule_session_save())
        view.urlChanged.connect(lambda _url: self._schedule_session_save())
        if url is not None:
            view.setUrl(QUrl(url))
        elif load_home:
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
        self._schedule_session_save()
        return view

    def _handle_new_tab_request(self):
        return new_tab_page(
            lambda: self.new_tab(title="Nueva pestaña", load_home=False)
        )

    def _handle_new_window_request(self, request):
        target = request.requestedUrl()
        page = self._handle_new_tab_request()
        request.openIn(page)
        if target.isValid() and not target.isEmpty():
            QTimer.singleShot(
                100,
                lambda requested=target, destination=page:
                    self._load_requested_url_if_blank(destination, requested),
            )

    @staticmethod
    def _load_requested_url_if_blank(page, target):
        try:
            if page.url().toString() in ("", "about:blank"):
                page.setUrl(target)
        except RuntimeError:
            return

    def new_blank_tab(self):
        """Create a new blank tab."""
        self.new_tab(title="Inicio")

    def close_tab(self, index: int):
        """Close a tab by index."""
        close_shared_tab(
            self.tabs,
            index,
            self.plus_widget,
            before_delete=lambda widget: widget.stop()
            if isinstance(widget, VideoTab)
            else None,
            ensure_tab=self.new_blank_tab,
        )
        self._schedule_session_save()

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
            self._schedule_session_save()

    def navigate_to_address(self, text: str):
        """Navigate to an address entered in the address bar."""
        url = address_to_url(text)
        if url is not None:
            view = self.current_view()
            if view:
                view.setUrl(url)

    def _build_shortcuts(self):
        QShortcut(QKeySequence("Ctrl+T"), self, activated=self.new_blank_tab)
        QShortcut(
            QKeySequence("Ctrl+W"),
            self,
            activated=lambda: self.close_tab(self.tabs.currentIndex()),
        )
        QShortcut(
            QKeySequence("Ctrl+L"),
            self,
            activated=lambda: self.navbar.address_bar.setFocus(),
        )
        QShortcut(QKeySequence("Ctrl+H"), self, activated=self.show_history)
        QShortcut(QKeySequence("Ctrl+J"), self, activated=self.open_downloads_folder)
        QShortcut(
            QKeySequence("Ctrl+="),
            self,
            activated=lambda: adjust_zoom(
                self.current_view, 0.1, self._persist_zoom_factor
            ),
        )
        QShortcut(
            QKeySequence("Ctrl+-"),
            self,
            activated=lambda: adjust_zoom(
                self.current_view, -0.1, self._persist_zoom_factor
            ),
        )
        QShortcut(
            QKeySequence("Ctrl+0"),
            self,
            activated=lambda: set_zoom(
                self.current_view, 1.0, self._persist_zoom_factor
            ),
        )

    def _load_zoom_factor(self):
        path = PROFILE_DIR / "zoom.json"
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError, TypeError):
            return 1.0
        if isinstance(value, (int, float)) and 0.25 <= value <= 5:
            return float(value)
        return 1.0

    def _persist_zoom_factor(self, factor):
        self.zoom_factor = factor
        try:
            (PROFILE_DIR / "zoom.json").write_text(
                json.dumps(factor), encoding="utf-8"
            )
        except OSError as error:
            self.statusBar().showMessage(f"No se pudo guardar el zoom: {error}", 7000)

    def _schedule_session_save(self):
        if not self._restoring_session and not self._closing:
            self.session_autosaver.schedule()

    def _save_session(self):
        try:
            save_tab_session(
                self.session_file,
                self.tabs,
                skip_widgets=(self.plus_widget,),
                metadata_for_widget=lambda widget: {
                    "acervo_home": bool(widget.property("_acervo_home"))
                },
                include_blank=True,
            )
        except OSError as error:
            message = f"No se pudo guardar la sesión: {error}"
            if self._closing:
                QMessageBox.warning(self, "Error al guardar la sesión", message)
            else:
                self.statusBar().showMessage(message, 7000)
            return False
        return True

    def _restore_session(self):
        session = load_tab_session(self.session_file)
        entries = session.get("tabs", [])
        if not entries:
            return False

        self._restoring_session = True
        restored = []
        try:
            for entry in entries:
                url = entry["url"]
                view = self.new_tab(
                    title=entry.get("title") or "Nueva pestaña",
                    load_home=bool(entry.get("acervo_home")),
                )
                if view is None:
                    continue
                restore_tab_metadata(
                    self.tabs,
                    self.tabs.indexOf(view),
                    entry,
                )
                if not entry.get("acervo_home") or url != "about:blank":
                    view.setUrl(QUrl(url))
                restored.append(view)

            if not restored:
                return False
            active_index = session.get("active_index", 0)
            if isinstance(active_index, int):
                self.tabs.setCurrentIndex(
                    max(0, min(active_index, len(restored) - 1))
                )
            return True
        finally:
            self._restoring_session = False
            if restored:
                self._schedule_session_save()

    def open_local_file(self):
        return choose_local_file(self, self.open_path_in_new_tab)

    def open_local_folder(self):
        return choose_local_folder(self, self.open_path_in_new_tab)

    def open_path_in_new_tab(self, path):
        view = self.new_tab(load_home=False)
        view.setUrl(QUrl.fromLocalFile(path))
        return view

    def handle_special_local_file(self, tab, local_path):
        dispatch_special_local_file(
            tab,
            local_path,
            video_extensions=VIDEO_EXTS,
            video_handler=lambda path: self._replace_with_video(tab, path),
            target_handler=self._open_local_target,
        )

    def _replace_with_video(self, tab, local_path):
        index = self.tabs.indexOf(tab)
        if index < 0:
            return None
        video = VideoTab(local_path, self)
        self.tabs.removeTab(index)
        self.tabs.insertTab(index, video, Path(local_path).name[:30] or "Video")
        self.tabs.setCurrentIndex(index)
        tab.deleteLater()
        self.history.add_history(
            video.url().toString(),
            video.title(),
            self.history_session_id,
        )
        self._schedule_session_save()
        return video

    def _open_local_target(self, tab, local_path):
        return open_local_target(
            tab,
            local_path,
            self.archive_cache_dir,
            epub_handler=self._replace_tab_with_epub,
        )

    def _replace_tab_with_epub(self, tab, local_path, cache_dir):
        return replace_tab_with_epub(
            tab,
            self.tabs,
            local_path,
            cache_dir,
            epub_factory=lambda source, path, cache: EpubTab(
                source.page().profile(),
                path,
                cache_dir=cache,
                parent=self,
            ),
            on_replaced=lambda _source, _epub: self._schedule_session_save(),
        )

    def open_downloads_folder(self):
        downloads_path = PROFILE_DIR / "downloads"
        downloads_path.mkdir(parents=True, exist_ok=True)
        QDesktopServices.openUrl(QUrl.fromLocalFile(str(downloads_path)))

    def _on_download_requested(self, request):
        downloads_path = PROFILE_DIR / "downloads"
        downloads_path.mkdir(parents=True, exist_ok=True)
        filename = Path(request.downloadFileName()).name
        base, suffix = os.path.splitext(filename)
        candidate = filename or "download"
        number = 1
        while (
            (downloads_path / candidate).exists()
            or candidate in self._pending_download_names
        ):
            candidate = f"{base} ({number}){suffix}"
            number += 1
        request.setDownloadDirectory(str(downloads_path))
        request.setDownloadFileName(candidate)
        request.accept()
        self._pending_download_names.add(candidate)
        request.stateChanged.connect(
            lambda state, name=candidate: self._on_download_state_changed(name, state)
        )
        self.statusBar().showMessage(f"Descargando: {candidate}", 5000)

    def _on_download_state_changed(self, filename, state):
        if state.name in ("DownloadCompleted", "DownloadInterrupted", "DownloadCancelled"):
            self._pending_download_names.discard(filename)
        if state.name == "DownloadCompleted":
            self.statusBar().showMessage(f"Descarga completada: {filename}", 7000)
        elif state.name == "DownloadInterrupted":
            self.statusBar().showMessage(f"Descarga interrumpida: {filename}", 7000)

    def show_history(self):
        """Show history dialog."""
        dialog = HistoryDialog(
            self.history,
            on_open=lambda url: self.new_tab(url, title="From History"),
        )
        dialog.exec()

    def _on_import_action(self):
        if QApplication.keyboardModifiers() & Qt.KeyboardModifier.ShiftModifier:
            self.show_link_transfer_dialog()
        else:
            self.capture_current_tab()

    def show_link_transfer_dialog(self):
        dialog = QDialog(self)
        dialog.setWindowTitle("Importar / exportar enlaces")
        dialog.resize(560, 420)

        layout = QVBoxLayout(dialog)
        layout.addWidget(QLabel(
            "Pegá enlaces http(s), uno por línea. Podés cargar o guardar la lista como archivo."
        ))
        links_input = QPlainTextEdit()
        links_input.setPlaceholderText("https://ejemplo.com/obra\nhttps://ejemplo.com/articulo")
        layout.addWidget(links_input)

        actions = QHBoxLayout()
        load_button = QPushButton("Cargar archivo")
        import_button = QPushButton("Importar enlaces")
        export_button = QPushButton("Exportar lista")
        export_catalog_button = QPushButton("Exportar colección (JSON)")
        close_button = QPushButton("Cerrar")
        for button in (
            load_button,
            import_button,
            export_button,
            export_catalog_button,
            close_button,
        ):
            actions.addWidget(button)
        layout.addLayout(actions)

        def get_valid_links():
            links = list(dict.fromkeys(
                line.strip()
                for line in links_input.toPlainText().splitlines()
                if line.strip()
            ))
            valid = []
            invalid = []
            for link in links:
                if is_http_url(link):
                    valid.append(link)
                else:
                    invalid.append(link)
            return valid, invalid

        def load_links():
            path, _ = QFileDialog.getOpenFileName(
                dialog,
                "Cargar enlaces",
                "",
                "Archivos de texto (*.txt);;Todos los archivos (*)",
            )
            if not path:
                return
            try:
                links_input.setPlainText(Path(path).read_text(encoding="utf-8"))
            except OSError as error:
                QMessageBox.critical(dialog, "No se pudo cargar", str(error))

        def import_links():
            links, invalid = get_valid_links()
            if invalid:
                QMessageBox.warning(
                    dialog,
                    "Enlaces inválidos",
                    "Todos los enlaces deben usar http:// o https://.\n\n"
                    + "\n".join(invalid[:5]),
                )
                return
            if not links:
                QMessageBox.information(
                    dialog, "Sin enlaces", "Agregá al menos un enlace para importar."
                )
                return
            self._import_link_batch(links)
            dialog.accept()

        def export_links():
            links, invalid = get_valid_links()
            if invalid:
                QMessageBox.warning(
                    dialog,
                    "Enlaces inválidos",
                    "Solo se pueden exportar enlaces http(s).\n\n"
                    + "\n".join(invalid[:5]),
                )
                return
            if not links:
                QMessageBox.information(
                    dialog, "Sin enlaces", "Agregá al menos un enlace para exportar."
                )
                return
            path, _ = QFileDialog.getSaveFileName(
                dialog, "Exportar enlaces", "enlaces.txt", "Archivos de texto (*.txt)"
            )
            if not path:
                return
            try:
                Path(path).write_text("\n".join(links) + "\n", encoding="utf-8")
            except OSError as error:
                QMessageBox.critical(dialog, "No se pudo exportar", str(error))

        load_button.clicked.connect(load_links)
        import_button.clicked.connect(import_links)
        export_button.clicked.connect(export_links)
        export_catalog_button.clicked.connect(
            lambda: self._export_literature_collection(dialog)
        )
        close_button.clicked.connect(dialog.reject)
        dialog.exec()

    def _import_link_batch(self, links):
        page = QWebEnginePage(self.profile, self)
        pending = iter(links)
        metadata_items = []
        failed_urls = []
        current_url = {"value": None}

        def import_captured_items():
            page.deleteLater()
            if not metadata_items:
                QMessageBox.warning(
                    self,
                    "No se pudo importar",
                    "No se pudo extraer información de los enlaces.",
                )
                return
            query = urlencode({
                "captureBatch": json.dumps(metadata_items, ensure_ascii=False)
            })
            self.new_tab(
                f"{self.arts_url}literatura?{query}",
                title=f"Importados {len(metadata_items)} enlaces",
            )
            if failed_urls:
                QMessageBox.warning(
                    self,
                    "Importación parcial",
                    f"Se importaron {len(metadata_items)} enlaces, pero no se pudo "
                    "abrir correctamente:\n\n" + "\n".join(failed_urls[:8]),
                )

        def load_next_url():
            try:
                current_url["value"] = next(pending)
            except StopIteration:
                import_captured_items()
                return
            page.load(QUrl(current_url["value"]))

        def on_metadata_loaded(result):
            url = current_url["value"]
            if not isinstance(result, dict):
                result = {}
                failed_urls.append(url)
            elif not any(result.get(field) for field in ("title", "author", "summary")):
                failed_urls.append(url)
            actual_url = result.get("url") or url
            parsed = urlsplit(actual_url)
            fallback_source = parsed.hostname or urlsplit(url).hostname or ""
            metadata_items.append({
                "title": result.get("title") or "",
                "author": result.get("author") or "",
                "authorUrl": result.get("authorUrl") or "",
                "source": result.get("source") or fallback_source,
                "sourceId": result.get("sourceId") or fallback_source,
                "url": actual_url,
                "summary": result.get("summary") or "",
            })
            load_next_url()

        def on_page_loaded(ok):
            url = current_url["value"]
            if not ok:
                failed_urls.append(url)
                host = urlsplit(url).hostname or ""
                metadata_items.append({
                    "title": "",
                    "author": "",
                    "authorUrl": "",
                    "source": host,
                    "sourceId": host,
                    "url": url,
                    "summary": "",
                })
                load_next_url()
                return
            page.runJavaScript(
                load_browser_script("save_metadata.js"),
                on_metadata_loaded,
            )

        page.loadFinished.connect(on_page_loaded)
        load_next_url()

    def _export_literature_collection(self, dialog):
        page = QWebEnginePage(self.profile, dialog)

        def on_collection_loaded(groups):
            self._save_exported_collection(dialog, groups)
            page.deleteLater()

        def on_catalog_loaded(ok):
            if not ok:
                QMessageBox.critical(
                    dialog, "No se pudo exportar", "No se pudo abrir el catálogo de Literatura."
                )
                page.deleteLater()
                return
            page.runJavaScript(
                load_browser_script("export_literature_collection.js"),
                on_collection_loaded,
            )

        page.loadFinished.connect(on_catalog_loaded)
        page.load(QUrl(f"{self.arts_url}literatura"))

    @staticmethod
    def _save_exported_collection(dialog, groups):
        if not isinstance(groups, list):
            QMessageBox.critical(
                dialog, "No se pudo exportar", "No se pudo leer la colección de Literatura."
            )
            return
        if not groups:
            QMessageBox.information(
                dialog, "Colección vacía", "La colección de Literatura no contiene datos para exportar."
            )
            return
        path, _ = QFileDialog.getSaveFileName(
            dialog, "Exportar colección", "acervo-coleccion.json", "Archivos JSON (*.json)"
        )
        if not path:
            return
        output_path = Path(path)
        if output_path.suffix.lower() != ".json":
            output_path = output_path.with_suffix(".json")
        try:
            output_path.write_text(
                json.dumps(groups, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
        except OSError as error:
            QMessageBox.critical(dialog, "No se pudo exportar", str(error))

    def capture_current_tab(self):
        """Capture metadata from the current tab."""
        view = self.current_view()
        if view is None:
            return
        self.capture_view(
            view,
            callback=self._save_capture_to_literature,
        )

    def _save_capture_to_literature(self, metadata):
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
        url = f"{self.arts_url}literatura?{urlencode(params)}"
        self.new_tab(url, title="Imported to Literature")

    def capture_view(self, view, callback: Optional[Callable] = None):
        """Save metadata from a web page."""
        if view is None:
            return

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

        view.page().runJavaScript(
            load_browser_script("save_metadata.js"),
            _on_result,
        )

    def closeEvent(self, event):
        """Clean up on close."""
        self._closing = True
        self._save_session()
        for index in range(self.tabs.count()):
            widget = self.tabs.widget(index)
            if isinstance(widget, VideoTab):
                widget.stop()
        self.section_server.stop()
        super().closeEvent(event)


def main():
    """Main entry point."""

    app = QApplication(sys.argv)
    app.setApplicationName("Acervo Browser")

    browser = AcervoBrowser()
    browser.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
