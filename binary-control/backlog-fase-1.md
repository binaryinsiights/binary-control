# Backlog executável da fase 1

## Épico 1: fundação

- Adicionar modelos tenant-scoped e políticas RLS.
- Criar migrations aditivas.
- Criar serviços de domínio sem dependência de transporte.
- Criar auditoria para mutações.
- Criar testes de isolamento entre tenants.

## Épico 2: clientes e planos

- CRUD de clientes gerenciados.
- Catálogo de planos e versões imutáveis.
- Importação dos três JSONs iniciais.
- Vínculo cliente, plano e contrato.
- Tela de clientes com busca e filtros.

## Épico 3: instalações

- Registro de deploymentId e instanceId.
- Serviços remotos e URLs.
- Estado de implantação.
- Links profundos para os painéis.
- Tela de detalhe da instalação.

## Épico 4: onboarding

- Checklist persistido por fase.
- Bloqueios, responsáveis e evidências.
- Aprovações de infraestrutura, conteúdo, homologação e produção.
- Registro da versão do plano e template.

## Épico 5: saúde

- Endpoint autenticado de heartbeat.
- Snapshots de saúde.
- Alertas de ausência, disco, TLS e backup.
- Dashboard consolidado.
- Retenção de métricas e agregações.

## Épico 6: agentes remotos

- Registro sanitizado de agentes.
- Estado, modo, canais, base e integrações.
- Consumo contra limites do plano.
- Links para Agents e Langfuse.

## Épico 7: segurança

- Perfis de acesso internos.
- Vault cifrado para referências remotas.
- Redação de logs.
- Rate limit e idempotência.
- Auditoria e testes negativos.

## Ordem técnica sugerida

1. Schema e RLS.
2. Serviços de domínio.
3. REST.
4. Eventos e heartbeat.
5. UI de clientes, planos e instalações.
6. UI de implantação.
7. Dashboard e alertas.
8. MCP administrativo.
9. Testes E2E.
10. Imagem privada da Binary Insights e deploy piloto.

## Definition of Done

- lint, tipos, i18n e testes verdes;
- `bun check` verde;
- migrations reversíveis sem perda;
- isolamento validado;
- nenhum segredo ou PII em logs;
- documentação atualizada;
- testes de permissão e idempotência;
- homologação na instalação da Binary Insights antes de qualquer cliente.
