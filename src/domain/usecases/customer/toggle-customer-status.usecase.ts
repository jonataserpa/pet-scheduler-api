import { CustomerRepository } from '../../repositories/customer-repository.js';

export interface ToggleCustomerStatusDTO {
  id: string;
  active: boolean;
}

export interface ToggleCustomerStatusResponseDTO {
  id: string;
  name: string;
  active: boolean;
  message: string;
}

export class CustomerNotFoundError extends Error {
  constructor(id: string) {
    super(`Cliente com ID ${id} não encontrado`);
    this.name = 'CustomerNotFoundError';
  }
}

/**
 * Caso de uso para ativar ou desativar um cliente
 */
export class ToggleCustomerStatusUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  /**
   * Executa o caso de uso
   * @param dto Dados para ativar/desativar o cliente
   * @returns Resultado da operação
   * @throws CustomerNotFoundError se o cliente não existir
   */
  async execute(dto: ToggleCustomerStatusDTO): Promise<ToggleCustomerStatusResponseDTO> {
    const { id, active } = dto;
    
    let customer;
    
    if (active) {
      customer = await this.customerRepository.activate(id);
    } else {
      customer = await this.customerRepository.deactivate(id);
    }
    
    if (!customer) {
      throw new CustomerNotFoundError(id);
    }
    
    const status = active ? 'ativado' : 'desativado';
    
    return {
      id: customer.id,
      name: customer.name,
      active: customer.active,
      message: `Cliente ${customer.name} foi ${status} com sucesso.`
    };
  }
} 