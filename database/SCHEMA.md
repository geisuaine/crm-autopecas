# Banco de Dados — CRM AutoPeças

## Como aplicar

### Supabase
1. Acesse o painel do Supabase → SQL Editor
2. Execute os arquivos na ordem:
   - `001_usuarios_auth.sql`
   - `002_rls_policies.sql`
   - `003_functions.sql`

### PostgreSQL local
```bash
psql -U postgres -d crm_autopecas -f 001_usuarios_auth.sql
psql -U postgres -d crm_autopecas -f 002_rls_policies.sql
psql -U postgres -d crm_autopecas -f 003_functions.sql
```

---

## Tabelas

### `usuarios`
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID PK | Identificador único |
| nome | TEXT | Nome completo |
| email | TEXT UNIQUE | Email de acesso |
| senha_hash | TEXT | Senha criptografada (bcrypt) |
| telefone | TEXT | WhatsApp/celular |
| cargo | TEXT | `admin` / `gerente` / `funcionario` |
| status | TEXT | `ativo` / `inativo` / `bloqueado` |
| ultimo_login | TIMESTAMPTZ | Última vez que logou |
| criado_em | TIMESTAMPTZ | Data de cadastro |
| criado_por | UUID FK | Admin que cadastrou |

### `permissoes`
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID PK | Identificador único |
| usuario_id | UUID FK | Referência ao usuário |
| modulo | TEXT | kanban / vendas / repasse / colaboradores / frete / relatorios / novo_pedido / prospeccao / configuracoes |
| visualizar | BOOLEAN | Pode ver |
| criar | BOOLEAN | Pode criar |
| editar | BOOLEAN | Pode editar |
| excluir | BOOLEAN | Pode excluir |

### `logs_acesso`
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID PK | Identificador único |
| usuario_id | UUID FK | Quem tentou logar |
| email | TEXT | Email usado na tentativa |
| ip | TEXT | IP do dispositivo |
| dispositivo | TEXT | User-Agent / dispositivo |
| data_login | TIMESTAMPTZ | Data/hora da tentativa |
| sucesso | BOOLEAN | Login OK ou falhou |
| motivo_falha | TEXT | senha_incorreta / usuario_inativo / usuario_bloqueado |

### `admin_anotacoes`
Área editável pelo admin: contatos de clientes, endereços, observações.
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID PK | Identificador único |
| pedido_id | TEXT | ID do card no Kanban |
| tipo | TEXT | `vale_repasse` / `contato_cliente` / `endereco` / `observacao` |
| titulo | TEXT | Título da anotação |
| conteudo | TEXT | Conteúdo / texto |
| valor | NUMERIC | Valor monetário (para vales) |
| criado_por | UUID FK | Admin que criou |
| editado_por | UUID FK | Admin que editou por último |

### `vales_repasse`
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID PK | Identificador único |
| usuario_id | UUID FK | Funcionário que recebe |
| pedido_id | TEXT | Pedido vinculado |
| descricao | TEXT | Descrição do vale |
| valor | NUMERIC | Valor em R$ |
| tipo | TEXT | `vale` / `repasse` / `comissao` / `desconto` |
| status | TEXT | `pendente` / `pago` / `cancelado` |
| data_emissao | TIMESTAMPTZ | Quando foi emitido |
| data_pagamento | TIMESTAMPTZ | Quando foi pago |
| criado_por | UUID FK | Admin que emitiu |

---

## Regras de Segurança

- **Somente admin** pode cadastrar/editar/excluir usuários
- **Senha** nunca armazenada em texto plano (bcrypt salt 12)
- **Todo login** é registrado (sucesso ou falha) com IP e dispositivo
- **RLS ativo** em todas as tabelas — funcionário só vê seus próprios dados
- **Admin** tem acesso total sem restrições
- **Vales/repasse** só admin cria e edita

---

## Login padrão
```
Email: admin@autopecas.com
Senha: admin1234
```
⚠️ Troque a senha no primeiro acesso!
