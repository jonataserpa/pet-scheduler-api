# Pet Scheduler API - Documento de Requisitos do Produto (PRD)

## Metadados do Documento
- **Versão:** 1.0
- **Data:** 2023-07-20
- **Status:** Proposto
- **Autor:** Equipe de Arquitetura

---

# Overview

O Pet Scheduler API é um sistema completo para gerenciamento de agendamentos de serviços de banho e tosa para pets, desenvolvido para petshops e clínicas veterinárias que precisam gerenciar sua agenda de forma eficiente. 

O sistema resolve problemas críticos enfrentados por estes estabelecimentos:
- Conflitos de horários entre agendamentos
- Dificuldade em aplicar regras de negócio específicas (como restrições de horários, feriados)
- Complexidade na precificação de serviços combinados (combos)
- Falta de validação adequada de clientes (por porte do pet, alergias, etc.)
- Comunicação inconsistente com clientes sobre agendamentos

Desenvolvido como uma API RESTful robusta, o sistema utiliza arquitetura Clean Architecture e Domain-Driven Design (DDD) para garantir manutenibilidade e escalabilidade.

> [!NOTE]
> Este documento consolida as decisões arquiteturais registradas nos ADRs 001-007 e estabelece o escopo completo do produto.

---

# Core Features

## 1. Gerenciamento de Agendamentos [ADR-007]
- **O que faz:** Permite criar, visualizar, atualizar e cancelar agendamentos de serviços para pets
- **Por que é importante:** É a funcionalidade central do sistema que gerencia a disponibilidade de horários e evita conflitos
- **Como funciona:** 
  - Aplica regras de negócio rigorosas para validar agendamentos (sem conflitos, respeitando feriados)
  - Requer agendamento com pelo menos 7 dias de antecedência
  - Utiliza transações atômicas via Prisma ORM para garantir integridade
  - Implementa índices únicos em `(date, time)` no banco de dados

## 2. Cadastro e Gestão de Clientes [ADR-007]
- **O que faz:** Gerencia informações de clientes e seus pets
- **Por que é importante:** Permite aplicar regras específicas por cliente/pet e personalizar o atendimento
- **Como funciona:**
  - Valida dados de cadastro conforme regras de negócio
  - Aplica restrições específicas (porte grande e alergias bloqueiam o cadastro)
  - Estrutura dados seguindo princípios de DDD com entidades bem definidas

## 3. Catálogo de Serviços e Precificação [ADR-007]
- **O que faz:** Gerencia serviços oferecidos e calcula preços baseados em combinações (combos)
- **Por que é importante:** Automatiza a lógica de precificação e torna o sistema flexível para promoções
- **Como funciona:**
  - Permite definir serviços individuais e combinações
  - Recalcula preços automaticamente quando serviços são combinados
  - Implementa regras de desconto e promoções no domínio

## 4. Sistema de Notificações [ADR-006]
- **O que faz:** Envia lembretes e confirmações sobre agendamentos
- **Por que é importante:** Melhora a experiência do cliente e reduz faltas
- **Como funciona:**
  - Utiliza worker assíncrono para processar fila de notificações
  - Implementa controle de taxa (rate limiting) para evitar spam
  - Suporta múltiplos canais (email, SMS)
  - Inclui estratégia de retry com backoff exponencial

## 5. Relatórios e Dashboard [ADR-007]
- **O que faz:** Gera relatórios e visualizações sobre agendamentos, serviços e clientes
- **Por que é importante:** Fornece insights para tomada de decisão do negócio
- **Como funciona:**
  - Agrega dados de múltiplas entidades
  - Processa relatórios de forma assíncrona quando complexos
  - Fornece dados em tempo real para dashboard via API dedicada

---

# User Experience

## Personas

### 1. Recepcionista de Petshop
- Precisa gerenciar agendamentos de forma rápida e eficiente
- Necessita visualizar agenda completa e detectar conflitos facilmente
- Realiza cadastro e atualização de dados de clientes

### 2. Gerente de Petshop
- Analisa relatórios de ocupação e faturamento
- Configura serviços e preços no sistema
- Monitora performance e qualidade do atendimento

### 3. Tutor de Pet (Cliente Final)
- Recebe notificações sobre agendamentos
- Pode ter restrições específicas para seu pet

## Fluxos de Usuário Principais

### Fluxo de Agendamento
1. Verificação de disponibilidade de horários
2. Seleção de serviços desejados
3. Associação com cliente/pet existente ou cadastro rápido
4. Confirmação com cálculo automático de preço
5. Envio de confirmação ao cliente

### Fluxo de Gestão de Clientes
1. Pesquisa de cliente por nome/telefone
2. Visualização de histórico de agendamentos
3. Atualização de dados cadastrais
4. Registro de preferências ou restrições específicas

