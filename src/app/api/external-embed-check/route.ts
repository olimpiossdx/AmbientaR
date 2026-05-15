import { NextRequest, NextResponse } from "next/server";
import { isUrlEmbeddableInIframe } from "@/lib/external-embed";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "url é obrigatória" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ embeddable: false }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ embeddable: false }, { status: 400 });
  }

  try {
    const response = await fetch(parsed.toString(), {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "AmbientaR/1.0 (embed-check)" },
    });

    const embeddable = isUrlEmbeddableInIframe(
      response.headers.get("x-frame-options"),
      response.headers.get("content-security-policy")
    );

    return NextResponse.json({ embeddable });
  } catch {
    return NextResponse.json({ embeddable: null });
  }
}
