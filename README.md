# Pacote operacional Binary Insights Thalya

O repositório também contém a fundação executável do **Binary Control**, a central privada que registra clientes e acompanha instalações remotas sem copiar conversas ou credenciais.

## Executar a fundação

1. Copie `.env.example` para `.env` e gere segredos fortes.
2. Execute `docker compose up --build`.
3. Consulte `GET /api/health` e use o token interno nas rotas `/api/v1/*`.
4. Instalações enviam heartbeats assinados por HMAC para `POST /api/v1/heartbeats`.

Antes de publicar qualquer mudança, execute `bun install` e `bun check`.
Quando o clone do Agents estiver ao lado deste diretório, execute também
`bun run plans:sync-check` para impedir divergência entre o catálogo comercial e
o catálogo carregado pela Central.

## Recursos disponíveis na v0.2.0

- dashboard web interno com clientes, instalações, agentes e alertas;
- API para catálogo de planos, clientes, instalações e agentes remotos;
- heartbeat idempotente assinado por HMAC;
- alerta automático quando um dos quatro serviços fica degradado ou offline;
- auditoria das principais mutações;
- migrations aditivas para serviços, agentes, checklist, alertas e manutenção;
- PostgreSQL com papel administrativo separado do runtime;
- RLS obrigatório, inclusive para o proprietário das tabelas;
- nenhuma conversa, credencial ou dado clínico armazenado na central.

Este diretório é a fonte de verdade para preparar a plataforma privada da Binary Insights e implantar uma instalação independente do ecossistema fazer.ai por cliente.

## Regras inegociáveis

- Uma VPS exclusiva por cliente.
- Uma stack independente por cliente: fazer.ai agents Free, Chatwoot, Baileys e Langfuse.
- Nenhum n8n.
- O onboarding oficial do fazer.ai é o motor de instalação.
- O plano Thalya contratado é aplicado como uma camada versionada após a infraestrutura básica.
- A instalação da Binary Insights não hospeda os clientes; ela administra referências e metadados operacionais.
- Segredos não entram neste diretório, em Git, em logs ou em relatórios.
- Conversas e dados sensíveis permanecem na VPS do cliente.
- Toda mudança remota apresenta prévia e requer aprovação.

## Ordem de uso

1. Preencher `templates/ficha-cliente.md`.
2. Escolher um perfil em `plans/`.
3. Preencher `templates/manifesto-implantacao.json` conforme `templates/manifesto.schema.json`.
4. Executar `checklists/onboarding-cliente.md` seguindo o onboarding oficial.
5. Executar `checklists/homologacao.md`.
6. Registrar a instância conforme `monitoring/contrato-monitoramento.md`.
7. Operar de acordo com `operations/manutencao-e-incidentes.md`.

## Documentos

- `architecture/decisoes.md`: fronteiras e decisões arquiteturais.
- `plans/plan.schema.json`: contrato de um plano provisionável.
- `plans/*.json`: planos Thalya versionados.
- `templates/ficha-cliente.md`: coleta comercial e operacional.
- `templates/manifesto-implantacao.json`: registro de uma implantação.
- `templates/manifesto.schema.json`: contrato completo do manifesto, incluindo agente,
  canais, credenciais por referência e orquestrador.
- `checklists/onboarding-cliente.md`: execução por VPS.
- `checklists/homologacao.md`: critérios de entrega.
- `monitoring/contrato-monitoramento.md`: dados enviados à central.
- `operations/manutencao-e-incidentes.md`: rotina posterior à entrega.
- `binary-control/especificacao-fase-1.md`: próxima alteração da instalação da Binary Insights.

## Referência oficial

O guia local canônico está em:

`/root/.codex/plugins/cache/agents/agents/1.1.11/skills/agents-onboarding/SKILL.md`

Os planos comerciais de origem estão em:

`/home/leno/plano-comercial-agentes-ia-binary-insights.md`
