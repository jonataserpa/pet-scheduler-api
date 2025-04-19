/**
 * Enum que representa o tipo de notificação
 */
export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

/**
 * Enum que representa o status de uma notificação
 */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED',
}

/**
 * Entidade que representa uma notificação no sistema
 */
export class Notification {
  private readonly _id: string;
  private readonly _type: NotificationType;
  private _content: string;
  private _sentAt?: Date;
  private _status: NotificationStatus;
  private readonly _schedulingId: string;
  private _deliveredAt?: Date;
  private _failedAt?: Date;
  private _failureReason?: string;

  private constructor(
    id: string,
    type: NotificationType,
    content: string,
    schedulingId: string,
    status: NotificationStatus = NotificationStatus.PENDING,
    sentAt?: Date,
    deliveredAt?: Date,
    failedAt?: Date,
    failureReason?: string,
  ) {
    this._id = id;
    this._type = type;
    this._content = content;
    this._schedulingId = schedulingId;
    this._status = status;
    this._sentAt = sentAt;
    this._deliveredAt = deliveredAt;
    this._failedAt = failedAt;
    this._failureReason = failureReason;
  }

  /**
   * Cria uma nova instância de Notification
   */
  public static create(
    id: string,
    type: NotificationType,
    content: string,
    schedulingId: string,
    status: NotificationStatus = NotificationStatus.PENDING,
    sentAt?: Date,
    deliveredAt?: Date,
    failedAt?: Date,
    failureReason?: string,
  ): Notification {
    // Validações
    if (!id) {
      throw new Error('Notification: ID é obrigatório');
    }

    if (!Object.values(NotificationType).includes(type)) {
      throw new Error(`Notification: tipo inválido: ${type}. Deve ser um dos valores: ${Object.values(NotificationType).join(', ')}`);
    }

    if (!content || content.trim() === '') {
      throw new Error('Notification: conteúdo é obrigatório');
    }

    if (!schedulingId) {
      throw new Error('Notification: ID do agendamento é obrigatório');
    }

    if (!Object.values(NotificationStatus).includes(status)) {
      throw new Error(`Notification: status inválido: ${status}. Deve ser um dos valores: ${Object.values(NotificationStatus).join(', ')}`);
    }

    return new Notification(
      id,
      type,
      content.trim(),
      schedulingId,
      status,
      sentAt,
      deliveredAt,
      failedAt,
      failureReason?.trim(),
    );
  }

  /**
   * Marca a notificação como enviada
   */
  public markAsSent(sentAt: Date = new Date()): void {
    if (this._status !== NotificationStatus.PENDING) {
      throw new Error(`Notification: não é possível marcar como enviada uma notificação com status ${this._status}`);
    }

    this._status = NotificationStatus.SENT;
    this._sentAt = sentAt;
  }

  /**
   * Marca a notificação como entregue
   */
  public markAsDelivered(deliveredAt: Date = new Date()): void {
    if (this._status !== NotificationStatus.SENT) {
      throw new Error(`Notification: não é possível marcar como entregue uma notificação com status ${this._status}`);
    }

    this._status = NotificationStatus.DELIVERED;
    this._deliveredAt = deliveredAt;
  }

  /**
   * Marca a notificação como falha
   */
  public markAsFailed(reason: string, failedAt: Date = new Date()): void {
    if (this._status !== NotificationStatus.PENDING && this._status !== NotificationStatus.SENT) {
      throw new Error(`Notification: não é possível marcar como falha uma notificação com status ${this._status}`);
    }

    this._status = NotificationStatus.FAILED;
    this._failedAt = failedAt;
    this._failureReason = reason.trim();
  }

  /**
   * Retenta o envio de uma notificação que falhou
   */
  public retry(): void {
    if (this._status !== NotificationStatus.FAILED) {
      throw new Error(`Notification: não é possível retentar uma notificação com status ${this._status}`);
    }

    this._status = NotificationStatus.PENDING;
    this._failedAt = undefined;
    this._failureReason = undefined;
  }

  /**
   * Atualiza o conteúdo da notificação
   */
  public updateContent(content: string): void {
    if (this._status !== NotificationStatus.PENDING) {
      throw new Error(`Notification: não é possível atualizar o conteúdo de uma notificação com status ${this._status}`);
    }

    if (!content || content.trim() === '') {
      throw new Error('Notification: conteúdo é obrigatório');
    }

    this._content = content.trim();
  }

  /**
   * Retorna um objeto com os dados da notificação
   */
  public toObject(): {
    id: string;
    type: NotificationType;
    content: string;
    schedulingId: string;
    status: NotificationStatus;
    sentAt?: Date;
    deliveredAt?: Date;
    failedAt?: Date;
    failureReason?: string;
  } {
    return {
      id: this._id,
      type: this._type,
      content: this._content,
      schedulingId: this._schedulingId,
      status: this._status,
      sentAt: this._sentAt ? new Date(this._sentAt) : undefined,
      deliveredAt: this._deliveredAt ? new Date(this._deliveredAt) : undefined,
      failedAt: this._failedAt ? new Date(this._failedAt) : undefined,
      failureReason: this._failureReason,
    };
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get type(): NotificationType {
    return this._type;
  }

  get content(): string {
    return this._content;
  }

  get schedulingId(): string {
    return this._schedulingId;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get sentAt(): Date | undefined {
    return this._sentAt ? new Date(this._sentAt) : undefined;
  }

  get deliveredAt(): Date | undefined {
    return this._deliveredAt ? new Date(this._deliveredAt) : undefined;
  }

  get failedAt(): Date | undefined {
    return this._failedAt ? new Date(this._failedAt) : undefined;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  /**
   * Compara duas notificações por igualdade de ID
   */
  public equals(other: Notification): boolean {
    if (!(other instanceof Notification)) {
      return false;
    }

    return this._id === other._id;
  }
} 