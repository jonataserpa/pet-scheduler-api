import { TimeSlot } from '../time-slot.js';

/**
 * Configuração de horário comercial
 */
interface BusinessHours {
  startHour: number; // Hora de início (0-23)
  startMinute: number; // Minuto de início (0-59)
  endHour: number; // Hora de fim (0-23)
  endMinute: number; // Minuto de fim (0-59)
  slotDurationMinutes: number; // Duração de cada slot em minutos
}

/**
 * Fábrica para criação de objetos TimeSlot para diferentes cenários
 */
export class TimeSlotFactory {
  // Horário comercial padrão (9h às 18h com slots de 60 minutos)
  private static readonly DEFAULT_BUSINESS_HOURS: BusinessHours = {
    startHour: 9,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    slotDurationMinutes: 60
  };

  /**
   * Cria um TimeSlot para o horário comercial de um dia específico
   */
  public static createBusinessHoursSlot(date: Date, config: Partial<BusinessHours> = {}): TimeSlot {
    // Mescla a configuração padrão com a configuração personalizada
    const businessHours = { ...TimeSlotFactory.DEFAULT_BUSINESS_HOURS, ...config };
    
    // Cria as datas de início e fim
    const startDate = new Date(date);
    startDate.setHours(businessHours.startHour, businessHours.startMinute, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(businessHours.endHour, businessHours.endMinute, 0, 0);
    
    return TimeSlot.create(startDate, endDate);
  }

  /**
   * Cria um TimeSlot para um horário específico com duração personalizada
   */
  public static createAppointmentSlot(startDate: Date, durationMinutes: number): TimeSlot {
    return TimeSlot.createFromDuration(startDate, durationMinutes);
  }

  /**
   * Divide um período em slots de duração fixa
   * Útil para gerar horários disponíveis para agendamento
   */
  public static generateTimeSlots(
    startDate: Date, 
    endDate: Date, 
    slotDurationMinutes: number
  ): TimeSlot[] {
    if (startDate >= endDate) {
      throw new Error('A data de início deve ser anterior à data de fim');
    }
    
    if (slotDurationMinutes <= 0) {
      throw new Error('A duração do slot deve ser maior que zero');
    }
    
    const slots: TimeSlot[] = [];
    let currentStart = new Date(startDate);
    
    while (currentStart < endDate) {
      const slotEndTime = new Date(currentStart.getTime() + slotDurationMinutes * 60 * 1000);
      
      // Se o slot ultrapassar o horário de fim, ajusta para o horário de fim
      const slotEnd = slotEndTime <= endDate ? slotEndTime : new Date(endDate);
      
      if (currentStart < slotEnd) {
        slots.push(TimeSlot.create(new Date(currentStart), slotEnd));
      }
      
      // Avança para o próximo slot
      currentStart = slotEndTime;
    }
    
    return slots;
  }

  /**
   * Gera slots de agendamento para um dia específico com base em configuração de horário comercial
   */
  public static generateDailyAppointmentSlots(
    date: Date, 
    config: Partial<BusinessHours> = {}
  ): TimeSlot[] {
    // Mescla a configuração padrão com a configuração personalizada
    const businessHours = { ...TimeSlotFactory.DEFAULT_BUSINESS_HOURS, ...config };
    
    // Cria as datas de início e fim do dia comercial
    const startDate = new Date(date);
    startDate.setHours(businessHours.startHour, businessHours.startMinute, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(businessHours.endHour, businessHours.endMinute, 0, 0);
    
    // Gera os slots dentro do horário comercial
    return TimeSlotFactory.generateTimeSlots(
      startDate, 
      endDate, 
      businessHours.slotDurationMinutes
    );
  }

  /**
   * Gera slots de agendamento para uma semana inteira
   */
  public static generateWeeklyAppointmentSlots(
    startDate: Date,
    config: Partial<BusinessHours> = {}
  ): Map<string, TimeSlot[]> {
    const weeklySlots = new Map<string, TimeSlot[]>();
    
    // Gera slots para os próximos 7 dias
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      // Formata a data como chave no formato YYYY-MM-DD
      const dateKey = currentDate.toISOString().split('T')[0];
      
      // Gera os slots para o dia atual
      const dailySlots = TimeSlotFactory.generateDailyAppointmentSlots(currentDate, config);
      
      weeklySlots.set(dateKey, dailySlots);
    }
    
    return weeklySlots;
  }

  /**
   * Verifica se um TimeSlot está dentro do horário comercial
   */
  public static isWithinBusinessHours(
    timeSlot: TimeSlot, 
    config: Partial<BusinessHours> = {}
  ): boolean {
    // Mescla a configuração padrão com a configuração personalizada
    const businessHours = { ...TimeSlotFactory.DEFAULT_BUSINESS_HOURS, ...config };
    
    const date = new Date(timeSlot.startTime);
    
    // Cria o intervalo de horário comercial para o mesmo dia
    const businessStart = new Date(date);
    businessStart.setHours(businessHours.startHour, businessHours.startMinute, 0, 0);
    
    const businessEnd = new Date(date);
    businessEnd.setHours(businessHours.endHour, businessHours.endMinute, 0, 0);
    
    const businessTimeSlot = TimeSlot.create(businessStart, businessEnd);
    
    // Verifica se o slot está contido no horário comercial
    return businessTimeSlot.contains(timeSlot);
  }
} 