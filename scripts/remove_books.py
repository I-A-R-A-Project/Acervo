"""Open ArtVision and remove the temporary books.txt import batch."""

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "artvision_qt.py"


def main():
    subprocess.Popen(
        [sys.executable, str(APP), "--path", "/literatura?removeImported=1"],
        cwd=ROOT,
    )
    print("ArtVision abierto para quitar el lote importado desde books.txt.")


if __name__ == "__main__":
    main()
