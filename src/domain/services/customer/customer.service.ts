import { CustomerRepository } from '../../repositories/customer-repository.js';
import { 
  CreateCustomerDTO,
  CreateCustomerResponseDTO,
  CreateCustomerUseCase 
} from '../../usecases/customer/create-customer.usecase.js';
import { 
  GetCustomerByIdResponseDTO, 
  GetCustomerByIdUseCase 
} from '../../usecases/customer/get-customer-by-id.usecase.js';
import { 
  ListCustomersDTO, 
  ListCustomersResponseDTO, 
  ListCustomersUseCase 
} from '../../usecases/customer/list-customers.usecase.js';
import { 
  ToggleCustomerStatusDTO, 
  ToggleCustomerStatusResponseDTO, 
  ToggleCustomerStatusUseCase 
} from '../../usecases/customer/toggle-customer-status.usecase.js';
import { 
  UpdateCustomerDTO, 
  UpdateCustomerResponseDTO, 
  UpdateCustomerUseCase 
} from '../../usecases/customer/update-customer.usecase.js';

/**
 * Serviço que encapsula todas as operações relacionadas a clientes
 * Atua como uma fachada (Facade) para os casos de uso
 */
export class CustomerService {
  private readonly createCustomerUseCase: CreateCustomerUseCase;
  private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase;
  private readonly listCustomersUseCase: ListCustomersUseCase;
  private readonly updateCustomerUseCase: UpdateCustomerUseCase;
  private readonly toggleCustomerStatusUseCase: ToggleCustomerStatusUseCase;

  constructor(customerRepository: CustomerRepository) {
    this.createCustomerUseCase = new CreateCustomerUseCase(customerRepository);
    this.getCustomerByIdUseCase = new GetCustomerByIdUseCase(customerRepository);
    this.listCustomersUseCase = new ListCustomersUseCase(customerRepository);
    this.updateCustomerUseCase = new UpdateCustomerUseCase(customerRepository);
    this.toggleCustomerStatusUseCase = new ToggleCustomerStatusUseCase(customerRepository);
  }

  /**
   * Cria um novo cliente
   */
  async createCustomer(data: CreateCustomerDTO): Promise<CreateCustomerResponseDTO> {
    return this.createCustomerUseCase.execute(data);
  }

  /**
   * Busca um cliente pelo ID
   */
  async getCustomerById(id: string): Promise<GetCustomerByIdResponseDTO | null> {
    return this.getCustomerByIdUseCase.execute(id);
  }

  /**
   * Lista clientes com filtros e paginação
   */
  async listCustomers(params: ListCustomersDTO): Promise<ListCustomersResponseDTO> {
    return this.listCustomersUseCase.execute(params);
  }

  /**
   * Atualiza um cliente existente
   */
  async updateCustomer(data: UpdateCustomerDTO): Promise<UpdateCustomerResponseDTO> {
    return this.updateCustomerUseCase.execute(data);
  }

  /**
   * Ativa ou desativa um cliente
   */
  async toggleCustomerStatus(data: ToggleCustomerStatusDTO): Promise<ToggleCustomerStatusResponseDTO> {
    return this.toggleCustomerStatusUseCase.execute(data);
  }

  /**
   * Ativa um cliente
   */
  async activateCustomer(id: string): Promise<ToggleCustomerStatusResponseDTO> {
    return this.toggleCustomerStatusUseCase.execute({ id, active: true });
  }

  /**
   * Desativa um cliente
   */
  async deactivateCustomer(id: string): Promise<ToggleCustomerStatusResponseDTO> {
    return this.toggleCustomerStatusUseCase.execute({ id, active: false });
  }
} 