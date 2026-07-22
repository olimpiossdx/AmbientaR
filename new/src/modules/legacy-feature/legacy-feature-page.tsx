import { useLocation } from "@tanstack/react-router";
import {
 Badge,
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
 PageHeader,
} from "../../componentes";
import type { NavigationItem } from "../../app/navigation/navigation.types";
import { adminNavigationItems } from "../navigation/navigation-registry";

type FlatNavigationItem = {
 item: NavigationItem;
 module: NavigationItem;
 parents: NavigationItem[];
 legacyPath: string;
 legacyHref: string;
};

function text(value: NavigationItem["label"]): string {
 if (typeof value === "string") return value;
 if (typeof value === "number") return String(value);
 return "Modulo";
}

function stripAppPrefix(pathname: string): string {
 if (pathname === "/app") return "/";
 if (pathname.startsWith("/app/")) return pathname.slice("/app".length);
 return pathname;
}

function normalizePath(pathname: string): string {
 const [pathOnly] = pathname.split("?", 1);
 const normalized = pathOnly || "/";
 return normalized.endsWith("/") && normalized.length > 1 ? normalized.slice(0, -1) : normalized;
}

function flattenNavigation(
 items: NavigationItem[],
 parents: NavigationItem[] = [],
 out: FlatNavigationItem[] = [],
): FlatNavigationItem[] {
 for (const item of items) {
  const nextParents = [...parents, item];
  const legacyHref = item.legacyHref ?? item.to;
  if (legacyHref && legacyHref.startsWith("/")) {
   const module = parents[0] ?? item;
   out.push({
    item,
    module,
    parents,
    legacyHref,
    legacyPath: normalizePath(legacyHref),
   });
  }
  if (item.children?.length) flattenNavigation(item.children, nextParents, out);
 }
 return out;
}

const flatNavigation = flattenNavigation(adminNavigationItems);

function legacyHrefForLocation(pathname: string, searchStr: string, hash: string): string {
 const legacyPath = stripAppPrefix(pathname);
 return `${legacyPath}${searchStr}${hash}`;
}

function scoreMatch(entry: FlatNavigationItem, legacyHref: string): number {
 const currentPath = normalizePath(legacyHref);
 const currentFull = legacyHref;
 if (entry.legacyHref === currentFull) return entry.legacyHref.length + 1000;
 if (entry.legacyPath === currentPath) return entry.legacyPath.length + 500;
 if (currentPath.startsWith(`${entry.legacyPath}/`)) return entry.legacyPath.length;
 return -1;
}

function findCurrentItem(legacyHref: string): FlatNavigationItem | null {
 let best: FlatNavigationItem | null = null;
 let bestScore = -1;
 for (const entry of flatNavigation) {
  const score = scoreMatch(entry, legacyHref);
  if (score > bestScore) {
   best = entry;
   bestScore = score;
  }
 }
 return bestScore >= 0 ? best : null;
}

function moduleChildren(module: NavigationItem): FlatNavigationItem[] {
 return flatNavigation.filter((entry) => entry.module === module && entry.item !== module);
}

function pathToInternalHref(legacyHref: string): string {
 const [pathPart, queryPart] = legacyHref.split("?", 2);
 const [pathname, hashPart] = (pathPart ?? "").split("#", 2);
 const normalizedPathname = pathname === "/" ? "" : pathname;
 const search = queryPart ? `?${queryPart}` : "";
 const hash = hashPart ? `#${hashPart}` : "";
 return `/app${normalizedPathname}${search}${hash}`;
}

export function LegacyFeaturePage() {
 const location = useLocation();
 const legacyHref = legacyHrefForLocation(
  location.pathname,
  typeof window === "undefined" ? "" : window.location.search,
  typeof window === "undefined" ? "" : window.location.hash,
 );
 const current = findCurrentItem(legacyHref);
 const module = current?.module;
 const siblings = module ? moduleChildren(module) : [];

 return (
  <div className="min-h-full bg-slate-100">
   <PageHeader
    eyebrow={module ? text(module.label) : "Modulo"}
    title={current ? text(current.item.label) : "Funcionalidade mapeada"}
    description="Esta rota ja foi integrada ao shell modular do novo painel. A tela final deve ser implementada dentro da pasta do modulo responsavel, mantendo service, validacao, regras e componentes agrupados."
   />

   <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
     <Card>
      <CardHeader>
       <CardTitle>Contrato da funcionalidade</CardTitle>
       <CardDescription>
        Use este bloco como checklist minimo ao substituir o placeholder pela tela real.
       </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-slate-700">
       <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Nova rota: {location.pathname}</Badge>
        <Badge variant="outline">Legado: {legacyHref}</Badge>
       </div>
       <ul className="grid gap-2 pl-4">
        <li>Implementar a pagina em `new/src/modules/{text(module?.label ?? "modulo").toLowerCase()}/pages`.</li>
        <li>Centralizar chamadas em `service.ts`, usando `new/src/service/api.ts`.</li>
        <li>Colocar validacoes de front em `validation.ts` e repetir as regras no backend/API.</li>
        <li>Reusar componentes de `new/src/componentes` antes de criar componentes novos.</li>
        <li>Manter as permissoes sincronizadas entre menu, rota e API.</li>
       </ul>
      </CardContent>
     </Card>

     <Card>
      <CardHeader>
       <CardTitle>Permissoes</CardTitle>
       <CardDescription>Claim declarada para esta funcionalidade.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
       {current?.item.claim ? (
        <Badge variant="secondary">
         {current.item.claim.claimType}:{current.item.claim.claimValue}
        </Badge>
       ) : (
        <span className="text-sm text-slate-500">Sem claim explícita durante a migração.</span>
       )}
      </CardContent>
     </Card>
    </div>

    <Card>
     <CardHeader>
      <CardTitle>Funcionalidades do agrupador</CardTitle>
      <CardDescription>
       Rotas ja navegaveis no `new`; cada uma deve ganhar implementacao propria no modulo.
      </CardDescription>
     </CardHeader>
     <CardContent>
      {siblings.length > 0 ? (
       <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {siblings.map((entry) => (
         <a
          key={`${entry.legacyHref}-${text(entry.item.label)}`}
          className="rounded-md border border-slate-200 bg-white p-3 text-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          href={pathToInternalHref(entry.legacyHref)}
         >
          <span className="block font-medium text-slate-900">{text(entry.item.label)}</span>
          <span className="mt-1 block break-all text-xs text-slate-500">{entry.legacyHref}</span>
         </a>
        ))}
       </div>
      ) : (
       <p className="text-sm text-slate-500">Nenhuma rota filha encontrada para este agrupador.</p>
      )}
     </CardContent>
    </Card>
   </main>
  </div>
 );
}
