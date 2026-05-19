'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OpportunityStage } from '@/lib/types';
import { useAuth } from '@/firebase';
import { Settings, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

import { canAccessCrm } from '@/lib/role-guards';

const DEFAULT_STAGES: OpportunityStage[] = [
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechado Ganho',
  'Fechado Perdido',
];

type CrmLocalSettings = {
  monthlyTargetBRL: number;
};

const STORAGE_KEY = 'ambientar.crm.settings.v1';

function readLocalSettings(): CrmLocalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { monthlyTargetBRL: 50000 };
    const parsed = JSON.parse(raw) as Partial<CrmLocalSettings>;
    return {
      monthlyTargetBRL: typeof parsed.monthlyTargetBRL === 'number' && Number.isFinite(parsed.monthlyTargetBRL)
        ? parsed.monthlyTargetBRL
        : 50000,
    };
  } catch {
    return { monthlyTargetBRL: 50000 };
  }
}

function writeLocalSettings(v: CrmLocalSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
}

export default function CrmSettingsPage() {
  const { user } = useAuth();
  const [monthlyTarget, setMonthlyTarget] = useState<string>('50000');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const s = readLocalSettings();
    setMonthlyTarget(String(s.monthlyTargetBRL));
    setIsHydrated(true);
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const monthlyTargetNumber = useMemo(() => {
    const n = Number(monthlyTarget);
    return Number.isFinite(n) ? n : 0;
  }, [monthlyTarget]);

  const handleSave = () => {
    writeLocalSettings({ monthlyTargetBRL: monthlyTargetNumber });
  };

  if (!user || !canAccessCrm(user.role)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Configurações do CRM" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>Você não tem permissão para acessar as configurações do CRM.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Configurações do CRM" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Metas (local)
              </CardTitle>
              <CardDescription>
                Configurações locais no navegador (sem gravar no Firebase ainda).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta mensal (R$)</Label>
                <Input
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  inputMode="numeric"
                  placeholder="Ex: 50000"
                />
                <div className="text-xs text-muted-foreground">
                  Prévia: {isHydrated ? formatCurrency(monthlyTargetNumber) : '—'}
                </div>
              </div>
              <Button onClick={handleSave} className="gap-2">
                <Settings className="h-4 w-4" />
                Salvar
              </Button>
              <div className="text-xs text-muted-foreground">
                Próximo passo: persistir no Firestore (ex.: `crmSettings`) com controle de acesso por role.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fases do pipeline</CardTitle>
              <CardDescription>
                Fases padrão usadas em oportunidades e no Kanban.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {DEFAULT_STAGES.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className={cn(
                    s === 'Fechado Ganho' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' : '',
                    s === 'Fechado Perdido' ? 'bg-red-500/15 text-red-700 border-red-500/30' : ''
                  )}
                >
                  {s}
                </Badge>
              ))}
              <div className="w-full text-xs text-muted-foreground mt-2">
                Se você quiser customização (renomear/adicionar fases), o ideal é centralizar em uma configuração e migrar as oportunidades existentes.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permissões do CRM</CardTitle>
            <CardDescription>
              Acesso às telas do CRM atualmente segue o padrão de roles internas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>- **Admin / Supervisor / Sales / Financial**: acesso às páginas do CRM</div>
            <div>- **Criação/edição de oportunidades**: `admin`, `sales`, `supervisor`</div>
            <div className="text-xs text-muted-foreground">
              Se você quiser regra “vendedor só vê o que é dele”, precisamos filtrar por `assignedTo` nas queries e ajustar as regras do Firestore.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

