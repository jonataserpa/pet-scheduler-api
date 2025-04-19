# Log de Desenvolvimento do Pet Scheduler API

## Tarefa 1: Configuração do Ambiente de Desenvolvimento

Data: 2024-08-13

### Objetivo
Configurar o ambiente de desenvolvimento com Docker, TypeScript e ferramentas necessárias conforme a tarefa #1.

### Requisitos da Tarefa
1. Configurar Docker e Docker Compose com containers para:
   - Node.js app
   - PostgreSQL
   - Redis
   - Worker para processamento assíncrono
   - Ambiente de testes

2. Configurar TypeScript com configurações estritas
   - Criar tsconfig.json com `strict: true`
   - Configurar ESLint e Prettier

3. Estruturar o projeto seguindo Clean Architecture e DDD:
   - Organizar diretórios conforme especificado
   - Configurar scripts de build e desenvolvimento

4. Implementar gestão de variáveis de ambiente:
   - Criar .env.example com as variáveis necessárias
   - Implementar validação das variáveis em runtime

### Etapas Realizadas

#### 1. Estruturação de Diretórios (Clean Architecture e DDD)
- Criados os diretórios principais seguindo a arquitetura limpa e DDD:
  - `src/domain`: Entidades de domínio, repositórios, serviços e casos de uso
  - `src/application`: Controladores, DTOs e middlewares
  - `src/infrastructure`: Banco de dados, HTTP, mensageria
  - `src/presentation`: Interface com o usuário
  - `src/shared`: Configurações, erros e utilitários compartilhados

#### 2. Configuração do Node.js e TypeScript
- Criado package.json com todas as dependências necessárias
- Configurado tsconfig.json com opções estritas:
  - `"strict": true`
  - Aliases de importação para camadas da arquitetura
  - Target ES2022 com suporte a ESM
  - Configurações para melhorar a qualidade do código (noUnusedLocals, noUnusedParameters, etc.)

#### 3. Configuração de Ferramentas de Qualidade de Código
- Configurado ESLint com regras estritas
- Configurado Prettier para formatação consistente
- Configurado Jest para testes
- Adicionados scripts no package.json para build, dev, testes e lint

#### 4. Configuração do Banco de Dados
- Configurado Prisma ORM
- Criado schema.prisma com modelos para todas as entidades do sistema:
  - User
  - Customer
  - Pet
  - Service
  - Scheduling
  - SchedulingService
  - Notification
- Definidos relacionamentos, índices e enumerações

#### 5. Configuração de Variáveis de Ambiente
- Criado .env.example com todas as variáveis necessárias
- Criado .env com valores de desenvolvimento
- Implementada validação de variáveis de ambiente usando Zod em src/shared/config/env.ts
- Configuração para falhar na inicialização se variáveis obrigatórias estiverem ausentes

#### 6. Configuração de Logs
- Implementado sistema de logs com Winston
- Configurado para gravar logs em arquivos e console
- Níveis diferentes de logs (info, error, debug, etc.)
- Rotação de arquivos de log

#### 7. Configuração do Docker e Docker Compose
- Criado Dockerfile com multi-stage build para otimização
- Configurado docker-compose.yml com serviços:
  - app: Aplicação principal
  - worker: Processamento assíncrono
  - postgres: Banco de dados PostgreSQL
  - redis: Cache e filas
  - test-db: Banco de dados para testes

#### 8. Implementação do Servidor HTTP
- Configurado Express com middlewares:
  - helmet para segurança
  - cors para controle de acesso
  - Tratamento de erros
  - Rota de health check
- Implementada inicialização segura do servidor

#### 9. Implementação do Worker para Processamento Assíncrono
- Configurada conexão com Redis para filas
- Implementados processadores de notificações e lembretes
- Configurado tratamento de erros e reconexão

#### 10. Configuração do Cliente do Banco de Dados
- Criado cliente Prisma personalizado com logs
- Implementadas funções para conexão e desconexão
- Adicionado suporte a transações

#### 11. Configuração do Git
- Configurado .gitignore para excluir arquivos sensíveis e desnecessários

### Conclusão da Tarefa 1

✅ **Status: Concluída**

**Data de conclusão:** 2024-08-13

**Observações:**
- A tarefa foi concluída com sucesso, implementando todos os requisitos especificados.
- O ambiente de desenvolvimento está configurado e pronto para o início da implementação das funcionalidades.
- A estrutura do projeto segue os princípios de Clean Architecture e DDD conforme especificado.
- A documentação foi criada no arquivo README.md com instruções detalhadas para configuração e execução do projeto.

**Aprendizados:**
- A abordagem Clean Architecture facilita a separação de responsabilidades e a testabilidade do código.
- A validação de variáveis de ambiente com Zod oferece uma camada adicional de segurança.
- A configuração de logs detalhados ajudará na depuração e monitoramento da aplicação.

