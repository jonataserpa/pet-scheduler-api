import { TimePeriod, DayOfWeek } from '../time-period.js';
import { RecurringTimePeriod } from '../recurring-time-period.js';
import { RecurringTimePeriodWithExceptions } from '../recurring-time-period-with-exceptions.js';

describe('RecurringTimePeriodWithExceptions', () => {
  // Períodos de tempo para usar nos testes
  const mondayPeriod = TimePeriod.create(DayOfWeek.MONDAY, '08:00', '18:00');
  const wednesdayPeriod = TimePeriod.create(DayOfWeek.WEDNESDAY, '09:00', '17:00');
  const fridayPeriod = TimePeriod.create(DayOfWeek.FRIDAY, '14:00', '20:00');
  
  const recurringPeriod = RecurringTimePeriod.create([
    mondayPeriod, 
    wednesdayPeriod, 
    fridayPeriod
  ]);

  // Datas de exceção para os testes (primeira segunda-feira, quarta-feira e sexta-feira de janeiro 2023)
  const mondayException = new Date(2023, 0, 2); // 02/01/2023 é uma segunda-feira
  const wednesdayException = new Date(2023, 0, 4); // 04/01/2023 é uma quarta-feira
  const fridayException = new Date(2023, 0, 6); // 06/01/2023 é uma sexta-feira

  describe('create', () => {
    it('deve criar um período recorrente com exceções válido', () => {
      const exceptions = [mondayException, wednesdayException];
      const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
        recurringPeriod,
        exceptions
      );
      
      expect(periodWithExceptions.recurringPeriod).toEqual(recurringPeriod);
      expect(periodWithExceptions.exceptions.length).toBe(2);
    });

    it('deve normalizar as datas de exceção para meia-noite', () => {
      const dateWithTime = new Date(2023, 0, 2, 12, 30); // Segunda-feira com horário 12:30
      const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
        recurringPeriod,
        [dateWithTime]
      );
      
      // A exceção deve ter sido normalizada para meia-noite
      const exception = periodWithExceptions.exceptions[0];
      expect(exception.getHours()).toBe(0);
      expect(exception.getMinutes()).toBe(0);
      expect(exception.getSeconds()).toBe(0);
      expect(exception.getMilliseconds()).toBe(0);
    });

    it('deve lançar erro se o período recorrente for inválido', () => {
      expect(() => RecurringTimePeriodWithExceptions.create(null as any, [])).toThrow(
        'RecurringTimePeriodWithExceptions: período recorrente é obrigatório'
      );
    });
  });

  describe('createFromDaysOfWeek', () => {
    it('deve criar um período recorrente com exceções a partir de dias da semana', () => {
      const days = [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY];
      const exceptions = [mondayException, fridayException];
      
      const periodWithExceptions = RecurringTimePeriodWithExceptions.createFromDaysOfWeek(
        days,
        '09:00',
        '17:00',
        exceptions
      );
      
      expect(periodWithExceptions.exceptions.length).toBe(2);
      expect(periodWithExceptions.recurringPeriod.getDaysOfWeek()).toEqual(days);
    });
  });

  describe('isExceptionDate (método privado testado indiretamente)', () => {
    it('deve identificar datas de exceção através do método includesDateTime', () => {
      const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
        recurringPeriod,
        [mondayException]
      );
      
      // Segunda-feira às 12:00 normalmente seria incluída, mas é uma exceção
      const mondayTime = new Date(2023, 0, 2, 12, 0);
      expect(periodWithExceptions.includesDateTime(mondayTime)).toBe(false);
      
      // Próxima segunda-feira (não é exceção) deve ser incluída
      const nextMondayTime = new Date(2023, 0, 9, 12, 0);
      expect(periodWithExceptions.includesDateTime(nextMondayTime)).toBe(true);
    });
  });

  describe('includesDateTime', () => {
    const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
      recurringPeriod,
      [mondayException, wednesdayException]
    );

    it('deve retornar false para datas que são exceções', () => {
      const mondayTime = new Date(2023, 0, 2, 12, 0);
      expect(periodWithExceptions.includesDateTime(mondayTime)).toBe(false);
      
      const wednesdayTime = new Date(2023, 0, 4, 12, 0);
      expect(periodWithExceptions.includesDateTime(wednesdayTime)).toBe(false);
    });

    it('deve retornar true para datas dentro do período e que não são exceções', () => {
      // Próxima segunda (não é exceção)
      const nextMondayTime = new Date(2023, 0, 9, 12, 0);
      expect(periodWithExceptions.includesDateTime(nextMondayTime)).toBe(true);
      
      // Sexta-feira (não é exceção)
      const fridayTime = new Date(2023, 0, 6, 15, 0);
      expect(periodWithExceptions.includesDateTime(fridayTime)).toBe(true);
    });

    it('deve retornar false para datas fora do período recorrente', () => {
      // Terça-feira (não está no período recorrente)
      const tuesdayTime = new Date(2023, 0, 3, 12, 0);
      expect(periodWithExceptions.includesDateTime(tuesdayTime)).toBe(false);
      
      // Segunda-feira fora do horário
      const mondayOutsideHours = new Date(2023, 0, 9, 19, 0);
      expect(periodWithExceptions.includesDateTime(mondayOutsideHours)).toBe(false);
    });

    it('deve lançar erro para data inválida', () => {
      expect(() => periodWithExceptions.includesDateTime(new Date('invalid date'))).toThrow(
        'RecurringTimePeriodWithExceptions: data e hora para verificação inválidas'
      );
    });
  });

  describe('addException', () => {
    const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
      recurringPeriod,
      [mondayException]
    );

    it('deve adicionar uma nova exceção e retornar uma nova instância', () => {
      const result = periodWithExceptions.addException(wednesdayException);
      
      // A instância original não deve ser alterada
      expect(periodWithExceptions.exceptions.length).toBe(1);
      
      // A nova instância deve ter a exceção adicional
      expect(result.exceptions.length).toBe(2);
      
      // As exceções devem ser normalizadas para meia-noite
      expect(result.exceptions[1].getHours()).toBe(0);
    });

    it('deve lançar erro para data inválida', () => {
      expect(() => periodWithExceptions.addException(new Date('invalid date'))).toThrow(
        'RecurringTimePeriodWithExceptions: data de exceção inválida'
      );
    });
  });

  describe('removeException', () => {
    const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
      recurringPeriod,
      [mondayException, wednesdayException, fridayException]
    );

    it('deve remover uma exceção e retornar uma nova instância', () => {
      const result = periodWithExceptions.removeException(wednesdayException);
      
      // A instância original não deve ser alterada
      expect(periodWithExceptions.exceptions.length).toBe(3);
      
      // A nova instância deve ter uma exceção a menos
      expect(result.exceptions.length).toBe(2);
      
      // A exceção específica deve ter sido removida
      expect(result.exceptions.some(d => d.getTime() === wednesdayException.getTime())).toBe(false);
    });

    it('deve ignorar silenciosamente se a exceção não existir', () => {
      const nonExistentDate = new Date(2023, 0, 10); // Uma data que não está nas exceções
      const result = periodWithExceptions.removeException(nonExistentDate);
      
      // Deve manter todas as exceções originais
      expect(result.exceptions.length).toBe(3);
    });
  });

  describe('clearExceptions', () => {
    const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
      recurringPeriod,
      [mondayException, wednesdayException]
    );

    it('deve remover todas as exceções e retornar uma nova instância', () => {
      const result = periodWithExceptions.clearExceptions();
      
      // A instância original não deve ser alterada
      expect(periodWithExceptions.exceptions.length).toBe(2);
      
      // A nova instância não deve ter exceções
      expect(result.exceptions.length).toBe(0);
    });
  });

  describe('overlaps', () => {
    const period1 = RecurringTimePeriodWithExceptions.create(
      RecurringTimePeriod.create([
        TimePeriod.create(DayOfWeek.MONDAY, '08:00', '12:00'),
        TimePeriod.create(DayOfWeek.WEDNESDAY, '08:00', '12:00')
      ]),
      [mondayException]
    );

    it('deve retornar true quando os períodos recorrentes se sobrepõem', () => {
      const period2 = RecurringTimePeriodWithExceptions.create(
        RecurringTimePeriod.create([
          TimePeriod.create(DayOfWeek.MONDAY, '10:00', '14:00'),
          TimePeriod.create(DayOfWeek.THURSDAY, '08:00', '12:00')
        ]),
        [mondayException] // Mesmo dia de exceção
      );
      
      expect(period1.overlaps(period2)).toBe(true);
    });

    it('deve retornar false quando os períodos recorrentes não se sobrepõem', () => {
      const period2 = RecurringTimePeriodWithExceptions.create(
        RecurringTimePeriod.create([
          TimePeriod.create(DayOfWeek.TUESDAY, '08:00', '12:00'),
          TimePeriod.create(DayOfWeek.THURSDAY, '08:00', '12:00')
        ]),
        []
      );
      
      expect(period1.overlaps(period2)).toBe(false);
    });
  });

  describe('getNextOccurrence', () => {
    const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
      RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
        '09:00',
        '17:00'
      ),
      [mondayException, wednesdayException] // Exclui a primeira segunda e quarta
    );

    it('deve encontrar a próxima ocorrência que não seja uma exceção', () => {
      // Domingo, 01/01/2023 - deveria retornar sexta-feira 06/01/2023 às 09:00
      // já que segunda (02/01) e quarta (04/01) são exceções
      const nextOccurrence = periodWithExceptions.getNextOccurrence(new Date(2023, 0, 1, 12, 0));
      
      expect(nextOccurrence).not.toBeNull();
      if (nextOccurrence) {
        expect(nextOccurrence.getDate()).toBe(6); // Dia 6
        expect(nextOccurrence.getMonth()).toBe(0); // Janeiro
        expect(nextOccurrence.getFullYear()).toBe(2023);
        expect(nextOccurrence.getHours()).toBe(9);
        expect(nextOccurrence.getMinutes()).toBe(0);
      }
    });

    it('deve retornar a próxima segunda-feira quando busca a partir de sexta após o horário', () => {
      // Sexta 06/01/2023 às 18:00 (após o horário) - próxima deve ser segunda 09/01/2023
      const nextOccurrence = periodWithExceptions.getNextOccurrence(new Date(2023, 0, 6, 18, 0));
      
      expect(nextOccurrence).not.toBeNull();
      if (nextOccurrence) {
        expect(nextOccurrence.getDate()).toBe(9); // Dia 9
        expect(nextOccurrence.getDay()).toBe(1); // Segunda-feira
      }
    });

    it('deve lançar erro para data inválida', () => {
      expect(() => periodWithExceptions.getNextOccurrence(new Date('invalid date'))).toThrow(
        'RecurringTimePeriodWithExceptions: data de início inválida'
      );
    });
  });

  describe('toObject', () => {
    it('deve retornar objeto com períodos e exceções', () => {
      const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
        recurringPeriod,
        [mondayException, wednesdayException]
      );
      
      const obj = periodWithExceptions.toObject();
      
      expect(obj.periods).toBeDefined();
      expect(obj.periods.length).toBe(3);
      expect(obj.exceptions).toBeDefined();
      expect(obj.exceptions.length).toBe(2);
    });
  });

  describe('toString', () => {
    const periodWithExceptions = RecurringTimePeriodWithExceptions.create(
      RecurringTimePeriod.createFromDaysOfWeek(
        [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        '09:00',
        '17:00'
      ),
      [mondayException] // Exclui apenas a primeira segunda
    );

    it('deve formatar o período com exceções em português (padrão)', () => {
      const result = periodWithExceptions.toString();
      expect(result).toContain('Segunda-feira e Quarta-feira');
      expect(result).toContain('09:00 às 17:00');
      expect(result).toContain('exceto:'); // Deve ter indicação de exceções
      expect(result).toContain('2 de janeiro de 2023'); // Data formatada em português
    });

    it('deve formatar o período com exceções em inglês', () => {
      const result = periodWithExceptions.toString('en-US');
      expect(result).toContain('Monday and Wednesday');
      expect(result).toContain('09:00 to 17:00');
      expect(result).toContain('except:'); // Deve ter indicação de exceções em inglês
      expect(result).toContain('January'); // Data em inglês
    });

    it('deve formatar o período com exceções em espanhol', () => {
      const result = periodWithExceptions.toString('es-ES');
      expect(result).toContain('Lunes y Miércoles');
      expect(result).toContain('09:00 a 17:00');
      expect(result).toContain('excepto:'); // Deve ter indicação de exceções em espanhol
      expect(result).toContain('enero'); // Data em espanhol
    });

    it('deve formatar o período sem exceções corretamente', () => {
      const periodWithoutExceptions = periodWithExceptions.clearExceptions();
      const result = periodWithoutExceptions.toString();
      
      // Não deve conter a parte de exceções
      expect(result).toContain('Segunda-feira e Quarta-feira');
      expect(result).not.toContain('exceto:');
    });
  });

  describe('equals', () => {
    const period1 = RecurringTimePeriodWithExceptions.create(
      recurringPeriod,
      [mondayException, wednesdayException]
    );

    it('deve retornar true para períodos com exceções idênticos', () => {
      const period2 = RecurringTimePeriodWithExceptions.create(
        RecurringTimePeriod.create([mondayPeriod, wednesdayPeriod, fridayPeriod]),
        [mondayException, wednesdayException]
      );
      
      expect(period1.equals(period2)).toBe(true);
    });

    it('deve retornar false quando os períodos recorrentes são diferentes', () => {
      const period2 = RecurringTimePeriodWithExceptions.create(
        RecurringTimePeriod.create([mondayPeriod, wednesdayPeriod]), // Sem sexta-feira
        [mondayException, wednesdayException]
      );
      
      expect(period1.equals(period2)).toBe(false);
    });

    it('deve retornar false quando as exceções são diferentes', () => {
      const period2 = RecurringTimePeriodWithExceptions.create(
        recurringPeriod,
        [mondayException] // Apenas uma exceção
      );
      
      expect(period1.equals(period2)).toBe(false);
    });

    it('deve retornar false para objetos de tipos diferentes', () => {
      expect(period1.equals({} as any)).toBe(false);
    });
  });
}); 