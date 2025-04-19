import { TimeSlot } from '../time-slot.js';

describe('TimeSlot Value Object', () => {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora depois

  describe('create', () => {
    it('deve criar um TimeSlot válido', () => {
      const timeSlot = TimeSlot.create(now, later);
      
      expect(timeSlot.startTime.getTime()).toBe(now.getTime());
      expect(timeSlot.endTime.getTime()).toBe(later.getTime());
      expect(timeSlot.durationMinutes).toBe(60);
    });

    it('deve lançar erro se a data de início for inválida', () => {
      const invalidDate = new Date('invalid date');
      
      expect(() => TimeSlot.create(invalidDate, later)).toThrow('TimeSlot: data de início inválida');
    });

    it('deve lançar erro se a data de fim for inválida', () => {
      const invalidDate = new Date('invalid date');
      
      expect(() => TimeSlot.create(now, invalidDate)).toThrow('TimeSlot: data de fim inválida');
    });

    it('deve lançar erro se a data de fim for anterior ou igual à data de início', () => {
      // Data de fim igual à de início
      expect(() => TimeSlot.create(now, new Date(now.getTime()))).toThrow(
        'TimeSlot: a data de início deve ser anterior à data de fim'
      );
      
      // Data de fim anterior à de início
      const earlier = new Date(now.getTime() - 60 * 60 * 1000);
      expect(() => TimeSlot.create(now, earlier)).toThrow(
        'TimeSlot: a data de início deve ser anterior à data de fim'
      );
    });
  });

  describe('createFromDuration', () => {
    it('deve criar um TimeSlot a partir de uma data inicial e duração em minutos', () => {
      const durationMinutes = 90;
      const timeSlot = TimeSlot.createFromDuration(now, durationMinutes);
      
      expect(timeSlot.startTime.getTime()).toBe(now.getTime());
      expect(timeSlot.endTime.getTime()).toBe(now.getTime() + durationMinutes * 60 * 1000);
      expect(timeSlot.durationMinutes).toBe(durationMinutes);
    });

    it('deve lançar erro se a data de início for inválida', () => {
      const invalidDate = new Date('invalid date');
      
      expect(() => TimeSlot.createFromDuration(invalidDate, 60)).toThrow('TimeSlot: data de início inválida');
    });

    it('deve lançar erro se a duração for inválida', () => {
      expect(() => TimeSlot.createFromDuration(now, 0)).toThrow(
        'TimeSlot: duração deve ser um número inteiro positivo em minutos'
      );
      
      expect(() => TimeSlot.createFromDuration(now, -30)).toThrow(
        'TimeSlot: duração deve ser um número inteiro positivo em minutos'
      );
      
      expect(() => TimeSlot.createFromDuration(now, 30.5)).toThrow(
        'TimeSlot: duração deve ser um número inteiro positivo em minutos'
      );
    });
  });

  describe('overlaps', () => {
    it('deve identificar sobreposição quando um período contém outro', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      const timeSlot2 = TimeSlot.create(
        new Date('2023-01-01T12:00:00Z'),
        new Date('2023-01-01T14:00:00Z')
      );
      
      expect(timeSlot1.overlaps(timeSlot2)).toBe(true);
      expect(timeSlot2.overlaps(timeSlot1)).toBe(true);
    });

    it('deve identificar sobreposição quando os períodos se sobrepõem parcialmente', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T13:00:00Z')
      );
      
      const timeSlot2 = TimeSlot.create(
        new Date('2023-01-01T12:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      expect(timeSlot1.overlaps(timeSlot2)).toBe(true);
      expect(timeSlot2.overlaps(timeSlot1)).toBe(true);
    });

    it('não deve identificar sobreposição quando os períodos são adjacentes', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T12:00:00Z')
      );
      
      const timeSlot2 = TimeSlot.create(
        new Date('2023-01-01T12:00:00Z'),
        new Date('2023-01-01T14:00:00Z')
      );
      
      expect(timeSlot1.overlaps(timeSlot2)).toBe(false);
      expect(timeSlot2.overlaps(timeSlot1)).toBe(false);
    });

    it('não deve identificar sobreposição quando os períodos são separados', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T12:00:00Z')
      );
      
      const timeSlot2 = TimeSlot.create(
        new Date('2023-01-01T13:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      expect(timeSlot1.overlaps(timeSlot2)).toBe(false);
      expect(timeSlot2.overlaps(timeSlot1)).toBe(false);
    });
  });

  describe('contains', () => {
    it('deve identificar quando um período contém totalmente outro', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      const timeSlot2 = TimeSlot.create(
        new Date('2023-01-01T12:00:00Z'),
        new Date('2023-01-01T14:00:00Z')
      );
      
      expect(timeSlot1.contains(timeSlot2)).toBe(true);
      expect(timeSlot2.contains(timeSlot1)).toBe(false);
    });

    it('deve identificar quando os períodos são iguais', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      const timeSlot2 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      expect(timeSlot1.contains(timeSlot2)).toBe(true);
      expect(timeSlot2.contains(timeSlot1)).toBe(true);
    });

    it('não deve identificar quando um período contém parcialmente outro', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T14:00:00Z')
      );
      
      const timeSlot2 = TimeSlot.create(
        new Date('2023-01-01T12:00:00Z'),
        new Date('2023-01-01T16:00:00Z')
      );
      
      expect(timeSlot1.contains(timeSlot2)).toBe(false);
      expect(timeSlot2.contains(timeSlot1)).toBe(false);
    });
  });

  describe('includesTime', () => {
    it('deve identificar quando um horário está dentro do período', () => {
      const timeSlot = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      expect(timeSlot.includesTime(new Date('2023-01-01T12:30:00Z'))).toBe(true);
      expect(timeSlot.includesTime(new Date('2023-01-01T10:00:00Z'))).toBe(true); // Limite início
      expect(timeSlot.includesTime(new Date('2023-01-01T15:00:00Z'))).toBe(true); // Limite fim
    });

    it('não deve identificar quando um horário está fora do período', () => {
      const timeSlot = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      expect(timeSlot.includesTime(new Date('2023-01-01T09:59:59Z'))).toBe(false);
      expect(timeSlot.includesTime(new Date('2023-01-01T15:00:01Z'))).toBe(false);
    });
  });

  describe('toObject', () => {
    it('deve retornar um objeto com as propriedades corretas', () => {
      const timeSlot = TimeSlot.create(now, later);
      const obj = timeSlot.toObject();
      
      expect(obj).toEqual({
        startTime: now,
        endTime: later,
        durationMinutes: 60
      });
      
      // Verificar se retorna cópias para manter imutabilidade
      expect(obj.startTime).not.toBe(now);
      expect(obj.endTime).not.toBe(later);
    });
  });

  describe('toString', () => {
    it('deve formatar corretamente o período como string', () => {
      const startTime = new Date('2023-01-01T10:30:00');
      const endTime = new Date('2023-01-01T11:45:00');
      const timeSlot = TimeSlot.create(startTime, endTime);
      
      const stringRepresentation = timeSlot.toString();
      
      // A string deve conter as datas formatadas e a duração
      expect(stringRepresentation).toContain('75 minutos');
    });
  });

  describe('equals', () => {
    it('deve identificar períodos iguais', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      const timeSlot2 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      expect(timeSlot1.equals(timeSlot2)).toBe(true);
    });

    it('deve identificar períodos diferentes', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T15:00:00Z')
      );
      
      const timeSlot2 = TimeSlot.create(
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-01T16:00:00Z')
      );
      
      expect(timeSlot1.equals(timeSlot2)).toBe(false);
    });

    it('deve retornar false quando comparado com algo que não é TimeSlot', () => {
      const timeSlot = TimeSlot.create(now, later);
      
      // @ts-expect-error testando com tipo inválido
      expect(timeSlot.equals("not a time slot")).toBe(false);
    });
  });

  describe('getters', () => {
    it('deve retornar cópias das datas para manter imutabilidade', () => {
      const timeSlot = TimeSlot.create(now, later);
      
      const startTime = timeSlot.startTime;
      const endTime = timeSlot.endTime;
      
      expect(startTime).toEqual(now);
      expect(endTime).toEqual(later);
      
      // Verificar que são cópias, não as mesmas referências
      expect(startTime).not.toBe(now);
      expect(endTime).not.toBe(later);
      
      // Modificar as cópias não deve afetar o objeto original
      startTime.setHours(startTime.getHours() + 1);
      expect(timeSlot.startTime).toEqual(now);
    });
  });
}); 