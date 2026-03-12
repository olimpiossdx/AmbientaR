from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import uvicorn

app = FastAPI(title="AmbientaR")

@app.get("/", response_class=HTMLResponse)
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title> AmbientaR - Plataforma de Consultoria Ambiental</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .container { max-width: 1200px; margin: 0 auto; text-align: center; }
            h1 { font-size: 3em; margin-bottom: 20px; }
            .stats { display: flex; justify-content: space-around; margin: 40px 0; }
            .stat-box { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; }
            .menu { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 40px 0; }
            .menu-item { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; text-decoration: none; color: white; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1> AmbientaR</h1>
            <p>Plataforma de Consultoria Ambiental</p>
            <p>Sistema otimizado e livre de travamentos!</p>
            
            <div class="stats">
                <div class="stat-box">
                    <h3>2</h3>
                    <p>Projetos Ativos</p>
                </div>
                <div class="stat-box">
                    <h3>5</h3>
                    <p>Estudos em Andamento</p>
                </div>
            </div>
            
            <div class="menu">
                <a href="/projects" class="menu-item">
                    <h3> Projetos</h3>
                    <p>Gerenciar projetos ambientais</p>
                </a>
                <a href="/studies" class="menu-item">
                    <h3> Estudos</h3>
                    <p>Visualizar estudos ambientais</p>
                </a>
            </div>
        </div>
    </body>
    </html>
    """

@app.get("/projects", response_class=HTMLResponse)
def projects():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Projetos - AmbientaR</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: #4CAF50; color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
            .project { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .back { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/" class="back"> Voltar ao Início</a>
            <div class="header">
                <h1> Projetos Ambientais</h1>
                <p>Gestão e acompanhamento de projetos</p>
            </div>
            
            <div class="project">
                <h2>Estudo de Impacto Ambiental - Mina Verde</h2>
                <p><strong>Status:</strong> Em Andamento</p>
                <p><strong>Descrição:</strong> Avaliação ambiental para mineração sustentável</p>
                <p><strong>Orçamento:</strong> R$ 150.000,00</p>
                <p><strong>Equipe:</strong> Dr. Silva, Eng. Santos, Biól. Costa</p>
            </div>
            
            <div class="project">
                <h2>Monitoramento de Qualidade da Água - Rio Azul</h2>
                <p><strong>Status:</strong> Concluído</p>
                <p><strong>Descrição:</strong> Controle contínuo de parâmetros hídricos</p>
                <p><strong>Orçamento:</strong> R$ 75.000,00</p>
                <p><strong>Equipe:</strong> Eng. Oliveira, Téc. Lima</p>
            </div>
        </div>
    </body>
    </html>
    """

@app.get("/studies", response_class=HTMLResponse)
def studies():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Estudos - AmbientaR</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: #2196F3; color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
            .study { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .back { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/" class="back"> Voltar ao Início</a>
            <div class="header">
                <h1> Estudos Ambientais</h1>
                <p>Visualização e gestão de estudos</p>
            </div>
            
            <div class="study">
                <h2>EIA - Estudo de Impacto Ambiental</h2>
                <p><strong>Projeto:</strong> Mina Verde (PROJ001)</p>
                <p><strong>Metodologia:</strong> Baseada na Resolução CONAMA 001/86</p>
                <p><strong>Responsável:</strong> Dr. Silva</p>
                <p><strong>Descobertas:</strong> Identificados impactos moderados na fauna local</p>
                <p><strong>Recomendações:</strong> Implementar programa de compensação ambiental</p>
            </div>
        </div>
    </body>
    </html>
    """

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
