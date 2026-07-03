# Escopo de dados por perfil – AmbientaR (app offline)

Lista de coleções e critério de acesso por perfil para uso em app mobile (download offline e sincronização).

---

## Perfis (roles)

admin, supervisor, gestor, technical, sales, financial, diretor_fauna, client

---

## Perfil **client**

Dados vinculados ao **CPF/CNPJ** do usuário (`user.cpf`, `user.cnpjs` em `users/{uid}`).

| Coleção / recurso | Filtro / critério |
|-------------------|-------------------|
| users | documento do próprio usuário |
| empreendedores | where('cpfCnpj', 'in', [user.cpf, ...user.cnpjs]) |
| projects | where('empreendedorId', 'in', ids dos empreendedores) |
| clients | where('cpfCnpj', 'in', [user.cpf, ...user.cnpjs]) |
| invoices, contracts, commercialProposals | por clientId / escopo do cliente |
| licenses, outorgas | where('empreendedorId', 'in', ids dos empreendedores) |
| companySettings | branding, companyProfile (leitura) |

Outras coleções acessíveis ao cliente na web (estudos, condicionantes) devem filtrar por empreendedorId/clientId derivados do CPF/CNPJ.

---

## Outros perfis

Cache sob demanda (não baixar tudo de uma vez) ou download limitado por tela/período. Escrita sujeita às regras do Firestore.

---

Uso: definir **o que** baixar por perfil na camada offline; o banco local deve conter apenas dados que o usuário poderia ver online.
