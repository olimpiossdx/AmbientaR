/**
 * Cliente GeoNetwork IDE-Sisema (REST + CSW) — descoberta de metadados (P4).
 */

const GEONETWORK_BASE =
  "https://idesisema.meioambiente.mg.gov.br/geonetwork/srv";

const CSW_BASE = `${GEONETWORK_BASE}/por/csw`;

const DEFAULT_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "AmbientaR/1.0 (GeoNetwork cliente)",
};

export type GeoNetworkRecordSummary = {
  uuid: string;
  title?: string;
  abstract?: string;
  link?: string;
};

function parseCswRecordSummaries(xml: string): GeoNetworkRecordSummary[] {
  const out: GeoNetworkRecordSummary[] = [];
  const recordBlocks =
    xml.match(/<csw:(?:Record|SummaryRecord)[\s\S]*?<\/csw:(?:Record|SummaryRecord)>/gi) ?? [];
  for (const block of recordBlocks) {
    const title =
      block.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i)?.[1]?.trim() ??
      block.match(/<dct:title[^>]*>([\s\S]*?)<\/dct:title>/i)?.[1]?.trim();
    const abstract =
      block.match(/<dct:abstract[^>]*>([\s\S]*?)<\/dct:abstract>/i)?.[1]?.trim();
    const uuid =
      block.match(/<dc:identifier[^>]*>([\s\S]*?)<\/dc:identifier>/i)?.[1]?.trim() ?? "";
    if (uuid || title) {
      out.push({ uuid, title, abstract });
    }
  }
  return out;
}

async function fetchCswGetRecords(maxRecords: number, startPosition = 1): Promise<string> {
  const url =
    `${CSW_BASE}?service=CSW&version=2.0.2&request=GetRecords` +
    `&typeNames=csw:Record&resultType=results&elementSetName=summary` +
    `&startPosition=${startPosition}&maxRecords=${maxRecords}`;

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`GeoNetwork CSW HTTP ${res.status}`);
  }
  return res.text();
}

function filterCswByQuery(
  records: GeoNetworkRecordSummary[],
  query: string,
  size: number,
): GeoNetworkRecordSummary[] {
  const q = query.toLowerCase();
  return records
    .filter((r) => {
      const hay = `${r.title ?? ""} ${r.abstract ?? ""} ${r.uuid}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, size);
}

/** CSW 2.0.2 — funciona sem auth quando REST devolve 403. */
export async function searchGeoNetworkCsw(params: {
  query: string;
  from?: number;
  size?: number;
}): Promise<GeoNetworkRecordSummary[]> {
  const max = params.size ?? 20;
  const xml = await fetchCswGetRecords(100);
  if (xml.includes("ExceptionReport")) {
    throw new Error("GeoNetwork CSW ExceptionReport");
  }
  const all = parseCswRecordSummaries(xml);
  return filterCswByQuery(all, params.query, max);
}

export async function searchGeoNetworkRecords(params: {
  query: string;
  from?: number;
  size?: number;
}): Promise<GeoNetworkRecordSummary[]> {
  const url = new URL(`${GEONETWORK_BASE}/api/search/records/_search`);
  const body = {
    query: {
      bool: {
        must: [
          {
            query_string: {
              query: params.query,
            },
          },
        ],
      },
    },
    from: params.from ?? 0,
    size: params.size ?? 20,
  };

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
      return searchGeoNetworkCsw(params);
    }
    throw new Error(`GeoNetwork search HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    hits?: { hits?: { _source?: { uuid?: string; resourceTitleObject?: { default?: string }; resourceAbstractObject?: { default?: string }; link?: string } }[] };
  };

  const hits = json.hits?.hits ?? [];
  return hits
    .map((h) => h._source)
    .filter(Boolean)
    .map((s) => ({
      uuid: s!.uuid ?? "",
      title: s!.resourceTitleObject?.default,
      abstract: s!.resourceAbstractObject?.default,
      link: s!.link,
    }))
    .filter((r) => r.uuid);
}

export async function fetchGeoNetworkRecord(uuid: string): Promise<unknown> {
  const url = `${GEONETWORK_BASE}/api/records/${encodeURIComponent(uuid)}`;
  const res = await fetch(url, {
    headers: DEFAULT_HEADERS,
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`GeoNetwork record HTTP ${res.status}`);
  }
  return res.json();
}

export async function probeCswCapabilities(): Promise<{ ok: boolean; status: number }> {
  const url = `${CSW_BASE}?service=CSW&version=2.0.2&request=GetCapabilities`;
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  return { ok: res.ok, status: res.status };
}
