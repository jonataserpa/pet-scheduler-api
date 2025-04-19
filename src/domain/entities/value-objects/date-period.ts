/**
 * Value Object que representa um período entre duas datas
 * Útil para representar períodos de disponibilidade, eventos, etc.
 * Value Objects são imutáveis e não possuem identidade
 */
export class DatePeriod {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  private constructor(
    startDate: Date,
    endDate: Date,
  ) {
    this._startDate = startDate;
    this._endDate = endDate;

    Object.freeze(this);
  }

  /**
   * Cria uma nova instância de DatePeriod
   */
  public static create(
    startDate: Date,
    endDate: Date,
  ): DatePeriod {
    // Validações
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('DatePeriod: data de início inválida');
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('DatePeriod: data de fim inválida');
    }

    // Validação de data final maior que data inicial
    if (endDate <= startDate) {
      throw new Error('DatePeriod: a data de fim deve ser posterior à data de início');
    }

    // Copiamos as datas para garantir imutabilidade
    return new DatePeriod(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Cria um DatePeriod a partir de uma data inicial e uma duração em dias
   */
  public static createFromDuration(
    startDate: Date,
    durationDays: number,
  ): DatePeriod {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('DatePeriod: data de início inválida');
    }

    if (durationDays <= 0 || !Number.isInteger(durationDays)) {
      throw new Error('DatePeriod: a duração deve ser um número inteiro positivo');
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);

    return DatePeriod.create(startDate, endDate);
  }

  /**
   * Verifica se uma determinada data está dentro deste período
   */
  public includesDate(date: Date): boolean {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('DatePeriod: data para verificação inválida');
    }

    return date >= this._startDate && date <= this._endDate;
  }

  /**
   * Verifica se este período tem alguma sobreposição com outro período
   */
  public overlaps(other: DatePeriod): boolean {
    return (this._startDate < other._endDate && this._endDate > other._startDate);
  }

  /**
   * Verifica se este período contém completamente outro período
   */
  public contains(other: DatePeriod): boolean {
    return (this._startDate <= other._startDate && this._endDate >= other._endDate);
  }

  /**
   * Calcula a duração do período em dias
   */
  public getDurationInDays(): number {
    const diffTime = Math.abs(this._endDate.getTime() - this._startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Calcula a duração do período em horas
   */
  public getDurationInHours(): number {
    const diffTime = Math.abs(this._endDate.getTime() - this._startDate.getTime());
    return diffTime / (1000 * 60 * 60);
  }

  /**
   * Retorna um objeto com os dados do período
   */
  public toObject(): {
    startDate: Date;
    endDate: Date;
  } {
    return {
      startDate: new Date(this._startDate),
      endDate: new Date(this._endDate),
    };
  }

  /**
   * Formata uma data como string (ex: 01/01/2023)
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Formata o período como string (ex: 01/01/2023 até 15/01/2023)
   */
  public toString(): string {
    return `${this.formatDate(this._startDate)} até ${this.formatDate(this._endDate)}`;
  }

  /**
   * Compara dois períodos por igualdade de valores
   */
  public equals(other: DatePeriod): boolean {
    if (!(other instanceof DatePeriod)) {
      return false;
    }

    return (
      this._startDate.getTime() === other._startDate.getTime() &&
      this._endDate.getTime() === other._endDate.getTime()
    );
  }

  // Getters
  get startDate(): Date {
    return new Date(this._startDate);
  }

  get endDate(): Date {
    return new Date(this._endDate);
  }
} 