"""
Sistema de logging estruturado para AmbientaR
"""

import logging
import logging.handlers
import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

class AmbientarLogger:
    """Logger estruturado para AmbientaR com monitoramento de performance"""
    
    def __init__(self, name: str = "ambientar", log_dir: str = "logs"):
        self.name = name
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Configurar logger principal
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Evitar duplicação de handlers
        if not self.logger.handlers:
            self._setup_handlers()
    
    def _setup_handlers(self):
        """Configura handlers para diferentes tipos de log"""
        
        # Handler para arquivo principal
        main_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / "ambientar.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        main_handler.setLevel(logging.INFO)
        
        # Handler para erros
        error_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / "errors.log",
            maxBytes=5*1024*1024,  # 5MB
            backupCount=3,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        
        # Handler para performance
        perf_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / "performance.log",
            maxBytes=5*1024*1024,  # 5MB
            backupCount=3,
            encoding='utf-8'
        )
        perf_handler.setLevel(logging.INFO)
        
        # Formatters
        main_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        json_formatter = JsonFormatter()
        
        # Aplicar formatters
        main_handler.setFormatter(main_formatter)
        error_handler.setFormatter(json_formatter)
        perf_handler.setFormatter(json_formatter)
        
        # Adicionar handlers
        self.logger.addHandler(main_handler)
        self.logger.addHandler(error_handler)
        self.logger.addHandler(perf_handler)
    
    def info(self, message: str, **kwargs):
        """Log de informação"""
        self.logger.info(message, extra=kwargs)
    
    def error(self, message: str, error: Optional[Exception] = None, **kwargs):
        """Log de erro com contexto"""
        if error:
            kwargs['error_type'] = type(error).__name__
            kwargs['error_message'] = str(error)
        
        self.logger.error(message, extra=kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log de aviso"""
        self.logger.warning(message, extra=kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log de debug"""
        self.logger.debug(message, extra=kwargs)
    
    def performance(self, operation: str, duration: float, **kwargs):
        """Log de performance"""
        perf_data = {
            'operation': operation,
            'duration_ms': round(duration * 1000, 2),
            'timestamp': datetime.now().isoformat(),
            **kwargs
        }
        
        # Log para arquivo de performance
        perf_logger = logging.getLogger(f"{self.name}.performance")
        perf_logger.info(json.dumps(perf_data))
        
        # Log para console se performance for lenta
        if duration > 5.0:  # Mais de 5 segundos
            self.warning(f"Operação lenta detectada: {operation} levou {duration:.2f}s", **kwargs)
    
    def operation_start(self, operation: str, **kwargs):
        """Marca início de operação para medição de performance"""
        return OperationTimer(self, operation, **kwargs)

class OperationTimer:
    """Context manager para medir tempo de operações"""
    
    def __init__(self, logger: AmbientarLogger, operation: str, **kwargs):
        self.logger = logger
        self.operation = operation
        self.kwargs = kwargs
        self.start_time = None
    
    def __enter__(self):
        self.start_time = datetime.now()
        self.logger.info(f"Iniciando operação: {self.operation}", **self.kwargs)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            duration = (datetime.now() - self.start_time).total_seconds()
            self.logger.performance(self.operation, duration, **self.kwargs)
            
            if exc_type:
                self.logger.error(f"Operação falhou: {self.operation}", 
                                error=exc_val, **self.kwargs)
            else:
                self.logger.info(f"Operação concluída: {self.operation}", **self.kwargs)

class JsonFormatter(logging.Formatter):
    """Formatter para logs em JSON"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }
        
        # Adicionar campos extras
        for key, value in record.__dict__.items():
            if key not in ['timestamp', 'level', 'logger', 'message', 'name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 'filename', 'module', 'lineno', 'funcName', 'created', 'msecs', 'relativeCreated', 'thread', 'threadName', 'processName', 'process', 'getMessage', 'exc_info', 'exc_text', 'stack_info']:
                log_entry[key] = value
        
        return json.dumps(log_entry, ensure_ascii=False)

# Instância global do logger
logger = AmbientarLogger()
