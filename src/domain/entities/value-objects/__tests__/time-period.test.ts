import { TimePeriod, DayOfWeek } from "../time-period.js";

describe("TimePeriod", () => {
	describe("create", () => {
		it("should create a valid time period", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod).toBeDefined();
			expect(timePeriod.dayOfWeek).toBe(DayOfWeek.MONDAY);
			expect(timePeriod.startTime).toBe("09:00");
			expect(timePeriod.endTime).toBe("17:00");
		});

		it("should throw error if day of week is invalid", () => {
			expect(() => {
				// @ts-expect-error: Testing invalid input
				TimePeriod.create(7, "09:00", "17:00");
			}).toThrow("TimePeriod: dia da semana inválido");
		});

		it("should throw error if start time is invalid", () => {
			expect(() => {
				TimePeriod.create(DayOfWeek.MONDAY, "invalid", "17:00");
			}).toThrow("TimePeriod: formato de hora inválido");
		});

		it("should throw error if end time is invalid", () => {
			expect(() => {
				TimePeriod.create(DayOfWeek.MONDAY, "09:00", "invalid");
			}).toThrow("TimePeriod: formato de hora inválido");
		});

		it("should throw error if start time is after end time", () => {
			expect(() => {
				TimePeriod.create(DayOfWeek.MONDAY, "18:00", "17:00");
			}).toThrow("TimePeriod: a hora de início deve ser anterior à hora de fim");
		});
	});

	describe("includesDateTime", () => {
		it("should return true if date time is included in the period", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			const dateTime = new Date("2023-01-02T10:00:00"); // Segunda-feira
			expect(timePeriod.includesDateTime(dateTime)).toBe(true);
		});

		it("should return false if date time is not on the same day of week", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			const dateTime = new Date("2023-01-03T10:00:00"); // Terça-feira
			expect(timePeriod.includesDateTime(dateTime)).toBe(false);
		});

		it("should return false if date time is outside the time range", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			const dateTime = new Date("2023-01-02T18:00:00"); // Segunda-feira, 18h
			expect(timePeriod.includesDateTime(dateTime)).toBe(false);
		});
	});

	describe("includesTime", () => {
		it("should return true if time is included in the period", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod.includesTime("10:00")).toBe(true);
		});

		it("should return true if time is at the start of the period", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod.includesTime("09:00")).toBe(true);
		});

		it("should return true if time is at the end of the period", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod.includesTime("17:00")).toBe(true);
		});

		it("should return false if time is before the period", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod.includesTime("08:59")).toBe(false);
		});

		it("should return false if time is after the period", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod.includesTime("17:01")).toBe(false);
		});
	});

	describe("overlaps", () => {
		it("should return true if periods overlap", () => {
			const period1 = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			const period2 = TimePeriod.create(DayOfWeek.MONDAY, "12:00", "18:00");
			expect(period1.overlaps(period2)).toBe(true);
		});

		it("should return false if periods do not overlap (different days)", () => {
			const period1 = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			const period2 = TimePeriod.create(DayOfWeek.TUESDAY, "09:00", "17:00");
			expect(period1.overlaps(period2)).toBe(false);
		});

		it("should return false if periods do not overlap (different times)", () => {
			const period1 = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "12:00");
			const period2 = TimePeriod.create(DayOfWeek.MONDAY, "12:01", "17:00");
			expect(period1.overlaps(period2)).toBe(false);
		});
	});

	describe("getDurationInMinutes", () => {
		it("should calculate duration correctly", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod.getDurationInMinutes()).toBe(480); // 8 horas = 480 minutos
		});

		it("should calculate small duration correctly", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "09:30");
			expect(timePeriod.getDurationInMinutes()).toBe(30);
		});
	});

	describe("toString", () => {
		it("should format string representation in pt-BR", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod.toString("pt-BR")).toBe("Segunda-feira, 09:00 até 17:00");
		});

		it("should format string representation in en-US", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod.toString("en-US")).toBe("Monday, 09:00 to 17:00");
		});

		it("should format string representation in 12h format", () => {
			const timePeriod = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(timePeriod.toString("en-US", "12h")).toBe("Monday, 9:00 AM to 5:00 PM");
		});
	});

	describe("equals", () => {
		it("should return true if periods are equal", () => {
			const period1 = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			const period2 = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			expect(period1.equals(period2)).toBe(true);
		});

		it("should return false if periods have different days", () => {
			const period1 = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			const period2 = TimePeriod.create(DayOfWeek.TUESDAY, "09:00", "17:00");
			expect(period1.equals(period2)).toBe(false);
		});

		it("should return false if periods have different start times", () => {
			const period1 = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			const period2 = TimePeriod.create(DayOfWeek.MONDAY, "10:00", "17:00");
			expect(period1.equals(period2)).toBe(false);
		});

		it("should return false if periods have different end times", () => {
			const period1 = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "17:00");
			const period2 = TimePeriod.create(DayOfWeek.MONDAY, "09:00", "18:00");
			expect(period1.equals(period2)).toBe(false);
		});
	});
});
