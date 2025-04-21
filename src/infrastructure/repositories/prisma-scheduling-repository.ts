import { Scheduling, SchedulingStatus, ScheduledService } from '../../domain/entities/scheduling.js';
import { TimeSlot } from '../../domain/entities/value-objects/time-slot.js';
import { SchedulingFilter, SchedulingRepository } from '../../domain/repositories/scheduling-repository.js';
import { PrismaRepositoryBase } from './base/prisma-repository-base.js';

// Enum duplicado do Prisma para lidar com o mapeamento de status
enum PrismaSchedulingStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

// Interface para estender os tipos do Prisma com campos adicionais
interface ExtendedSchedulingService {
  id: string;
  schedulingId: string;
  serviceId: string;
  serviceName?: string;
  price?: number;
  duration?: number;
}

interface ExtendedScheduling {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes: string | null;
  customerId: string;
  petId: string;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  services: ExtendedSchedulingService[];
}

/**
 * Implementação do repositório de agendamentos usando Prisma
 */
export class PrismaSchedulingRepository extends PrismaRepositoryBase implements SchedulingRepository {
  /**
   * Mapeia o status do domínio para o formato do Prisma
   */
  private mapDomainStatusToPrisma(status: SchedulingStatus): string {
    switch (status) {
      case SchedulingStatus.SCHEDULED:
        return PrismaSchedulingStatus.SCHEDULED;
      case SchedulingStatus.CONFIRMED:
        return PrismaSchedulingStatus.CONFIRMED;
      case SchedulingStatus.IN_PROGRESS:
        return PrismaSchedulingStatus.IN_PROGRESS;
      case SchedulingStatus.COMPLETED:
        return PrismaSchedulingStatus.COMPLETED;
      case SchedulingStatus.CANCELLED:
        return PrismaSchedulingStatus.CANCELLED;
      case SchedulingStatus.NO_SHOW:
        return PrismaSchedulingStatus.NO_SHOW;
      default:
        throw new Error(`Status de agendamento inválido: ${status}`);
    }
  }

  /**
   * Mapeia o status do Prisma para o formato do domínio
   */
  private mapPrismaStatusToDomain(status: string): SchedulingStatus {
    switch (status) {
      case 'SCHEDULED':
        return SchedulingStatus.SCHEDULED;
      case 'CONFIRMED':
        return SchedulingStatus.CONFIRMED;
      case 'IN_PROGRESS':
        return SchedulingStatus.IN_PROGRESS;
      case 'COMPLETED':
        return SchedulingStatus.COMPLETED;
      case 'CANCELLED':
        return SchedulingStatus.CANCELLED;
      case 'NO_SHOW':
        return SchedulingStatus.NO_SHOW;
      default:
        throw new Error(`Status de agendamento inválido: ${status}`);
    }
  }

  /**
   * Salva um agendamento (cria ou atualiza)
   */
  async save(scheduling: Scheduling): Promise<Scheduling> {
    try {
      const timeSlotData = scheduling.timeSlot.toObject();
      const servicesData = scheduling.services.map(service => service.toObject());

      // Atualizar o agendamento principal usando any para contornar verificação de tipo
      const data: any = {
        startTime: timeSlotData.startTime,
        endTime: timeSlotData.endTime,
        status: this.mapDomainStatusToPrisma(scheduling.status),
        notes: scheduling.notes,
        totalPrice: scheduling.totalPrice,
        updatedAt: new Date(),
      };

      const updatedScheduling = await this.prisma.scheduling.update({
        where: { id: scheduling.id },
        data,
        include: {
          services: true,
        },
      });

      // Para atualizar os serviços, primeiro excluímos os existentes e depois recriamos
      await this.prisma.schedulingService.deleteMany({
        where: { schedulingId: scheduling.id },
      });

      // Array para armazenar os serviços criados
      const createdServices: ExtendedSchedulingService[] = [];

      // Recriar os serviços usando any para contornar verificação de tipo
      const servicePromises = servicesData.map(service => {
        const serviceData: any = {
          id: service.id,
          schedulingId: scheduling.id,
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          price: service.price,
          duration: service.duration,
        };
        return this.prisma.schedulingService.create({
          data: serviceData,
        });
      });

      // Obter os serviços criados
      const createdServicesResults = await Promise.all(servicePromises);
      
      // Mapear os resultados para o formato esperado
      createdServicesResults.forEach(service => {
        createdServices.push({
          id: service.id,
          schedulingId: service.schedulingId,
          serviceId: service.serviceId,
          serviceName: servicesData.find(s => s.id === service.id)?.serviceName,
          price: servicesData.find(s => s.id === service.id)?.price,
          duration: servicesData.find(s => s.id === service.id)?.duration
        });
      });

      // Criar um objeto combinado com o agendamento atualizado e os novos serviços
      const completeScheduling: ExtendedScheduling = {
        ...updatedScheduling,
        services: createdServices
      };

      // Não precisamos de uma nova consulta, usamos os dados que já temos
      return this.mapToDomain(completeScheduling);
    } catch (error) {
      return this.handleError(error, 'save', { schedulingId: scheduling.id });
    }
  }

