import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button, Card, CardContent, Input, PageHeader, Select, Skeleton } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { entrepreneursService } from "../entrepreneurs/entrepreneurs.service";
import { projectsService } from "./projects.service";
import { utmSirgas2000ToDecimal } from "./coordinates";
import { projectStatuses, type ProjectInput } from "./projects.types";

type Geo = {
  datum?: string;
  format?: string;
  local?: string;
  additionalLocationInfo?: string;
  hydrographicBasin?: string;
  hydrographicSubBasin?: string;
  upgrh?: string;
  nearestWaterCourse?: string;
  latLong?: {
    lat?: { grau?: string; min?: string; seg?: string };
    long?: { grau?: string; min?: string; seg?: string };
  };
  utm?: { x?: string; y?: string; fuso?: string };
  decimal?: { lat: number; lng: number };
};
type EntrepreneurChoice = { id: string; name: string };
const ownerConditions = ["Proprietário", "Arrendatário", "Parceiro", "Posseiro", "Outros"] as const;
const datumOptions = ["SIRGAS2000", "SAD-69", "WGS-84", "Córrego Alegre"] as const;

export function NewProjectPage() {
  return <ProjectFormPage />;
}
export function EditProjectPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  return <ProjectFormPage key={id} id={id} />;
}

function ProjectFormPage({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [input, setInput] = useState<ProjectInput>({
    empreendedorId: "", activity: "", propertyName: "", status: "Em Andamento",
    geographicLocation: { datum: "SIRGAS2000", format: "UTM", utm: { fuso: "23" } },
  });
  const [version, setVersion] = useState(0);
  const [entrepreneurs, setEntrepreneurs] = useState<EntrepreneurChoice[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [ready, setReady] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [revision, setRevision] = useState(0);
  const geo = (input.geographicLocation && typeof input.geographicLocation === "object"
    ? input.geographicLocation : {}) as Geo;

  useEffect(() => {
    const controller = new AbortController();
    entrepreneursService.list("", 1, controller.signal, 100)
      .then((items) => {
        if (!controller.signal.aborted) setEntrepreneurs(items.items.map((item) => ({ id: item.id, name: item.name })));
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Falha ao carregar empreendedores.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    setReady(false);
    setError("");
    projectsService.get(id, controller.signal)
      .then((item) => {
        if (!controller.signal.aborted) {
          setInput(item);
          setVersion(item.version);
          setReady(true);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Falha ao carregar empreendimento.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, revision]);

  function setField(name: string, value: unknown) {
    setInput((current) => ({ ...current, [name]: value }));
  }
  function setGeo(name: string, value: unknown) {
    setInput((current) => {
      const location = { ...((current.geographicLocation as Geo | undefined) ?? {}) };
      if (name === "format" || name === "datum") delete location.decimal;
      return { ...current, geographicLocation: { ...location, [name]: value } };
    });
  }
  function setGeoPart(group: "latLong" | "utm", name: string, value: string) {
    const currentGeo = (input.geographicLocation as Geo | undefined) ?? {};
    const currentGroup = currentGeo[group] ?? {};
    if (group === "latLong") {
      const [axis, part] = name.split(".") as ["lat" | "long", "grau" | "min" | "seg"];
      setGeo(group, {
        ...currentGroup,
        [axis]: { ...((currentGroup as NonNullable<Geo["latLong"]>)[axis] ?? {}), [part]: value },
      });
    } else {
      setInput((current) => {
        const location = { ...((current.geographicLocation as Geo | undefined) ?? {}) };
        delete location.decimal;
        return { ...current, geographicLocation: { ...location, utm: { ...((location.utm) ?? {}), [name]: value } } };
      });
    }
  }
  const field = (name: string, label: string, required = false, maxLength = 200) => (
    <Input
      name={name}
      label={label}
      required={required}
      maxLength={maxLength}
      value={typeof input[name] === "string" ? input[name] as string : ""}
      onChange={(event) => setField(name, event.target.value)}
    />
  );
  const geoField = (name: keyof Geo, label: string) => (
    <Input
      name={`geographic-${name}`}
      label={label}
      maxLength={200}
      value={typeof geo[name] === "string" ? geo[name] as string : ""}
      onChange={(event) => setGeo(name, event.target.value)}
    />
  );

  function validateAndBuild(): ProjectInput | null {
    const location = (input.geographicLocation as Geo | undefined) ?? {};
    if (!location.format) return input;
    if (location.format === "Lat/Long") {
      const lat = location.latLong?.lat ?? {};
      const lng = location.latLong?.long ?? {};
      const parts = [lat.grau, lat.min, lat.seg, lng.grau, lng.min, lng.seg];
      if (parts.every((part) => !String(part ?? "").trim())) return input;
      const toDecimal = (axis: { grau?: string; min?: string; seg?: string }, maximum: number) => {
        const degrees = Number(axis.grau);
        const minutes = Number(axis.min || 0);
        const seconds = Number(String(axis.seg || 0).replace(",", "."));
        if (!axis.grau?.trim() || !Number.isInteger(degrees) || degrees < 0 || degrees > maximum || !Number.isFinite(minutes) || minutes < 0 || minutes >= 60 || !Number.isFinite(seconds) || seconds < 0 || seconds >= 60 || (degrees === maximum && (minutes > 0 || seconds > 0))) return null;
        return degrees + minutes / 60 + seconds / 3600;
      };
      const latitude = toDecimal(lat, 90);
      const longitude = toDecimal(lng, 180);
      if (latitude === null || longitude === null) {
        setError("Informe latitude e longitude completas. Graus devem estar no limite do eixo e minutos/segundos entre 0 e 59.");
        return null;
      }
      return {
        ...input,
        geographicLocation: {
          ...location,
          decimal: { lat: -Math.abs(latitude), lng: -Math.abs(longitude) },
        },
      };
    }
    const x = location.utm?.x?.trim() ?? "";
    const y = location.utm?.y?.trim() ?? "";
    if (!x && !y) {
      const { decimal: _stale, ...withoutDecimal } = location;
      void _stale;
      return { ...input, geographicLocation: withoutDecimal };
    }
    if (!/^\d{6}$/.test(x) || !/^\d{7}$/.test(y) || !["22", "23", "24"].includes(location.utm?.fuso ?? "")) {
      setError("Para UTM, informe X com 6 dígitos, Y com 7 dígitos e o fuso 22, 23 ou 24.");
      return null;
    }
    const { decimal: _stale, ...withoutDecimal } = location;
    if (location.datum !== "SIRGAS2000") return { ...input, geographicLocation: withoutDecimal };
    const decimal = utmSirgas2000ToDecimal(Number(x), Number(y), Number(location.utm?.fuso));
    if (!decimal) {
      setError("As coordenadas UTM estão fora da faixa válida para conversão no hemisfério sul.");
      return null;
    }
    return { ...input, geographicLocation: { ...withoutDecimal, decimal } };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!input.empreendedorId) {
      setError("Selecione o empreendedor responsável.");
      return;
    }
    const payload = validateAndBuild();
    if (!payload) return;
    setSaving(true);
    try {
      if (id) {
        await projectsService.update(id, version, payload);
        setVersion((current) => current + 1);
      } else {
        await projectsService.create(payload);
      }
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const lat = geo.latLong?.lat ?? {};
  const lng = geo.latLong?.long ?? {};
  const utmPreview = geo.datum === "SIRGAS2000" && geo.format === "UTM" && /^\d{6}$/.test(geo.utm?.x ?? "") && /^\d{7}$/.test(geo.utm?.y ?? "")
    ? utmSirgas2000ToDecimal(Number(geo.utm?.x), Number(geo.utm?.y), Number(geo.utm?.fuso))
    : null;
  const coord = (axis: "lat" | "long", part: "grau" | "min" | "seg", label: string) => (
    <Input
      name={`coord-${axis}-${part}`}
      label={label}
      inputMode="decimal"
      maxLength={12}
      value={(axis === "lat" ? lat : lng)[part] ?? ""}
      onChange={(event) => setGeoPart("latLong", `${axis}.${part}`, event.target.value)}
    />
  );

  return (
    <div>
      <PageHeader title={id ? "Editar empreendimento" : "Novo empreendimento"} description="Dados cadastrais do empreendimento." />
      <main className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8">
        {error ? <Alert variant="error" title="Não foi possível concluir">{error}{id ? <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Recarregar cadastro</Button> : null}</Alert> : null}
        {loading ? <Skeleton className="h-80 w-full" /> : saved ? (
          <Card><CardContent className="space-y-4 p-6"><p role="status">Empreendimento salvo.</p><Button onClick={() => void navigate({ to: "/app/projects", search: { q: "", page: 1, status: "" } })}>Voltar para empreendimentos</Button></CardContent></Card>
        ) : ready ? (
          <Card><CardContent className="p-6">
            <form className="space-y-6" onSubmit={(event) => void submit(event)}>
              <fieldset disabled={saving} className="space-y-5">
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold">Dados do empreendimento</h2>
                  <Select name="entrepreneur" label="Empreendedor responsável" required value={input.empreendedorId} onChange={(event) => setField("empreendedorId", event.target.value)}>
                    <option value="">Selecione</option>{entrepreneurs.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </Select>
                  {entrepreneurs.length === 0 ? <p className="text-sm text-amber-800">Cadastre primeiro o empreendedor responsável na seção Empreendedores.</p> : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field("propertyName", "Nome do imóvel / empreendimento", true)}
                    {field("fantasyName", "Nome fantasia")}
                    {field("activity", "Atividade principal", true)}
                    {field("subActivity", "Subatividade")}
                    {field("cnpj", "CNPJ", false, 18)}
                    {field("incraCode", "Código INCRA")}
                    {field("matricula", "Matrícula do imóvel")}
                    {field("comarca", "Comarca")}
                    {field("inscricaoEstadual", "Inscrição estadual")}
                    {field("inscricaoMunicipal", "Inscrição municipal")}
                  </div>
                  <Select name="zoneType" label="Zona do imóvel" value={typeof input.zoneType === "string" ? input.zoneType : ""} onChange={(event) => setField("zoneType", event.target.value)}>
                    <option value="">Selecione</option><option>Rural</option><option>Residencial</option><option>Comercial</option><option>Não</option>
                  </Select>
                  <Select name="status" label="Situação do cadastro" value={typeof input.status === "string" ? input.status : "Em Andamento"} onChange={(event) => setField("status", event.target.value)}>
                    {projectStatuses.map((status) => <option key={status}>{status}</option>)}
                  </Select>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Condição do empreendedor no imóvel</span>
                    <div className="flex flex-wrap gap-4">{ownerConditions.map((condition) => {
                      const selected = Array.isArray(input.ownerCondition) ? input.ownerCondition as string[] : [];
                      return <label key={condition} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(condition)} onChange={(event) => setField("ownerCondition", event.target.checked ? [...selected, condition] : selected.filter((item) => item !== condition))} />{condition}</label>;
                    })}</div>
                  </div>
                </section>
                <section className="space-y-4 border-t pt-5">
                  <h2 className="text-lg font-semibold">Endereço do imóvel</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field("address", "Logradouro")}{field("numero", "Número")}{field("district", "Distrito ou localidade")}{field("caixaPostal", "Caixa postal")}{field("municipio", "Município")}{field("uf", "UF", false, 2)}{field("cep", "CEP", false, 9)}
                  </div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={input.correspondenceIsSame === true} onChange={(event) => setField("correspondenceIsSame", event.target.checked)} />Endereço de correspondência é o mesmo do imóvel</label>
                  {input.correspondenceIsSame !== true ? <div className="grid gap-4 sm:grid-cols-2">{field("correspondenceAddress", "Endereço de correspondência")}{field("correspondenceCaixaPostal", "Caixa postal de correspondência")}{field("correspondenceMunicipio", "Município de correspondência")}{field("correspondenceUf", "UF de correspondência", false, 2)}{field("correspondenceCep", "CEP de correspondência", false, 9)}</div> : null}
                </section>
                <section className="space-y-4 border-t pt-5">
                  <h2 className="text-lg font-semibold">Localização geográfica</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select name="geographic-datum" label="Datum" value={geo.datum ?? "SIRGAS2000"} onChange={(event) => setGeo("datum", event.target.value)}>{datumOptions.map((datum) => <option key={datum}>{datum}</option>)}</Select>
                    <Select name="geographic-format" label="Formato da coordenada" value={geo.format ?? "UTM"} onChange={(event) => setGeo("format", event.target.value)}><option>UTM</option><option>Lat/Long</option></Select>
                  </div>
                  {geo.format === "Lat/Long" ? <div className="grid gap-4 sm:grid-cols-3">{coord("lat", "grau", "Latitude — graus")}{coord("lat", "min", "Latitude — minutos")}{coord("lat", "seg", "Latitude — segundos")}{coord("long", "grau", "Longitude — graus")}{coord("long", "min", "Longitude — minutos")}{coord("long", "seg", "Longitude — segundos")}</div> : <div className="grid gap-4 sm:grid-cols-3"><Input name="utm-x" label="UTM X — 6 dígitos" inputMode="numeric" maxLength={6} value={geo.utm?.x ?? ""} onChange={(event) => setGeoPart("utm", "x", event.target.value)} /><Input name="utm-y" label="UTM Y — 7 dígitos" inputMode="numeric" maxLength={7} value={geo.utm?.y ?? ""} onChange={(event) => setGeoPart("utm", "y", event.target.value)} /><Select name="utm-fuso" label="Fuso UTM" value={geo.utm?.fuso ?? "23"} onChange={(event) => setGeoPart("utm", "fuso", event.target.value)}><option>22</option><option>23</option><option>24</option></Select></div>}
                  {utmPreview ? <p className="text-sm text-slate-600" role="status">Coordenada decimal derivada: {utmPreview.lat.toFixed(6)}, {utmPreview.lng.toFixed(6)} (SIRGAS 2000)</p> : null}
                  <div className="grid gap-4 sm:grid-cols-2">{geoField("local", "Local")}{geoField("additionalLocationInfo", "Informações adicionais")}{geoField("hydrographicBasin", "Bacia hidrográfica")}{geoField("hydrographicSubBasin", "Sub-bacia hidrográfica")}{geoField("upgrh", "UPGRH")}{geoField("nearestWaterCourse", "Curso d’água mais próximo")}</div>
                </section>
              </fieldset>
              <div className="flex gap-3"><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate({ to: "/app/projects", search: { q: "", page: 1, status: "" } })}>Cancelar</Button><Button type="submit" isLoading={saving} disabled={entrepreneurs.length === 0}>Salvar</Button></div>
              <p className="text-xs text-slate-500">As fichas técnicas das Listagens A–H e os arquivos CAR/perímetro serão migrados nas próximas fatias.</p>
            </form>
          </CardContent></Card>
        ) : null}
      </main>
    </div>
  );
}
