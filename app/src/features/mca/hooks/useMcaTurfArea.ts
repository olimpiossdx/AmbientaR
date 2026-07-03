import * as React from "react";

/** Carrega @turf/area sob demanda e expõe cálculo de área em hectares. */
export function useMcaTurfArea() {
  const turfAreaRef = React.useRef<((geo: never) => number) | null>(null);
  const [turfAreaReady, setTurfAreaReady] = React.useState(false);

  React.useEffect(() => {
    void import("@turf/area").then((m) => {
      turfAreaRef.current = m.default;
      setTurfAreaReady(true);
    });
  }, []);

  const computeAreaHa = React.useCallback((geo: unknown): number | null => {
    const fn = turfAreaRef.current;
    if (!fn) return null;
    try {
      return fn(geo as never) / 10_000;
    } catch {
      return null;
    }
  }, []);

  return { turfAreaReady, computeAreaHa };
}