**Próxima Tarefa:** Implementação do Modelo de Dados e Entidades (Tarefa #2) 

## Tarefa 2: Implementação do Modelo de Dados e Entidades

Data: 2024-08-15

### Objetivo
Criar as entidades de domínio e seus relacionamentos usando DDD e Prisma ORM.

### Requisitos da Tarefa
1. Definir as entidades principais do domínio:
   - Scheduling (Agendamento)
   - Customer (Cliente)
   - Pet (Animal de estimação)
   - Service (Serviço oferecido)
   - Notification (Notificação)

2. Implementar os Value Objects para conceitos imutáveis:
   - Endereço
   - Contato
   - Período de tempo

3. Configurar o Prisma Schema com:
   - Modelos para todas as entidades
   - Relacionamentos entre entidades
   - Índices únicos (especialmente para date/time em Scheduling)
   - Constraints e validações no nível do banco de dados

4. Criar as migrations iniciais do banco de dados

5. Implementar validações das entidades no domínio (regras de negócio)

### Etapas Realizadas

#### 1. Definição das Entidades de Domínio
- Implementadas as entidades principais seguindo princípios DDD:
  - `Customer`: Implementada com validações para documentos (CPF/CNPJ)
  - `Pet`: Criada com propriedades como espécie, raça, tamanho e relacionamento com Customer
  - `Service`: Definida com validações para duração, preço e tamanhos de pet compatíveis
  - `Scheduling`: Implementada com regras de negócio para datas de agendamento e conflitos
  - `Notification`: Criada com diferentes tipos (email, SMS, WhatsApp) e estados de entrega

#### 2. Implementação de Value Objects
- Criados Value Objects encapsulando conceitos imutáveis do domínio:
  - `Address`: Representação de endereços com validação de CEP
  - `Contact`: Encapsulamento de informações de contato (email, telefone, WhatsApp)
  - `TimeSlot`: Representação de um intervalo de tempo para agendamentos
  - `TimePeriod`: Para representar períodos de tempo como dias da semana e horários
  - `DocumentNumber`: Para validação e formatação de CPF/CNPJ
  - `Money`: Representação de valores monetários
  - `DatePeriod`: Para representar períodos entre datas
  - `RecurringTimePeriod`: Para representar horários recorrentes
  - `RecurringTimePeriodWithExceptions`: Para horários recorrentes com exceções

#### 3. Implementação de Validações de Domínio
- Adicionadas validações ricas para todas as entidades:
  - Validação de formato e conteúdo para emails, telefones e documentos
  - Regras para evitar sobreposição de agendamentos
  - Validação de tamanho de pet compatível com serviços
  - Validação de datas e horários de funcionamento

#### 4. Configuração do Prisma Schema
- Definidos modelos no Prisma com:
  - Campos obrigatórios e opcionais
  - Tipos de dados adequados
  - Valores padrão quando apropriado
  - Relacionamentos (um-para-um, um-para-muitos, muitos-para-muitos)
  - Tabelas pivô para relacionamentos muitos-para-muitos (ex: SchedulingService)

#### 5. Criação de Índices e Constraints
- Adicionados índices para:
  - Busca eficiente de agendamentos por data/hora
  - Pesquisa de clientes por documento
  - Localização de pets por cliente
- Implementadas constraints para:
  - Unicidade de documentos de cliente
  - Unicidade de emails de usuário
  - Prevenção de agendamentos sobrepostos

#### 6. Implementação de Factories e Testes
- Criados factories para facilitar a criação de entidades complexas:
  - `AddressFactory`: Para criação de endereços a partir de CEP
  - `TimeSlotFactory`: Para geração de slots de tempo disponíveis

#### 7. Testes de Domínio
- Implementados testes unitários para validar regras de negócio
- Testes para verificar comportamento de Value Objects
- Testes para validar sobreposição de agendamentos

### Conclusão da Tarefa 2

✅ **Status: Concluída**

**Data de conclusão:** 2024-08-17

**Observações:**
- A tarefa foi concluída com sucesso, implementando todas as entidades de domínio e value objects.
- O modelo de dados foi validado através de testes unitários.
- O uso de value objects imutáveis melhorou a integridade e a clareza do código.

**Aprendizados:**
- A abordagem DDD com value objects imutáveis reduz a complexidade e aumenta a robustez do código.
- A implementação de regras de negócio dentro das entidades de domínio melhora a consistência e facilita o teste.
- O uso de classes factory simplifica a criação de instâncias complexas e melhora a legibilidade.

**Próxima Tarefa:** Implementação de Autenticação e Autorização (Tarefa #3)

## Tarefa 3: Implementação de Autenticação e Autorização

Data: 2024-08-18

### Objetivo
Criar o sistema de autenticação e autorização utilizando JWT conforme especificado no ADR-002.

### Requisitos da Tarefa
1. Criar entidade de User/Admin no domínio
   - Implementar model no Prisma
   - Definir roles e permissões

2. Implementar serviço de autenticação:
   - Login com email/senha
   - Geração de tokens JWT
   - Refresh token
   - Armazenamento seguro de senhas (bcrypt)

3. Criar middlewares de autorização:
   - Verificação de token JWT
   - Validação de roles/permissões
   - Proteção de rotas específicas

4. Implementar logout e gestão de sessões:
   - Invalidação de tokens
   - Lista negra de tokens (usando Redis)

5. Criar endpoints de autenticação:
   - POST /login
   - POST /refresh-token
   - POST /logout

### Etapas Realizadas

#### 1. Entidade User e Modelo Prisma
- Implementada a entidade de domínio `User` com:
  - Validações para email e senha
  - Suporte a diferentes roles (ADMIN, EMPLOYEE)
  - Métodos para autenticação e validação de permissões
  - Suporte para registro de logins e gerenciamento de status (ativo/inativo)
- Configurado o modelo Prisma para User com:
  - Índice único para email
  - Relacionamentos com outras entidades do sistema
  - Campos para controle de acesso e auditoria

#### 2. Implementação da Entidade LoginHistory
- Criada a entidade `LoginHistory` para registro e auditoria de acessos:
  - Métodos para registrar diferentes tipos de login (sucesso, falha, suspeito)
  - Armazenamento de informações como IP, user-agent, geolocalização
  - Suporte a diferentes métodos de autenticação (senha, OAuth, token)

#### 3. Serviço de Token JWT
- Implementado o `TokenService` para gerenciamento de tokens JWT:
  - Geração de pares de tokens (access token e refresh token)
  - Validação e verificação de tokens
  - Extração de payload e informações do usuário
  - Suporte a diferentes tempos de expiração para access e refresh tokens

#### 4. Sistema de Blacklist de Tokens
- Implementado o `TokenBlacklistService` usando Redis:
  - Adição de tokens à blacklist após logout
  - Verificação de tokens na blacklist durante autenticação
  - Suporte a TTL (Time-To-Live) para limpeza automática da blacklist
  - Métodos para lidar com múltiplos tokens (logout de todos os dispositivos)

#### 5. Serviço de Autenticação
- Criado o `AuthService` para lógica de autenticação:
  - Implementação de login com validação de credenciais
  - Suporte a refresh token para renovação de sessões
  - Mecanismos para logout e invalidação de sessões
  - Verificação de permissões e níveis de acesso
  - Registro de tentativas de login para auditoria e segurança

#### 6. Serviço de Recuperação de Senha
- Implementado o `PasswordResetService` com:
  - Geração de tokens de recuperação de senha com expiração
  - Validação de tokens e redefinição segura de senhas
  - Integração com serviço de email para envio dos tokens
  - Invalidação de tokens após uso ou expiração

#### 7. Middlewares de Autenticação
- Criado o `AuthMiddleware` para proteção de rotas:
  - Middleware de autenticação para verificar tokens JWT
  - Middleware de verificação de roles (hasRole)
  - Middleware de verificação de permissões específicas (hasPermission)
  - Utilitário `asAuthHandler` para resolver problemas de tipagem TypeScript

#### 8. Controlador de Autenticação
- Implementado o `AuthController` com endpoints para:
  - Login com email/senha
  - Logout com invalidação de tokens
  - Refresh de tokens
  - Recuperação de senha (forgot-password e reset-password)
  - Alteração de senha para usuários autenticados
  - Obtenção de histórico de logins
  - Callback para autenticação OAuth (Google)

#### 9. Configuração de Rotas de Autenticação
- Implementadas rotas de autenticação no express:
  - Rotas públicas: login, refresh-token, forgot-password, reset-password
  - Rotas OAuth: /google, /google/callback
  - Rotas protegidas: logout, profile, change-password, login-history
  - Aplicação adequada de rate limiting para prevenir ataques de força bruta

#### 10. Rate Limiting
- Implementados middlewares de rate limiting para proteção contra ataques:
  - Rate limiting específico para tentativas de login (mais restritivo)
  - Rate limiting para recuperação de senha
  - Rate limiting global para todas as rotas da API

#### 11. Implementação de Repositórios
- Criados repositórios para persistência:
  - `PrismaUserRepository`: Implementação do repositório de usuários com Prisma
  - `PrismaLoginHistoryRepository`: Implementação do repositório de histórico de login
  - Implementações alternativas para testes (InMemory)

#### 12. Integração com Email
- Configurado serviço de email para:
  - Envio de tokens de recuperação de senha
  - Notificação sobre alterações de senha

### Conclusão da Tarefa 3

✅ **Status: Concluída**

**Data de conclusão:** 2024-08-20

**Observações:**
- A tarefa foi concluída com sucesso, implementando um sistema robusto de autenticação e autorização.
- A implementação segue as melhores práticas de segurança, incluindo blacklist de tokens e rate limiting.
- O sistema de autenticação é flexível e suporta múltiplos métodos (senha, OAuth) com possibilidade de expansão.

**Aprendizados:**
- O uso de JWT com refresh tokens permite uma experiência de usuário fluida sem comprometer a segurança.
- A implementação de blacklist com Redis é essencial para permitir logout imediato e revogação de tokens.
- Rate limiting é crucial para prevenir ataques de força bruta em endpoints sensíveis como login e recuperação de senha.
- A separação clara entre domínio, serviços e controladores facilita a manutenção e teste do sistema de autenticação.

**Próxima Tarefa:** Implementação dos Serviços de Agendamento (Tarefa #4) 