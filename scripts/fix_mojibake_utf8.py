"""Fix double-encoded UTF-8 mojibake in source files (line-by-line latin1->utf8)."""
from __future__ import annotations

import sys
from pathlib import Path


def fix_line(line: str) -> str:
    """Apply latin1->utf8 until stable or encode/decode fails."""
    cur = line
    for _ in range(5):
        try:
            nxt = cur.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return cur
        if nxt == cur:
            return cur
        cur = nxt
    return cur


def fix_text(text: str) -> str:
    """Preserve newlines; skip lines that are not latin-1-encodable (e.g. real emoji)."""
    lines = text.splitlines(keepends=True)
    return "".join(fix_line(line) for line in lines)


def main() -> int:
    roots = [Path("src")]
    exts = {".tsx", ".ts", ".jsx", ".js", ".md", ".json"}
    changed = 0
    for root in roots:
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if path.suffix not in exts:
                continue
            try:
                raw = path.read_bytes()
            except OSError:
                continue
            if raw.startswith(b"\xef\xbb\xbf"):
                raw = raw[3:]
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                continue
            if "Ã" not in text and "Â" not in text and "â€" not in text:
                continue
            new = fix_text(text)
            if new != text:
                path.write_text(new, encoding="utf-8", newline="\n")
                print("fixed", path)
                changed += 1
    print("files_changed", changed)
    return 0


if __name__ == "__main__":
    sys.exit(main())
