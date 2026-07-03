#!/usr/bin/env python3
"""
Script de instalação automatizada do AmbientaR
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

class AmbientarInstaller:
    """Instalador automatizado do AmbientaR"""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.python_version = sys.version_info
        self.os_type = platform.system().lower()
        
    def check_requirements(self):
        """Verifica requisitos do sistema"""
        print("🔍 Verificando requisitos do sistema...")
        
        # Verifica Python
        if self.python_version < (3, 8):
            print("❌ Python 3.8+ é necessário")
            return False
        
        print(f"✅ Python {self.python_version.major}.{self.python_version.minor} detectado")
        
        # Verifica se pip está disponível
        try:
            subprocess.run([sys.executable, "-m", "pip", "--version"], 
                         check=True, capture_output=True)
            print("✅ pip disponível")
        except subprocess.CalledProcessError:
            print("❌ pip não está disponível")
            return False
        
        # Verifica se virtualenv está disponível
        try:
            subprocess.run([sys.executable, "-m", "venv", "--help"], 
                         check=True, capture_output=True)
            print("✅ venv disponível")
        except subprocess.CalledProcessError:
            print("❌ venv não está disponível")
            return False
        
        return True
    
    def create_virtual_environment(self):
        """Cria ambiente virtual Python"""
        print("🐍 Criando ambiente virtual...")
        
        venv_path = self.project_root / "venv"
        
        if venv_path.exists():
            print("✅ Ambiente virtual já existe")
            return str(venv_path)
        
        try:
            subprocess.run([sys.executable, "-m", "venv", str(venv_path)], 
                         check=True)
            print("✅ Ambiente virtual criado com sucesso")
            return str(venv_path)
        except subprocess.CalledProcessError as e:
            print(f"❌ Erro ao criar ambiente virtual: {e}")
            return None
    
    def install_dependencies(self, venv_path):
        """Instala dependências Python"""
        print("📦 Instalando dependências...")
        
        # Determina o executável pip do ambiente virtual
        if self.os_type == "windows":
            pip_path = Path(venv_path) / "Scripts" / "pip.exe"
        else:
            pip_path = Path(venv_path) / "bin" / "pip"
        
        if not pip_path.exists():
            print(f"❌ pip não encontrado em {pip_path}")
            return False
        
        try:
            # Atualiza pip usando python -m pip
            python_path = Path(venv_path) / "Scripts" / "python.exe" if self.os_type == "windows" else Path(venv_path) / "bin" / "python"
            subprocess.run([str(python_path), "-m", "pip", "install", "--upgrade", "pip"], 
                         check=True)
            
            # Instala dependências
            requirements_file = self.project_root / "requirements.txt"
            if requirements_file.exists():
                subprocess.run([str(python_path), "-m", "pip", "install", "-r", str(requirements_file)], 
                             check=True)
                print("✅ Dependências instaladas com sucesso")
                return True
            else:
                print("❌ Arquivo requirements.txt não encontrado")
                return False
                
        except subprocess.CalledProcessError as e:
            print(f"❌ Erro ao instalar dependências: {e}")
            return False
    
    def setup_database(self):
        """Configura banco de dados"""
        print("🗄️ Configurando banco de dados...")
        
        # Cria diretório para dados do banco
        db_dir = self.project_root / "data" / "db"
        db_dir.mkdir(parents=True, exist_ok=True)
        
        print("✅ Diretório do banco de dados criado")
        return True
    
    def create_directories(self):
        """Cria diretórios necessários"""
        print("📁 Criando diretórios...")
        
        directories = [
            "output/reports",
            "logs",
            "data/uploads",
            "data/temp",
            "static",
            "media"
        ]
        
        for dir_path in directories:
            full_path = self.project_root / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
            print(f"✅ Criado: {dir_path}")
    
    def create_env_file(self):
        """Cria arquivo .env com variáveis de ambiente"""
        print("⚙️ Criando arquivo .env...")
        
        env_content = """# Configurações do Ambiente AmbientaR
AMBIENTAR_ENV=development
AMBIENTAR_DEBUG=true
AMBIENTAR_SECRET_KEY=your-secret-key-here-change-in-production

# Banco de dados
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ambientar
DB_USER=root
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Configurações da aplicação
AMBIENTAR_HOST=0.0.0.0
AMBIENTAR_PORT=8000
AMBIENTAR_WORKERS=4

# Configurações de upload
MAX_FILE_SIZE=100MB
ALLOWED_EXTENSIONS=pdf,doc,docx,xls,xlsx,zip,rar,jpg,jpeg,png,gif
"""
        
        env_file = self.project_root / ".env"
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print("✅ Arquivo .env criado")
    
    def run_tests(self):
        """Executa testes básicos"""
        print("🧪 Executando testes básicos...")
        
        try:
            # Testa importação dos módulos
            sys.path.insert(0, str(self.project_root))
            
            from apps.ambientar_core.models import EnvironmentalProject, EnvironmentalCategory
            from apps.ambientar_reports.report_generator import EnvironmentalReportGenerator
            
            print("✅ Módulos importados com sucesso")
            
            # Testa criação de objetos
            project = EnvironmentalProject(
                id="TEST001",
                name="Projeto de Teste",
                description="Descrição de teste",
                category=EnvironmentalCategory.AIR,
                status="planning",
                client_id="TEST_CLIENT",
                start_date="2024-01-01",
                end_date="2024-12-31",
                budget=10000.00,
                team_members=["Teste"],
                created_at="2024-01-01",
                updated_at="2024-01-01"
            )
            
            print("✅ Objetos criados com sucesso")
            return True
            
        except Exception as e:
            print(f"❌ Erro nos testes: {e}")
            return False
    
    def install(self):
        """Executa instalação completa"""
        print("🚀 Iniciando instalação do AmbientaR")
        print("=" * 50)
        
        # Verifica requisitos
        if not self.check_requirements():
            print("❌ Requisitos não atendidos. Instalação abortada.")
            return False
        
        # Cria ambiente virtual
        venv_path = self.create_virtual_environment()
        if not venv_path:
            print("❌ Falha ao criar ambiente virtual. Instalação abortada.")
            return False
        
        # Instala dependências
        if not self.install_dependencies(venv_path):
            print("❌ Falha ao instalar dependências. Instalação abortada.")
            return False
        
        # Configura banco de dados
        if not self.setup_database():
            print("❌ Falha ao configurar banco de dados. Instalação abortada.")
            return False
        
        # Cria diretórios
        self.create_directories()
        
        # Cria arquivo .env
        self.create_env_file()
        
        # Executa testes
        if not self.run_tests():
            print("⚠️ Testes falharam, mas instalação continuará")
        
        print("\n" + "=" * 50)
        print("🎉 Instalação concluída com sucesso!")
        print("\n📋 Próximos passos:")
        print("   1. Configure o arquivo .env com suas credenciais")
        print("   2. Inicie o banco de dados (MariaDB/MySQL)")
        print("   3. Execute: python main.py")
        print("   4. Acesse: http://localhost:8000")
        print("\n🐳 Para usar Docker:")
        print("   docker-compose up -d")
        
        return True

def main():
    """Função principal"""
    installer = AmbientarInstaller()
    
    try:
        success = installer.install()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n❌ Instalação cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro durante instalação: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
