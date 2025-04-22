# ADR 006 - Estratégia Geral Sistêmica

## Status

Proposto

## Contexto

O sistema precisa suportar múltiplos usuários agendando simultaneamente com alta confiabilidade e disponibilidade, respeitando regras rígidas de negócio.

## Decisão

- Arquitetura: **Monolito Modular com Worker Assíncrono**
- Banco relacional com transações para consistência
- Worker para notificações com rate limit
- DDD + Clean Architecture
- Prisma ORM com PostgreSQL

## Consequências

- Estrutura modular, pronta para escalar
- Camadas separadas e testáveis
- Possível evolução futura para microsserviços

## Data

2025-04-18
