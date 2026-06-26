#!/usr/bin/env python3
"""
Monitor de Performance para AmbientaR
Monitora continuamente a aplicação para detectar travamentos
"""

import time
import psutil
import threading
import signal
import sys
from datetime import datetime
from pathlib import Path
import json

class PerformanceMonitor:
    """Monitor de performance para detectar travamentos"""
    
    def __init__(self, check_interval: int = 5):
        self.check_interval = check_interval
        self.running = True
        self.alert_thresholds = {
            'cpu_percent': 80.0,      # CPU acima de 80%
            'memory_percent': 85.0,   # Memória acima de 85%
            'response_time': 10.0,    # Resposta acima de 10s
            'disk_io_wait': 20.0      # I/O de disco acima de 20%
        }
        
        # Configurar signal handler para graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handler para sinais de interrupção"""
        print(f"\n🛑 Recebido sinal {signum}, encerrando monitor...")
        self.running = False
    
    def get_system_metrics(self):
        """Coleta métricas do sistema"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_io_counters()
            
            return {
                'timestamp': datetime.now().isoformat(),
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_used_gb': round(memory.used / (1024**3), 2),
                'memory_available_gb': round(memory.available / (1024**3), 2),
                'disk_read_mb': round(disk.read_bytes / (1024**2), 2) if disk else 0,
                'disk_write_mb': round(disk.write_bytes / (1024**2), 2) if disk else 0
            }
        except Exception as e:
            return {
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def check_process_health(self):
        """Verifica saúde dos processos Python"""
        python_processes = []
        
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                if 'python' in proc.info['name'].lower():
                    proc_info = proc.info
                    proc_info['memory_mb'] = round(proc.memory_info().rss / (1024**2), 2)
                    python_processes.append(proc_info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        return python_processes
    
    def check_docker_containers(self):
        """Verifica status dos containers Docker"""
        try:
            import subprocess
            result = subprocess.run(['docker', 'ps', '--format', 'json'], 
                                 capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                containers = []
                for line in result.stdout.strip().split('\n'):
                    if line:
                        try:
                            container_info = json.loads(line)
                            containers.append({
                                'name': container_info.get('Names', 'N/A'),
                                'status': container_info.get('Status', 'N/A'),
                                'ports': container_info.get('Ports', 'N/A')
                            })
                        except json.JSONDecodeError:
                            continue
                return containers
            else:
                return [{'error': 'Docker não disponível ou comando falhou'}]
                
        except Exception as e:
            return [{'error': f'Erro ao verificar Docker: {str(e)}'}]
    
    def generate_health_report(self):
        """Gera relatório de saúde do sistema"""
        system_metrics = self.get_system_metrics()
        process_health = self.check_process_health()
        docker_status = self.check_docker_containers()
        
        report = {
            'system': system_metrics,
            'processes': process_health,
            'docker': docker_status,
            'alerts': []
        }
        
        # Verificar alertas
        if system_metrics.get('cpu_percent', 0) > self.alert_thresholds['cpu_percent']:
            report['alerts'].append({
                'type': 'HIGH_CPU',
                'message': f"CPU em {system_metrics['cpu_percent']}% (limite: {self.alert_thresholds['cpu_percent']}%)",
                'severity': 'WARNING'
            })
        
        if system_metrics.get('memory_percent', 0) > self.alert_thresholds['memory_percent']:
            report['alerts'].append({
                'type': 'HIGH_MEMORY',
                'message': f"Memória em {system_metrics['memory_percent']}% (limite: {self.alert_thresholds['memory_percent']}%)",
                'severity': 'WARNING'
            })
        
        # Verificar processos travados (CPU alta por muito tempo)
        for proc in process_health:
            if proc.get('cpu_percent', 0) > 50:  # CPU acima de 50%
                report['alerts'].append({
                    'type': 'HIGH_PROCESS_CPU',
                    'message': f"Processo {proc.get('name', 'N/A')} (PID: {proc.get('pid', 'N/A')}) usando {proc.get('cpu_percent', 0)}% CPU",
                    'severity': 'INFO'
                })
        
        return report
    
    def save_report(self, report):
        """Salva relatório em arquivo"""
        try:
            logs_dir = Path("logs")
            logs_dir.mkdir(exist_ok=True)
            
            report_file = logs_dir / f"health_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            
            # Manter apenas os últimos 10 relatórios
            health_reports = list(logs_dir.glob("health_report_*.json"))
            if len(health_reports) > 10:
                health_reports.sort()
                for old_report in health_reports[:-10]:
                    old_report.unlink()
                    
        except Exception as e:
            print(f"❌ Erro ao salvar relatório: {e}")
    
    def display_report(self, report):
        """Exibe relatório no console"""
        timestamp = report['system']['timestamp']
        cpu = report['system'].get('cpu_percent', 0)
        memory = report['system'].get('memory_percent', 0)
        
        print(f"\n📊 Relatório de Saúde - {timestamp}")
        print(f"🖥️  CPU: {cpu}% | 💾 Memória: {memory}%")
        
        if report['alerts']:
            print(f"⚠️  Alertas ({len(report['alerts'])}):")
            for alert in report['alerts']:
                print(f"   • {alert['severity']}: {alert['message']}")
        else:
            print("✅ Sistema saudável")
        
        # Mostrar processos Python
        if report['processes']:
            print(f"\n🐍 Processos Python ({len(report['processes'])}):")
            for proc in report['processes'][:3]:  # Mostrar apenas os 3 primeiros
                print(f"   • {proc.get('name', 'N/A')} (PID: {proc.get('pid', 'N/A')}) - CPU: {proc.get('cpu_percent', 0)}%")
    
    def run(self):
        """Executa o monitor continuamente"""
        print("🚀 Iniciando Monitor de Performance do AmbientaR")
        print(f"📡 Verificando a cada {self.check_interval} segundos")
        print("🛑 Pressione Ctrl+C para parar\n")
        
        while self.running:
            try:
                report = self.generate_health_report()
                self.display_report(report)
                self.save_report(report)
                
                # Aguardar próximo check
                time.sleep(self.check_interval)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Erro no monitor: {e}")
                time.sleep(self.check_interval)
        
        print("\n👋 Monitor encerrado")

if __name__ == "__main__":
    try:
        monitor = PerformanceMonitor(check_interval=10)  # Check a cada 10 segundos
        monitor.run()
    except Exception as e:
        print(f"❌ Erro fatal no monitor: {e}")
        sys.exit(1)
