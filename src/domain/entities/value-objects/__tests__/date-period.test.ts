import { DatePeriod } from "../date-period.js";

describe("DatePeriod", () => {
	let startDate: Date;
	let endDate: Date;
	let period: DatePeriod;

	beforeEach(() => {
		startDate = new Date("2023-08-01T10:00:00.000Z");
		endDate = new Date("2023-08-05T10:00:00.000Z");
		period = DatePeriod.create(startDate, endDate);
	});

	describe("create", () => {
		it("deve criar um período de datas válido", () => {
			expect(period).toBeInstanceOf(DatePeriod);
			expect(period.startDate).toBeInstanceOf(Date);
			expect(period.endDate).toBeInstanceOf(Date);
		});

		it("deve lançar erro se a data de início for após a data de fim", () => {
			expect(() => {
				DatePeriod.create(endDate, startDate);
			}).toThrow("DatePeriod: a data de fim deve ser posterior à data de início");
		});

		it("deve lançar erro quando a data inicial ou final é inválida", () => {
			const invalidDate = new Date("invalid date");

			expect(() => {
				DatePeriod.create(invalidDate, new Date("2023-01-10"));
			}).toThrow("DatePeriod: data de início inválida");

			expect(() => {
				DatePeriod.create(new Date("2023-01-01"), invalidDate);
			}).toThrow("DatePeriod: data de fim inválida");
		});
	});

	describe("createFromDuration", () => {
		it("deve criar um período a partir de uma data inicial e uma duração em dias", () => {
			const durationPeriod = DatePeriod.createFromDuration(startDate, 4);
			expect(durationPeriod.startDate.toISOString()).toBe(startDate.toISOString());
			expect(durationPeriod.endDate.toISOString()).toBe(endDate.toISOString());
		});

		it("deve lançar erro se a duração for negativa", () => {
			expect(() => {
				DatePeriod.createFromDuration(startDate, -1);
			}).toThrow("DatePeriod: a duração deve ser um número inteiro positivo");
		});

		it("deve lançar erro quando a data inicial é inválida", () => {
			const invalidDate = new Date("invalid date");

			expect(() => {
				DatePeriod.createFromDuration(invalidDate, 5);
			}).toThrow("DatePeriod: data de início inválida");
		});
	});

	describe("includesDate", () => {
		it("deve retornar true se a data estiver dentro do período", () => {
			const middleDate = new Date("2023-08-03T10:00:00.000Z");
			expect(period.includesDate(middleDate)).toBe(true);
		});

		it("deve retornar true se a data for igual à data de início", () => {
			expect(period.includesDate(new Date(startDate))).toBe(true);
		});

		it("deve retornar true se a data for igual à data de fim", () => {
			expect(period.includesDate(new Date(endDate))).toBe(true);
		});

		it("deve retornar false se a data estiver antes do período", () => {
			const beforeDate = new Date("2023-07-30T10:00:00.000Z");
			expect(period.includesDate(beforeDate)).toBe(false);
		});

		it("deve retornar false se a data estiver após o período", () => {
			const afterDate = new Date("2023-08-10T10:00:00.000Z");
			expect(period.includesDate(afterDate)).toBe(false);
		});

		it("deve lançar erro quando a data para verificação é inválida", () => {
			expect(() => {
				period.includesDate(new Date("invalid date"));
			}).toThrow("DatePeriod: data para verificação inválida");
		});
	});

	describe("overlaps", () => {
		it("deve retornar true se os períodos se sobrepõem", () => {
			const otherPeriod = DatePeriod.create(
				new Date("2023-08-03T10:00:00.000Z"),
				new Date("2023-08-10T10:00:00.000Z"),
			);
			expect(period.overlaps(otherPeriod)).toBe(true);
		});

		it("deve retornar false se os períodos não se sobrepõem", () => {
			const otherPeriod = DatePeriod.create(
				new Date("2023-08-10T10:00:00.000Z"),
				new Date("2023-08-15T10:00:00.000Z"),
			);
			expect(period.overlaps(otherPeriod)).toBe(false);
		});
	});

	describe("contains", () => {
		it("deve retornar true se o período contiver outro período", () => {
			const innerPeriod = DatePeriod.create(
				new Date("2023-08-02T10:00:00.000Z"),
				new Date("2023-08-04T10:00:00.000Z"),
			);
			expect(period.contains(innerPeriod)).toBe(true);
		});

		it("deve retornar false se o período não contiver outro período", () => {
			const outerPeriod = DatePeriod.create(
				new Date("2023-08-01T10:00:00.000Z"),
				new Date("2023-08-10T10:00:00.000Z"),
			);
			expect(period.contains(outerPeriod)).toBe(false);
		});
	});

	describe("getDurationInDays", () => {
		it("deve retornar a duração em dias correta", () => {
			expect(period.getDurationInDays()).toBe(4);
		});
	});

	describe("getDurationInHours", () => {
		it("deve retornar a duração em horas correta", () => {
			expect(period.getDurationInHours()).toBe(96);
		});
	});

	describe("toString", () => {
		it("deve formatar o período de datas corretamente", () => {
			const result = period.toString();
			expect(result).toContain("até");
		});
	});

	describe("toObject", () => {
		it("deve retornar um objeto com as datas de início e fim", () => {
			const obj = period.toObject();
			expect(obj.startDate.toISOString()).toBe(startDate.toISOString());
			expect(obj.endDate.toISOString()).toBe(endDate.toISOString());
		});
	});

	describe("equals", () => {
		it("deve retornar true para períodos equivalentes", () => {
			const samePeriod = DatePeriod.create(new Date(startDate), new Date(endDate));
			expect(period.equals(samePeriod)).toBe(true);
		});

		it("deve retornar false para períodos diferentes", () => {
			const differentPeriod = DatePeriod.create(
				new Date(startDate),
				new Date("2023-08-10T10:00:00.000Z"),
			);
			expect(period.equals(differentPeriod)).toBe(false);
		});

		it("deve retornar false para objetos que não são DatePeriod", () => {
			// @ts-ignore - Teste de runtime
			expect(period.equals({})).toBe(false);
			// @ts-ignore - Teste de runtime
			expect(period.equals(null)).toBe(false);
		});
	});
});
