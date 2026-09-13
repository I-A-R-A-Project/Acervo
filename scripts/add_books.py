"""Open ArtVision and import the real links listed in books.txt."""

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BOOKS_FILE = ROOT / "books.txt"
APP = ROOT / "artvision_qt.py"


def read_urls():
    urls = []
    for line in BOOKS_FILE.read_text(encoding="utf-8").splitlines():
        value = line.strip()
        if value and not value.startswith("#") and value.startswith(("http://", "https://")):
            urls.append(value)
    return list(dict.fromkeys(urls))


def main():
    parser = argparse.ArgumentParser(
        description="Importa books.txt sin cargar todas las páginas al mismo tiempo."
    )
    parser.add_argument(
        "--tabs",
        type=int,
        choices=(1, 4),
        default=1,
        help="Cantidad de pestañas externas a cargar a la vez (por defecto: 1).",
    )
    args = parser.parse_args()

    urls = read_urls()
    if not urls:
        raise SystemExit("books.txt no contiene links http(s) válidos.")

    command = [
        sys.executable,
        str(APP),
        "--path",
        "/literatura",
        "--max-source-tabs",
        str(args.tabs),
    ]
    for url in urls:
        command.extend(["--url", url])
    subprocess.Popen(command, cwd=ROOT)
    print(
        f"ArtVision abierto: {len(urls)} links en cola, "
        f"cargando {args.tabs} pestaña(s) a la vez."
    )


if __name__ == "__main__":
    main()
