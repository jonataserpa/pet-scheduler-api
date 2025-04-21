/**
 * Classe responsável pela validação de dados de notificação
 */
export class NotificationValidator {
  /**
   * Valida os dados básicos de uma notificação
   * @throws Error se os dados forem inválidos
   */
  static validateBasicData(id: string, content: string, schedulingId: string): void {
    if (!id || id.trim() === '') {
      throw new Error('ID da notificação é obrigatório');
    }
    
    if (!content || content.trim() === '') {
      throw new Error('Conteúdo da notificação é obrigatório');
    }
    
    if (!schedulingId || schedulingId.trim() === '') {
      throw new Error('ID do agendamento é obrigatório');
    }
  }

  /**
   * Valida um ID
   * @throws Error se o ID for inválido
   */
  static validateId(id: string, context: string = 'notificação'): void {
    if (!id || id.trim() === '') {
      throw new Error(`ID da ${context} é obrigatório`);
    }
  }

  /**
   * Valida o motivo de falha
   * @throws Error se o motivo for inválido
   */
  static validateFailureReason(reason: string): void {
    if (!reason || reason.trim() === '') {
      throw new Error('Motivo da falha é obrigatório');
    }
  }

  /**
   * Valida o conteúdo da notificação
   * @throws Error se o conteúdo for inválido
   */
  static validateContent(content: string): void {
    if (!content || content.trim() === '') {
      throw new Error('Conteúdo da notificação é obrigatório');
    }
  }
} 