"""Verifica mojibake / duplo UTF-8 no repositório (exclui node_modules, .next, venv)."""
from __future__ import annotations

import sys
from pathlib import Path

SKIP_DIRS = {
    "node_modules",
    ".next",
    "venv",
    ".git",
    "dist",
    "build",
    "coverage",
    ".turbo",
}

EXTS = {".tsx", ".ts", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".css", ".html"}

# Padrões de texto frequentes em mojibake (UTF-8 mal interpretado)
TEXT_MARKERS = (
    "Ã£",
    "Ã¡",
    "Ã§",
    "Ã©",
    "Ã­",
    "Ã³",
    "Ãº",
    "Ãµ",
    "Ãª",
    "Ã¢",
    "Ã´",
    "NÃ£o",
    "nÃ£o",
    "NÂº",
    "nÂº",
    "vocÃª",
    "Ã‰",
    "â€",
    "â†",
    "â€™",
    "â€œ",
)

# Bytes típicos de dupla codificação UTF-8 (prefixos comuns)
BYTE_MARKERS = (
    b"\xc3\x83\xc2",  # muitos casos: ã, ê, í, etc. duplos
    b"\xc3\x82\xc2",  # º duplo (nº)
    b"\xc3\xa2\xe2\x82\xac",  # travessão / símbolos quebrados
)


def should_skip(path: Path) -> bool:
    parts = set(path.parts)
    return bool(parts & SKIP_DIRS)


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    text_hits: list[tuple[Path, str]] = []
    byte_hits: list[tuple[Path, bytes]] = []

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if should_skip(path):
            continue
        if path.suffix.lower() not in EXTS:
            continue
        try:
            raw = path.read_bytes()
        except OSError:
            continue
        if raw.startswith(b"\xef\xbb\xbf"):
            raw = raw[3:]

        for bm in BYTE_MARKERS:
            if bm in raw:
                byte_hits.append((path.relative_to(root), bm))
                break

        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            text_hits.append((path.relative_to(root), "ERRO: ficheiro nao e UTF-8 valido"))
            continue

        for marker in TEXT_MARKERS:
            if marker in text:
                text_hits.append((path.relative_to(root), f"contem {marker!r}"))
                break

    print("=== Verificacao mojibake / UTF-8 ===")
    print(f"Raiz: {root}")
    print(f"Extensoes: {sorted(EXTS)}")
    print()
    if not text_hits and not byte_hits:
        print("OK: nenhum marcador suspeito nem sequencia de bytes tipica de duplo UTF-8.")
        return 0

    if text_hits:
        print(f"ALERTA: {len(text_hits)} ficheiro(s) com marcadores de texto:")
        for p, msg in sorted(text_hits, key=lambda x: str(x[0])):
            print(f"  - {p}: {msg}")
        print()

    if byte_hits:
        print(f"ALERTA: {len(byte_hits)} ficheiro(s) com bytes suspeitos (duplo UTF-8):")
        for p, bm in sorted(byte_hits, key=lambda x: str(x[0])):
            print(f"  - {p}: {bm!r}")
        print()

    return 1


if __name__ == "__main__":
    sys.exit(main())
