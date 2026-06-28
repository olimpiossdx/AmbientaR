// src/service/http/__tests__/client.test.ts
import { HttpClient } from "../client";
import { standardAdapter } from "../adapters";

type FetchMock = jest.MockedFunction<typeof fetch>;

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    statusText: init?.statusText,
  });
}

describe("HttpClient", () => {
  let fetchMock: FetchMock;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchMock = jest.fn() as FetchMock;
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("normaliza envelope padrao com ok/data/notifications", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        status: "success",
        data: { id: "1", nome: "Ana" },
        notifications: [{ status: "success", message: "Cliente salvo" }],
      }),
    );

    const api = new HttpClient({ baseURL: "https://api.test", adapter: standardAdapter });
    const response = await api.post<{ id: string; nome: string }>("/clientes", {
      nome: "Ana",
    });

    expect(response.ok).toBe(true);
    expect(response.httpStatus).toBe(200);
    expect(response.data?.id).toBe("1");
    expect(response.notifications[0]?.message).toBe("Cliente salvo");
    expect(response.request.url).toBe("https://api.test/clientes");
    expect(response.request.method).toBe("POST");
  });

  it("infere body como JSON e configura Content-Type automaticamente", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, data: null }));

    const api = new HttpClient({ baseURL: "https://api.test" });
    await api.post("/clientes", { nome: "Ana" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(init.body).toBe(JSON.stringify({ nome: "Ana" }));
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("envia FormData sem Content-Type para preservar boundary do browser", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, data: { arquivoId: "abc" } }));

    const api = new HttpClient({
      baseURL: "https://api.test",
      headers: { "Content-Type": "application/json" },
    });
    const formData = new FormData();
    formData.append("file", new Blob(["teste"]), "teste.txt");

    await api.post<{ arquivoId: string }>("/upload", formData);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(init.body).toBe(formData);
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("aplica params na URL", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, data: [] }));

    const api = new HttpClient({ baseURL: "https://api.test" });
    await api.get("/clientes", { params: { page: 1, active: true, empty: null } });

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.test/clientes?page=1&active=true");
  });

  it("faz retry em GET para 503 conforme configuracao global", async () => {
    jest.useFakeTimers();

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ok: false }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { ok: true } }));

    const api = new HttpClient({
      baseURL: "https://api.test",
      retry: {
        attempts: 1,
        delay: 100,
        strategy: "fixed",
        retryOnHttpStatus: [503],
      },
    });

    const promise = api.get<{ ok: boolean }>("/health");
    await jest.advanceTimersByTimeAsync(100);
    const response = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.ok).toBe(true);
    expect(response.request.attempts).toBe(2);
    expect(response.request.retried).toBe(true);
  });

  it("nao faz retry em POST por padrao para evitar duplicidade", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: false }, { status: 503 }));

    const api = new HttpClient({
      baseURL: "https://api.test",
      retry: {
        attempts: 2,
        delay: 1,
        retryOnHttpStatus: [503],
      },
    });

    const response = await api.post("/clientes", { nome: "Ana" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.ok).toBe(false);
  });

  it("faz retry em POST quando retryUnsafeMethods esta habilitado", async () => {
    jest.useFakeTimers();

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ok: false }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { id: "1" } }));

    const api = new HttpClient({
      baseURL: "https://api.test",
      retry: {
        attempts: 1,
        delay: 100,
        strategy: "fixed",
        retryOnHttpStatus: [503],
        retryUnsafeMethods: true,
      },
    });

    const promise = api.post<{ id: string }>("/clientes", { nome: "Ana" });
    await jest.advanceTimersByTimeAsync(100);
    const response = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.ok).toBe(true);
    expect(response.data?.id).toBe("1");
  });

  it("permite sobrescrever retry por request", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: false }, { status: 503 }));

    const api = new HttpClient({
      baseURL: "https://api.test",
      retry: { attempts: 2, delay: 1, retryOnHttpStatus: [503] },
    });

    await api.get("/sem-retry", { retry: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
