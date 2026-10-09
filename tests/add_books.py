"""Open URLs in Acervo Browser for manual source-capture tests."""

import argparse
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
BROWSER = ROOT / "acervo_browser.py"


def read_urls(files):
    urls = []
    for path in files:
        for line in path.read_text(encoding="utf-8").splitlines():
            value = line.strip()
            if value and not value.startswith("#"):
                urls.append(value)
    return urls


def is_http_url(value):
    try:
        parsed = urlsplit(value)
        return parsed.scheme.lower() in {"http", "https"} and bool(parsed.netloc)
    except ValueError:
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Open source URLs in Acervo Browser to test saving from a tab."
    )
    parser.add_argument(
        "--url",
        action="append",
        default=[],
        help="URL to test (repeat to queue sources one at a time)",
    )
    parser.add_argument(
        "--file",
        action="append",
        type=Path,
        default=[],
        help="UTF-8 text file with one URL per line; # lines are ignored",
    )
    args = parser.parse_args()

    urls = list(dict.fromkeys([*args.url, *read_urls(args.file)]))
    invalid = [url for url in urls if not is_http_url(url)]
    if invalid:
        parser.error(f"Solo se admiten URLs http(s); URL inválida: {invalid[0]}")
    if not urls:
        parser.error("Indicá al menos una URL con --url o --file.")

    command = [sys.executable, str(BROWSER), "--test-batch"]
    for url in urls:
        command.extend(["--url", url])
    subprocess.Popen(command, cwd=ROOT)
    print(
        f"Acervo Browser abierto con {len(urls)} fuente(s) en cola. "
        "Se carga una por vez; usá «Save from tab» para guardar y avanzar."
    )


if __name__ == "__main__":
    main()
