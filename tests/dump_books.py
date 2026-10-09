"""Export the Literature catalog from Acervo Browser's persistent profile."""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from PyQt6.QtCore import QTimer, QUrl
from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineCore import QWebEnginePage


ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = ROOT.parent
PROFILE_DIR = Path.home() / ".acervo_browser"
STORAGE_KEY = "artvision-literatura-groups"

for import_path in (ROOT, REPOSITORY_ROOT):
    if str(import_path) not in sys.path:
        sys.path.insert(0, str(import_path))

from acervo_browser import APP_PORT, LocalSectionServer  # noqa: E402
from web_common.browser.web_profiles import build_web_profile  # noqa: E402


def default_output_path():
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return ROOT / f"books-dump-{stamp}.json"


def main():
    parser = argparse.ArgumentParser(
        description="Export the Literature catalog from Acervo Browser local storage."
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=default_output_path(),
        help="JSON output path (defaults to books-dump-YYYYMMDD-HHMMSS.json)",
    )
    args = parser.parse_args()
    output_path = args.output if args.output.is_absolute() else ROOT / args.output

    app = QApplication(sys.argv)
    try:
        server = LocalSectionServer(ROOT / "app" / "vite" / "dist", APP_PORT)
    except OSError as error:
        raise SystemExit(
            f"No se pudo abrir el servidor local del catálogo. "
            f"Cerrá Acervo Browser y volvé a intentar: {error}"
        ) from error

    profile = build_web_profile(
        name="acervo",
        parent=None,
        storage_path=PROFILE_DIR / "storage",
        cache_path=PROFILE_DIR / "cache",
        download_path=PROFILE_DIR / "downloads",
    )
    page = QWebEnginePage(profile)
    finished = {"value": False}

    def finish(exit_code=0, message=None):
        if finished["value"]:
            return
        finished["value"] = True
        if message:
            print(message, file=sys.stderr)
        server.stop()
        app.exit(exit_code)

    def write_dump(raw_value):
        if finished["value"]:
            return
        try:
            groups = json.loads(raw_value) if raw_value else None
        except json.JSONDecodeError as error:
            finish(1, f"El valor guardado no es JSON válido: {error}")
            return

        dump = {
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "origin": server.url.rstrip("/"),
            "storage_key": STORAGE_KEY,
            "raw_value": raw_value,
            "groups": groups,
        }
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(dump, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        total = sum(
            len(group.get("items", []))
            for group in groups
            if isinstance(group, dict) and isinstance(group.get("items"), list)
        ) if isinstance(groups, list) else 0
        finish(message=f"Exportadas {total} entradas a {output_path}")

    def on_load(ok):
        if not ok:
            finish(1, "No se pudo abrir Literatura para leer el catálogo.")
            return
        page.runJavaScript(
            f"localStorage.getItem({json.dumps(STORAGE_KEY)})",
            write_dump,
        )

    page.loadFinished.connect(on_load)
    page.load(QUrl(f"http://127.0.0.1:{APP_PORT}/salas-arte/literatura"))
    QTimer.singleShot(
        15000,
        lambda: finish(1, "Tiempo agotado leyendo el catálogo de Literatura."),
    )
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
