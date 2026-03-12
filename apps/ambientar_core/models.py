"""
Modelos de dados para o módulo core ambiental
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class EnvironmentalCategory(Enum):
    """Categorias ambientais"""
    AIR = "air"
    WATER = "water"
    SOIL = "soil"
    NOISE = "noise"
    BIODIVERSITY = "biodiversity"
    WASTE = "waste"

class ProjectStatus(Enum):
    """Status dos projetos"""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    APPROVED = "approved"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@dataclass
class EnvironmentalProject:
    """Modelo para projetos ambientais"""
    id: str
    name: str
    description: str
    category: EnvironmentalCategory
    status: ProjectStatus
    client_id: str
    start_date: datetime
    end_date: Optional[datetime]
    budget: float
    team_members: List[str]
    created_at: datetime
    updated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o projeto para dicionário"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category.value,
            "status": self.status.value,
            "client_id": self.client_id,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "budget": self.budget,
            "team_members": self.team_members,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

@dataclass
class EnvironmentalStudy:
    """Modelo para estudos ambientais"""
    id: str
    project_id: str
    study_type: str
    reference_terms: str
    methodology: str
    findings: str
    recommendations: str
    attachments: List[str]
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o estudo para dicionário"""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "study_type": self.study_type,
            "reference_terms": self.reference_terms,
            "methodology": self.methodology,
            "findings": self.findings,
            "recommendations": self.recommendations,
            "attachments": self.attachments,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

@dataclass
class ReferenceTerms:
    """Modelo para termos de referência"""
    id: str
    name: str
    description: str
    category: EnvironmentalCategory
    requirements: List[str]
    methodology: str
    deliverables: List[str]
    standards: List[str]
    created_at: datetime
    updated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte os termos de referência para dicionário"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category.value,
            "requirements": self.requirements,
            "methodology": self.methodology,
            "deliverables": self.deliverables,
            "standards": self.standards,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