  /**
   * Cria um novo agendamento
   */
  async create(
    id: string,
    timeSlot: TimeSlot,
    customerId: string,
    petId: string,
    services: ScheduledService[],
    notes?: string,
    status: SchedulingStatus = SchedulingStatus.SCHEDULED
  ): Promise<Scheduling> {
    try {
      const timeSlotData = timeSlot.toObject();
      const servicesData = services.map(service => service.toObject());
      const totalPrice = services.reduce((total, service) => total + service.price, 0);

      // Usar any para contornar verificação de tipo
      const data: any = {
        id,
        startTime: timeSlotData.startTime,
        endTime: timeSlotData.endTime,
        status: this.mapDomainStatusToPrisma(status),
        notes,
        customerId,
        petId,
        totalPrice,
        createdAt: new Date(),
        updatedAt: new Date(),
        services: {
          create: servicesData.map(service => ({
            id: service.id,
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            price: service.price,
            duration: service.duration,
          })),
        },
      };

      const createdScheduling = await this.prisma.scheduling.create({
        data,
        include: {
          services: true,
        },
      });

      return this.mapToDomain(createdScheduling as unknown as ExtendedScheduling);
    } catch (error) {
      return this.handleError(error, 'create', { id, customerId, petId });
    }
  }

  /**
   * Encontra um agendamento pelo ID
   */
  async findById(id: string): Promise<Scheduling | null> {
    try {
      const scheduling = await this.prisma.scheduling.findUnique({
        where: { id },
        include: {
          services: true,
        },
      });

      if (!scheduling) {
        return null;
      }

      return this.mapToDomain(scheduling as unknown as ExtendedScheduling);
    } catch (error) {
      return this.handleError(error, 'findById', { id });
    }
  }

  /**
   * Procura agendamentos que correspondam aos filtros fornecidos
   */
  async findAll(filter: SchedulingFilter, limit?: number, offset?: number): Promise<Scheduling[]> {
    try {
      const { id, customerId, petId, serviceIds, status, startDate, endDate, minTotalPrice, maxTotalPrice } = filter;

      // Usar any para contornar verificação de tipo
      const where: any = {
        id: id ? { equals: id } : undefined,
        customerId: customerId ? { equals: customerId } : undefined,
        petId: petId ? { equals: petId } : undefined,
        services: serviceIds && serviceIds.length > 0
          ? { some: { serviceId: { in: serviceIds } } }
          : undefined,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        totalPrice: {
          gte: minTotalPrice,
          lte: maxTotalPrice,
        },
      };

      // Adicionar status apenas se especificado
      if (status) {
        where.status = { equals: this.mapDomainStatusToPrisma(status) };
      }

      const schedulings = await this.prisma.scheduling.findMany({
        where,
        include: {
          services: true,
        },
        take: limit,
        skip: offset,
        orderBy: {
          startTime: 'asc',
        },
      });

      return schedulings.map((scheduling) => this.mapToDomain(scheduling as unknown as ExtendedScheduling));
    } catch (error) {
      return this.handleError(error, 'findAll', filter as unknown as Record<string, unknown>);
    }
  }

