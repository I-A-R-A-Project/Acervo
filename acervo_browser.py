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

from PyQt6.QtCore import Qt, QUrl
from PyQt6.QtGui import QAction
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
APP_PORT = 8765
BROWSER_SCRIPTS_DIR = ACERVO_ROOT / "browser_scripts"


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

        self.capture_action = QAction("Import", self)
        self.capture_action.setToolTip(
            "Import the current page; Shift-click to import or export multiple links"
        )
        self.capture_action.triggered.connect(self._on_import_action)
        self.navbar.addAction(self.capture_action)

        # Setup initial tab
        if initial_url:
            self.new_tab(initial_url, title="Source")
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
