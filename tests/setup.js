// Configuração de testes para o Pet Scheduler API
import "dotenv/config";

// Configurações globais de teste
beforeEach(() => {
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
