import { PrismaClient, Prisma } from '@prisma/client';
import { Customer } from '../../domain/entities/customer.js';
import { Address } from '../../domain/entities/value-objects/address.js';
import { Contact } from '../../domain/entities/value-objects/contact.js';
import { CustomerFilter, CustomerRepository } from '../../domain/repositories/customer-repository.js';
import { PrismaRepositoryBase } from './base/prisma-repository-base.js';

type PrismaCustomerResult = {
  id: string;
  name: string;
  documentNumber: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp?: string;
  };
};

/**
 * Implementação do repositório de clientes usando Prisma
 */
export class PrismaCustomerRepository extends PrismaRepositoryBase implements CustomerRepository {
  /**
   * Salva um cliente (cria ou atualiza)
   */
  async save(customer: Customer): Promise<Customer> {
    try {
      const addressData = customer.address.toObject();
      const contactData = customer.contact.toObject();

      const data = {
        name: customer.name,
        documentNumber: customer.documentNumber,
        address: {
          update: {
            street: addressData.street,
            number: addressData.number,
            complement: addressData.complement,
            neighborhood: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: addressData.country,
          },
        },
        contact: {
          update: {
            email: contactData.email,
            phone: contactData.phone,
            whatsapp: contactData.whatsapp,
          },
        },
        updatedAt: new Date(),
        active: customer.active,
      };

      const updatedCustomer = await this.prisma.customer.update({
        where: { id: customer.id },
        data,
        include: {
          address: true,
          contact: true,
        },
      });

      return this.mapToDomain(updatedCustomer);
    } catch (error) {
      return this.handleError(error, 'save', { customerId: customer.id });
    }
  }

