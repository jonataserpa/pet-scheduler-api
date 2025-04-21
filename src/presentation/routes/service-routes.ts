import { Router } from 'express';
import { ServiceController } from '../controllers/service-controller.js';
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
 * Configura as rotas para gerenciamento de serviços
 * @param router Router do Express
 * @param serviceController Controlador de serviços
 * @param authMiddleware Middleware de autenticação
 */
export function setupServiceRoutes(
  router: Router,
  serviceController: ServiceController,
  authMiddleware: AuthMiddleware,
): void {
  // Adaptar middleware de autenticação
  const authenticate = authMiddlewareAdapter(authMiddleware.authenticate.bind(authMiddleware));
  
  /**
   * @swagger
   * /api/services:
   *   get:
   *     summary: Lista todos os serviços
   *     description: Retorna uma lista paginada de serviços com opções de filtragem
   *     tags: [Serviços]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Filtrar por nome do serviço
   *       - in: query
   *         name: minPrice
   *         schema:
   *           type: number
   *         description: Preço mínimo
   *       - in: query
   *         name: maxPrice
   *         schema:
   *           type: number
   *         description: Preço máximo
   *       - in: query
   *         name: minDuration
   *         schema:
   *           type: integer
   *         description: Duração mínima em minutos
   *       - in: query
   *         name: maxDuration
   *         schema:
   *           type: integer
   *         description: Duração máxima em minutos
   *       - in: query
   *         name: petSize
   *         schema:
   *           type: string
   *           enum: [SMALL, MEDIUM, LARGE, EXTRA_LARGE]
   *         description: Tamanho de pet compatível
   *       - in: query
   *         name: active
   *         schema:
   *           type: boolean
   *           default: true
   *         description: Filtrar serviços ativos/inativos
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Limite de resultados por página
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Offset para paginação
   *     responses:
   *       200:
   *         description: Lista de serviços
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ServiceListResponse'
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  router.get(
    '/',
    authenticate,
    serviceController.listServices.bind(serviceController),
  );

  /**
   * @swagger
   * /api/services/{id}:
   *   get:
   *     summary: Busca um serviço pelo ID
   *     description: Retorna os detalhes completos de um serviço específico
   *     tags: [Serviços]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do serviço
   *     responses:
   *       200:
   *         description: Serviço encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/Service'
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Serviço não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.get(
    '/:id',
    authenticate,
    serviceController.getServiceById.bind(serviceController),
  );

  /**
   * @swagger
   * /api/services:
   *   post:
   *     summary: Cria um novo serviço
   *     description: Cria um novo serviço com as informações fornecidas
   *     tags: [Serviços]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateServiceRequest'
   *     responses:
   *       201:
   *         description: Serviço criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Serviço criado com sucesso
   *                 data:
   *                   $ref: '#/components/schemas/Service'
   *       400:
   *         description: Dados inválidos na requisição
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  router.post(
    '/',
    authenticate,
    serviceController.createService.bind(serviceController),
  );

  /**
   * @swagger
   * /api/services/{id}:
   *   put:
   *     summary: Atualiza um serviço existente
   *     description: Atualiza as informações de um serviço específico
   *     tags: [Serviços]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do serviço
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateServiceRequest'
   *     responses:
   *       200:
   *         description: Serviço atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Serviço atualizado com sucesso
   *                 data:
   *                   $ref: '#/components/schemas/Service'
   *       400:
   *         description: Dados inválidos na requisição
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Serviço não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.put(
    '/:id',
    authenticate,
    serviceController.updateService.bind(serviceController),
  );

  /**
   * @swagger
   * /api/services/{id}/activate:
   *   patch:
   *     summary: Ativa um serviço
   *     description: Altera o status de um serviço para ativo
   *     tags: [Serviços]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do serviço
   *     responses:
   *       200:
   *         description: Serviço ativado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Serviço ativado com sucesso
   *                 data:
   *                   $ref: '#/components/schemas/Service'
   *       400:
   *         description: Serviço já está ativo
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Serviço não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.patch(
    '/:id/activate',
    authenticate,
    serviceController.activateService.bind(serviceController),
  );

  /**
   * @swagger
   * /api/services/{id}/deactivate:
   *   patch:
   *     summary: Desativa um serviço
   *     description: Altera o status de um serviço para inativo
   *     tags: [Serviços]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do serviço
   *     responses:
   *       200:
   *         description: Serviço desativado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Serviço desativado com sucesso
   *                 data:
   *                   $ref: '#/components/schemas/Service'
   *       400:
   *         description: Serviço já está inativo
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Serviço não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  router.patch(
    '/:id/deactivate',
    authenticate,
    serviceController.deactivateService.bind(serviceController),
  );

  /**
   * @swagger
   * /api/services/pet-size/{size}:
   *   get:
   *     summary: Lista serviços por tamanho de pet
   *     description: Retorna todos os serviços compatíveis com um determinado tamanho de pet
   *     tags: [Serviços]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: size
   *         required: true
   *         schema:
   *           type: string
   *           enum: [SMALL, MEDIUM, LARGE, EXTRA_LARGE]
   *         description: Tamanho do pet
   *     responses:
   *       200:
   *         description: Lista de serviços compatíveis
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Service'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                       example: 5
   *                     petSize:
   *                       type: string
   *                       example: MEDIUM
   *       400:
   *         description: Tamanho de pet inválido
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  router.get(
    '/pet-size/:size',
    authenticate,
    serviceController.getServicesByPetSize.bind(serviceController),
  );
} 