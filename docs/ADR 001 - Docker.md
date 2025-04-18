# ADR 001 - Docker

## Status
Proposto

## Contexto

A padronização do ambiente de desenvolvimento e execução do sistema é essencial para garantir consistência entre times, ambientes e CI/CD. A utilização de Docker permite encapsular dependências, configurações, ferramentas e versões exatas utilizadas pelo projeto.

Nosso projeto é um monólito modular baseado em Clean Architecture com Node.js, Prisma e PostgreSQL. Também utilizamos fila de mensageria para notificações e testes automatizados. Precisamos de ambientes isolados para banco de dados, testes, workers e app principal.

## Decisão

Utilizar Docker e Docker Compose para gerenciar todos os serviços da stack:

- `node-app`: container principal do projeto
- `postgres`: banco de dados relacional
- `redis`: cache e mensageria (se necessário)
- `worker`: fila para tarefas assíncronas (ex: notificações)
- `test`: ambiente isolado para testes automatizados

## Alternativas Consideradas

- Instalação local manual (sem Docker)
- Containers apenas para banco de dados

## Consequências

- Consistência total entre ambientes
- Facilidade de onboarding e CI
- Possibilidade de replicar rapidamente produção localmente
- Scripts padronizados para build, test e deploy

## Decisão Tomada Por

- Equipe de Arquitetura

## Data

2025-04-18
