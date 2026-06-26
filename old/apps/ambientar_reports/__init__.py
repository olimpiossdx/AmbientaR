"""
AmbientaR Reports - Sistema de geração de relatórios ambientais
"""

__version__ = "1.0.0"
__author__ = "AmbientaR Team"
__description__ = "Sistema de relatórios para consultoria ambiental"

def get_version():
    """Retorna a versão atual do módulo"""
    return __version__

def get_info():
    """Retorna informações sobre o módulo"""
    return {
        "name": "ambientar_reports",
        "version": __version__,
        "author": __author__,
        "description": __description__
    }
