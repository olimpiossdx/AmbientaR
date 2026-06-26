#!/usr/bin/env python3
"""
Demonstração do sistema AmbientaR
"""

import sys
import os
from pathlib import Path

# Adiciona o diretório raiz ao PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from apps.ambientar_core.models import (
    EnvironmentalProject, 
    EnvironmentalStudy, 
    ReferenceTerms,
    EnvironmentalCategory, 
    ProjectStatus
)
from apps.ambientar_reports.report_generator import EnvironmentalReportGenerator
from datetime import datetime

def demo_environmental_project():
    """Demonstra criação de projeto ambiental"""
    print("🌱 Criando projeto ambiental de exemplo...")
    
    # Cria projeto
    project = EnvironmentalProject(
        id="PROJ001",
        name="Estudo de Impacto Ambiental - Complexo Industrial",
        description="Avaliação completa dos impactos ambientais de um complexo industrial na região metropolitana",
        category=EnvironmentalCategory.AIR,
        status=ProjectStatus.IN_PROGRESS,
        client_id="CLIENT001",
        start_date=datetime(2024, 1, 15),
        end_date=datetime(2024, 6, 30),
        budget=150000.00,
        team_members=["Dr. Silva", "Eng. Santos", "Biól. Costa"],
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    print(f"✅ Projeto criado: {project.name}")
    return project

def demo_environmental_study():
    """Demonstra criação de estudo ambiental"""
    print("🔬 Criando estudo ambiental de exemplo...")
    
    # Cria estudo
    study = EnvironmentalStudy(
        id="STUDY001",
        project_id="PROJ001",
        study_type="Estudo de Impacto Ambiental (EIA)",
        reference_terms="Resolução CONAMA 001/1986",
        methodology="Metodologia de identificação e avaliação de impactos ambientais",
        findings="Identificados impactos significativos na qualidade do ar e biodiversidade local",
        recommendations="Implementar sistema de filtros avançados e programa de compensação ambiental",
        attachments=["mapas.pdf", "dados_tecnicos.xlsx", "fotos.zip"],
        created_by="Dr. Silva",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    print(f"✅ Estudo criado: {study.study_type}")
    return study

def demo_reference_terms():
    """Demonstra criação de termos de referência"""
    print("📋 Criando termos de referência de exemplo...")
    
    # Cria termos de referência
    terms = ReferenceTerms(
        id="TERMS001",
        name="Termos de Referência para EIA - Complexos Industriais",
        description="Diretrizes para elaboração de estudos de impacto ambiental em complexos industriais",
        category=EnvironmentalCategory.AIR,
        requirements=[
            "Avaliação da qualidade do ar",
            "Análise de emissões atmosféricas",
            "Estudo de dispersão de poluentes",
            "Avaliação de impactos na saúde pública"
        ],
        methodology="Metodologia baseada em modelos matemáticos de dispersão atmosférica",
        deliverables=[
            "Relatório técnico completo",
            "Mapas de concentração de poluentes",
            "Análise de cenários",
            "Programa de monitoramento"
        ],
        standards=[
            "CONAMA 003/1990",
            "NBR 13244",
            "ISO 14001"
        ],
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    print(f"✅ Termos de referência criados: {terms.name}")
    return terms

def demo_report_generation():
    """Demonstra geração de relatórios"""
    print("📊 Gerando relatórios de exemplo...")
    
    # Cria gerador de relatórios
    generator = EnvironmentalReportGenerator(
        template_path="apps/ambientar_reports/templates",
        output_path="output/reports"
    )
    
    # Dados de exemplo
    project_data = {
        "id": "PROJ001",
        "name": "Estudo de Impacto Ambiental - Complexo Industrial",
        "description": "Avaliação completa dos impactos ambientais",
        "category": "Ar",
        "status": "Em andamento",
        "budget": 150000.00,
        "start_date": "15/01/2024",
        "end_date": "30/06/2024",
        "team_members": ["Dr. Silva", "Eng. Santos", "Biól. Costa"]
    }
    
    study_data = {
        "id": "STUDY001",
        "project_id": "PROJ001",
        "study_type": "Estudo de Impacto Ambiental (EIA)",
        "methodology": "Metodologia de identificação e avaliação",
        "findings": "Identificados impactos significativos na qualidade do ar",
        "recommendations": "Implementar sistema de filtros avançados",
        "created_by": "Dr. Silva",
        "created_at": "15/01/2024"
    }
    
    try:
        # Gera relatório de projeto
        project_report = generator.generate_project_report(project_data)
        print(f"✅ Relatório de projeto gerado: {project_report}")
        
        # Gera relatório de estudo
        study_report = generator.generate_study_report(study_data)
        print(f"✅ Relatório de estudo gerado: {study_report}")
        
    except Exception as e:
        print(f"❌ Erro ao gerar relatórios: {e}")

def main():
    """Função principal da demonstração"""
    print("🚀 Iniciando demonstração do AmbientaR")
    print("=" * 50)
    
    # Demonstrações
    project = demo_environmental_project()
    study = demo_environmental_study()
    terms = demo_reference_terms()
    
    print("\n" + "=" * 50)
    print("📋 Resumo dos dados criados:")
    print(f"   Projeto: {project.name}")
    print(f"   Estudo: {study.study_type}")
    print(f"   Termos: {terms.name}")
    
    print("\n" + "=" * 50)
    demo_report_generation()
    
    print("\n" + "=" * 50)
    print("🎉 Demonstração concluída com sucesso!")
    print("📁 Verifique a pasta 'output/reports' para os relatórios gerados")

if __name__ == "__main__":
    main()
