import { LoginHistory } from "../login-history.js";

describe("LoginHistory", () => {
	const validEmail = "usuario@teste.com";
	const validIpAddress = "192.168.1.1";
	const validUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
	const validTimestamp = new Date();
	const validUserId = "user-123";

	describe("create", () => {
		it("deve criar um objeto LoginHistory válido", () => {
			const loginHistory = LoginHistory.create({
				email: validEmail,
				ipAddress: validIpAddress,
				userAgent: validUserAgent,
				status: "success",
				timestamp: validTimestamp,
			});

			expect(loginHistory).toBeInstanceOf(LoginHistory);
			expect(loginHistory.email).toBe(validEmail);
			expect(loginHistory.ipAddress).toBe(validIpAddress);
			expect(loginHistory.userAgent).toBe(validUserAgent);
			expect(loginHistory.status).toBe("success");
			expect(loginHistory.timestamp).toEqual(validTimestamp);
			expect(loginHistory.id).toBeDefined();
		});

		it("deve gerar um ID aleatório se não for fornecido", () => {
			const loginHistory1 = LoginHistory.create({
				email: validEmail,
				ipAddress: validIpAddress,
				userAgent: validUserAgent,
				status: "success",
				timestamp: validTimestamp,
			});

			const loginHistory2 = LoginHistory.create({
				email: validEmail,
				ipAddress: validIpAddress,
				userAgent: validUserAgent,
				status: "success",
				timestamp: validTimestamp,
			});

			expect(loginHistory1.id).not.toBe(loginHistory2.id);
		});

		it("deve usar o ID fornecido se for passado", () => {
			const customId = "custom-id-123";
			const loginHistory = LoginHistory.create({
				id: customId,
				email: validEmail,
				ipAddress: validIpAddress,
				userAgent: validUserAgent,
				status: "success",
				timestamp: validTimestamp,
			});

			expect(loginHistory.id).toBe(customId);
		});

		it("deve lançar erro se o email não for fornecido", () => {
			expect(() => {
				LoginHistory.create({
					email: "",
					ipAddress: validIpAddress,
					userAgent: validUserAgent,
					status: "success",
					timestamp: validTimestamp,
				});
			}).toThrow("Email é obrigatório");
		});

		it("deve lançar erro se o email for inválido", () => {
			expect(() => {
				LoginHistory.create({
					email: "email-invalido",
					ipAddress: validIpAddress,
					userAgent: validUserAgent,
					status: "success",
					timestamp: validTimestamp,
				});
			}).toThrow("Email inválido");
		});

		it("deve lançar erro se o ipAddress não for fornecido", () => {
			expect(() => {
				LoginHistory.create({
					email: validEmail,
					ipAddress: "",
					userAgent: validUserAgent,
					status: "success",
					timestamp: validTimestamp,
				});
			}).toThrow("Endereço IP é obrigatório");
		});

		it("deve lançar erro se o userAgent não for fornecido", () => {
			expect(() => {
				LoginHistory.create({
					email: validEmail,
					ipAddress: validIpAddress,
					userAgent: "",
					status: "success",
					timestamp: validTimestamp,
				});
			}).toThrow("User-Agent é obrigatório");
		});

		it("deve lançar erro se o status não for fornecido", () => {
			expect(() => {
				LoginHistory.create({
					email: validEmail,
					ipAddress: validIpAddress,
					userAgent: validUserAgent,
					status: "" as any,
					timestamp: validTimestamp,
				});
			}).toThrow("Status é obrigatório");
		});

		it("deve lançar erro se o status for inválido", () => {
			expect(() => {
				LoginHistory.create({
					email: validEmail,
					ipAddress: validIpAddress,
					userAgent: validUserAgent,
					status: "invalid-status" as any,
					timestamp: validTimestamp,
				});
			}).toThrow("Status inválido");
		});

		it("deve lançar erro se o status for failed mas não tiver failureReason", () => {
			expect(() => {
				LoginHistory.create({
					email: validEmail,
					ipAddress: validIpAddress,
					userAgent: validUserAgent,
					status: "failed",
					timestamp: validTimestamp,
				});
			}).toThrow("Motivo da falha é obrigatório para status failed ou blocked");
		});

		it("deve lançar erro se o status for blocked mas não tiver failureReason", () => {
			expect(() => {
				LoginHistory.create({
					email: validEmail,
					ipAddress: validIpAddress,
					userAgent: validUserAgent,
					status: "blocked",
					timestamp: validTimestamp,
				});
			}).toThrow("Motivo da falha é obrigatório para status failed ou blocked");
		});

		it("deve lançar erro se o timestamp não for fornecido", () => {
			expect(() => {
				LoginHistory.create({
					email: validEmail,
					ipAddress: validIpAddress,
					userAgent: validUserAgent,
					status: "success",
					timestamp: undefined as any,
				});
			}).toThrow("Timestamp é obrigatório");
		});
	});

	describe("createSuccessful", () => {
		it("deve criar um registro de login bem-sucedido", () => {
			const loginHistory = LoginHistory.createSuccessful(
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
			expect(loginHistory.failureReason).toBeUndefined();
		});

		it("deve aceitar informações de localização opcionais", () => {
			const location = {
				country: "Brasil",
				region: "São Paulo",
				city: "São Paulo",
			};

			const loginHistory = LoginHistory.createSuccessful(
				validUserId,
				validEmail,
				validIpAddress,
				validUserAgent,
				location,
			);

			expect(loginHistory.location).toEqual(location);
		});
	});

	describe("createFailed", () => {
		it("deve criar um registro de login falho", () => {
			const failureReason = "Senha incorreta";

			const loginHistory = LoginHistory.createFailed(
				validEmail,
				validIpAddress,
				validUserAgent,
				failureReason,
			);

			expect(loginHistory).toBeInstanceOf(LoginHistory);
			expect(loginHistory.userId).toBeUndefined();
			expect(loginHistory.email).toBe(validEmail);
			expect(loginHistory.ipAddress).toBe(validIpAddress);
			expect(loginHistory.userAgent).toBe(validUserAgent);
			expect(loginHistory.status).toBe("failed");
			expect(loginHistory.timestamp).toBeInstanceOf(Date);
			expect(loginHistory.failureReason).toBe(failureReason);
		});

		it("deve aceitar informações de localização opcionais", () => {
			const location = {
				country: "Brasil",
				region: "São Paulo",
				city: "São Paulo",
			};

			const loginHistory = LoginHistory.createFailed(
				validEmail,
				validIpAddress,
				validUserAgent,
				"Senha incorreta",
				location,
			);

			expect(loginHistory.location).toEqual(location);
		});
	});

	describe("createBlocked", () => {
		it("deve criar um registro de login bloqueado", () => {
			const failureReason = "Muitas tentativas de login";

			const loginHistory = LoginHistory.createBlocked(
				validEmail,
				validIpAddress,
				validUserAgent,
				failureReason,
			);

			expect(loginHistory).toBeInstanceOf(LoginHistory);
			expect(loginHistory.userId).toBeUndefined();
			expect(loginHistory.email).toBe(validEmail);
			expect(loginHistory.ipAddress).toBe(validIpAddress);
			expect(loginHistory.userAgent).toBe(validUserAgent);
			expect(loginHistory.status).toBe("blocked");
			expect(loginHistory.timestamp).toBeInstanceOf(Date);
			expect(loginHistory.failureReason).toBe(failureReason);
		});
	});

	describe("toObject", () => {
		it("deve retornar um objeto com as propriedades corretas", () => {
			const loginHistory = LoginHistory.createSuccessful(
				validUserId,
				validEmail,
				validIpAddress,
				validUserAgent,
			);

			const obj = loginHistory.toObject();

			expect(obj).toEqual({
				id: loginHistory.id,
				userId: validUserId,
				email: validEmail,
				ipAddress: validIpAddress,
				userAgent: validUserAgent,
				status: "success",
				failureReason: undefined,
				timestamp: loginHistory.timestamp,
				location: undefined,
			});
		});
	});

	describe("equals", () => {
		it("deve retornar true para objetos com mesmo ID", () => {
			const id = "same-id";
			const login1 = LoginHistory.create({
				id,
				email: validEmail,
				ipAddress: validIpAddress,
				userAgent: validUserAgent,
				status: "success",
				timestamp: validTimestamp,
			});

			const login2 = LoginHistory.create({
				id,
				email: "outro@email.com", // diferentes propriedades
				ipAddress: "10.0.0.1",
				userAgent: "Outro agente",
				status: "success",
				timestamp: new Date(),
			});

			expect(login1.equals(login2)).toBe(true);
		});

		it("deve retornar false para objetos com IDs diferentes", () => {
			const login1 = LoginHistory.create({
				id: "id-1",
				email: validEmail,
				ipAddress: validIpAddress,
				userAgent: validUserAgent,
				status: "success",
				timestamp: validTimestamp,
			});

			const login2 = LoginHistory.create({
				id: "id-2",
				email: validEmail,
				ipAddress: validIpAddress,
				userAgent: validUserAgent,
				status: "success",
				timestamp: validTimestamp,
			});

			expect(login1.equals(login2)).toBe(false);
		});

		it("deve retornar false quando comparado com algo que não é LoginHistory", () => {
			const login = LoginHistory.create({
				email: validEmail,
				ipAddress: validIpAddress,
				userAgent: validUserAgent,
				status: "success",
				timestamp: validTimestamp,
			});

			// @ts-ignore - teste proposital
			expect(login.equals({})).toBe(false);
		});
	});
});
