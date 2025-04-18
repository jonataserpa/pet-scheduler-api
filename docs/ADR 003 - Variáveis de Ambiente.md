# ADR 003 - Variáveis de Ambiente

## Status
Proposto

## Contexto

Separar configurações sensíveis e específicas por ambiente é fundamental. Variáveis de ambiente serão utilizadas para manter configurações desacopladas do código-fonte.

## Decisão

Adotaremos arquivos `.env` com `dotenv`, e as variáveis serão validadas em tempo de execução via biblioteca como `zod` ou `env-schema`.

Variáveis importantes:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `REDIS_URL` (se usado)
- `MAILGUN_API_KEY`
- `NOTIFICATION_QUEUE`

## Consequências

- Maior segurança e portabilidade
- Possibilidade de ambientes isolados por `.env.development`, `.env.test`, etc.
- Erros de configuração detectáveis via validação

## Data

2025-04-18
