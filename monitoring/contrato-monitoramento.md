# Contrato de monitoramento da central

## Objetivo

Permitir que a Binary Insights cuide das instalações sem centralizar conversas ou dados sensíveis.

## Identidade mínima da instalação

- `deploymentId`: UUID gerado pela Binary Insights.
- `customerExternalId`: identificador interno do cliente.
- `instanceId`: identificador persistente do fazer.ai agents.
- `planCode` e `planVersion`.
- `environment`: production ou homologation.
- URLs administrativas sem credenciais.

## Sinais coletados

### Disponibilidade

- heartbeat;
- versão;
- uptime;
- estado de Agents, Chatwoot, Baileys e Langfuse;
- validade de TLS;
- CPU, memória e disco.

### Agentes

- quantidade;
- status;
- modo teste ou produção;
- data da última alteração;
- base com documentos não indexados;
- integrações indisponíveis;
- credenciais com estado inválido, nunca o segredo.

### Uso

- conversas no período;
- tokens de entrada e saída;
- custo estimado;
- minutos de áudio;
- chamadas de ferramentas;
- transferências humanas;
- erros por estágio.

### Backup

- último início e término;
- sucesso ou falha;
- tamanho;
- destino lógico;
- último teste de restauração.

## Dados proibidos na central

- corpo de mensagens;
- prompt completo de produção por padrão;
- documentos da base;
- dados clínicos;
- CPF, dados de pagamento ou prontuário;
- tokens, senhas e chaves;
- sessão Baileys;
- anexos do Chatwoot.

## Alertas mínimos

- heartbeat ausente;
- serviço indisponível;
- Baileys desconectado;
- erro de credencial;
- documento `FAILED`;
- consumo acima de 80%, 100% e 120% do plano;
- disco acima de 80% e 90%;
- TLS a 30, 15 e 7 dias do vencimento;
- backup falhou ou atrasou;
- crescimento anormal de erros ou custos.

## Administração remota

- Leituras por API autenticada.
- Eventos por webhook assinado.
- Mudanças no fazer.ai agents por MCP com prévia.
- Infraestrutura por acesso SSH individual e auditável.
- Nenhuma credencial administrativa compartilhada entre clientes.

