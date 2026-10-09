"""Open Acervo Browser and remove only source-test captures from Literature."""

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BROWSER = ROOT / "acervo_browser.py"


def main():
    subprocess.Popen(
        [sys.executable, str(BROWSER), "--remove-test-imports"],
        cwd=ROOT,
    )
    print("Acervo Browser abierto para quitar capturas de pruebas de fuentes.")


if __name__ == "__main__":
    main()
