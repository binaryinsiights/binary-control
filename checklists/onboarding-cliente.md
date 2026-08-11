# Checklist de onboarding por cliente

## Gate 0: venda e escopo

- [ ] Contrato aprovado.
- [ ] Plano e versão registrados.
- [ ] Nicho e template definidos.
- [ ] Limites e adicionais registrados.
- [ ] Ficha do cliente preenchida sem segredos.

## Fase 1: o agente e os acessos

- [ ] VPS escolhida pelo usuário.
- [ ] Domínio escolhido pelo usuário.
- [ ] Acesso SSH validado.
- [ ] DNS sob controle confirmado.
- [ ] Origem do Chatwoot decidida.
- [ ] Nenhuma produção de terceiro tocada sem autorização.

## Fase 2: onde hospedar

- [ ] Inventário brownfield somente leitura concluído.
- [ ] Tier A, B ou C registrado.
- [ ] Orquestrador saudável.
- [ ] Registros DNS criados.
- [ ] Chatwoot implantado.
- [ ] Baileys implantado com sessão isolada.
- [ ] fazer.ai agents Free implantado.
- [ ] Langfuse implantado com MinIO.
- [ ] Bancos, Redis e volumes persistentes saudáveis.
- [ ] TLS válido em todos os serviços.

## Fase 3: o Chatwoot

- [ ] Primeiro administrador criado pelo usuário.
- [ ] Conta correta selecionada.
- [ ] Inbox criado.
- [ ] Equipe e operadores configurados.
- [ ] Baileys conectado pelo usuário responsável.
- [ ] Agent Bot criado pelo fluxo oficial.
- [ ] Webhook e roteamento validados.

## Fase 4: configurar o agente

- [ ] `/setup` concluído pelo usuário.
- [ ] MCP autenticado.
- [ ] Tenant correto descoberto, sem criar tenant órfão.
- [ ] Perfil do plano carregado.
- [ ] Template do nicho copiado.
- [ ] Prompt personalizado e aprovado.
- [ ] Credenciais referenciadas sem expor segredos.
- [ ] Embedding configurado no tenant.
- [ ] Base e documentos importados.
- [ ] Todos os documentos em `READY`.
- [ ] Ferramentas limitadas ao plano.
- [ ] Quantidade de agentes e canais dentro do contrato.
- [ ] Agente mantido desligado ou em modo de teste.
- [ ] Chatwoot conectado e inbox vinculado.
- [ ] Langfuse recebendo traces.

## Gate de produção

- [ ] Homologação completa aprovada.
- [ ] Backups configurados.
- [ ] Monitoramento registrado na central.
- [ ] Responsáveis receberam os acessos.
- [ ] Produção autorizada explicitamente.

