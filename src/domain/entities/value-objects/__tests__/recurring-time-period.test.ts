import { TimePeriod, DayOfWeek } from '../time-period.js';
import { RecurringTimePeriod } from '../recurring-time-period.js';

describe('RecurringTimePeriod', () => {
  // Períodos de tempo para usar nos testes
  const mondayPeriod = TimePeriod.create(DayOfWeek.MONDAY, '08:00', '18:00');
  const wednesdayPeriod = TimePeriod.create(DayOfWeek.WEDNESDAY, '09:00', '17:00');
  const fridayPeriod = TimePeriod.create(DayOfWeek.FRIDAY, '14:00', '20:00');

  describe('create', () => {
    it('should create a valid recurring time period', () => {
      const monday = TimePeriod.create(DayOfWeek.MONDAY, '09:00', '17:00');
      const tuesday = TimePeriod.create(DayOfWeek.TUESDAY, '09:00', '17:00');
      const recurringPeriod = RecurringTimePeriod.create([monday, tuesday]);

      expect(recurringPeriod).toBeDefined();
      expect(recurringPeriod.timePeriods).toHaveLength(2);
      expect(recurringPeriod.timePeriods[0].dayOfWeek).toBe(DayOfWeek.MONDAY);
      expect(recurringPeriod.timePeriods[1].dayOfWeek).toBe(DayOfWeek.TUESDAY);
    });

    it('should throw error if no time periods are provided', () => {
      expect(() => {
        RecurringTimePeriod.create([]);
      }).toThrow('RecurringTimePeriod: pelo menos um período de tempo deve ser fornecido');
    });

    it('should throw error if duplicate days of week are provided', () => {
      const monday1 = TimePeriod.create(DayOfWeek.MONDAY, '09:00', '17:00');
      const monday2 = TimePeriod.create(DayOfWeek.MONDAY, '18:00', '22:00');
      
      expect(() => {
        RecurringTimePeriod.create([monday1, monday2]);
      }).toThrow('RecurringTimePeriod: dias da semana duplicados não são permitidos');
    });
  });

  describe('createFromDaysOfWeek', () => {
    it('should create a recurring time period from days of week', () => {
      const recurringPeriod = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
        '09:00',
        '17:00'
      );

      expect(recurringPeriod).toBeDefined();
      expect(recurringPeriod.timePeriods).toHaveLength(3);
      expect(recurringPeriod.getDaysOfWeek()).toEqual([DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY]);
    });

    it('should throw error if no days are provided', () => {
      expect(() => {
        RecurringTimePeriod.createFromDaysOfWeek([], '09:00', '17:00');
      }).toThrow('RecurringTimePeriod: pelo menos um dia da semana deve ser fornecido');
    });

    it('should throw error if duplicate days are provided', () => {
      expect(() => {
        RecurringTimePeriod.createFromDaysOfWeek(
          [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.MONDAY],
          '09:00',
          '17:00'
        );
      }).toThrow('RecurringTimePeriod: dias da semana duplicados não são permitidos');
    });
  });

  describe('includesDateTime', () => {
    it('should return true if date time is included in one of the periods', () => {
      const recurringPeriod = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      // Segunda-feira às 10:00
      const mondayDate = new Date('2023-01-02T10:00:00');
      expect(recurringPeriod.includesDateTime(mondayDate)).toBe(true);
      
      // Quarta-feira às 16:00
      const wednesdayDate = new Date('2023-01-04T16:00:00');
      expect(recurringPeriod.includesDateTime(wednesdayDate)).toBe(true);
    });

    it('should return false if date time is not included in any period', () => {
      const recurringPeriod = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      // Terça-feira às 10:00
      const tuesdayDate = new Date('2023-01-03T10:00:00');
      expect(recurringPeriod.includesDateTime(tuesdayDate)).toBe(false);
      
      // Segunda-feira às 18:00 (fora do horário)
      const mondayEveningDate = new Date('2023-01-02T18:00:00');
      expect(recurringPeriod.includesDateTime(mondayEveningDate)).toBe(false);
    });
  });

  describe('includesTimeOnDay', () => {
    it('should return true if time is included on specific day', () => {
      const recurringPeriod = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      expect(recurringPeriod.includesTimeOnDay('10:00', DayOfWeek.MONDAY)).toBe(true);
    });

    it('should return false if day is not included in periods', () => {
      const recurringPeriod = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      expect(recurringPeriod.includesTimeOnDay('10:00', DayOfWeek.TUESDAY)).toBe(false);
    });

    it('should return false if time is outside period on included day', () => {
      const recurringPeriod = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      expect(recurringPeriod.includesTimeOnDay('18:00', DayOfWeek.MONDAY)).toBe(false);
    });
  });

  describe('overlaps', () => {
    it('should return true if recurring periods overlap', () => {
      const period1 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      const period2 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
        '12:00',
        '20:00'
      );
      
      expect(period1.overlaps(period2)).toBe(true);
    });

    it('should return false if recurring periods do not overlap', () => {
      const period1 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '12:00'
      );
      
      const period2 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
        '13:00',
        '17:00'
      );
      
      expect(period1.overlaps(period2)).toBe(false);
    });
  });

  describe('excludeDays', () => {
    it('should return new recurring period with excluded days', () => {
      const period = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
        '09:00',
        '17:00'
      );
      
      const result = period.excludeDays([DayOfWeek.TUESDAY, DayOfWeek.THURSDAY]);
      
      expect(result.getDaysOfWeek()).toEqual([DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY]);
    });

    it('should throw error if all days would be excluded', () => {
      const period = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      expect(() => {
        period.excludeDays([DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY]);
      }).toThrow('RecurringTimePeriod: pelo menos um período de tempo deve ser fornecido');
    });
  });

  describe('includesDay', () => {
    it('should return true if day is included', () => {
      const period = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
        '09:00',
        '17:00'
      );
      
      expect(period.includesDay(DayOfWeek.MONDAY)).toBe(true);
      expect(period.includesDay(DayOfWeek.WEDNESDAY)).toBe(true);
      expect(period.includesDay(DayOfWeek.FRIDAY)).toBe(true);
    });

    it('should return false if day is not included', () => {
      const period = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
        '09:00',
        '17:00'
      );
      
      expect(period.includesDay(DayOfWeek.TUESDAY)).toBe(false);
      expect(period.includesDay(DayOfWeek.THURSDAY)).toBe(false);
      expect(period.includesDay(DayOfWeek.SATURDAY)).toBe(false);
      expect(period.includesDay(DayOfWeek.SUNDAY)).toBe(false);
    });
  });

  describe('getDurationInMinutes', () => {
    it('should calculate total duration across all periods', () => {
      const monday = TimePeriod.create(DayOfWeek.MONDAY, '09:00', '17:00'); // 8 hours = 480 minutes
      const wednesday = TimePeriod.create(DayOfWeek.WEDNESDAY, '13:00', '17:00'); // 4 hours = 240 minutes
      const recurringPeriod = RecurringTimePeriod.create([monday, wednesday]);
      
      expect(recurringPeriod.getDurationInMinutes()).toBe(720); // 480 + 240 = 720
    });
  });

  describe('toString', () => {
    it('should format string representation in pt-BR', () => {
      const period = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      const result = period.toString('pt-BR');
      expect(result).toContain('Segunda-feira');
      expect(result).toContain('Quarta-feira');
      expect(result).toContain('09:00');
      expect(result).toContain('17:00');
    });

    it('should format string representation in en-US', () => {
      const period = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      const result = period.toString('en-US');
      expect(result).toContain('Monday');
      expect(result).toContain('Wednesday');
    });

    it('should format string representation in 12h format', () => {
      const period = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY],
        '09:00',
        '17:00'
      );
      
      const result = period.toString('en-US', '12h');
      expect(result).toContain('9:00 AM');
      expect(result).toContain('5:00 PM');
    });
  });

  describe('equals', () => {
    it('should return true if recurring periods are equal', () => {
      const period1 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      const period2 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      expect(period1.equals(period2)).toBe(true);
    });

    it('should return false if days differ', () => {
      const period1 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      const period2 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
        '09:00',
        '17:00'
      );
      
      expect(period1.equals(period2)).toBe(false);
    });

    it('should return false if times differ', () => {
      const period1 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      );
      
      const period2 = RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '10:00',
        '18:00'
      );
      
      expect(period1.equals(period2)).toBe(false);
    });
  });
}); 