### Fluxo de Relatórios
1. Seleção de período de análise
2. Escolha do tipo de relatório
3. Geração assíncrona para relatórios complexos
4. Exportação em formatos diversos (PDF, CSV)

---

# Technical Architecture

## Componentes do Sistema [ADR-001, ADR-006]

### Camada de Aplicação
- **Servidor HTTP**: Express.js [ADR-002]
- **API Restful**: Endpoints organizados por domínio
- **Controllers**: Responsáveis apenas por parsing e delegação [ADR-004]
- **Middlewares**: Validação, autenticação, erro
- **DTOs**: Objetos de transferência de dados com validação via Zod [ADR-002]

### Camada de Domínio
- **Entidades**: Definem estrutura e regras de negócio
- **Regras de Domínio**: Implementam lógica de negócio (ex: validação de agendamento)
- **Value Objects**: Representam conceitos imutáveis do domínio
- **Interfaces de Repositórios**: Definem contratos para persistência

### Camada de Infraestrutura
- **Repositórios**: Implementações dos contratos usando Prisma ORM [ADR-002]
- **Database**: PostgreSQL para persistência relacional [ADR-006]
- **Worker Assíncrono**: Para processamento de notificações e relatórios

### Ambiente e Infraestrutura
- **Docker & Docker Compose**: Containerização completa [ADR-001]
  - Containers: `node-app`, `postgres`, `redis`, `worker`, `test`
- **Variáveis de Ambiente**: Gerenciadas via dotenv e validadas em runtime [ADR-003]
  - Variáveis essenciais: `DATABASE_URL`, `JWT_SECRET`, `PORT`, etc.

## Modelo de Dados

### Principais Entidades
- **Scheduling**: Agendamento de serviço
- **Customer**: Cliente dono do pet
- **Pet**: Informações sobre o animal
- **Service**: Serviço oferecido (banho, tosa, etc.)
- **Notification**: Registro de comunicações enviadas

### Relacionamentos Importantes
- Um Customer pode ter vários Pets
- Um Scheduling está associado a um Pet e a um ou mais Services
- Notifications estão associadas a Schedulings

## APIs e Integrações

### Endpoints Principais
- `/login` - Autenticação JWT
- `/scheduling` - CRUD para agendamentos
- `/customers` - CRUD para clientes e pets
- `/services` - CRUD para serviços
- `/reports` - Geração e consulta de relatórios
- `/dashboard` - Dados em tempo real

### Integrações Externas
- Provedores de email/SMS para notificações
- Sistemas de pagamento (integração futura)

## Convenções e Padrões Técnicos [ADR-004]

### Convenções de Linguagem
- **TypeScript** com configuração estrita (`strict: true`)
- `camelCase` para variáveis/funções, `PascalCase` para classes
- Organização de arquivos seguindo padrão DDD

### Padrões Arquiteturais
- **Clean Architecture**: Separação clara entre domínio e infraestrutura
- **Domain-Driven Design**: Modelagem orientada ao domínio
- **Repository Pattern**: Abstração da persistência
- **DTO Pattern**: Validação e transferência de dados

---

# Development Roadmap

## Fase 1: Fundação e Infraestrutura
- Configuração do ambiente Docker [ADR-001]
  - Setup de containers para desenvolvimento e testes
  - Configuração de PostgreSQL e Redis
- Estrutura base do projeto
  - Organização de diretórios seguindo Clean Architecture
  - Configuração TypeScript e linting
- Setup de autenticação e autorização
  - Implementação JWT com roles básicas

## Fase 2: Domínio Central e Regras de Negócio
- Modelagem de entidades do domínio
  - Scheduling, Customer, Pet, Service
- Implementação de regras de negócio no domínio
  - Validação de agendamentos
  - Lógica de combos de serviços
  - Restrições de clientes

## Fase 3: Infraestrutura e Persistência
- Implementação de repositórios com Prisma
  - Mapeamento ORM para todas as entidades
  - Índices e constraints de banco
- Configuração de transações e consistência
- Implementação do worker assíncrono
  - Sistema de filas para notificações

## Fase 4: APIs e Interface com Usuário
- Desenvolvimento das rotas REST
  - Implementação de controllers por domínio
  - Validação de entrada com Zod
- Documentação da API
  - Swagger/OpenAPI
  - Postman collections

## Fase 5: Testes e Qualidade
- Testes unitários para domínio
- Testes de integração para casos de uso
- Testes E2E para rotas REST
- Automação de CI/CD

## Fase 6: Refinamentos e Recursos Adicionais
- Sistema de relatórios avançados
- Dashboard em tempo real
- Melhorias de performance
- Integrações adicionais (pagamentos, etc.)

---

# Logical Dependency Chain

## Fundação (Primeiro)
1. **Configuração de Infraestrutura**: Docker, Banco de dados [ADR-001]
2. **Setup do Projeto**: TypeScript, estrutura de diretórios [ADR-004]
3. **Autenticação Base**: Sistema JWT para segurança [ADR-002]

