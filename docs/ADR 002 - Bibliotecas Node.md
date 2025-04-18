# ADR 002 - Bibliotecas Node.js

## Status
Proposto

## Contexto

Escolhemos bibliotecas específicas com base em produtividade, comunidade, compatibilidade com TypeScript e aderência ao padrão Clean Architecture.

## Decisão

Bibliotecas essenciais adotadas:

- **Express**: servidor HTTP leve e modular
- **Prisma**: ORM com suporte a PostgreSQL e tipagem forte
- **Zod**: validação de entrada com integração a DTOs
- **jsonwebtoken**: autenticação JWT
- **bcryptjs**: hash de senhas
- **dotenv**: carregamento de variáveis de ambiente
- **Jest**: testes unitários e integração
- **Supertest**: testes E2E
- **ts-node-dev**: hot reload no desenvolvimento
- **esbuild** ou **tsup** (compiladores rápidos para produção)

## Alternativas Consideradas

- Fastify no lugar de Express
- class-validator no lugar de Zod
- Sequelize no lugar de Prisma

## Consequências

- Stack moderna, enxuta e tipada
- Facilita testes e refatorações seguras
- Compatível com DDD e Clean Architecture

## Data

2025-04-18
