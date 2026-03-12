#!/usr/bin/env python3
"""
AmbientaR - Plataforma de Consultoria Ambiental
Arquivo principal de inicialização com melhorias de performance
"""

import os
import sys
import configparser
import time
from pathlib import Path

# Importar logger personalizado
try:
    from apps.ambientar_core.logger import logger
except ImportError:
    # Fallback para logging padrão se o módulo não estiver disponível
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

def load_config():
    """Carrega as configurações do arquivo config/ambientar.conf"""
    with logger.operation_start("carregar_configuracoes"):
        try:
            config = configparser.ConfigParser()
            config_path = Path("config/ambientar.conf")
            
            if config_path.exists():
                config.read(config_path)
                logger.info("Configurações carregadas com sucesso")
                return config
            else:
                logger.error("Arquivo de configuração não encontrado", 
                           config_path=str(config_path))
                return None
                
        except Exception as e:
            logger.error("Erro ao carregar configurações", error=e)
            return None

def setup_environment():
    """Configura o ambiente Python para o projeto"""
    with logger.operation_start("configurar_ambiente"):
        try:
            # Adiciona o diretório apps ao PYTHONPATH
            apps_path = Path("apps")
            if apps_path.exists():
                sys.path.insert(0, str(apps_path.absolute()))
                logger.info("Diretório apps adicionado ao PYTHONPATH")
            else:
                logger.warning("Diretório apps não encontrado")
            
            # Configura variáveis de ambiente
            os.environ.setdefault('AMBIENTAR_CONFIG', 'config/ambientar.conf')
            os.environ.setdefault('AMBIENTAR_ROOT', str(Path.cwd().absolute()))
            
            logger.info("Variáveis de ambiente configuradas")
            
        except Exception as e:
            logger.error("Erro ao configurar ambiente", error=e)
            raise

def check_dependencies():
    """Verifica se todas as dependências estão instaladas"""
    with logger.operation_start("verificar_dependencias"):
        required_packages = [
            'fastapi', 'uvicorn', 'sqlalchemy', 'pymysql', 
            'jinja2', 'reportlab'
        ]
        
        missing_packages = []
        
        for package in required_packages:
            try:
                __import__(package)
                logger.info(f"Pacote {package} disponível")
            except ImportError:
                missing_packages.append(package)
                logger.warning(f"Pacote {package} não encontrado")
        
        if missing_packages:
            logger.error(f"Pacotes faltando: {', '.join(missing_packages)}")
            return False
        
        logger.info("Todas as dependências estão disponíveis")
        return True

def check_database_connection():
    """Verifica conectividade com banco de dados"""
    with logger.operation_start("verificar_conexao_banco"):
        try:
            import pymysql
            from config import ambientar
            
            config = ambientar.load_config()
            if not config:
                logger.error("Configuração não disponível para teste de banco")
                return False
            
            # Tentar conexão
            connection = pymysql.connect(
                host=config.get('common', 'db_host', fallback='localhost'),
                port=int(config.get('common', 'db_port', fallback=3306)),
                user=config.get('common', 'db_user', fallback='root'),
                password=config.get('common', 'db_password', fallback=''),
                connect_timeout=10
            )
            
            connection.close()
            logger.info("Conexão com banco de dados estabelecida com sucesso")
            return True
            
        except Exception as e:
            logger.error("Falha na conexão com banco de dados", error=e)
            return False

def main():
    """Função principal com tratamento de erros robusto"""
    start_time = time.time()
    
    try:
        logger.info("🚀 Iniciando AmbientaR - Plataforma de Consultoria Ambiental")
        
        # Carrega configurações
        config = load_config()
        if not config:
            logger.error("Falha ao carregar configurações. Encerrando aplicação.")
            return 1
        
        # Configura ambiente
        setup_environment()
        
        # Verifica dependências
        if not check_dependencies():
            logger.error("Dependências não satisfeitas. Encerrando aplicação.")
            return 1
        
        # Verifica banco de dados (opcional para desenvolvimento)
        if config.get('development', 'debug', fallback='false').lower() == 'true':
            if not check_database_connection():
                logger.warning("Banco de dados não disponível, mas continuando em modo desenvolvimento")
        
        logger.info("✅ Ambiente configurado com sucesso!")
        logger.info(f"📁 Diretório raiz: {Path.cwd().absolute()}")
        logger.info(f"🔧 Modo debug: {config.get('development', 'debug', fallback='false')}")
        
        # Aqui será integrado o ERPNext quando estiver disponível
        logger.info("📋 Próximos passos:")
        logger.info("   1. ✅ Dependências Python instaladas")
        logger.info("   2. 🔄 Configurar banco de dados")
        logger.info("   3. 🔄 Integrar ERPNext")
        logger.info("   4. 🔄 Configurar módulos ambientais")
        
        total_time = time.time() - start_time
        logger.performance("inicializacao_completa", total_time)
        
        return 0
        
    except Exception as e:
        logger.error("Erro crítico durante inicialização", error=e)
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
