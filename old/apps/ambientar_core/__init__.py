"""
AmbientaR Core - Módulo principal para funcionalidades ambientais
"""

__version__ = "1.0.0"
__author__ = "AmbientaR Team"
__description__ = "Módulo core para funcionalidades ambientais do AmbientaR"

def get_version():
    """Retorna a versão atual do módulo"""
    return __version__

def get_info():
    """Retorna informações sobre o módulo"""
    return {
        "name": "ambientar_core",
        "version": __version__,
        "author": __author__,
        "description": __description__
    }
