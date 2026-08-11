# Decisões arquiteturais

## ADR-001: uma VPS por cliente

Cada cliente recebe infraestrutura exclusiva. Não serão criados tenants de clientes dentro da instalação operacional da Binary Insights.

Motivos:

- isolamento de dados e credenciais;
- falhas e consumo sem impacto cruzado;
- backup e restauração independentes;
- atualização controlada por cliente;
- encerramento e portabilidade mais simples;
- melhor adequação a clientes com dados sensíveis.

## ADR-002: onboarding oficial como motor

Cada implantação seguirá o fluxo oficial:

1. pré-requisitos e acessos;
2. VPS, DNS e SSH;
3. inventário brownfield;
4. escolha do tier;
5. Chatwoot;
6. fazer.ai agents Free;
7. Langfuse com MinIO;
8. `/setup` e MCP;
9. importação e base;
10. conexão com Chatwoot;
11. validação ponta a ponta.

Coolify é o padrão recomendado para novas VPS. Portainer e Compose genérico permanecem compatíveis quando necessários.

## ADR-003: plano comercial separado do instalador

O onboarding instala a base técnica. O manifesto do plano decide agentes, canais, recursos, limites, integrações, testes e suporte.

Um plano é imutável depois de publicado. Alterações geram nova versão. Cada cliente mantém a versão contratada até uma migração aprovada.

## ADR-004: central privada separada

O Binary Control será exclusivo da Binary Insights. Ele não será incluído na imagem entregue aos clientes.

O Binary Control armazenará metadados, vínculos e métricas sanitizadas. Não será cópia de Chatwoot, Langfuse ou fazer.ai agents.

## ADR-005: nenhum n8n

O n8n não será instalado nem utilizado. Integrações usarão ferramentas nativas, toolpacks, ferramentas HTTP, MCP, API e webhooks do ecossistema fazer.ai.

## ADR-006: sistemas de registro

- Chatwoot: conversas, contatos e operação humana.
- fazer.ai agents: agentes, prompts, ferramentas e bases.
- Langfuse: traces, custos, latência e avaliação.
- Baileys: sessão de transporte do WhatsApp.
- Binary Control: cliente, contrato, implantação, saúde, consumo e manutenção.

## ADR-007: segurança

- Nenhum segredo em manifesto ou repositório.
- Referências a credenciais somente por nome ou identificador opaco.
- Segredos preenchidos nos fluxos seguros de cada produto.
- MCP para configuração do fazer.ai agents após o setup.
- SSH restrito a infraestrutura.
- Prévia obrigatória antes de mutações remotas.
- Logs centrais sem conteúdo de mensagens e sem dados clínicos.