  /**
   * Cria um novo cliente
   */
  async create(
    id: string,
    name: string,
    documentNumber: string,
    address: Address,
    contact: Contact,
    active: boolean = true
  ): Promise<Customer> {
    try {
      const addressData = address.toObject();
      const contactData = contact.toObject();

      const data = {
        id,
        name,
        documentNumber,
        address: {
          create: {
            street: addressData.street,
            number: addressData.number,
            complement: addressData.complement,
            neighborhood: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: addressData.country,
          },
        },
        contact: {
          create: {
            email: contactData.email,
            phone: contactData.phone,
            whatsapp: contactData.whatsapp,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        active,
      };

      const createdCustomer = await this.prisma.customer.create({
        data,
        include: {
          address: true,
          contact: true,
        },
      });

      return this.mapToDomain(createdCustomer);
    } catch (error) {
      return this.handleError(error, 'create', { id, name, documentNumber });
    }
  }

  /**
   * Encontra um cliente pelo ID
   */
  async findById(id: string): Promise<Customer | null> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          address: true,
          contact: true,
        },
      });

      if (!customer) {
        return null;
      }

      return this.mapToDomain(customer);
    } catch (error) {
      return this.handleError(error, 'findById', { id });
    }
  }

  /**
   * Encontra um cliente pelo número do documento (CPF/CNPJ)
   */
  async findByDocumentNumber(documentNumber: string): Promise<Customer | null> {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { documentNumber },
        include: {
          address: true,
          contact: true,
        },
      });

      if (!customer) {
        return null;
      }

      return this.mapToDomain(customer);
    } catch (error) {
      return this.handleError(error, 'findByDocumentNumber', { documentNumber });
    }
  }

  /**
   * Procura clientes que correspondam aos filtros fornecidos
   */
  async findAll(filter: CustomerFilter, limit?: number, offset?: number): Promise<Customer[]> {
    try {
      const { id, name, documentNumber, email, phone, active, city, state } = filter;

      const customers = await this.prisma.customer.findMany({
        where: {
          id: id ? { equals: id } : undefined,
          name: name ? { contains: name, mode: 'insensitive' } : undefined,
          documentNumber: documentNumber ? { equals: documentNumber } : undefined,
          contact: {
            email: email ? { contains: email, mode: 'insensitive' } : undefined,
            phone: phone ? { contains: phone } : undefined,
          },
          address: {
            city: city ? { contains: city, mode: 'insensitive' } : undefined,
            state: state ? { equals: state } : undefined,
          },
          active: active !== undefined ? { equals: active } : undefined,
        },
        include: {
          address: true,
          contact: true,
        },
        take: limit,
        skip: offset,
        orderBy: {
          name: 'asc',
        },
      });

      return customers.map((customer) => this.mapToDomain(customer));
    } catch (error) {
      return this.handleError(error, 'findAll', { filter, limit, offset });
    }
  }

  /**
   * Verifica se um cliente com o documento especificado já existe
   */
  async existsByDocumentNumber(documentNumber: string, excludeId?: string): Promise<boolean> {
    try {
      const count = await this.prisma.customer.count({
        where: {
          documentNumber,
          id: excludeId ? { not: excludeId } : undefined,
        },
      });

      return count > 0;
    } catch (error) {
      return this.handleError(error, 'existsByDocumentNumber', { documentNumber, excludeId });
    }
  }

  /**
   * Ativa um cliente
   */
  async activate(id: string): Promise<Customer> {
    try {
      const customer = await this.prisma.customer.update({
        where: { id },
        data: {
          active: true,
          updatedAt: new Date(),
        },
        include: {
          address: true,
          contact: true,
        },
      });

      return this.mapToDomain(customer);
    } catch (error) {
      return this.handleError(error, 'activate', { id });
    }
  }

  /**
   * Desativa um cliente
   */
  async deactivate(id: string): Promise<Customer> {
    try {
      const customer = await this.prisma.customer.update({
        where: { id },
        data: {
          active: false,
          updatedAt: new Date(),
        },
        include: {
          address: true,
          contact: true,
        },
      });

      return this.mapToDomain(customer);
    } catch (error) {
      return this.handleError(error, 'deactivate', { id });
    }
  }

  /**
   * Conta o número total de clientes que correspondem aos filtros
   */
  async count(filter: CustomerFilter): Promise<number> {
    try {
      const { id, name, documentNumber, email, phone, active, city, state } = filter;

      return await this.prisma.customer.count({
        where: {
          id: id ? { equals: id } : undefined,
          name: name ? { contains: name, mode: 'insensitive' } : undefined,
          documentNumber: documentNumber ? { equals: documentNumber } : undefined,
          contact: {
            email: email ? { contains: email, mode: 'insensitive' } : undefined,
            phone: phone ? { contains: phone } : undefined,
          },
          address: {
            city: city ? { contains: city, mode: 'insensitive' } : undefined,
            state: state ? { equals: state } : undefined,
          },
          active: active !== undefined ? { equals: active } : undefined,
        },
      });
    } catch (error) {
      return this.handleError(error, 'count', { filter });
    }
  }

  /**
   * Exclui um cliente pelo ID
   */
  async delete(id: string): Promise<void> {
    try {
      await this.executeInTransaction(async (prisma) => {
        // Primeiro excluímos o endereço e contato do cliente
        await prisma.address.delete({
          where: { customerId: id },
        });

        await prisma.contact.delete({
          where: { customerId: id },
        });

        // Então excluímos o cliente
        await prisma.customer.delete({
          where: { id },
        });
      });
    } catch (error) {
      this.handleError(error, 'delete', { id });
    }
  }

  /**
   * Mapeia um cliente do Prisma para uma entidade de domínio
   */
  private mapToDomain(prismaCustomer: PrismaCustomerResult): Customer {
    const address = Address.create(
      prismaCustomer.address.street,
      prismaCustomer.address.number,
      prismaCustomer.address.neighborhood,
      prismaCustomer.address.city,
      prismaCustomer.address.state,
      prismaCustomer.address.zipCode,
      prismaCustomer.address.country,
      prismaCustomer.address.complement,
    );

    const contact = Contact.create(
      prismaCustomer.contact.email,
      prismaCustomer.contact.phone,
      prismaCustomer.contact.whatsapp,
    );

    return Customer.create(
      prismaCustomer.id,
      prismaCustomer.name,
      prismaCustomer.documentNumber,
      address,
      contact,
      prismaCustomer.createdAt,
      prismaCustomer.updatedAt,
      prismaCustomer.active,
    );
  }
} 