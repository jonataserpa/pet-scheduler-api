import { Address } from "../address.js";

describe("Address Value Object", () => {
	const validStreet = "Rua das Flores";
	const validNumber = "123";
	const validNeighborhood = "Centro";
	const validCity = "São Paulo";
	const validState = "SP";
	const validZipCode = "01234-567";
	const validCountry = "Brasil";
	const validComplement = "Apto 101";

	describe("create", () => {
		it("deve criar um Address válido sem complemento", () => {
			const address = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
			);

			expect(address.street).toBe(validStreet);
			expect(address.number).toBe(validNumber);
			expect(address.complement).toBeUndefined();
			expect(address.neighborhood).toBe(validNeighborhood);
			expect(address.city).toBe(validCity);
			expect(address.state).toBe(validState);
			expect(address.zipCode).toBe("01234567"); // Sem traços
			expect(address.country).toBe(validCountry);
		});

		it("deve criar um Address válido com complemento", () => {
			const address = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
				validComplement,
			);

			expect(address.street).toBe(validStreet);
			expect(address.number).toBe(validNumber);
			expect(address.complement).toBe(validComplement);
			expect(address.neighborhood).toBe(validNeighborhood);
			expect(address.city).toBe(validCity);
			expect(address.state).toBe(validState);
			expect(address.zipCode).toBe("01234567"); // Sem traços
			expect(address.country).toBe(validCountry);
		});

		it("deve remover espaços em branco e caracteres não numéricos do CEP", () => {
			const address = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				"  01234-567  ",
				validCountry,
			);

			expect(address.zipCode).toBe("01234567");
		});

		it("deve fazer trim de todos os campos", () => {
			const address = Address.create(
				"  " + validStreet + "  ",
				"  " + validNumber + "  ",
				"  " + validNeighborhood + "  ",
				"  " + validCity + "  ",
				"  " + validState + "  ",
				validZipCode,
				"  " + validCountry + "  ",
				"  " + validComplement + "  ",
			);

			expect(address.street).toBe(validStreet);
			expect(address.number).toBe(validNumber);
			expect(address.complement).toBe(validComplement);
			expect(address.neighborhood).toBe(validNeighborhood);
			expect(address.city).toBe(validCity);
			expect(address.state).toBe(validState);
			expect(address.country).toBe(validCountry);
		});

		it("deve lançar erro se a rua for vazia", () => {
			expect(() =>
				Address.create(
					"",
					validNumber,
					validNeighborhood,
					validCity,
					validState,
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: rua é obrigatória");

			expect(() =>
				Address.create(
					"   ",
					validNumber,
					validNeighborhood,
					validCity,
					validState,
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: rua é obrigatória");
		});

		it("deve lançar erro se o número for vazio", () => {
			expect(() =>
				Address.create(
					validStreet,
					"",
					validNeighborhood,
					validCity,
					validState,
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: número é obrigatório");

			expect(() =>
				Address.create(
					validStreet,
					"   ",
					validNeighborhood,
					validCity,
					validState,
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: número é obrigatório");
		});

		it("deve lançar erro se o bairro for vazio", () => {
			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					"",
					validCity,
					validState,
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: bairro é obrigatório");

			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					"   ",
					validCity,
					validState,
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: bairro é obrigatório");
		});

		it("deve lançar erro se a cidade for vazia", () => {
			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					validNeighborhood,
					"",
					validState,
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: cidade é obrigatória");

			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					validNeighborhood,
					"   ",
					validState,
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: cidade é obrigatória");
		});

		it("deve lançar erro se o estado for vazio", () => {
			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					validNeighborhood,
					validCity,
					"",
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: estado é obrigatório");

			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					validNeighborhood,
					validCity,
					"   ",
					validZipCode,
					validCountry,
				),
			).toThrow("Endereço: estado é obrigatório");
		});

		it("deve lançar erro se o CEP for vazio", () => {
			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					validNeighborhood,
					validCity,
					validState,
					"",
					validCountry,
				),
			).toThrow("Endereço: CEP é obrigatório");

			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					validNeighborhood,
					validCity,
					validState,
					"   ",
					validCountry,
				),
			).toThrow("Endereço: CEP é obrigatório");
		});

		it("deve lançar erro se o país for vazio", () => {
			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					validNeighborhood,
					validCity,
					validState,
					validZipCode,
					"",
				),
			).toThrow("Endereço: país é obrigatório");

			expect(() =>
				Address.create(
					validStreet,
					validNumber,
					validNeighborhood,
					validCity,
					validState,
					validZipCode,
					"   ",
				),
			).toThrow("Endereço: país é obrigatório");
		});
	});

	describe("toString", () => {
		it("deve formatar corretamente o endereço sem complemento", () => {
			const address = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
			);

			const expectedString = `${validStreet}, ${validNumber}, ${validNeighborhood}, ${validCity} - ${validState}, 01234567, ${validCountry}`;
			expect(address.toString()).toBe(expectedString);
		});

		it("deve formatar corretamente o endereço com complemento", () => {
			const address = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
				validComplement,
			);

			const expectedString = `${validStreet}, ${validNumber} - ${validComplement}, ${validNeighborhood}, ${validCity} - ${validState}, 01234567, ${validCountry}`;
			expect(address.toString()).toBe(expectedString);
		});
	});

	describe("toObject", () => {
		it("deve retornar um objeto com as propriedades corretas sem complemento", () => {
			const address = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
			);

			const obj = address.toObject();

			expect(obj).toEqual({
				street: validStreet,
				number: validNumber,
				complement: undefined,
				neighborhood: validNeighborhood,
				city: validCity,
				state: validState,
				zipCode: "01234567",
				country: validCountry,
			});
		});

		it("deve retornar um objeto com as propriedades corretas com complemento", () => {
			const address = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
				validComplement,
			);

			const obj = address.toObject();

			expect(obj).toEqual({
				street: validStreet,
				number: validNumber,
				complement: validComplement,
				neighborhood: validNeighborhood,
				city: validCity,
				state: validState,
				zipCode: "01234567",
				country: validCountry,
			});
		});
	});

	describe("equals", () => {
		it("deve identificar endereços iguais sem complemento", () => {
			const address1 = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
			);

			const address2 = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
			);

			expect(address1.equals(address2)).toBe(true);
		});

		it("deve identificar endereços iguais com complemento", () => {
			const address1 = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
				validComplement,
			);

			const address2 = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
				validComplement,
			);

			expect(address1.equals(address2)).toBe(true);
		});

		it("deve identificar endereços diferentes por rua", () => {
			const address1 = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
			);

			const address2 = Address.create(
				"Outra Rua",
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
			);

			expect(address1.equals(address2)).toBe(false);
		});

		it("deve identificar endereços diferentes por complemento", () => {
			const address1 = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
				validComplement,
			);

			const address2 = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
				"Outro complemento",
			);

			expect(address1.equals(address2)).toBe(false);
		});

		it("deve identificar endereços diferentes pela presença de complemento", () => {
			const address1 = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
			);

			const address2 = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
				validComplement,
			);

			expect(address1.equals(address2)).toBe(false);
		});

		it("deve retornar false quando comparado com algo que não é Address", () => {
			const address = Address.create(
				validStreet,
				validNumber,
				validNeighborhood,
				validCity,
				validState,
				validZipCode,
				validCountry,
			);

			// @ts-expect-error testando com tipo inválido
			expect(address.equals("not an address")).toBe(false);
		});
	});
});
