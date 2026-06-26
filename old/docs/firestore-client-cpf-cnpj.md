# Regras do perfil Cliente – CPF/CNPJ

O perfil **client** no Firestore só pode **ler** documentos ligados ao CPF ou CNPJ cadastrado no usuário.

## Cadastro do usuário (`users/{uid}`)

O documento do usuário deve ter:

- **cpf** (string): CPF do titular.
- **cpfCnpjSet** (mapa, opcional): para mais de um CPF/CNPJ, use um mapa com chaves = números e valor = true.  
  Exemplo: `cpfCnpjSet: { "123.456.789-00": true, "11.222.333/0001-44": true }`.

Assim, o cliente tem acesso quando `docCpfCnpj == user.cpf` ou `docCpfCnpj` está entre as chaves de `user.cpfCnpjSet`.

## Onde o app deve preencher `cpfCnpjSet`

Ao criar/atualizar usuário com **role = client**, além de `cpf` e `cnpjs`, gravar **cpfCnpjSet**:

- Incluir `cpf` como chave no mapa.
- Incluir cada item de `cnpjs` como chave.  
Exemplo em JS:  
`cpfCnpjSet: { [cpf]: true, ...(cnpjs || []).reduce((acc, c) => ({ ...acc, [c]: true }), {}) }`

Sem `cpfCnpjSet`, o cliente só terá acesso quando o documento tiver `cpfCnpj` igual ao campo **cpf** do usuário.

## Coleções com checagem por CPF/CNPJ

- **clients**, **empreendedores**: get para cliente se `resource.data.cpfCnpj` for do seu cadastro.
- **projects**, **licenses**, **outorgas**, **intervencoes**: get para cliente se `empreendedorId` apontar para empreendedor cujo `cpfCnpj` seja do cliente.
- **invoices**, **commercialProposals**: get para cliente se `clientId` apontar para client do cliente.
- **contracts**: get para cliente se `contratante.clientId` apontar para client do cliente.
- **supplierContracts**: leitura geral para autenticados; módulo operacional focado em perfis financeiros/administrativos.
- **autoInfracaoDefesas**: acesso administrativo (não faz parte do escopo client/representative).

O app deve filtrar as listagens por CPF/CNPJ (e IDs derivados) para o perfil client.
