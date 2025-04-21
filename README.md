# Pet Scheduler API

API para gerenciamento de agendamentos de serviços para pets em petshops e clínicas veterinárias.

## Funcionalidades Principais

- Gerenciamento de clientes e pets
- Agendamento de serviços
- Sistema de notificações (e-mail, SMS, WhatsApp)
- Autenticação e controle de acesso
- Relatórios e estatísticas

## Tecnologias

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Redis (para cache e blacklist de tokens)
- Nodemailer (para envio de emails)
- Swagger (documentação da API)

## Arquitetura

O projeto segue os princípios de Clean Architecture e Domain-Driven Design (DDD), com a seguinte estrutura de diretórios:

```
src/
├── domain/           # Regras de negócio e entidades
├── application/      # Casos de uso e serviços de aplicação
├── infrastructure/   # Adaptadores para frameworks e ferramentas externas
├── presentation/     # Interface com o usuário (controllers, rotas)
└── shared/           # Recursos compartilhados entre camadas
```

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Yarn ou NPM

## Configuração e Instalação

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente (veja o arquivo `.env.example`)
4. Execute as migrações do banco de dados: `npx prisma migrate dev`
5. Inicie o servidor: `npm run dev`

## Seed de Dados

O projeto inclui um script de seed para popular o banco de dados com dados iniciais para desenvolvimento e testes:

```bash
# Executar o seed de dados
npm run seed
```

O script irá criar:
- Usuários (admin e funcionário)
- Clientes
- Pets (cães e gatos)
- Serviços (banho, tosa, etc.)
- Agendamentos
- Notificações
- Histórico de login

Dados de acesso para testes:
- Admin: admin@petshop.com / senha: admin123
- Funcionário: funcionario@petshop.com / senha: employee123

## Variáveis de Ambiente

O projeto utiliza diversas variáveis de ambiente para configuração. Veja abaixo as principais:

### Configurações Gerais
- `NODE_ENV`: ambiente de execução (development, production, test)
- `PORT`: porta onde o servidor irá rodar
- `API_URL`: URL base da API
- `CORS_ORIGINS`: origens permitidas para CORS (separadas por vírgula)

### Banco de Dados
- `DATABASE_URL`: URL de conexão com o PostgreSQL

### Redis
- `REDIS_HOST`: host do Redis
- `REDIS_PORT`: porta do Redis
- `REDIS_PASSWORD`: senha do Redis (se necessário)

### JWT
- `JWT_SECRET`: chave secreta para tokens JWT
- `JWT_EXPIRES_IN`: tempo de expiração dos tokens (ex: "1d")
- `JWT_REFRESH_SECRET`: chave secreta para refresh tokens
- `JWT_REFRESH_EXPIRES_IN`: tempo de expiração dos refresh tokens (ex: "7d")

### Email
- `EMAIL_HOST`: servidor SMTP
- `EMAIL_PORT`: porta do servidor SMTP
- `EMAIL_SECURE`: se deve usar SSL/TLS (true/false)
- `EMAIL_USER`: usuário para autenticação SMTP
- `EMAIL_PASSWORD`: senha para autenticação SMTP
- `EMAIL_FROM`: email do remetente
- `EMAIL_FROM_NAME`: nome do remetente

### Jobs e Processos em Background
- `ENABLE_NOTIFICATION_JOB`: habilita o job de processamento de notificações

## Sistema de Notificações

O Pet Scheduler API possui um sistema completo e extensível de notificações que suporta múltiplos canais:

- **Email**: Notificações por email usando Nodemailer
- **SMS**: Notificações por SMS (requer integração com serviço externo)
- **WhatsApp**: Notificações por WhatsApp (requer integração com serviço externo)

### Arquitetura de Notificações

O sistema de notificações é composto por:

1. **Controllers**: Gerenciam as requisições HTTP e validam os dados
2. **Use Cases**: Implementam a lógica de negócio para cada operação de notificação
3. **Services**: Coordenam o envio e o gerenciamento de notificações
4. **Repositories**: Armazenam e recuperam dados de notificações
5. **Providers**: Implementam o envio efetivo de notificações para cada canal
6. **Templates**: Definem o conteúdo das notificações

### Principais Funcionalidades

- Envio de notificações de confirmação, lembrete e cancelamento de agendamentos
- Envio de notificações de boas-vindas para novos clientes
- Lembretes de checkup para pets
- Processamento assíncrono de notificações pendentes
- Retry automático para notificações com falha
- Monitoramento de status (pendente, enviado, entregue, falha)

## Documentação da API

A API é totalmente documentada usando Swagger/OpenAPI:

- **Documentação Interativa**: Disponível em `/api-docs` ao executar o servidor
- **Especificação OpenAPI**: Disponível em `/api-docs.json`

A documentação inclui detalhes sobre todos os endpoints, parâmetros, corpos de requisição, respostas e autenticação.

## Executando Testes

```bash
# Testes unitários
npm test

# Testes com cobertura
npm run test:coverage
```

## Contribuindo

1. Faça um fork do projeto
2. Crie sua branch de recurso (`git checkout -b feature/amazing-feature`)
3. Commit suas alterações (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes.
