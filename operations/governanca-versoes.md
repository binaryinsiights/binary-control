# Governança de versões

## Objetos versionados

- plano Thalya;
- template de nicho;
- template de agente;
- checklist de homologação;
- imagem dos serviços;
- configuração de infraestrutura;
- política de monitoramento.

## Regra de imutabilidade

Uma versão usada por cliente não é editada retroativamente. Correções produzem uma nova versão e um plano de migração.

## Registro obrigatório por instalação

- versão do plano;
- versão do nicho;
- versão do export do agente;
- versão das imagens;
- data de implantação;
- data da última atualização;
- responsável;
- resultado dos testes;
- rollback disponível.

## Promoção de atualização

1. Desenvolver fora da produção.
2. Rodar testes automatizados.
3. Rodar `bun check` quando houver código.
4. Implantar na Binary Insights.
5. Validar o fluxo completo.
6. Implantar em cliente piloto autorizado.
7. Observar métricas e erros.
8. Liberar gradualmente para clientes compatíveis.

## Compatibilidade

- Uma atualização técnica não pode habilitar recurso não contratado.
- Uma mudança de plano requer registro comercial e aprovação.
- Credenciais nunca são copiadas entre clientes.
- Migrações devem ser aditivas e preservar isolamento.
- Rollback não pode descartar mensagens ou configurações recentes.

