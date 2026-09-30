"""Export the literature catalog currently stored by Salas de Arte."""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from PyQt6.QtCore import QTimer, QUrl
from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineCore import QWebEnginePage

ROOT = Path(__file__).resolve().parents[1]
APP_PROFILE_DIR = Path.home() / ".artvision_qt"
STORAGE_KEY = "artvision-literatura-groups"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from artvision_qt import ArtVisionHttpServer  # noqa: E402
from web_common.browser.web_profiles import build_web_profile  # noqa: E402


def default_output_path():
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return ROOT / f"books-dump-{stamp}.json"


def main():
    parser = argparse.ArgumentParser(
        description="Exporta el valor actual de localStorage de la sala Literatura."
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=default_output_path(),
        help="Archivo JSON de salida (por defecto: books-dump-YYYYMMDD-HHMMSS.json).",
    )
    args = parser.parse_args()
    output_path = args.output if args.output.is_absolute() else ROOT / args.output

    app = QApplication(sys.argv)
    server = ArtVisionHttpServer(
        ROOT / "artvision-app" / "dist"
        if (ROOT / "artvision-app" / "dist").exists()
        else ROOT / "artvision-app"
    )
    profile = build_web_profile(
        "ArtVisionProfile",
        None,
        str(APP_PROFILE_DIR / "storage"),
        str(APP_PROFILE_DIR / "cache"),
    )
    page = QWebEnginePage(profile)
    finished = {"value": False}

    def fail(message):
        if finished["value"]:
            return
        finished["value"] = True
        server.stop()
        raise SystemExit(message)

    def write_dump(raw_value):
        if finished["value"]:
            return
        finished["value"] = True
        try:
            groups = json.loads(raw_value) if raw_value else None
        except json.JSONDecodeError as error:
            server.stop()
            raise SystemExit(f"El valor guardado no es JSON válido: {error}") from error

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
        print(f"Exportados {total} libros a {output_path}")
        server.stop()
        app.quit()

    def on_load(ok):
        if not ok:
            fail("No se pudo abrir la aplicación para leer localStorage.")
        page.runJavaScript(
            f"localStorage.getItem({json.dumps(STORAGE_KEY)})",
            write_dump,
        )

    server.start()
    page.loadFinished.connect(on_load)
    page.load(QUrl(f"{server.url}literatura"))
    QTimer.singleShot(15000, lambda: fail("Tiempo agotado leyendo localStorage."))
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
