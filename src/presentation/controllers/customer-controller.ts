import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CustomerRepository } from '../../domain/repositories/customer-repository.js';
import { PetRepository } from '../../domain/repositories/pet-repository.js';
import { Customer } from '../../domain/entities/customer.js';
import { Address } from '../../domain/entities/value-objects/address.js';
import { Contact } from '../../domain/entities/value-objects/contact.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controlador para gerenciamento de clientes
 */
export class CustomerController {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly petRepository: PetRepository
  ) {}

  /**
   * Lista todos os clientes com filtros opcionais
   */
  async listCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { 
        name, 
        email, 
        phone, 
        documentNumber, 
        active = 'true',
        limit = '50', 
        offset = '0' 
      } = req.query;
      
      // Converter string para boolean
      const isActive = active === 'true';
      
      const filter = {
        name: name as string,
        email: email as string,
        phone: phone as string,
        documentNumber: documentNumber as string,
        active: isActive
      };
      
      const customers = await this.customerRepository.findAll(
        filter,
        parseInt(limit as string, 10),
        parseInt(offset as string, 10)
      );
      
      const count = await this.customerRepository.count(filter);
      
      res.status(200).json({
        data: customers.map(customer => customer.toObject()),
        meta: {
          total: count,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10)
        }
      });
    } catch (error) {
      logger.error('Erro ao listar clientes:', { error });
      res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  }

  /**
   * Busca um cliente pelo ID
   */
  async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const customer = await this.customerRepository.findById(id);
      
      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      
      res.status(200).json(customer.toObject());
    } catch (error) {
      logger.error('Erro ao buscar cliente por ID:', { error, id: req.params.id });
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  /**
   * Cria um novo cliente
   */
  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, documentNumber, address } = req.body;
      
      // Validações básicas
      if (!name || !email || !phone || !documentNumber) {
        res.status(400).json({ error: 'Dados incompletos. Nome, email, telefone e documento são obrigatórios.' });
        return;
      }
      
      // Verificar se já existe um cliente com o mesmo documento
      const exists = await this.customerRepository.existsByDocumentNumber(documentNumber);
      
      if (exists) {
        res.status(409).json({ error: 'Já existe um cliente com este documento' });
        return;
      }
      
      // Criar objetos Address e Contact usando seus métodos create
      const customerAddress = address ? Address.create(
        address.street || '',
        address.number || '',
        address.neighborhood || '',
        address.city || '',
        address.state || '',
        address.zipCode || '',
        address.country || 'Brasil',
        address.complement
      ) : Address.create('', '', '', '', '', '', 'Brasil');
      
      const customerContact = Contact.create(email, phone);
      
      // Criar e salvar o cliente
      const customer = await this.customerRepository.create(
        uuidv4(),
        name,
        documentNumber,
        customerAddress,
        customerContact,
        true
      );
      
      res.status(201).json(customer.toObject());
    } catch (error) {
      logger.error('Erro ao criar cliente:', { error, body: req.body });
      
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao criar cliente' });
      }
    }
  }

  /**
   * Atualiza um cliente existente
   */
  async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, phone, address } = req.body;
      
      // Buscar o cliente existente
      const customer = await this.customerRepository.findById(id);
      
      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }

      // Criar objeto Address utilizando os valores existentes ou novos
      let customerAddress = customer.address;
      if (address) {
        const addressData = customer.address.toObject();
        customerAddress = Address.create(
          address.street || addressData.street,
          address.number || addressData.number,
          address.neighborhood || addressData.neighborhood,
          address.city || addressData.city,
          address.state || addressData.state,
          address.zipCode || addressData.zipCode,
          address.country || addressData.country,
          address.complement !== undefined ? address.complement : addressData.complement
        );
      }

      // Criar objeto Contact utilizando os valores existentes ou novos
      const contactData = customer.contact.toObject();
      const customerContact = Contact.create(
        email || contactData.email,
        phone || contactData.phone,
        contactData.whatsapp
      );

      // Criar um cliente atualizado com as modificações
      const updatedCustomer = Customer.create(
        customer.id,
        name || customer.name,
        customer.documentNumber,
        customerAddress,
        customerContact,
        customer.createdAt,
        new Date(),
        customer.active
      );
      
      // Salvar as alterações
      const savedCustomer = await this.customerRepository.save(updatedCustomer);
      
      res.status(200).json(savedCustomer.toObject());
    } catch (error) {
      logger.error('Erro ao atualizar cliente:', { error, id: req.params.id, body: req.body });
      
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
      }
    }
  }

  /**
   * Ativa um cliente
   */
  async activateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Buscar o cliente
      const customer = await this.customerRepository.findById(id);
      
      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      
      // Verificar se já está ativo
      if (customer.active) {
        res.status(400).json({ error: 'Cliente já está ativo' });
        return;
      }
      
      // Ativar e salvar
      const activatedCustomer = await this.customerRepository.activate(id);
      
      res.status(200).json(activatedCustomer.toObject());
    } catch (error) {
      logger.error('Erro ao ativar cliente:', { error, id: req.params.id });
      res.status(500).json({ error: 'Erro ao ativar cliente' });
    }
  }

  /**
   * Desativa um cliente
   */
  async deactivateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Buscar o cliente
      const customer = await this.customerRepository.findById(id);
      
      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      
      // Verificar se já está inativo
      if (!customer.active) {
        res.status(400).json({ error: 'Cliente já está inativo' });
        return;
      }
      
      // Desativar e salvar
      const deactivatedCustomer = await this.customerRepository.deactivate(id);
      
      res.status(200).json(deactivatedCustomer.toObject());
    } catch (error) {
      logger.error('Erro ao desativar cliente:', { error, id: req.params.id });
      res.status(500).json({ error: 'Erro ao desativar cliente' });
    }
  }

  /**
   * Busca um cliente pelo número do documento
   */
  async getCustomerByDocument(req: Request, res: Response): Promise<void> {
    try {
      const { documentNumber } = req.params;
      
      const customer = await this.customerRepository.findByDocumentNumber(documentNumber);
      
      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      
      res.status(200).json(customer.toObject());
    } catch (error) {
      logger.error('Erro ao buscar cliente por documento:', { error, documentNumber: req.params.documentNumber });
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  /**
   * Lista os pets de um cliente
   */
  async getCustomerPets(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeInactive = 'false' } = req.query;
      
      // Verificar se o cliente existe
      const customer = await this.customerRepository.findById(id);
      
      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      
      // Buscar pets do cliente
      const pets = await this.petRepository.findByCustomerId(
        id, 
        includeInactive === 'true'
      );
      
      res.status(200).json(pets.map(pet => pet.toObject()));
    } catch (error) {
      logger.error('Erro ao listar pets do cliente:', { error, id: req.params.id });
      res.status(500).json({ error: 'Erro ao listar pets do cliente' });
    }
  }

  /**
   * Lista os agendamentos de um cliente
   */
  async getCustomerSchedulings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, limit = '10' } = req.query;
      
      // Verificar se o cliente existe
      const customer = await this.customerRepository.findById(id);
      
      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      
      // Neste ponto, seria necessário um repositório de agendamentos
      // Como não o temos disponível aqui, retornamos apenas uma mensagem
      res.status(200).json({ 
        message: 'Função disponível apenas com a implementação do SchedulingRepository',
        customerId: id,
        status: status,
        limit: parseInt(limit as string, 10)
      });
    } catch (error) {
      logger.error('Erro ao listar agendamentos do cliente:', { error, id: req.params.id });
      res.status(500).json({ error: 'Erro ao listar agendamentos do cliente' });
    }
  }

  /**
   * Verifica se um documento já está em uso
   */
  async checkDocumentExists(req: Request, res: Response): Promise<void> {
    try {
      const { documentNumber } = req.params;
      const { excludeId } = req.query;
      
      const exists = await this.customerRepository.existsByDocumentNumber(
        documentNumber,
        excludeId as string
      );
      
      res.status(200).json({ exists });
    } catch (error) {
      logger.error('Erro ao verificar documento:', { error, documentNumber: req.params.documentNumber });
      res.status(500).json({ error: 'Erro ao verificar documento' });
    }
  }
} 