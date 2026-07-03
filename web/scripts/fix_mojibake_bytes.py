"""Binary-level fixes for remaining UTF-8 mojibake (double-encoding) in TS/TSX."""
from __future__ import annotations

import sys
from pathlib import Path

# (bad_bytes, good_bytes) — longest patterns first
FIXES: list[tuple[bytes, bytes]] = [
    # "Órgão" mis-encoded as Ã + U+201C + rg + ã double
    (
        b"\xc3\x83\xe2\x80\x9crg\xc3\x83\xc2\xa3o",
        "\u00d3rg\u00e3o".encode("utf-8"),
    ),
    # nº (ordinal) double-encoded
    (b"n\xc3\x82\xc2\xba", "n\u00ba".encode("utf-8")),
    (b"N\xc3\x82\xc2\xba", "N\u00ba".encode("utf-8")),
    # ê, í (common in vocÃª, visÃ­veis)
    (b"\xc3\x83\xc2\xaa", "\u00ea".encode("utf-8")),
    (b"\xc3\x83\xc2\xad", "\u00ed".encode("utf-8")),
    # em dash wrong UTF-8 chain → real em dash U+2014
    (b"\xc3\xa2\xe2\x82\xac\xe2\x80\x9d", "\u2014".encode("utf-8")),
    # ã double-encoded (e.g. GestÃ£o)
    (b"\xc3\x83\xc2\xa3", "\u00e3".encode("utf-8")),
]


def main() -> int:
    roots = [Path("src")]
    changed = 0
    for root in roots:
        for path in root.rglob("*.tsx"):
            raw = path.read_bytes()
            if raw.startswith(b"\xef\xbb\xbf"):
                raw = raw[3:]
            new = raw
            for bad, good in FIXES:
                new = new.replace(bad, good)
            if new != raw:
                path.write_bytes(new)
                print("bytes-fixed", path)
                changed += 1
    print("files", changed)
    return 0


if __name__ == "__main__":
    sys.exit(main())
