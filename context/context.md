# ADR 001 - Arquitetura para Sistema de Agendamento de Banho e Tosa de Pets

## Status
Proposto

## Contexto

Precisamos desenvolver um sistema de agendamento de serviços (banho e tosa) para pets com regras de negócios específicas, visando garantir integridade nos agendamentos (evitar conflitos de horários), validações de clientes, e diferenciação de preços conforme combos de serviços. O sistema deverá ser disponibilizado como uma API RESTful com autenticação JWT e arquitetura baseada em Clean Architecture e DDD.

A complexidade do domínio envolve regras como:
- Restrições de horários e feriados;
- Lógica condicional para serviços (combos);
- Tipos de clientes com restrições (porte, alergia);
- Controle de envio de mensagens assíncronas;
- Requisitos de testes em várias camadas.

## Decisão

Optamos por implementar o sistema como um **monolito modular baseado em Clean Architecture com um Worker assíncrono para notificações e relatórios**, utilizando **Node.js com TypeScript**, **Prisma ORM** e **PostgreSQL** como banco de dados relacional.

As camadas serão organizadas conforme:
- **Domínio**: entidades com regras de negócio (ex: regras de agendamento, validações)
- **UseCases**: orquestram regras do domínio e chamam interfaces de repositórios
- **Interfaces**: rotas (Express/Fastify), DTOs, validadores
- **Repositórios**: abstrações e implementações com Prisma
- **Worker**: responsável por notificações e relatórios assíncronos

Rotas da API:
- `/login` (JWT)
- `/scheduling` (CRUD + lógica de regras)
- `/customers` (CRUD + validações específicas)
- `/services` (CRUD + lógica de precificação por combo)
- `/reports` (dados agregados)
- `/dashboard` (dados em tempo real)

Regras importantes implementadas no domínio:
- Agendamento: não pode haver conflitos, nem datas em feriados; só com 7 dias de antecedência.
- Services: combos alteram o preço automaticamente.
- Customers: porte grande e alergias bloqueiam o cadastro.

Para tratamento de concorrência:
- Transações atômicas via Prisma.
- Índices únicos em `(date, time)` para garantir unicidade no nível do banco.
- Validações de domínio antes da persistência.

Mensageria:
- Worker assíncrono que consome fila para envio de notificações e geração de relatórios.
- Limite de envio com controle de taxa.
- Suporte a backoff exponencial e retries.

Testes:
- Unitários no domínio
- Integração nos UseCases
- E2E nas rotas REST

## Alternativas Consideradas

### 1. Microsserviços Independentes por Domínio

**Prós:**
- Escalabilidade por serviço
- Separação clara de responsabilidade
- Alta disponibilidade por módulo
- Equipes podem trabalhar separadamente
- Failover mais simples

**Contras:**
- Overhead de comunicação interserviços
- Complexidade arquitetural maior
- Latência mais alta nas chamadas
- Infraestrutura mais cara
- Dependência de mensageria e orquestração

### 2. Monolito Simples sem Worker

**Prós:**
- Rápido de implementar
- Estrutura simples
- Menor curva de aprendizado
- Deploy e CI/CD simplificados
- Menos componentes para gerenciar

**Contras:**
- Baixa escalabilidade
- Difícil lidar com tarefas assíncronas
- Alto acoplamento
- Risco de gargalos no sistema
- Dificuldade futura de separação de responsabilidades

### 3. Arquitetura Escolhida: Monolito Modular com Worker

**Prós:**
- Simples o suficiente para iniciar o projeto
- Capacidade de evoluir para microsserviços
- Assíncrono para tarefas intensivas (notificações/relatórios)
- Estrutura escalável por domínio
- Boa divisão de responsabilidades com Clean Architecture

**Contras:**
- Complexidade moderada
- Ainda exige boa cobertura de testes
- Manutenção do worker assíncrono
- Custo de processamento em fila
- Exige arquitetura bem planejada desde o início

## Consequências

- O sistema estará apto a escalar por domínio e tarefas assíncronas separadamente.
- A Clean Architecture impõe disciplina arquitetural desde o início.
- Facilita testes automatizados, garantindo confiabilidade do sistema.
- A fila permite que notificações sejam enviadas mesmo com picos de agendamentos.
- Futuros microsserviços podem ser extraídos sem reescrever regras de negócio.
- Já existe uma estrutura inicial de projeto (starter skeleton) que será utilizada como base para implementação:

### Estrutura de Diretórios

```bash
pet-scheduler-api/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── Scheduling.ts
│   │   ├── valueObjects/
│   │   └── rules/
│   │       └── SchedulingRules.ts
│   │
│   ├── usecases/
│   │   └── scheduling/
│   │       ├── CreateSchedulingUseCase.ts
│   │       ├── CancelSchedulingUseCase.ts
│   │       └── interfaces/
│   │           └── ISchedulingRepository.ts
│
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   ├── client.ts
│   │   │   │   └── schema.prisma
│   │   │   └── repositories/
│   │   │       └── PrismaSchedulingRepository.ts
│   │   ├── server/
│   │   │   ├── app.ts
│   │   │   └── routes/
│   │   │       └── scheduling.route.ts
│   │   └── middlewares/
│   │       └── validateDTO.ts
│
│   ├── interfaces/
│   │   └── controllers/
│   │       └── SchedulingController.ts
│
│   ├── dtos/
│   │   ├── scheduling/
│   │   │   ├── CreateSchedulingDTO.ts
│   │   │   └── SchedulingResponseDTO.ts
│
│   ├── tests/
│   │   ├── unit/
│   │   │   └── domain/
│   │   ├── integration/
│   │   │   └── usecases/
│   │   └── e2e/
│   │       └── scheduling.test.ts
│
│   ├── main.ts
│
├── .env
├── package.json
├── tsconfig.json
└── README.md
