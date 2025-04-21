import { Router } from 'express';
import { SchedulingController } from '../controllers/scheduling-controller.js';
import { AuthMiddleware } from '../middlewares/auth-middleware.js';

// Adaptadores para middlewares
const authMiddlewareAdapter = (middleware: (req: any, res: any, next: any) => Promise<any>) => {
  return async (req: any, res: any, next: any) => {
    try {
      await middleware(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Configura as rotas para gerenciamento de agendamentos
 * @param router Router do Express
 * @param schedulingController Controlador de agendamentos
 * @param authMiddleware Middleware de autenticação
 */
export function setupSchedulingRoutes(
  router: Router,
  schedulingController: SchedulingController,
  authMiddleware: AuthMiddleware,
): void {
  // Adaptar middlewares de autenticação
  const authenticate = authMiddlewareAdapter(authMiddleware.authenticate.bind(authMiddleware));
  
  /**
   * @swagger
   * /api/schedulings:
   *   get:
   *     summary: Lista todos os agendamentos
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data inicial para filtrar (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data final para filtrar (YYYY-MM-DD)
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
   *         description: Filtrar por status
   *       - in: query
   *         name: customerId
   *         schema:
   *           type: string
   *         description: Filtrar por cliente
   *       - in: query
   *         name: petId
   *         schema:
   *           type: string
   *         description: Filtrar por pet
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Limite de resultados
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Offset para paginação
   *     responses:
   *       200:
   *         description: Lista de agendamentos
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  router.get(
    '/',
    authenticate,
    schedulingController.listSchedulings.bind(schedulingController),
  );

  /**
   * @swagger
   * /api/schedulings/{id}:
   *   get:
   *     summary: Busca um agendamento pelo ID
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do agendamento
   *     responses:
   *       200:
   *         description: Agendamento encontrado
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Agendamento não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.get(
    '/:id',
    authenticate,
    schedulingController.getSchedulingById.bind(schedulingController),
  );

  /**
   * @swagger
   * /api/schedulings:
   *   post:
   *     summary: Cria um novo agendamento
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - startTime
   *               - endTime
   *               - customerId
   *               - petId
   *               - services
   *             properties:
   *               startTime:
   *                 type: string
   *                 format: date-time
   *                 description: Data e hora de início
   *               endTime:
   *                 type: string
   *                 format: date-time
   *                 description: Data e hora de término
   *               customerId:
   *                 type: string
   *                 format: uuid
   *                 description: ID do cliente
   *               petId:
   *                 type: string
   *                 format: uuid
   *                 description: ID do pet
   *               services:
   *                 type: array
   *                 description: Lista de IDs de serviços
   *                 items:
   *                   type: string
   *                   format: uuid
   *               notes:
   *                 type: string
   *                 description: Observações sobre o agendamento
   *               status:
   *                 type: string
   *                 enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
   *                 default: SCHEDULED
   *                 description: Status do agendamento
   *     responses:
   *       201:
   *         description: Agendamento criado com sucesso
   *       400:
   *         description: Dados inválidos na requisição
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Cliente, pet ou serviços não encontrados
   *       409:
   *         description: Conflito com outro agendamento
   *       500:
   *         description: Erro interno do servidor
   */
  router.post(
    '/',
    authenticate,
    schedulingController.createScheduling.bind(schedulingController),
  );

  /**
   * @swagger
   * /api/schedulings/{id}:
   *   put:
   *     summary: Atualiza um agendamento existente
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do agendamento
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               startTime:
   *                 type: string
   *                 format: date-time
   *                 description: Data e hora de início
   *               endTime:
   *                 type: string
   *                 format: date-time
   *                 description: Data e hora de término
   *               services:
   *                 type: array
   *                 description: Lista de IDs de serviços
   *                 items:
   *                   type: string
   *                   format: uuid
   *               notes:
   *                 type: string
   *                 description: Observações sobre o agendamento
   *     responses:
   *       200:
   *         description: Agendamento atualizado com sucesso
   *       400:
   *         description: Dados inválidos na requisição
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Agendamento não encontrado
   *       409:
   *         description: Conflito com outro agendamento
   *       500:
   *         description: Erro interno do servidor
   */
  router.put(
    '/:id',
    authenticate,
    schedulingController.updateScheduling.bind(schedulingController),
  );

  /**
   * @swagger
   * /api/schedulings/{id}/status:
   *   patch:
   *     summary: Atualiza o status de um agendamento
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do agendamento
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
   *                 description: Novo status do agendamento
   *     responses:
   *       200:
   *         description: Status atualizado com sucesso
   *       400:
   *         description: Dados inválidos na requisição
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Agendamento não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.patch(
    '/:id/status',
    authenticate,
    schedulingController.updateStatus.bind(schedulingController),
  );

  /**
   * @swagger
   * /api/schedulings/{id}/notes:
   *   patch:
   *     summary: Adiciona notas a um agendamento
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do agendamento
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - notes
   *             properties:
   *               notes:
   *                 type: string
   *                 description: Notas ou observações sobre o agendamento
   *     responses:
   *       200:
   *         description: Notas adicionadas com sucesso
   *       400:
   *         description: Dados inválidos na requisição
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Agendamento não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.patch(
    '/:id/notes',
    authenticate,
    schedulingController.addNotes.bind(schedulingController),
  );

  /**
   * @swagger
   * /api/schedulings/customer/{customerId}:
   *   get:
   *     summary: Busca agendamentos de um cliente
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do cliente
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
   *         description: Filtrar por status
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Limite de resultados
   *     responses:
   *       200:
   *         description: Lista de agendamentos do cliente
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.get(
    '/customer/:customerId',
    authenticate,
    schedulingController.getSchedulingsByCustomer.bind(schedulingController),
  );

  /**
   * @swagger
   * /api/schedulings/pet/{petId}:
   *   get:
   *     summary: Busca agendamentos de um pet
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: petId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do pet
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
   *         description: Filtrar por status
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Limite de resultados
   *     responses:
   *       200:
   *         description: Lista de agendamentos do pet
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Pet não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.get(
    '/pet/:petId',
    authenticate,
    schedulingController.getSchedulingsByPet.bind(schedulingController),
  );

  /**
   * @swagger
   * /api/schedulings/period:
   *   get:
   *     summary: Busca agendamentos em um período específico
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Data inicial (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Data final (YYYY-MM-DD)
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
   *         description: Filtrar por status
   *     responses:
   *       200:
   *         description: Lista de agendamentos no período
   *       400:
   *         description: Parâmetros de data inválidos
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  router.get(
    '/period',
    authenticate,
    schedulingController.getSchedulingsByPeriod.bind(schedulingController),
  );

  /**
   * @swagger
   * /api/schedulings/{id}:
   *   delete:
   *     summary: Remove um agendamento
   *     tags: [Agendamentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do agendamento
   *     responses:
   *       204:
   *         description: Agendamento removido com sucesso
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Agendamento não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.delete(
    '/:id',
    authenticate,
    schedulingController.deleteScheduling.bind(schedulingController),
  );
} 