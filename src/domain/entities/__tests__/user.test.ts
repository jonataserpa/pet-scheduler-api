import { User, UserRole } from "../user.js";
import { compare } from "bcrypt";

describe("User", () => {
	describe("create", () => {
		it("should create a valid user", async () => {
			const user = await User.create(
				"1",
				"test@example.com",
				"password123",
				"Test User",
				UserRole.EMPLOYEE,
			);

			expect(user).toBeDefined();
			expect(user.id).toBe("1");
			expect(user.email).toBe("test@example.com");
			expect(user.name).toBe("Test User");
			expect(user.role).toBe(UserRole.EMPLOYEE);
			expect(user.active).toBe(true);
		});

		it("should create user with hashed password", async () => {
			const plainPassword = "password123";
			const user = await User.create("1", "test@example.com", plainPassword, "Test User");

			// Verifica se a senha foi hasheada
			const validPassword = await user.validatePassword(plainPassword);
			expect(validPassword).toBe(true);
		});

		it("should create a user with default employee role", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			expect(user.role).toBe(UserRole.EMPLOYEE);
		});

		it("should throw error if id is empty", async () => {
			await expect(User.create("", "test@example.com", "password123", "Test User")).rejects.toThrow(
				"User: ID é obrigatório",
			);
		});

		it("should throw error if email is empty", async () => {
			await expect(User.create("1", "", "password123", "Test User")).rejects.toThrow(
				"User: Email é obrigatório",
			);
		});

		it("should throw error if email is invalid", async () => {
			await expect(User.create("1", "invalid-email", "password123", "Test User")).rejects.toThrow(
				"User: Email inválido",
			);
		});

		it("should throw error if password is too short", async () => {
			await expect(User.create("1", "test@example.com", "123", "Test User")).rejects.toThrow(
				"User: Senha deve ter pelo menos 8 caracteres",
			);
		});

		it("should throw error if name is empty", async () => {
			await expect(User.create("1", "test@example.com", "password123", "")).rejects.toThrow(
				"User: Nome é obrigatório",
			);
		});
	});

	describe("createFromPersistence", () => {
		it("should create user from persistence data", () => {
			const user = User.createFromPersistence(
				"1",
				"test@example.com",
				"hashed_password",
				"Test User",
				UserRole.ADMIN,
				new Date("2023-01-01"),
				new Date("2023-01-02"),
				new Date("2023-01-03"),
				true,
			);

			expect(user).toBeDefined();
			expect(user.id).toBe("1");
			expect(user.email).toBe("test@example.com");
			expect(user.name).toBe("Test User");
			expect(user.role).toBe(UserRole.ADMIN);
			expect(user.createdAt).toEqual(new Date("2023-01-01"));
			expect(user.updatedAt).toEqual(new Date("2023-01-02"));
			expect(user.lastLoginAt).toEqual(new Date("2023-01-03"));
			expect(user.active).toBe(true);
		});
	});

	describe("validatePassword", () => {
		it("should validate correct password", async () => {
			const plainPassword = "password123";
			const user = await User.create("1", "test@example.com", plainPassword, "Test User");

			const isValid = await user.validatePassword(plainPassword);
			expect(isValid).toBe(true);
		});

		it("should not validate incorrect password", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			const isValid = await user.validatePassword("wrong_password");
			expect(isValid).toBe(false);
		});
	});

	describe("changePassword", () => {
		it("should change password when current password is correct", async () => {
			const oldPassword = "password123";
			const newPassword = "newpassword123";

			const user = await User.create("1", "test@example.com", oldPassword, "Test User");

			await user.changePassword(oldPassword, newPassword);

			// Verifica se a nova senha é válida
			const isValid = await user.validatePassword(newPassword);
			expect(isValid).toBe(true);

			// Verifica se a senha antiga não é mais válida
			const isOldValid = await user.validatePassword(oldPassword);
			expect(isOldValid).toBe(false);
		});

		it("should throw error if current password is incorrect", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			await expect(user.changePassword("wrong_password", "newpassword123")).rejects.toThrow(
				"User: Senha atual inválida",
			);
		});

		it("should throw error if new password is too short", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			await expect(user.changePassword("password123", "123")).rejects.toThrow(
				"User: Nova senha deve ter pelo menos 8 caracteres",
			);
		});
	});

	describe("update", () => {
		it("should update user name and email", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			user.update("New Name", "new@example.com");

			expect(user.name).toBe("New Name");
			expect(user.email).toBe("new@example.com");
		});

		it("should throw error if new name is empty", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			expect(() => {
				user.update("", "new@example.com");
			}).toThrow("User: Nome é obrigatório");
		});

		it("should throw error if new email is empty", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			expect(() => {
				user.update("New Name", "");
			}).toThrow("User: Email é obrigatório");
		});

		it("should throw error if new email is invalid", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			expect(() => {
				user.update("New Name", "invalid-email");
			}).toThrow("User: Email inválido");
		});
	});

	describe("role management", () => {
		it("should promote employee to admin", async () => {
			const user = await User.create(
				"1",
				"test@example.com",
				"password123",
				"Test User",
				UserRole.EMPLOYEE,
			);

			user.promoteToAdmin();

			expect(user.role).toBe(UserRole.ADMIN);
		});

		it("should throw error when promoting admin to admin", async () => {
			const user = await User.create(
				"1",
				"test@example.com",
				"password123",
				"Test User",
				UserRole.ADMIN,
			);

			expect(() => {
				user.promoteToAdmin();
			}).toThrow("User: Usuário já é um administrador");
		});

		it("should demote admin to employee", async () => {
			const user = await User.create(
				"1",
				"test@example.com",
				"password123",
				"Test User",
				UserRole.ADMIN,
			);

			user.demoteToEmployee();

			expect(user.role).toBe(UserRole.EMPLOYEE);
		});

		it("should throw error when demoting employee to employee", async () => {
			const user = await User.create(
				"1",
				"test@example.com",
				"password123",
				"Test User",
				UserRole.EMPLOYEE,
			);

			expect(() => {
				user.demoteToEmployee();
			}).toThrow("User: Usuário já é um funcionário");
		});
	});

	describe("activation management", () => {
		it("should deactivate an active user", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			user.deactivate();

			expect(user.active).toBe(false);
		});

		it("should throw error when deactivating an inactive user", async () => {
			const user = await User.create(
				"1",
				"test@example.com",
				"password123",
				"Test User",
				UserRole.EMPLOYEE,
				undefined,
				undefined,
				undefined,
				false,
			);

			expect(() => {
				user.deactivate();
			}).toThrow("User: Usuário já está inativo");
		});

		it("should activate an inactive user", async () => {
			const user = await User.create(
				"1",
				"test@example.com",
				"password123",
				"Test User",
				UserRole.EMPLOYEE,
				undefined,
				undefined,
				undefined,
				false,
			);

			user.activate();

			expect(user.active).toBe(true);
		});

		it("should throw error when activating an active user", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			expect(() => {
				user.activate();
			}).toThrow("User: Usuário já está ativo");
		});
	});

	describe("registerLogin", () => {
		it("should update lastLoginAt", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			expect(user.lastLoginAt).toBeUndefined();

			user.registerLogin();

			expect(user.lastLoginAt).toBeDefined();
		});
	});

	describe("toObject", () => {
		it("should return user data without password", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			const userData = user.toObject();

			expect(userData).toEqual({
				id: "1",
				email: "test@example.com",
				name: "Test User",
				role: UserRole.EMPLOYEE,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
				lastLoginAt: undefined,
				active: true,
			});

			// Verifica que a senha não está no objeto
			expect(userData).not.toHaveProperty("password");
		});
	});

	describe("can", () => {
		it("should allow admin to perform all actions", async () => {
			const admin = await User.create(
				"1",
				"admin@example.com",
				"password123",
				"Admin User",
				UserRole.ADMIN,
			);

			expect(admin.can("manage-users")).toBe(true);
			expect(admin.can("view-reports")).toBe(true);
			expect(admin.can("delete-records")).toBe(true);
			expect(admin.can("regular-action")).toBe(true);
		});

		it("should restrict employee from admin-only actions", async () => {
			const employee = await User.create(
				"2",
				"employee@example.com",
				"password123",
				"Employee User",
				UserRole.EMPLOYEE,
			);

			expect(employee.can("manage-users")).toBe(false);
			expect(employee.can("view-reports")).toBe(false);
			expect(employee.can("delete-records")).toBe(false);
			expect(employee.can("regular-action")).toBe(true);
		});
	});

	describe("equals", () => {
		it("should return true for users with same ID", async () => {
			const user1 = await User.create("1", "test1@example.com", "password123", "Test User 1");

			const user2 = await User.create("1", "test2@example.com", "password456", "Test User 2");

			expect(user1.equals(user2)).toBe(true);
		});

		it("should return false for users with different IDs", async () => {
			const user1 = await User.create("1", "test1@example.com", "password123", "Test User 1");

			const user2 = await User.create("2", "test2@example.com", "password123", "Test User 2");

			expect(user1.equals(user2)).toBe(false);
		});

		it("should return false when comparing with non-User object", async () => {
			const user = await User.create("1", "test@example.com", "password123", "Test User");

			// @ts-expect-error: Testing with invalid type
			expect(user.equals({})).toBe(false);
		});
	});
});