## Camada de Domínio
4. **Entidades Core**: Implementação das entidades principais
5. **Regras de Negócio**: Validações e lógica específica do domínio
6. **Serviços de Domínio**: Operações que coordenam entidades

## Persistência
7. **Interfaces de Repositório**: Definição dos contratos
8. **Implementação Prisma**: ORM configurado para PostgreSQL [ADR-002]
9. **Migrations**: Estrutura inicial do banco de dados

## APIs e Recursos Visíveis
10. **Controllers Básicos**: Endpoints REST para operações CRUD
11. **DTOs e Validação**: Esquemas de entrada/saída
12. **Documentação da API**: Swagger para visualização
13. **Sistema de Notificações**: Worker para processamento assíncrono [ADR-006]

## Recursos Avançados
14. **Relatórios**: Geração de insights para gestão
15. **Dashboard**: Visualização em tempo real
16. **Integrações**: Sistemas externos

---

# Risks and Mitigations

## Desafios Técnicos

### 1. Concorrência em Agendamentos
- **Risco**: Condições de corrida levando a conflitos de horários
- **Mitigação**: 
  - Transações atômicas via Prisma
  - Índices únicos no banco de dados
  - Validações de domínio rigorosas

### 2. Complexidade das Regras de Negócio
- **Risco**: Regras específicas de agendamento difíceis de manter
- **Mitigação**:
  - Encapsulamento no domínio
  - Testes abrangentes de casos de uso
  - Documentação clara de regras

### 3. Falhas em Notificações
- **Risco**: Mensagens não entregues a clientes
- **Mitigação**:
  - Sistema de retry com backoff exponencial
  - Monitoramento e alertas
  - Logs detalhados de falhas

## Definição do MVP

### MVP Essencial
- Sistema de agendamentos com regras básicas
- Cadastro de clientes e pets
- Catálogo simples de serviços
- API REST com autenticação
- Sistema básico de notificações

### Recursos para Versões Futuras
- Dashboard em tempo real
- Relatórios avançados
- Integrações com sistemas de pagamento
- App mobile para clientes

## Restrições de Recursos

### 1. Limitações de Infraestrutura
- **Risco**: Escalabilidade em picos de uso
- **Mitigação**: 
  - Arquitetura modular preparada para escalar
  - Worker assíncrono para operações intensivas

### 2. Complexidade de Implementação
- **Risco**: Tempo de desenvolvimento prolongado
- **Mitigação**:
  - Abordagem incremental com MVP claro
  - Priorização de recursos essenciais

---

# Appendix

## A. Matriz de Rastreabilidade de Requisitos Técnicos

| Requisito | Fonte | Implementação | Prioridade |
|-----------|-------|---------------|------------|
| Containerização | ADR-001 | Docker & Docker Compose | Alta |
| ORM com TypeScript | ADR-002 | Prisma | Alta |
| Validação de Dados | ADR-002, ADR-004 | Zod | Alta |
| Gestão de Configuração | ADR-003 | dotenv + validação | Alta |
| Convenções de Código | ADR-004 | TypeScript strict | Média |
| Arquitetura | ADR-006, ADR-007 | Clean Architecture + DDD | Alta |
| Processamento Assíncrono | ADR-006 | Worker com Redis | Média |

## B. Glossário Técnico

- **Clean Architecture**: Arquitetura em camadas que separa regras de negócio da infraestrutura
- **DDD (Domain-Driven Design)**: Abordagem de design que prioriza o domínio do problema
- **ORM (Object-Relational Mapping)**: Técnica para mapear objetos para bancos relacionais
- **Worker Assíncrono**: Processo que executa tarefas em segundo plano
- **DTO (Data Transfer Object)**: Objeto usado para transferir dados entre camadas
- **JWT (JSON Web Token)**: Padrão para autenticação e autorização

## C. Especificações Detalhadas

### C.1 Variáveis de Ambiente [ADR-003]
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
PORT=3000
REDIS_URL=redis://localhost:6379
MAILGUN_API_KEY=your-api-key
NOTIFICATION_QUEUE=notifications
```

### C.2 Estrutura de Diretórios

```
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
│   │       └── interfaces/
│   │           └── ISchedulingRepository.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── server/
│   │   └── workers/
│   │
│   ├── interfaces/
│   │   └── controllers/
│   │
│   ├── dtos/
│   │   └── scheduling/
│
├── tests/
├── docker/
├── .env
└── package.json
```

### C.3 Bibliotecas e Versões [ADR-002]
- Node.js: v18.x ou superior
- TypeScript: v4.9.x ou superior
- Express: v4.18.x
- Prisma: v4.12.x
- Zod: v3.21.x
- Jest: v29.5.x

### C.4 Resumo de Decisões Arquiteturais
Todos os ADRs estão disponíveis na pasta `/docs` com detalhes completos sobre cada decisão arquitetural tomada. 