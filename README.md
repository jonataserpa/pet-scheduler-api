# Pet Scheduler API

API para gerenciamento de agendamentos de serviços de banho e tosa para pets em petshops e clínicas veterinárias.

## Tecnologias Utilizadas

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Redis
- Docker & Docker Compose
- Jest
- ESLint & Prettier

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
- Docker e Docker Compose
- PostgreSQL 16
- Redis 7

## Configuração do Ambiente

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/pet-scheduler-api.git
cd pet-scheduler-api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações.

### Usando Docker

O modo mais simples de executar a aplicação é usando Docker Compose:

```bash
docker-compose up
```

Isso irá iniciar todos os serviços necessários:
- Aplicação principal (API)
- Worker para processamento assíncrono
- PostgreSQL
- Redis
- Banco de dados de teste

### Desenvolvimento sem Docker

1. Certifique-se de ter PostgreSQL e Redis rodando localmente.

2. Configure as variáveis de ambiente no arquivo `.env`

3. Execute as migrações do Prisma:
```bash
npx prisma migrate dev
```

4. Inicie o servidor em modo de desenvolvimento:
```bash
npm run dev
```

5. Para o worker de processamento assíncrono, abra outro terminal e execute:
```bash
node dist/infrastructure/messaging/worker.js
```

## Scripts Disponíveis

- `npm run build`: Compila o projeto TypeScript
- `npm start`: Inicia o servidor em produção
- `npm run dev`: Inicia o servidor em modo de desenvolvimento com hot reload
- `npm test`: Executa os testes
- `npm run lint`: Verifica a qualidade do código com ESLint
- `npm run lint:fix`: Corrige automaticamente problemas de lint
- `npm run format`: Formata o código usando Prettier

## Estrutura do Banco de Dados

O projeto utiliza Prisma ORM para gerenciar o banco de dados PostgreSQL. As principais entidades são:

- User: Usuários do sistema (admin/funcionário)
- Customer: Clientes que agendam serviços
- Pet: Animais de estimação vinculados aos clientes
- Service: Serviços oferecidos (banho, tosa, etc.)
- Scheduling: Agendamentos de serviços
- Notification: Notificações enviadas para clientes

Para visualizar ou modificar o schema, consulte o arquivo `prisma/schema.prisma`.

## Contribuição

1. Crie um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