  /**
   * Encontra agendamentos por período
   */
  async findByPeriod(startDate: Date, endDate: Date, status?: SchedulingStatus): Promise<Scheduling[]> {
    try {
      // Usar any para contornar verificação de tipo
      const where: any = {
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      };

      // Adicionar status apenas se especificado
      if (status) {
        where.status = { equals: this.mapDomainStatusToPrisma(status) };
      }

      const schedulings = await this.prisma.scheduling.findMany({
        where,
        include: {
          services: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      return schedulings.map((scheduling) => this.mapToDomain(scheduling as unknown as ExtendedScheduling));
    } catch (error) {
      return this.handleError(error, 'findByPeriod', { startDate, endDate, status });
    }
  }

  /**
   * Encontra agendamentos por cliente
   */
  async findByCustomerId(customerId: string, status?: SchedulingStatus, limit?: number): Promise<Scheduling[]> {
    try {
      // Usar any para contornar verificação de tipo
      const where: any = { customerId };

      // Adicionar status apenas se especificado
      if (status) {
        where.status = { equals: this.mapDomainStatusToPrisma(status) };
      }

      const schedulings = await this.prisma.scheduling.findMany({
        where,
        include: {
          services: true,
        },
        take: limit,
        orderBy: {
          startTime: 'desc',
        },
      });

      return schedulings.map((scheduling) => this.mapToDomain(scheduling as unknown as ExtendedScheduling));
    } catch (error) {
      return this.handleError(error, 'findByCustomerId', { customerId, status });
    }
  }

  /**
   * Encontra agendamentos por pet
   */
  async findByPetId(petId: string, status?: SchedulingStatus, limit?: number): Promise<Scheduling[]> {
    try {
      // Usar any para contornar verificação de tipo
      const where: any = { petId };

      // Adicionar status apenas se especificado
      if (status) {
        where.status = { equals: this.mapDomainStatusToPrisma(status) };
      }

      const schedulings = await this.prisma.scheduling.findMany({
        where,
        include: {
          services: true,
        },
        take: limit,
        orderBy: {
          startTime: 'desc',
        },
      });

      return schedulings.map((scheduling) => this.mapToDomain(scheduling as unknown as ExtendedScheduling));
    } catch (error) {
      return this.handleError(error, 'findByPetId', { petId, status });
    }
  }

  /**
   * Verifica se há conflito com outros agendamentos no mesmo período
   */
  async findConflicts(timeSlot: TimeSlot, excludeId?: string): Promise<Scheduling[]> {
    try {
      const { startTime, endTime } = timeSlot.toObject();

      // Usar any para contornar verificação de tipo
      const where: any = {
        id: excludeId ? { not: excludeId } : undefined,
        status: {
          in: [
            PrismaSchedulingStatus.SCHEDULED,
            PrismaSchedulingStatus.CONFIRMED,
            PrismaSchedulingStatus.IN_PROGRESS,
          ],
        },
        OR: [
          // Verifica sobreposição: o novo período começa durante um existente
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          // Verifica sobreposição: o novo período termina durante um existente
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          // Verifica se o novo período contém completamente um existente
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      };

      const schedulings = await this.prisma.scheduling.findMany({
        where,
        include: {
          services: true,
        },
      });

      return schedulings.map((scheduling) => this.mapToDomain(scheduling as unknown as ExtendedScheduling));
    } catch (error) {
      return this.handleError(error, 'findConflicts', { startTime: timeSlot.startTime, endTime: timeSlot.endTime });
    }
  }

  /**
   * Atualiza o status de um agendamento
   */
  async updateStatus(id: string, status: SchedulingStatus): Promise<Scheduling> {
    try {
      // Usar any para contornar verificação de tipo
      const data: any = {
        status: this.mapDomainStatusToPrisma(status),
        updatedAt: new Date(),
      };

      const updatedScheduling = await this.prisma.scheduling.update({
        where: { id },
        data,
        include: {
          services: true,
        },
      });

      return this.mapToDomain(updatedScheduling as unknown as ExtendedScheduling);
    } catch (error) {
      return this.handleError(error, 'updateStatus', { id, status });
    }
  }

  /**
   * Atualiza o período de tempo de um agendamento
   */
  async updateTimeSlot(id: string, timeSlot: TimeSlot): Promise<Scheduling> {
    try {
      const { startTime, endTime } = timeSlot.toObject();

      const updatedScheduling = await this.prisma.scheduling.update({
        where: { id },
        data: {
          startTime,
          endTime,
          updatedAt: new Date(),
        },
        include: {
          services: true,
        },
      });

      return this.mapToDomain(updatedScheduling as unknown as ExtendedScheduling);
    } catch (error) {
      return this.handleError(error, 'updateTimeSlot', { id, startTime: timeSlot.startTime, endTime: timeSlot.endTime });
    }
  }

  /**
   * Adiciona observações a um agendamento
   */
  async addNotes(id: string, notes: string): Promise<Scheduling> {
    try {
      const updatedScheduling = await this.prisma.scheduling.update({
        where: { id },
        data: {
          notes,
          updatedAt: new Date(),
        },
        include: {
          services: true,
        },
      });

      return this.mapToDomain(updatedScheduling as unknown as ExtendedScheduling);
    } catch (error) {
      return this.handleError(error, 'addNotes', { id, notes });
    }
  }

  /**
   * Conta o número total de agendamentos que correspondem aos filtros
   */
  async count(filter: SchedulingFilter): Promise<number> {
    try {
      const { id, customerId, petId, serviceIds, status, startDate, endDate, minTotalPrice, maxTotalPrice } = filter;

      // Usar any para contornar verificação de tipo
      const where: any = {
        id: id ? { equals: id } : undefined,
        customerId: customerId ? { equals: customerId } : undefined,
        petId: petId ? { equals: petId } : undefined,
        services: serviceIds && serviceIds.length > 0
          ? { some: { serviceId: { in: serviceIds } } }
          : undefined,
        startTime: startDate ? { gte: startDate } : undefined,
        endTime: endDate ? { lte: endDate } : undefined,
        totalPrice: {
          gte: minTotalPrice,
          lte: maxTotalPrice,
        },
      };

      // Adicionar status apenas se especificado
      if (status) {
        where.status = { equals: this.mapDomainStatusToPrisma(status) };
      }

      return await this.prisma.scheduling.count({
        where,
      });
    } catch (error) {
      return this.handleError(error, 'count', filter as unknown as Record<string, unknown>);
    }
  }

  /**
   * Exclui um agendamento pelo ID
   */
  async delete(id: string): Promise<void> {
    try {
      // Primeiro excluímos os serviços relacionados
      await this.prisma.schedulingService.deleteMany({
        where: { schedulingId: id },
      });

      // Depois excluímos o agendamento
      await this.prisma.scheduling.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'delete', { id });
    }
  }

  /**
   * Mapeia os dados do Prisma para a entidade de domínio
   */
  private mapToDomain(prismaScheduling: ExtendedScheduling): Scheduling {
    // Certificar que prismaScheduling.services está definido e tem os campos necessários
    const scheduledServices = (prismaScheduling.services || []).map(service => {
      return new ScheduledService(
        service.id,
        service.serviceId,
        service.serviceName || 'Serviço sem nome',
        service.price || 0,
        service.duration || 0
      );
    });

    // Criamos o TimeSlot
    const timeSlot = TimeSlot.create(
      prismaScheduling.startTime,
      prismaScheduling.endTime
    );

    // Criamos o agendamento
    return Scheduling.create(
      prismaScheduling.id,
      timeSlot,
      prismaScheduling.customerId,
      prismaScheduling.petId,
      scheduledServices,
      prismaScheduling.notes || undefined,
      this.mapPrismaStatusToDomain(prismaScheduling.status),
      prismaScheduling.createdAt,
      prismaScheduling.updatedAt
    );
  }
} 