'use client';

/**
 * Painéis de configuração do “Seletor de cálculo”, alinhados à rotina do Mata Nativa
 * (amostragem casual simples/estratificada/curva coletora; est. diamétrica; estruturas).
 * Os cálculos numéricos em si serão ligados aos dados de parcelas/árvores em fases seguintes.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inventoryActionButtonClass } from '../inventory-module-chrome';

const STAT_COLS = ['Média', 'Máxima', 'Mínima', 'Variância', 'Desvio Padrão', 'Mediana'] as const;

function StatisticMatrix({ rows }: { rows: string[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Parâmetro</TableHead>
            {STAT_COLS.map((c) => (
              <TableHead key={c} className="text-center min-w-[72px]">
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row}>
              <TableCell className="font-medium">{row}</TableCell>
              {STAT_COLS.map((c) => (
                <TableCell key={c} className="text-center">
                  <Checkbox aria-label={`${row} — ${c}`} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export type AmostragemRunPayload = Record<string, unknown>;

export function AmostragemPanel({
  onClose,
  className,
  runCollectorRef,
}: {
  onClose: () => void;
  className?: string;
  /** Quando definido, expõe função síncrona que devolve o snapshot dos parâmetros para gravar em `calculationRuns`. */
  runCollectorRef?: React.MutableRefObject<(() => AmostragemRunPayload) | null>;
}) {
  const [amostTab, setAmostTab] = React.useState('casual-simples');
  const [csDecimais, setCsDecimais] = React.useState(5);
  const [csAreaHa, setCsAreaHa] = React.useState('');
  const [csErroPct, setCsErroPct] = React.useState('');
  const [csProb, setCsProb] = React.useState(90);
  const [csParam, setCsParam] = React.useState('volume');
  const [ceDecimais, setCeDecimais] = React.useState(3);
  const [ceAreaHa, setCeAreaHa] = React.useState('');
  const [ceErro, setCeErro] = React.useState('');
  const [ceProb, setCeProb] = React.useState(90);
  const [ccDecimais, setCcDecimais] = React.useState(5);

  React.useEffect(() => {
    if (!runCollectorRef) return;
    runCollectorRef.current = () => {
      const base: AmostragemRunPayload = { module: 'Amostragem', tab: amostTab };
      if (amostTab === 'casual-simples') {
        return {
          ...base,
          casualSimples: {
            casasDecimais: csDecimais,
            areaTotalHa: csAreaHa === '' ? null : Number(csAreaHa),
            erroPercentual: csErroPct === '' ? null : Number(csErroPct),
            nivelProbabilidadePercentual: csProb,
            parametro: csParam,
          },
        };
      }
      if (amostTab === 'casual-estratificada') {
        return {
          ...base,
          casualEstratificada: {
            casasDecimais: ceDecimais,
            areaTotalHa: ceAreaHa === '' ? null : Number(ceAreaHa),
            erroPercentual: ceErro === '' ? null : Number(ceErro),
            nivelProbabilidadePercentual: ceProb,
          },
        };
      }
      return {
        ...base,
        curvaColetora: {
          casasDecimais: ccDecimais,
        },
      };
    };
    return () => {
      runCollectorRef.current = null;
    };
  }, [
    runCollectorRef,
    amostTab,
    csDecimais,
    csAreaHa,
    csErroPct,
    csProb,
    csParam,
    ceDecimais,
    ceAreaHa,
    ceErro,
    ceProb,
    ccDecimais,
  ]);

  return (
    <div className={cn('bg-background rounded-lg border flex flex-col h-full min-h-0', className)}>
      <Tabs value={amostTab} onValueChange={setAmostTab} className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-start justify-between gap-2 border-b p-3">
          <TabsList className="flex h-auto min-w-0 flex-1 flex-wrap gap-1">
            <TabsTrigger value="casual-simples">Casual Simples</TabsTrigger>
            <TabsTrigger value="casual-estratificada">Casual Estratificada</TabsTrigger>
            <TabsTrigger value="curva-coletora">Curva Coletora</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0" aria-label="Fechar painel">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
          <TabsContent value="casual-simples" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="casas-decimais">Casas decimais</Label>
                  <Input
                    id="casas-decimais"
                    type="number"
                    className="mt-1 w-24"
                    value={csDecimais}
                    onChange={(e) => setCsDecimais(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-4 rounded-md border p-4">
                  <h3 className="font-medium">Parâmetros da Amostragem</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="area-total">Área total do inventário (ha)</Label>
                      <Input
                        id="area-total"
                        type="number"
                        placeholder="Ex.: 89,18"
                        value={csAreaHa}
                        onChange={(e) => setCsAreaHa(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="erro">Erro (%)</Label>
                      <Input
                        id="erro"
                        type="number"
                        placeholder="Ex.: 10"
                        value={csErroPct}
                        onChange={(e) => setCsErroPct(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="probabilidade">Nível de Probabilidade (%)</Label>
                      <Input
                        id="probabilidade"
                        type="number"
                        value={csProb}
                        onChange={(e) => setCsProb(Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Parâmetro</Label>
                      <Select value={csParam} onValueChange={setCsParam}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="n">N (número de indivíduos)</SelectItem>
                          <SelectItem value="volume">Volume</SelectItem>
                          <SelectItem value="ab">Área basal (AB)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 rounded-md border p-4">
                  <h3 className="font-medium">Volume</h3>
                  <RadioGroup defaultValue="todos" className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="todos" id="vol-todos" />
                      <Label htmlFor="vol-todos" className="font-normal">
                        Para todos os estratos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="especie" id="vol-especie" />
                      <Label htmlFor="vol-especie" className="font-normal">
                        Por espécie
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="estrato" id="vol-estrato" />
                      <Label htmlFor="vol-estrato" className="font-normal">
                        Por estrato
                      </Label>
                    </div>
                  </RadioGroup>
                  <div>
                    <Label>Fórmula (exemplo Schumacher–Hall / regressão)</Label>
                    <div className="mt-1 rounded-md bg-muted p-2 font-mono text-xs leading-relaxed">
                      EXP(-9.703579751+(2.4233966884*LN(D))+(0.449805…*LN(HT)))
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="font-medium">Apresentar árvores</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox id="considerar-fuste" />
                  <Label htmlFor="considerar-fuste" className="font-normal">
                    Considerar cada fuste como um indivíduo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="arvore-adulta" defaultChecked />
                  <Label htmlFor="arvore-adulta" className="font-normal">
                    Árvore adulta
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="arvore-regeneracao" />
                  <Label htmlFor="arvore-regeneracao" className="font-normal">
                    Árvore de regeneração
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="casual-estratificada" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="casas-decimais-est">Casas decimais</Label>
                  <Input
                    id="casas-decimais-est"
                    type="number"
                    className="mt-1 w-24"
                    value={ceDecimais}
                    onChange={(e) => setCeDecimais(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-4 rounded-md border p-4">
                  <h3 className="font-medium">Parâmetros da amostragem</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Área total do inventário (ha)</Label>
                      <Input type="number" placeholder="89,18" value={ceAreaHa} onChange={(e) => setCeAreaHa(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Erro (%)</Label>
                      <Input type="number" placeholder="10" value={ceErro} onChange={(e) => setCeErro(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Nível de probabilidade (%)</Label>
                      <Input type="number" value={ceProb} onChange={(e) => setCeProb(Number(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Parâmetro</Label>
                      <Select defaultValue="volume">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="volume">Volume</SelectItem>
                          <SelectItem value="n">N</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 rounded-md border p-4">
                  <h3 className="font-medium">Volume por estrato</h3>
                  <p className="text-sm text-muted-foreground">
                    Fórmulas por estrato (como no Mata Nativa): ligação aos cadastros de fórmulas do projeto virá na
                    etapa seguinte.
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estrato</TableHead>
                        <TableHead>Seletor de fórmulas</TableHead>
                        <TableHead>Fórmula</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {['Estrato 1', 'Estrato 2', 'Estrato 3'].map((e) => (
                        <TableRow key={e}>
                          <TableCell>{e}</TableCell>
                          <TableCell>
                            <Button type="button" variant="outline" size="sm">
                              Escolher…
                            </Button>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                            —
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-4 rounded-md border p-4">
                  <h3 className="font-medium">Apresentar árvores</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="est-fuste" />
                    <Label htmlFor="est-fuste" className="font-normal">
                      Considerar cada fuste como um indivíduo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="est-adulta" defaultChecked />
                    <Label htmlFor="est-adulta" className="font-normal">
                      Árvore adulta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="est-regen" />
                    <Label htmlFor="est-regen" className="font-normal">
                      Árvore de regeneração
                    </Label>
                  </div>
                </div>
                <div className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Tipo de alocação</Label>
                    <Select defaultValue="proporcional">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proporcional">Alocação proporcional</SelectItem>
                        <SelectItem value="uniforme">Uniforme</SelectItem>
                        <SelectItem value="otima">Número ótimo por estrato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Nível de inclusão</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="i1">Inclusão 1</SelectItem>
                        <SelectItem value="i2">Inclusão 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="curva-coletora" className="mt-0 space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="space-y-1">
                <Label htmlFor="casas-decimais-curva">Casas decimais</Label>
                <Input
                  id="casas-decimais-curva"
                  type="number"
                  className="mt-1 w-24"
                  value={ccDecimais}
                  onChange={(e) => setCcDecimais(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="exibir-nome-simplificado" />
                <Label htmlFor="exibir-nome-simplificado" className="font-normal">
                  Exibir nome científico simplificado
                </Label>
              </div>
            </div>
            <div className="space-y-2 rounded-md border p-4">
              <Label>Apresentar árvores</Label>
              <div className="flex flex-col space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="arvore-adulta-curva" defaultChecked />
                  <Label htmlFor="arvore-adulta-curva" className="font-normal">
                    Árvore adulta
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="arvore-regeneracao-curva" />
                  <Label htmlFor="arvore-regeneracao-curva" className="font-normal">
                    Árvore de regeneração
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Método de ordenação</Label>
              <Select defaultValue="parcelas">
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parcelas">Parcelas</SelectItem>
                  <SelectItem value="aleatorio">Aleatório</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export function EstDiametricaPanel({ onClose, className }: { onClose: () => void; className?: string }) {
  return (
    <div className={cn('bg-background rounded-lg border flex flex-col h-full min-h-0', className)}>
      <div className="flex items-center justify-between gap-2 border-b p-3 shrink-0">
        <p className="text-sm font-medium text-muted-foreground px-1">Est. diamétrica — escopo do cálculo</p>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar painel">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <Tabs defaultValue="especie-classe">
          <TabsList className="mb-4 flex h-auto max-w-full flex-wrap gap-1">
            {(
              [
                ['especie', 'Espécie'],
                ['classe', 'Classe'],
                ['parcela', 'Parcela'],
                ['arvore', 'Árvore'],
                ['especie-classe', 'Espécie-Classe'],
                ['especie-parcela', 'Espécie-Parcela'],
                ['parcela-classe', 'Parcela-Classe'],
                ['bdq', 'BDq'],
              ] as const
            ).map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="especie" className="text-sm text-muted-foreground">
            Parâmetros por espécie (N, AB, densidades…) — espelho do Mata Nativa; execução após dados de árvores.
          </TabsContent>
          <TabsContent value="classe" className="text-sm text-muted-foreground">
            Distribuição apenas por classe diamétrica.
          </TabsContent>
          <TabsContent value="parcela" className="text-sm text-muted-foreground">
            Agregação por parcela (Vol/m³, Vol/ha, médias de HT/DAP…).
          </TabsContent>
          <TabsContent value="arvore" className="text-sm text-muted-foreground">
            Nível árvore individual.
          </TabsContent>
          <TabsContent value="especie-classe" className="mt-0 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="font-medium">Calcular</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Casas decimais</Label>
                    <Input type="number" defaultValue={3} className="w-24" />
                  </div>
                  <div className="space-y-1">
                    <Label>Variável</Label>
                    <Select defaultValue="dap">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dap">DAP</SelectItem>
                        <SelectItem value="cap">CAP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Definição das classes</Label>
                    <Select defaultValue="intervalo">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intervalo">Intervalo de classes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Cálc. árv. com fuste</Label>
                    <Select defaultValue="gq">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gq">Média quadrática</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Exibir</Label>
                    <Select defaultValue="centro">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centro">Centro de classe</SelectItem>
                        <SelectItem value="limite">Limite de classe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Limite inferior</Label>
                    <Input type="number" defaultValue={0} />
                  </div>
                  <div className="space-y-1">
                    <Label>Amplitude</Label>
                    <Input type="number" defaultValue={10} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="lim-ultima" defaultChecked />
                      <Label htmlFor="lim-ultima" className="font-normal text-sm">
                        Lim. inf. última classe
                      </Label>
                    </div>
                    <Input type="number" defaultValue={30} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-3 rounded-md border p-4">
                  <h3 className="font-medium">Apresentar árvores</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="diam-adulta" defaultChecked />
                    <Label htmlFor="diam-adulta" className="font-normal">
                      Árvore adulta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="diam-regen" />
                    <Label htmlFor="diam-regen" className="font-normal">
                      Árvore de regeneração
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="diam-vi" />
                    <Label htmlFor="diam-vi" className="font-normal">
                      Ordenar por VI (valor de importância)
                    </Label>
                  </div>
                </div>
                <div className="space-y-2 rounded-md border p-4">
                  <h3 className="font-medium">Parâmetros</h3>
                  <div className="flex flex-wrap gap-3">
                    {['N', 'AB', 'DA', 'DoA', 'Pres/Aus'].map((p) => (
                      <div key={p} className="flex items-center space-x-2">
                        <Checkbox id={`p-${p}`} defaultChecked={p === 'N'} />
                        <Label htmlFor={`p-${p}`} className="font-normal">
                          {p}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm">
                      Usar parâmetros salvos
                    </Button>
                    <Button type="button" variant="outline" size="sm">
                      Salvar parâmetros
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2 rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">Outros parâmetros (ex.: volume)</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">
                    Inserir
                  </Button>
                  <Button size="sm" variant="outline">
                    Excluir
                  </Button>
                </div>
              </div>
              <Tabs defaultValue="vol-formula">
                <TabsList>
                  <TabsTrigger value="vol-formula">Por fórmula</TabsTrigger>
                  <TabsTrigger value="vol-especie">Por espécie</TabsTrigger>
                </TabsList>
                <TabsContent value="vol-formula" className="pt-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Casas dec.</TableHead>
                        <TableHead>Por ha</TableHead>
                        <TableHead>Fórmula</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                          Sem linhas — importar da grelha de fórmulas do projeto (como “Importar fórmulas” no Mata
                          Nativa).
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="vol-especie" className="pt-3 text-sm text-muted-foreground">
                  Parâmetros adicionais por espécie.
                </TabsContent>
              </Tabs>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="exibir-nomes-param" defaultChecked />
                <Label htmlFor="exibir-nomes-param" className="font-normal">
                  Exibir nome dos parâmetros
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Estatística</h3>
                <Button type="button" variant="outline" size="sm">
                  Todos
                </Button>
                <Button type="button" variant="outline" size="sm">
                  Nenhum
                </Button>
              </div>
              <StatisticMatrix rows={['HT', 'HC']} />
            </div>
          </TabsContent>
          <TabsContent value="especie-parcela" className="text-sm text-muted-foreground">
            Cruzamento espécie × parcela.
          </TabsContent>
          <TabsContent value="parcela-classe" className="text-sm text-muted-foreground">
            Parcela × classe diamétrica.
          </TabsContent>
          <TabsContent value="bdq" className="text-sm text-muted-foreground">
            Coeficiente de De Liocourt (BDq).
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function EstruturasPanel({ onClose, className }: { onClose: () => void; className?: string }) {
  return (
    <div className={cn('bg-background rounded-lg border flex flex-col h-full min-h-0', className)}>
      <div className="flex items-center justify-between gap-2 border-b p-3 shrink-0">
        <p className="text-sm font-medium text-muted-foreground px-1">Estruturas da vegetação</p>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar painel">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <Tabs defaultValue="horizontal">
          <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
            <TabsTrigger value="horizontal">Estrutura horizontal</TabsTrigger>
            <TabsTrigger value="vertical-soc">Estrutura vertical — pos. sociológica</TabsTrigger>
            <TabsTrigger value="vertical-reg">Estrutura vertical — reg. natural</TabsTrigger>
            <TabsTrigger value="categ">Categ. de tamanho — reg. natural</TabsTrigger>
          </TabsList>
          <TabsContent value="horizontal" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-md border p-4">
                <div className="space-y-1">
                  <Label>Casas decimais</Label>
                  <Input type="number" defaultValue={3} className="w-24" />
                </div>
                <div className="space-y-1">
                  <Label>Agrupar por</Label>
                  <Select defaultValue="parcela">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parcela">Parcela</SelectItem>
                      <SelectItem value="especie">Espécie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Calcular por</Label>
                  <Select defaultValue="especie">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especie">Espécie</SelectItem>
                      <SelectItem value="parcela">Parcela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                  <Label>Apresentar árvores</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="eh-adulta" defaultChecked />
                    <Label htmlFor="eh-adulta" className="font-normal">
                      Árvore adulta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="eh-regen" />
                    <Label htmlFor="eh-regen" className="font-normal">
                      Árvore de regeneração
                    </Label>
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="font-medium">Apresentar árvores</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="eh-fuste" />
                    <Label htmlFor="eh-fuste" className="font-normal">
                      Considerar cada fuste como um indivíduo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="eh-sem-ind" />
                    <Label htmlFor="eh-sem-ind" className="font-normal">
                      Apresentar espécies sem indivíduos relacionados
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="eh-nome-simp" />
                    <Label htmlFor="eh-nome-simp" className="font-normal">
                      Exibir nome científico simplificado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="eh-ordenar-vi" />
                    <Label htmlFor="eh-ordenar-vi" className="font-normal">
                      Ordenar por VI (valor de importância)
                    </Label>
                  </div>
                </div>
                <div className="space-y-2 border-t pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium">Estatística</h3>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" className={inventoryActionButtonClass('insert')}>
                        Todos
                      </Button>
                      <Button type="button" size="sm" variant="outline" className={inventoryActionButtonClass('delete')}>
                        Nenhum
                      </Button>
                    </div>
                  </div>
                  <StatisticMatrix rows={['HT', 'HC', 'DAP', 'CAP']} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Parâmetros fitossociológicos (N, U, AB, DA/DR, FA/FR, DoA/DoR, VC, VI) serão calculados a partir das
                  parcelas e árvores cadastradas.
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="vertical-soc" className="space-y-4 text-sm text-muted-foreground">
            Classes de altura (variável HT), parâmetros N, DA, DR, DoA, DoR — alinhado ao fluxo “posição sociológica”
            do Mata Nativa.
          </TabsContent>
          <TabsContent value="vertical-reg" className="text-sm text-muted-foreground">
            Regeneração natural por altura / categorias.
          </TabsContent>
          <TabsContent value="categ" className="text-sm text-muted-foreground">
            Categorias de tamanho em regeneração.
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function GenericCalculoPanel({
  title,
  onClose,
  className,
}: {
  title: string;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center rounded-lg border bg-background p-8', className)}>
      <p className="mb-4 text-center text-muted-foreground">
        Módulo <span className="font-medium text-foreground">{title}</span> — formulários e resultados (tabelas,
        exportação Excel/Word, gráficos) seguirão o mesmo padrão do Mata Nativa após ligação aos dados do projeto.
      </p>
      <Button variant="outline" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );
}
