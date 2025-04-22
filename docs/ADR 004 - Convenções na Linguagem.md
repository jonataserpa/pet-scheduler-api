# ADR 004 - Convenções na Linguagem

## Status

Proposto

## Contexto

Estabelecer convenções garante que o projeto se mantenha legível, consistente e fácil de escalar.

## Decisão

- Utilizar **TypeScript** estritamente (`strict: true`)
- Usar `camelCase` para variáveis e funções, `PascalCase` para classes
- Seguir padrão DDD (camadas: domain, usecases, infra, etc.)
- Controllers só fazem parsing e delegação
- Regras de negócio só existem no domínio
- DTOs de entrada e saída com validação no controller

## Consequências

- Código consistente e legível
- Redução de bugs em refatorações
- Facilita onboarding

## Data

2025-04-18
