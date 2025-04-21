import { Customer } from '../../entities/customer.js';
import { CustomerRepository } from '../../repositories/customer-repository.js';

export interface GetCustomerByIdResponseDTO {
  id: string;
  name: string;
  documentNumber: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    formattedZipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp?: string;
    formattedPhone: string;
    formattedWhatsapp: string;
  };
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

/**
 * Caso de uso para buscar um cliente pelo ID
 */
export class GetCustomerByIdUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  /**
   * Executa o caso de uso
   * @param id ID do cliente a ser buscado
   * @returns Dados do cliente ou null se não encontrado
   */
  async execute(id: string): Promise<GetCustomerByIdResponseDTO | null> {
    const customer = await this.customerRepository.findById(id);
    
    if (!customer) {
      return null;
    }

    return customer.toObject();
  }
} 