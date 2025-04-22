import { Router } from "express";
import { CustomerController } from "../controllers/customer-controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";

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
 * Configura as rotas para gerenciamento de clientes
 * @param router Router do Express
 * @param customerController Controlador de clientes
 * @param authMiddleware Middleware de autenticação
 */
export function setupCustomerRoutes(
	router: Router,
	customerController: CustomerController,
	authMiddleware: AuthMiddleware,
): void {
	// Adaptar middlewares de autenticação
	const authenticate = authMiddlewareAdapter(authMiddleware.authenticate.bind(authMiddleware));

	/**
	 * @swagger
	 * /api/customers:
	 *   get:
	 *     summary: Lista todos os clientes
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: name
	 *         schema:
	 *           type: string
	 *         description: Filtrar por nome
	 *       - in: query
	 *         name: email
	 *         schema:
	 *           type: string
	 *         description: Filtrar por email
	 *       - in: query
	 *         name: phone
	 *         schema:
	 *           type: string
	 *         description: Filtrar por telefone
	 *       - in: query
	 *         name: documentNumber
	 *         schema:
	 *           type: string
	 *         description: Filtrar por número de documento (CPF/CNPJ)
	 *       - in: query
	 *         name: active
	 *         schema:
	 *           type: boolean
	 *           default: true
	 *         description: Filtrar por status (ativo/inativo)
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
	 *         description: Lista de clientes
	 *       401:
	 *         description: Não autorizado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get("/", authenticate, customerController.listCustomers.bind(customerController));

	/**
	 * @swagger
	 * /api/customers/{id}:
	 *   get:
	 *     summary: Busca um cliente pelo ID
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: ID do cliente
	 *     responses:
	 *       200:
	 *         description: Cliente encontrado
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Cliente não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get("/:id", authenticate, customerController.getCustomerById.bind(customerController));

	/**
	 * @swagger
	 * /api/customers:
	 *   post:
	 *     summary: Cria um novo cliente
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - name
	 *               - email
	 *               - phone
	 *               - documentNumber
	 *             properties:
	 *               name:
	 *                 type: string
	 *                 description: Nome completo do cliente
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 description: Email do cliente
	 *               phone:
	 *                 type: string
	 *                 description: Telefone do cliente
	 *               documentNumber:
	 *                 type: string
	 *                 description: CPF ou CNPJ do cliente
	 *               address:
	 *                 type: object
	 *                 properties:
	 *                   street:
	 *                     type: string
	 *                     description: Rua/Logradouro
	 *                   number:
	 *                     type: string
	 *                     description: Número
	 *                   complement:
	 *                     type: string
	 *                     description: Complemento
	 *                   neighborhood:
	 *                     type: string
	 *                     description: Bairro
	 *                   city:
	 *                     type: string
	 *                     description: Cidade
	 *                   state:
	 *                     type: string
	 *                     description: Estado
	 *                   postalCode:
	 *                     type: string
	 *                     description: CEP
	 *     responses:
	 *       201:
	 *         description: Cliente criado com sucesso
	 *       400:
	 *         description: Dados inválidos na requisição
	 *       401:
	 *         description: Não autorizado
	 *       409:
	 *         description: Cliente com mesmo documento ou email já existe
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post("/", authenticate, customerController.createCustomer.bind(customerController));

	/**
	 * @swagger
	 * /api/customers/{id}:
	 *   put:
	 *     summary: Atualiza um cliente existente
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: ID do cliente
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               name:
	 *                 type: string
	 *                 description: Nome completo do cliente
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 description: Email do cliente
	 *               phone:
	 *                 type: string
	 *                 description: Telefone do cliente
	 *               address:
	 *                 type: object
	 *                 properties:
	 *                   street:
	 *                     type: string
	 *                     description: Rua/Logradouro
	 *                   number:
	 *                     type: string
	 *                     description: Número
	 *                   complement:
	 *                     type: string
	 *                     description: Complemento
	 *                   neighborhood:
	 *                     type: string
	 *                     description: Bairro
	 *                   city:
	 *                     type: string
	 *                     description: Cidade
	 *                   state:
	 *                     type: string
	 *                     description: Estado
	 *                   postalCode:
	 *                     type: string
	 *                     description: CEP
	 *     responses:
	 *       200:
	 *         description: Cliente atualizado com sucesso
	 *       400:
	 *         description: Dados inválidos na requisição
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Cliente não encontrado
	 *       409:
	 *         description: Email já está em uso por outro cliente
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.put("/:id", authenticate, customerController.updateCustomer.bind(customerController));

	/**
	 * @swagger
	 * /api/customers/{id}/activate:
	 *   patch:
	 *     summary: Ativa um cliente
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: ID do cliente
	 *     responses:
	 *       200:
	 *         description: Cliente ativado com sucesso
	 *       400:
	 *         description: Cliente já está ativo
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Cliente não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.patch(
		"/:id/activate",
		authenticate,
		customerController.activateCustomer.bind(customerController),
	);

	/**
	 * @swagger
	 * /api/customers/{id}/deactivate:
	 *   patch:
	 *     summary: Desativa um cliente
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: ID do cliente
	 *     responses:
	 *       200:
	 *         description: Cliente desativado com sucesso
	 *       400:
	 *         description: Cliente já está inativo
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Cliente não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.patch(
		"/:id/deactivate",
		authenticate,
		customerController.deactivateCustomer.bind(customerController),
	);

	/**
	 * @swagger
	 * /api/customers/document/{documentNumber}:
	 *   get:
	 *     summary: Busca um cliente pelo número do documento (CPF/CNPJ)
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: documentNumber
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Número do documento (CPF/CNPJ)
	 *     responses:
	 *       200:
	 *         description: Cliente encontrado
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Cliente não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get(
		"/document/:documentNumber",
		authenticate,
		customerController.getCustomerByDocument.bind(customerController),
	);

	/**
	 * @swagger
	 * /api/customers/{id}/pets:
	 *   get:
	 *     summary: Lista os pets de um cliente
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: ID do cliente
	 *       - in: query
	 *         name: includeInactive
	 *         schema:
	 *           type: boolean
	 *           default: false
	 *         description: Incluir pets inativos
	 *     responses:
	 *       200:
	 *         description: Lista de pets do cliente
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Cliente não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get(
		"/:id/pets",
		authenticate,
		customerController.getCustomerPets.bind(customerController),
	);

	/**
	 * @swagger
	 * /api/customers/{id}/schedulings:
	 *   get:
	 *     summary: Lista os agendamentos de um cliente
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
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
		"/:id/schedulings",
		authenticate,
		customerController.getCustomerSchedulings.bind(customerController),
	);

	/**
	 * @swagger
	 * /api/customers/check-document/{documentNumber}:
	 *   get:
	 *     summary: Verifica se um número de documento (CPF/CNPJ) já está em uso
	 *     tags: [Clientes]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: documentNumber
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Número do documento (CPF/CNPJ)
	 *       - in: query
	 *         name: excludeId
	 *         schema:
	 *           type: string
	 *         description: ID de cliente a ser excluído da verificação
	 *     responses:
	 *       200:
	 *         description: Resultado da verificação
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 exists:
	 *                   type: boolean
	 *                   description: Indica se o documento já está em uso
	 *       401:
	 *         description: Não autorizado
	 *       400:
	 *         description: Documento inválido
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get(
		"/check-document/:documentNumber",
		authenticate,
		customerController.checkDocumentExists.bind(customerController),
	);
}
