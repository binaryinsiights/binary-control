# Binary Control, especificação da fase 1

## Objetivo

Adaptar a instalação privada da Binary Insights para registrar e acompanhar instalações remotas, sem hospedar os agentes dos clientes nela.

## Telas

### Clientes

- lista, busca, filtros e saúde;
- dados cadastrais mínimos;
- contatos e responsáveis;
- plano e versão;
- datas contratuais;
- status comercial, implantação, financeiro e suporte.

### Instalações

- uma ou mais instalações por cliente;
- URLs de Agents, Chatwoot e Langfuse;
- VPS, domínio, orquestrador e região;
- instanceId e deploymentId;
- versão dos serviços;
- último heartbeat;
- estado e alertas.

### Agentes remotos

- nome, função, modo e status;
- instalação de origem;
- plano e template;
- quantidade de canais;
- estado da base e integrações;
- consumo e última alteração;
- links profundos para as telas originais.

### Implantações

- etapas do onboarding oficial;
- checklist persistido;
- responsáveis;
- bloqueios e aprovações;
- evidências de homologação;
- histórico imutável de eventos.

### Monitoramento

- visão geral de saúde;
- instalações offline;
- Baileys desconectado;
- bases com erro;
- consumo por plano;
- backups e certificados;
- incidentes abertos.

## Modelo de dados inicial

- `ManagedCustomer`
- `CommercialPlan`
- `PlanVersion`
- `ManagedDeployment`
- `RemoteService`
- `RemoteAgent`
- `DeploymentChecklistItem`
- `DeploymentApproval`
- `HealthSnapshot`
- `UsageSnapshot`
- `ManagedAlert`
- `MaintenanceRecord`
- `AuditEvent`

Todas as tabelas internas seguem multi-tenancy e RLS. Segredos devem usar o mecanismo de vault cifrado, nunca colunas comuns.

## API e eventos

- Serviços de domínio em `src/modules/`.
- REST, UI e MCP como projeções do mesmo core.
- Endpoint autenticado para heartbeat sanitizado.
- Webhook assinado por instalação.
- Leitura remota agendada com limites e timeout.
- Idempotência por `instanceId`, evento e timestamp.
- Auditoria de toda ação administrativa.

## Permissões

- SUPER_ADMIN: todas as instalações.
- Gestor Binary: leitura e operação aprovada.
- Implantador: implantações atribuídas.
- Suporte: saúde, diagnóstico e incidentes.
- Comercial: clientes, planos e contratos, sem credenciais.
- Financeiro: plano, consumo e cobrança, sem conteúdo operacional.

## Fora da fase 1

- provisionamento totalmente automático de VPS;
- cópia de conversas;
- editor remoto completo de prompts;
- faturamento contábil;
- acesso de clientes ao Binary Control;
- atualização simultânea de toda a frota.

## Critérios de aceite

- cadastrar um cliente e seu plano, mesmo antes de existir contrato formal;
- registrar uma instalação remota;
- receber heartbeat autenticado;
- exibir saúde e versão;
- relacionar agentes remotos;
- acompanhar checklist e aprovações;
- emitir alertas essenciais;
- manter auditoria;
- não armazenar conteúdo de conversa ou segredos;
- `bun check` verde antes de qualquer deploy.
