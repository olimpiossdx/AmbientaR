"""
Gerador de relatórios ambientais com melhorias de performance
"""

import os
import asyncio
import signal
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
import json
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReportTimeoutError(Exception):
    """Exceção para timeout de relatórios"""
    pass

class EnvironmentalReportGenerator:
    """Gerador de relatórios ambientais com melhorias de performance"""
    
    def __init__(self, template_path: str = "templates", output_path: str = "output", 
                 timeout: int = 60, max_workers: int = 3):
        self.template_path = Path(template_path)
        self.output_path = Path(output_path)
        self.output_path.mkdir(parents=True, exist_ok=True)
        self.timeout = timeout
        self.max_workers = max_workers
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        
        # Configurar timeout handler
        signal.signal(signal.SIGALRM, self._timeout_handler)
    
    def _timeout_handler(self, signum, frame):
        """Handler para timeout de operações"""
        raise ReportTimeoutError(f"Operação excedeu o timeout de {self.timeout} segundos")
    
    def generate_study_report(self, study_data: Dict[str, Any], template_name: str = "default") -> str:
        """Gera relatório de estudo ambiental com timeout"""
        try:
            logger.info(f"Iniciando geração de relatório para estudo {study_data.get('id', 'N/A')}")
            
            # Executar com timeout
            future = self.executor.submit(self._generate_study_report_internal, study_data, template_name)
            result = future.result(timeout=self.timeout)
            
            logger.info(f"Relatório gerado com sucesso: {result}")
            return result
            
        except TimeoutError:
            logger.error(f"Timeout ao gerar relatório de estudo {study_data.get('id', 'N/A')}")
            raise ReportTimeoutError(f"Geração de relatório excedeu {self.timeout} segundos")
        except Exception as e:
            logger.error(f"Erro ao gerar relatório de estudo: {str(e)}")
            raise Exception(f"Erro ao gerar relatório: {str(e)}")
    
    def _generate_study_report_internal(self, study_data: Dict[str, Any], template_name: str) -> str:
        """Implementação interna da geração de relatório"""
        try:
            # Carrega template
            template = self._load_template(template_name)
            
            # Processa dados
            processed_data = self._process_study_data(study_data)
            
            # Gera relatório
            report_content = self._apply_template(template, processed_data)
            
            # Salva relatório
            filename = f"study_report_{study_data.get('id', datetime.now().strftime('%Y%m%d_%H%M%S'))}.html"
            output_file = self.output_path / filename
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report_content)
            
            return str(output_file)
            
        except Exception as e:
            logger.error(f"Erro interno na geração de relatório: {str(e)}")
            raise
    
    def generate_project_report(self, project_data: Dict[str, Any], template_name: str = "project") -> str:
        """Gera relatório de projeto ambiental com timeout"""
        try:
            logger.info(f"Iniciando geração de relatório para projeto {project_data.get('id', 'N/A')}")
            
            # Executar com timeout
            future = self.executor.submit(self._generate_project_report_internal, project_data, template_name)
            result = future.result(timeout=self.timeout)
            
            logger.info(f"Relatório de projeto gerado com sucesso: {result}")
            return result
            
        except TimeoutError:
            logger.error(f"Timeout ao gerar relatório de projeto {project_data.get('id', 'N/A')}")
            raise ReportTimeoutError(f"Geração de relatório excedeu {self.timeout} segundos")
        except Exception as e:
            logger.error(f"Erro ao gerar relatório de projeto: {str(e)}")
            raise Exception(f"Erro ao gerar relatório: {str(e)}")
    
    def _generate_project_report_internal(self, project_data: Dict[str, Any], template_name: str) -> str:
        """Implementação interna da geração de relatório de projeto"""
        try:
            # Carrega template
            template = self._load_template(template_name)
            
            # Processa dados
            processed_data = self._process_project_data(project_data)
            
            # Gera relatório
            report_content = self._apply_template(template, processed_data)
            
            # Salva relatório
            filename = f"project_report_{project_data.get('id', datetime.now().strftime('%Y%m%d_%H%M%S'))}.html"
            output_file = self.output_path / filename
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report_content)
            
            return str(output_file)
            
        except Exception as e:
            logger.error(f"Erro interno na geração de relatório de projeto: {str(e)}")
            raise
    
    def _load_template(self, template_name: str) -> str:
        """Carrega template HTML com timeout"""
        try:
            template_file = self.template_path / f"{template_name}.html"
            
            if not template_file.exists():
                logger.warning(f"Template {template_name} não encontrado, usando padrão")
                return self._get_default_template()
            
            with open(template_file, 'r', encoding='utf-8') as f:
                return f.read()
                
        except Exception as e:
            logger.error(f"Erro ao carregar template {template_name}: {str(e)}")
            return self._get_default_template()
    
    def _get_default_template(self) -> str:
        """Retorna template padrão"""
        return """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Relatório Ambiental</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .header {{ text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; }}
        .section {{ margin: 20px 0; }}
        .section h2 {{ color: #4CAF50; }}
        .data-table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
        .data-table th, .data-table td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        .data-table th {{ background-color: #f2f2f2; }}
        .footer {{ margin-top: 40px; text-align: center; color: #666; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório Ambiental</h1>
        <p>Gerado em: {generation_date}</p>
    </div>
    
    {content}
    
    <div class="footer">
        <p>AmbientaR - Plataforma de Consultoria Ambiental</p>
    </div>
</body>
</html>"""
    
    def _process_study_data(self, study_data: Dict[str, Any]) -> Dict[str, Any]:
        """Processa dados do estudo para o template"""
        return {
            "title": f"Relatório de Estudo: {study_data.get('study_type', 'N/A')}",
            "project_id": study_data.get('project_id', 'N/A'),
            "methodology": study_data.get('methodology', 'N/A'),
            "findings": study_data.get('findings', 'N/A'),
            "recommendations": study_data.get('recommendations', 'N/A'),
            "created_by": study_data.get('created_by', 'N/A'),
            "created_at": study_data.get('created_at', 'N/A'),
            "generation_date": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        }
    
    def _process_project_data(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Processa dados do projeto para o template"""
        return {
            "title": f"Relatório de Projeto: {project_data.get('name', 'N/A')}",
            "description": project_data.get('description', 'N/A'),
            "category": project_data.get('category', 'N/A'),
            "status": project_data.get('status', 'N/A'),
            "budget": f"R$ {project_data.get('budget', 0):,.2f}",
            "start_date": project_data.get('start_date', 'N/A'),
            "end_date": project_data.get('end_date', 'N/A') or 'Em andamento',
            "team_members": ", ".join(project_data.get('team_members', [])),
            "generation_date": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        }
    
    def _apply_template(self, template: str, data: Dict[str, Any]) -> str:
        """Aplica dados ao template"""
        content = ""
        
        if "study_type" in data:
            # Template para estudo
            content = f"""
            <div class="section">
                <h2>Informações do Estudo</h2>
                <table class="data-table">
                    <tr><th>Projeto ID</th><td>{data.get('project_id', 'N/A')}</td></tr>
                    <tr><th>Metodologia</th><td>{data.get('methodology', 'N/A')}</td></tr>
                    <tr><th>Criado por</th><td>{data.get('created_by', 'N/A')}</td></tr>
                    <tr><th>Data de criação</th><td>{data.get('created_at', 'N/A')}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h2>Resultados</h2>
                <p><strong>Descobertas:</strong></p>
                <p>{data.get('findings', 'N/A')}</p>
                
                <p><strong>Recomendações:</strong></p>
                <p>{data.get('recommendations', 'N/A')}</p>
            </div>
            """
        else:
            # Template para projeto
            content = f"""
            <div class="section">
                <h2>Informações do Projeto</h2>
                <table class="data-table">
                    <tr><th>Nome</th><td>{data.get('name', 'N/A')}</td></tr>
                    <tr><th>Descrição</th><td>{data.get('description', 'N/A')}</td></tr>
                    <tr><th>Categoria</th><td>{data.get('category', 'N/A')}</td></tr>
                    <tr><th>Status</th><td>{data.get('status', 'N/A')}</td></tr>
                    <tr><th>Orçamento</th><td>{data.get('budget', 'N/A')}</td></tr>
                    <tr><th>Data de início</th><td>{data.get('start_date', 'N/A')}</td></tr>
                    <tr><th>Data de término</th><td>{data.get('end_date', 'N/A')}</td></tr>
                    <tr><th>Membros da equipe</th><td>{data.get('team_members', 'N/A')}</td></tr>
                </table>
            </div>
            """
        
        return template.format(
            generation_date=data.get('generation_date', 'N/A'),
            content=content
        )
