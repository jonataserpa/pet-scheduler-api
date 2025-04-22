import { LoginHistory } from "../login-history.js";
import { compare } from "bcrypt";

describe("LoginHistory", () => {
	const validEmail = "usuario@teste.com";
	const validIpAddress = "192.168.1.1";
	const validUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
	const validTimestamp = new Date();
	const validUserId = "user-123";

	describe("create", () => {
		it("deve criar um objeto LoginHistory válido", () => {
			const loginHistory = LoginHistory.create(
				"test-id",
				null,
				validEmail,
				"success",
				validTimestamp,
				validIpAddress,
				validUserAgent,
			);

			expect(loginHistory).toBeInstanceOf(LoginHistory);
			expect(loginHistory.email).toBe(validEmail);
			expect(loginHistory.ipAddress).toBe(validIpAddress);
			expect(loginHistory.userAgent).toBe(validUserAgent);
			expect(loginHistory.status).toBe("success");
			expect(loginHistory.timestamp).toEqual(validTimestamp);
			expect(loginHistory.id).toBeDefined();
		});

		it("deve gerar um ID aleatório se não for fornecido", () => {
			// Não aplicável com a nova assinatura, pois o ID é obrigatório
			// Simulamos dois logins com IDs diferentes
			const loginHistory1 = LoginHistory.create(
				"test-id-1",
				null,
				validEmail,
				"success",
				validTimestamp,
				validIpAddress,
				validUserAgent,
			);

			const loginHistory2 = LoginHistory.create(
				"test-id-2",
				null,
				validEmail,
				"success",
				validTimestamp,
				validIpAddress,
				validUserAgent,
			);

			expect(loginHistory1.id).not.toBe(loginHistory2.id);
		});

		it("deve usar o ID fornecido se for passado", () => {
			const customId = "custom-id-123";
			const loginHistory = LoginHistory.create(
				customId,
				null,
				validEmail,
				"success",
				validTimestamp,
				validIpAddress,
				validUserAgent,
			);

			expect(loginHistory.id).toBe(customId);
		});

		it("deve lançar erro se o email não for fornecido", () => {
			expect(() => {
				LoginHistory.create(
					"test-id",
					null,
					"",
					"success",
					validTimestamp,
					validIpAddress,
					validUserAgent,
				);
			}).toThrow("Email é obrigatório");
		});

		it("deve lançar erro se o email for inválido", () => {
			expect(() => {
				LoginHistory.create(
					"test-id",
					null,
					"email-invalido",
					"success",
					validTimestamp,
					validIpAddress,
					validUserAgent,
				);
			}).toThrow(/Email inválido/);
		});

		it("deve lançar erro se o ipAddress não for fornecido", () => {
			expect(() => {
				LoginHistory.create(
					"test-id",
					null,
					validEmail,
					"success",
					validTimestamp,
					"",
					validUserAgent,
				);
			}).toThrow("Endereço IP é obrigatório");
		});

		it("deve lançar erro se o userAgent não for fornecido", () => {
			expect(() => {
				LoginHistory.create(
					"test-id",
					null,
					validEmail,
					"success",
					validTimestamp,
					validIpAddress,
					"",
				);
			}).toThrow("User-Agent é obrigatório");
		});

		it("deve lançar erro se o status não for fornecido", () => {
			expect(() => {
				LoginHistory.create(
					"test-id",
					null,
					validEmail,
					"" as any,
					validTimestamp,
					validIpAddress,
					validUserAgent,
				);
			}).toThrow(/Status é obrigatório/);
		});

		it("deve lançar erro se o status for inválido", () => {
			expect(() => {
				LoginHistory.create(
					"test-id",
					null,
					validEmail,
					"invalid-status" as any,
					validTimestamp,
					validIpAddress,
					validUserAgent,
				);
			}).toThrow(/Status inválido/);
		});

		it("deve lançar erro se o timestamp não for fornecido", () => {
			expect(() => {
				LoginHistory.create(
					"test-id",
					null,
					validEmail,
					"success",
					undefined as any,
					validIpAddress,
					validUserAgent,
				);
			}).toThrow("Timestamp é obrigatório");
		});
	});

	describe("createSuccessLogin", () => {
		it("deve criar um registro de login bem-sucedido", () => {
			const loginHistory = LoginHistory.createSuccessLogin(
				"login-id",
				validUserId,
				validEmail,
				validIpAddress,
				validUserAgent,
			);

			expect(loginHistory).toBeInstanceOf(LoginHistory);
			expect(loginHistory.userId).toBe(validUserId);
			expect(loginHistory.email).toBe(validEmail);
			expect(loginHistory.ipAddress).toBe(validIpAddress);
			expect(loginHistory.userAgent).toBe(validUserAgent);
			expect(loginHistory.status).toBe("success");
			expect(loginHistory.timestamp).toBeInstanceOf(Date);
		});

		it("deve aceitar informações de localização opcionais", () => {
			const location = {
				country: "Brasil",
				region: "São Paulo",
				city: "São Paulo",
			};

			const loginHistory = LoginHistory.createSuccessLogin(
				"login-id",
				validUserId,
				validEmail,
				validIpAddress,
				validUserAgent,
				"password",
				location,
			);

			expect(loginHistory.location).toEqual(location);
		});
	});

	describe("createFailedLogin", () => {
		it("deve criar um registro de login falho", () => {
			const loginHistory = LoginHistory.createFailedLogin(
				"login-id",
				validEmail,
				validIpAddress,
				validUserAgent,
				"Senha incorreta",
			);

			expect(loginHistory).toBeInstanceOf(LoginHistory);
			expect(loginHistory.userId).toBeNull();
			expect(loginHistory.email).toBe(validEmail);
			expect(loginHistory.ipAddress).toBe(validIpAddress);
			expect(loginHistory.userAgent).toBe(validUserAgent);
			expect(loginHistory.status).toBe("failed");
			expect(loginHistory.timestamp).toBeInstanceOf(Date);
			expect(loginHistory.details?.reason).toBe("Senha incorreta");
		});

		it("deve aceitar informações de localização opcionais", () => {
			const location = {
				country: "Brasil",
				region: "São Paulo",
				city: "São Paulo",
			};

			const loginHistory = LoginHistory.createFailedLogin(
				"login-id",
				validEmail,
				validIpAddress,
				validUserAgent,
				"Senha incorreta",
				location,
			);

			expect(loginHistory.location).toEqual(location);
		});
	});

	describe("createSuspiciousLogin", () => {
		it("deve criar um registro de login suspeito", () => {
			const loginHistory = LoginHistory.createSuspiciousLogin(
				"login-id",
				validEmail,
				validIpAddress,
				validUserAgent,
				"Localização suspeita",
			);

			expect(loginHistory).toBeInstanceOf(LoginHistory);
			expect(loginHistory.userId).toBeNull();
			expect(loginHistory.email).toBe(validEmail);
			expect(loginHistory.ipAddress).toBe(validIpAddress);
			expect(loginHistory.userAgent).toBe(validUserAgent);
			expect(loginHistory.status).toBe("suspicious");
			expect(loginHistory.timestamp).toBeInstanceOf(Date);
			expect(loginHistory.details?.reason).toBe("Localização suspeita");
		});
	});

	describe("toObject", () => {
		it("deve retornar um objeto com as propriedades corretas", () => {
			const loginHistory = LoginHistory.createSuccessLogin(
				"login-id",
				validUserId,
				validEmail,
				validIpAddress,
				validUserAgent,
			);

			const obj = loginHistory.toObject();

			expect(obj).toHaveProperty("id");
			expect(obj).toHaveProperty("userId", validUserId);
			expect(obj).toHaveProperty("email", validEmail);
			expect(obj).toHaveProperty("ipAddress", validIpAddress);
			expect(obj).toHaveProperty("userAgent", validUserAgent);
			expect(obj).toHaveProperty("status", "success");
			expect(obj).toHaveProperty("timestamp");
		});
	});
});
