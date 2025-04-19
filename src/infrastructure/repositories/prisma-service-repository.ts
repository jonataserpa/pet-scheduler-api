import { PrismaClient } from '@prisma/client';
import { Service } from '../../domain/entities/service.js';
import { ServiceFilter, ServiceRepository } from '../../domain/repositories/service-repository.js';
import { PrismaRepositoryBase } from './base/prisma-repository-base.js';

type PrismaServiceResult = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
};

/**
 * Implementação do repositório de serviços usando Prisma
 */
export class PrismaServiceRepository extends PrismaRepositoryBase implements ServiceRepository {
  /**
   * Salva um serviço (cria ou atualiza)
   */
  async save(service: Service): Promise<Service> {
    try {
      const data = {
        name: service.name,
        description: service.description || null,
        duration: service.duration,
        price: service.price,
        category: service.category,
        updatedAt: new Date(),
        active: service.active,
      };

      const updatedService = await this.prisma.service.update({
        where: { id: service.id },
        data,
      });

      return this.mapToDomain(updatedService);
    } catch (error) {
      return this.handleError(error, 'save', { serviceId: service.id });
    }
  }

  /**
   * Cria um novo serviço
   */
  async create(
    id: string,
    name: string,
    category: string,
    duration: number,
    price: number,
    description?: string,
    active: boolean = true
  ): Promise<Service> {
    try {
      const data = {
        id,
        name,
        description: description || null,
        duration,
        price,
        category,
        createdAt: new Date(),
        updatedAt: new Date(),
        active,
      };

      const createdService = await this.prisma.service.create({
        data,
      });

      return this.mapToDomain(createdService);
    } catch (error) {
      return this.handleError(error, 'create', { id, name, category });
    }
  }

  /**
   * Encontra um serviço pelo ID
   */
  async findById(id: string): Promise<Service | null> {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id },
      });

      if (!service) {
        return null;
      }

      return this.mapToDomain(service);
    } catch (error) {
      return this.handleError(error, 'findById', { id });
    }
  }

  /**
   * Procura serviços que correspondam aos filtros fornecidos
   */
  async findAll(filter: ServiceFilter, limit?: number, offset?: number): Promise<Service[]> {
    try {
      const { id, name, category, minPrice, maxPrice, minDuration, maxDuration, active } = filter;

      const services = await this.prisma.service.findMany({
        where: {
          id: id ? { equals: id } : undefined,
          name: name ? { contains: name, mode: 'insensitive' } : undefined,
          category: category ? { equals: category } : undefined,
          price: {
            gte: minPrice !== undefined ? minPrice : undefined,
            lte: maxPrice !== undefined ? maxPrice : undefined,
          },
          duration: {
            gte: minDuration !== undefined ? minDuration : undefined,
            lte: maxDuration !== undefined ? maxDuration : undefined,
          },
          active: active !== undefined ? { equals: active } : undefined,
        },
        take: limit,
        skip: offset,
        orderBy: {
          name: 'asc',
        },
      });

      return services.map((service: PrismaServiceResult) => this.mapToDomain(service));
    } catch (error) {
      return this.handleError(error, 'findAll', { filter, limit, offset });
    }
  }

  /**
   * Encontra serviços por categoria
   */
  async findByCategory(category: string, includeInactive: boolean = false): Promise<Service[]> {
    try {
      const services = await this.prisma.service.findMany({
        where: {
          category,
          active: includeInactive ? undefined : true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return services.map((service: PrismaServiceResult) => this.mapToDomain(service));
    } catch (error) {
      return this.handleError(error, 'findByCategory', { category, includeInactive });
    }
  }

  /**
   * Ativa um serviço
   */
  async activate(id: string): Promise<Service> {
    try {
      const service = await this.prisma.service.update({
        where: { id },
        data: {
          active: true,
          updatedAt: new Date(),
        },
      });

      return this.mapToDomain(service);
    } catch (error) {
      return this.handleError(error, 'activate', { id });
    }
  }

  /**
   * Desativa um serviço
   */
  async deactivate(id: string): Promise<Service> {
    try {
      const service = await this.prisma.service.update({
        where: { id },
        data: {
          active: false,
          updatedAt: new Date(),
        },
      });

      return this.mapToDomain(service);
    } catch (error) {
      return this.handleError(error, 'deactivate', { id });
    }
  }

  /**
   * Atualiza a descrição de um serviço
   */
  async updateDescription(id: string, description: string): Promise<Service> {
    try {
      const service = await this.prisma.service.update({
        where: { id },
        data: {
          description,
          updatedAt: new Date(),
        },
      });

      return this.mapToDomain(service);
    } catch (error) {
      return this.handleError(error, 'updateDescription', { id, description });
    }
  }

  /**
   * Atualiza o preço de um serviço
   */
  async updatePrice(id: string, price: number): Promise<Service> {
    try {
      const service = await this.prisma.service.update({
        where: { id },
        data: {
          price,
          updatedAt: new Date(),
        },
      });

      return this.mapToDomain(service);
    } catch (error) {
      return this.handleError(error, 'updatePrice', { id, price });
    }
  }

  /**
   * Atualiza a duração de um serviço
   */
  async updateDuration(id: string, duration: number): Promise<Service> {
    try {
      const service = await this.prisma.service.update({
        where: { id },
        data: {
          duration,
          updatedAt: new Date(),
        },
      });

      return this.mapToDomain(service);
    } catch (error) {
      return this.handleError(error, 'updateDuration', { id, duration });
    }
  }

  /**
   * Conta o número total de serviços que correspondem aos filtros
   */
  async count(filter: ServiceFilter): Promise<number> {
    try {
      const { id, name, category, minPrice, maxPrice, minDuration, maxDuration, active } = filter;

      return await this.prisma.service.count({
        where: {
          id: id ? { equals: id } : undefined,
          name: name ? { contains: name, mode: 'insensitive' } : undefined,
          category: category ? { equals: category } : undefined,
          price: {
            gte: minPrice !== undefined ? minPrice : undefined,
            lte: maxPrice !== undefined ? maxPrice : undefined,
          },
          duration: {
            gte: minDuration !== undefined ? minDuration : undefined,
            lte: maxDuration !== undefined ? maxDuration : undefined,
          },
          active: active !== undefined ? { equals: active } : undefined,
        },
      });
    } catch (error) {
      return this.handleError(error, 'count', { filter });
    }
  }

  /**
   * Exclui um serviço pelo ID
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.service.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'delete', { id });
    }
  }

  /**
   * Mapeia um serviço do Prisma para uma entidade de domínio
   */
  private mapToDomain(prismaService: PrismaServiceResult): Service {
    return Service.create(
      prismaService.id,
      prismaService.name,
      prismaService.category,
      prismaService.duration,
      prismaService.price,
      prismaService.description || undefined,
      prismaService.createdAt,
      prismaService.updatedAt,
      prismaService.active,
    );
  }
} 