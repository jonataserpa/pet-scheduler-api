#!/bin/bash

# Script para remover testes não relacionados ao projeto Pet Scheduler API

echo "Limpando testes não relacionados ao projeto Pet Scheduler API..."

# Removendo pastas de testes não relacionados
rm -rf tests/unit
rm -rf tests/fixture
rm -rf tests/fixtures
rm -rf tests/integration

# Criando estrutura mínima para testes
mkdir -p tests/unit

# Criando arquivo de configuração mínimo para testes
cat > tests/setup.js << 'EOL'
// Configuração de testes para o Pet Scheduler API
import 'dotenv/config';

// Configurações globais de teste
global.beforeEach(() => {
  jest.clearAllMocks();
});

// Silence console during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
EOL

# Criando um README básico
cat > tests/README.md << 'EOL'
# Testes do Pet Scheduler API

Este diretório contém testes para a API de agendamento de serviços para pets.

## Estrutura

- `src/domain/entities/__tests__/`: Testes para as entidades de domínio
- `src/domain/entities/value-objects/__tests__/`: Testes para os value objects
- `src/infrastructure/repositories/__tests__/`: Testes para repositórios

## Executando os testes

```bash
npm test
npm run test:coverage
```
EOL

echo "Limpeza concluída. Os testes relacionados ao Task Master foram removidos."
echo "Mantidos apenas os testes específicos do Pet Scheduler API em src/**/__tests__/" 