"""Open ArtVision and import the real links listed in books.txt."""

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
    urls = read_urls()
    if not urls:
        raise SystemExit("books.txt no contiene links http(s) válidos.")

    command = [sys.executable, str(APP), "--path", "/literatura"]
    for url in urls:
        command.extend(["--url", url])
    subprocess.Popen(command, cwd=ROOT)
    print(f"ArtVision abierto con {len(urls)} pestañas de {BOOKS_FILE.name}.")


if __name__ == "__main__":
    main()
