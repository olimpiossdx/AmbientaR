import { endOfMonth, format, isWithinInterval, startOfMonth } from "date-fns";
import type { ManualMonitoringLog, TelemetryReading, WaterPermit } from "@/lib/types";

export interface ComplianceAlert {
  type: "volume_diario" | "horas_diarias" | "volume_mensal" | "dias_mensais";
  message: string;
  date?: string;
  severity: "critical" | "warning";
}

export interface ComplianceReport {
  totalVolumeMonth: number;
  usagePercentage: number;
  alerts: ComplianceAlert[];
  isExceeded: boolean;
  activeDaysCount: number;
}

type DailyBucket = { volume: number; hours: number };

function hoursBetween(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) {
    return 0;
  }
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) return 0;
  return (endMinutes - startMinutes) / 60;
}

export function mapManualLogToTelemetryReading(log: ManualMonitoringLog): TelemetryReading {
  const hoursActive = hoursBetween(log.startTime, log.endTime);
  const volumeM3 = hoursActive * (log.flowRateM3h || 0);
  const isoDate = log.logDate ? new Date(log.logDate).toISOString() : new Date().toISOString();

  return {
    id: log.id,
    outorgaId: log.outorgaId,
    pontoId: log.pontoId,
    timestamp: isoDate,
    pumpOn: hoursActive > 0,
    flowRateM3h: log.flowRateM3h,
    hoursActive,
    volumeM3,
  };
}

/**
 * Calcula conformidade de uso hídrico (mensal + verificações diárias).
 */
export function calculateWaterCompliance(
  readings: TelemetryReading[],
  permit: WaterPermit,
  referenceDate: Date = new Date(),
): ComplianceReport {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  const monthlyReadings = readings.filter((r) => {
    const d = new Date(r.timestamp);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });

  const dailyData = new Map<string, DailyBucket>();

  monthlyReadings.forEach((r) => {
    const dayKey = format(new Date(r.timestamp), "yyyy-MM-dd");
    const current = dailyData.get(dayKey) || { volume: 0, hours: 0 };
    dailyData.set(dayKey, {
      volume: current.volume + (r.volumeM3 || 0),
      hours: current.hours + (r.hoursActive || 0),
    });
  });

  const totalVolumeMonth = monthlyReadings.reduce((acc, curr) => acc + (curr.volumeM3 || 0), 0);
  const limitMensal = permit.monthlyLimitM3 || 0;
  const usagePercentage = limitMensal > 0 ? (totalVolumeMonth / limitMensal) * 100 : 0;

  const alerts: ComplianceAlert[] = [];

  if (limitMensal > 0 && totalVolumeMonth > limitMensal) {
    alerts.push({
      type: "volume_mensal",
      severity: "critical",
      message: `Volume mensal excedido: ${totalVolumeMonth.toFixed(2)} m³ (Limite: ${limitMensal.toFixed(2)} m³)`,
    });
  }

  dailyData.forEach((data, day) => {
    if (permit.dailyLimitM3 && data.volume > permit.dailyLimitM3) {
      alerts.push({
        type: "volume_diario",
        severity: "warning",
        message: `Volume diário excedido em ${day}: ${data.volume.toFixed(2)} m³`,
        date: day,
      });
    }
    if (permit.dailyHoursLimit && data.hours > permit.dailyHoursLimit) {
      alerts.push({
        type: "horas_diarias",
        severity: "warning",
        message: `Horas de operação excedidas em ${day}: ${data.hours.toFixed(2)} h`,
        date: day,
      });
    }
  });

  const activeDaysCount = dailyData.size;
  if (permit.maxDaysPerMonth && activeDaysCount > permit.maxDaysPerMonth) {
    alerts.push({
      type: "dias_mensais",
      severity: "critical",
      message: `Limite de dias de captação excedido: ${activeDaysCount} dias ativos (Limite: ${permit.maxDaysPerMonth})`,
    });
  }

  return {
    totalVolumeMonth,
    usagePercentage,
    alerts,
    isExceeded: limitMensal > 0 && totalVolumeMonth > limitMensal,
    activeDaysCount,
  };
}
