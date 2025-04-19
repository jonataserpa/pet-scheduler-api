/**
 * Enum que representa os dias da semana
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/**
 * Tipo que representa formatos de exibição de hora
 */
export type TimeFormat = '12h' | '24h';

/**
 * Tipo que representa idiomas suportados
 */
export type Locale = 'pt-BR' | 'en-US' | 'es-ES';

/**
 * Mapeamento de idiomas para nomes de dias da semana
 */
const DAY_NAMES: Record<Locale, string[]> = {
  'pt-BR': [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ],
  'en-US': [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ],
  'es-ES': [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ]
};

/**
 * Value Object que representa um período de tempo em um dia da semana
 * Útil para representar horários recorrentes como horários de funcionamento, agenda semanal, etc.
 * Value Objects são imutáveis e não possuem identidade
 */
export class TimePeriod {
  private readonly _dayOfWeek: DayOfWeek;
  private readonly _startTime: string; // formato HH:MM
  private readonly _endTime: string; // formato HH:MM

  private constructor(
    dayOfWeek: DayOfWeek,
    startTime: string, 
    endTime: string
  ) {
    this._dayOfWeek = dayOfWeek;
    this._startTime = startTime;
    this._endTime = endTime;

    Object.freeze(this);
  }

  /**
   * Cria uma nova instância de TimePeriod
   */
  public static create(
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string
  ): TimePeriod {
    // Validações
    if (dayOfWeek < 0 || dayOfWeek > 6 || !Number.isInteger(dayOfWeek)) {
      throw new Error('TimePeriod: dia da semana inválido');
    }

    // Validação do formato de hora (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(startTime)) {
      throw new Error('TimePeriod: horário de início inválido, use o formato HH:MM');
    }

    if (!timeRegex.test(endTime)) {
      throw new Error('TimePeriod: horário de fim inválido, use o formato HH:MM');
    }

    // Validação do horário final maior que o inicial
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      throw new Error('TimePeriod: o horário de fim deve ser posterior ao horário de início');
    }

    return new TimePeriod(dayOfWeek, startTime, endTime);
  }

  /**
   * Verifica se um determinado Date está dentro deste período de tempo (considerando dia da semana e horário)
   */
  public includesDateTime(dateTime: Date): boolean {
    if (!(dateTime instanceof Date) || isNaN(dateTime.getTime())) {
      throw new Error('TimePeriod: data e hora para verificação inválidas');
    }

    // Verifica se o dia da semana coincide
    const dayMatches = dateTime.getDay() === this._dayOfWeek;
    if (!dayMatches) return false;

    // Extrair hora e minuto do dateTime
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Comparar com o intervalo de tempo
    return this.includesTime(timeString);
  }

  /**
   * Verifica se um horário específico (HH:MM) está dentro deste período
   */
  public includesTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(time)) {
      throw new Error('TimePeriod: horário para verificação inválido, use o formato HH:MM');
    }

    const [hour, minute] = time.split(':').map(Number);
    const timeInMinutes = hour * 60 + minute;

    const [startHour, startMinute] = this._startTime.split(':').map(Number);
    const startInMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = this._endTime.split(':').map(Number);
    const endInMinutes = endHour * 60 + endMinute;

    return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
  }

  /**
   * Verifica se este período tem alguma sobreposição com outro período (no mesmo dia da semana)
   */
  public overlaps(other: TimePeriod): boolean {
    // Se não for o mesmo dia da semana, não há sobreposição
    if (this._dayOfWeek !== other._dayOfWeek) {
      return false;
    }

    const [thisStartHour, thisStartMinute] = this._startTime.split(':').map(Number);
    const thisStartInMinutes = thisStartHour * 60 + thisStartMinute;

    const [thisEndHour, thisEndMinute] = this._endTime.split(':').map(Number);
    const thisEndInMinutes = thisEndHour * 60 + thisEndMinute;

    const [otherStartHour, otherStartMinute] = other._startTime.split(':').map(Number);
    const otherStartInMinutes = otherStartHour * 60 + otherStartMinute;

    const [otherEndHour, otherEndMinute] = other._endTime.split(':').map(Number);
    const otherEndInMinutes = otherEndHour * 60 + otherEndMinute;

    return (thisStartInMinutes < otherEndInMinutes && thisEndInMinutes > otherStartInMinutes);
  }

  /**
   * Calcula a duração do período em minutos
   */
  public getDurationInMinutes(): number {
    const [startHour, startMinute] = this._startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = this._endTime.split(':').map(Number);
    const endTotalMinutes = endHour * 60 + endMinute;

    return endTotalMinutes - startTotalMinutes;
  }

  /**
   * Retorna um objeto com os dados do período
   */
  public toObject(): {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
  } {
    return {
      dayOfWeek: this._dayOfWeek,
      startTime: this._startTime,
      endTime: this._endTime,
    };
  }

  /**
   * Retorna o nome do dia da semana no idioma especificado
   */
  private getDayName(locale: Locale = 'pt-BR'): string {
    return DAY_NAMES[locale][this._dayOfWeek];
  }

  /**
   * Formata o período como string no formato e idioma especificados
   * @param locale Idioma para exibição (pt-BR, en-US, es-ES)
   * @param format Formato de hora (12h ou 24h)
   */
  public toString(locale: Locale = 'pt-BR', format: TimeFormat = '24h'): string {
    const dayName = this.getDayName(locale);
    const startFormatted = this.formatTime(this._startTime, format);
    const endFormatted = this.formatTime(this._endTime, format);
    
    const templates = {
      'pt-BR': `${dayName}, das ${startFormatted} às ${endFormatted}`,
      'en-US': `${dayName}, from ${startFormatted} to ${endFormatted}`,
      'es-ES': `${dayName}, de ${startFormatted} a ${endFormatted}`
    };
    
    return templates[locale];
  }

  /**
   * Formata a hora no formato 12h ou 24h
   */
  private formatTime(time: string, format: TimeFormat = '24h'): string {
    if (format === '24h') {
      return time;
    }

    // Converter para formato 12h
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Converte 0 para 12
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Compara dois períodos por igualdade de valores
   */
  public equals(other: TimePeriod): boolean {
    if (!(other instanceof TimePeriod)) {
      return false;
    }

    return (
      this._dayOfWeek === other._dayOfWeek &&
      this._startTime === other._startTime &&
      this._endTime === other._endTime
    );
  }

  // Getters
  get dayOfWeek(): DayOfWeek {
    return this._dayOfWeek;
  }

  get startTime(): string {
    return this._startTime;
  }

  get endTime(): string {
    return this._endTime;
  }
} 