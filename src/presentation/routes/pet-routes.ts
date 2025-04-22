import { Router } from "express";
import { PetController } from "../controllers/pet-controller.js";
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

// const roleMiddlewareAdapter = (middleware: (role: string) => (req: any, res: any, next: any) => Promise<any>) => {
//   return (role: string) => {
//     return async (req: any, res: any, next: any) => {
//       try {
//         await middleware(role)(req, res, next);
//       } catch (error) {
//         next(error);
//       }
//     };
//   };
// };

/**
 * Configura as rotas para gerenciamento de pets
 * @param router Router do Express
 * @param petController Controlador de pets
 * @param authMiddleware Middleware de autenticação
 */
export function setupPetRoutes(
	router: Router,
	petController: PetController,
	authMiddleware: AuthMiddleware,
): void {
	// Adaptar middlewares de autenticação
	const authenticate = authMiddlewareAdapter(authMiddleware.authenticate.bind(authMiddleware));
	// const hasRole = roleMiddlewareAdapter(authMiddleware.hasRole.bind(authMiddleware));

	/**
	 * @swagger
	 * /api/pets:
	 *   get:
	 *     summary: Lista todos os pets
	 *     tags: [Pets]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: name
	 *         schema:
	 *           type: string
	 *         description: Filtrar por nome
	 *       - in: query
	 *         name: species
	 *         schema:
	 *           type: string
	 *         description: Filtrar por espécie
	 *       - in: query
	 *         name: breed
	 *         schema:
	 *           type: string
	 *         description: Filtrar por raça
	 *       - in: query
	 *         name: size
	 *         schema:
	 *           type: string
	 *           enum: [SMALL, MEDIUM, LARGE, EXTRA_LARGE]
	 *         description: Filtrar por tamanho
	 *       - in: query
	 *         name: customerId
	 *         schema:
	 *           type: string
	 *         description: Filtrar por cliente
	 *       - in: query
	 *         name: active
	 *         schema:
	 *           type: boolean
	 *           default: true
	 *         description: Filtrar por status (ativo/inativo)
	 *       - in: query
	 *         name: hasAllergies
	 *         schema:
	 *           type: boolean
	 *         description: Filtrar pets com alergias
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
	 *         description: Lista de pets
	 *       401:
	 *         description: Não autorizado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get("/", authenticate, petController.listPets.bind(petController));

	/**
	 * @swagger
	 * /api/pets/{id}:
	 *   get:
	 *     summary: Busca um pet pelo ID
	 *     tags: [Pets]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: ID do pet
	 *     responses:
	 *       200:
	 *         description: Pet encontrado
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Pet não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get("/:id", authenticate, petController.getPetById.bind(petController));

	/**
	 * @swagger
	 * /api/pets:
	 *   post:
	 *     summary: Cria um novo pet
	 *     tags: [Pets]
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
	 *               - species
	 *               - size
	 *               - customerId
	 *             properties:
	 *               name:
	 *                 type: string
	 *                 description: Nome do pet
	 *               species:
	 *                 type: string
	 *                 description: Espécie do pet (cão, gato, etc.)
	 *               breed:
	 *                 type: string
	 *                 description: Raça do pet
	 *               size:
	 *                 type: string
	 *                 enum: [SMALL, MEDIUM, LARGE, EXTRA_LARGE]
	 *                 description: Tamanho do pet
	 *               customerId:
	 *                 type: string
	 *                 format: uuid
	 *                 description: ID do cliente dono do pet
	 *               birthDate:
	 *                 type: string
	 *                 format: date
	 *                 description: Data de nascimento do pet
	 *               allergies:
	 *                 type: string
	 *                 description: Alergias do pet
	 *               observations:
	 *                 type: string
	 *                 description: Observações sobre o pet
	 *     responses:
	 *       201:
	 *         description: Pet criado com sucesso
	 *       400:
	 *         description: Dados inválidos na requisição
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Cliente não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post("/", authenticate, petController.createPet.bind(petController));

	/**
	 * @swagger
	 * /api/pets/{id}:
	 *   put:
	 *     summary: Atualiza um pet existente
	 *     tags: [Pets]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: ID do pet
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               name:
	 *                 type: string
	 *                 description: Nome do pet
	 *               species:
	 *                 type: string
	 *                 description: Espécie do pet (cão, gato, etc.)
	 *               breed:
	 *                 type: string
	 *                 description: Raça do pet
	 *               size:
	 *                 type: string
	 *                 enum: [SMALL, MEDIUM, LARGE, EXTRA_LARGE]
	 *                 description: Tamanho do pet
	 *               birthDate:
	 *                 type: string
	 *                 format: date
	 *                 description: Data de nascimento do pet
	 *               allergies:
	 *                 type: string
	 *                 description: Alergias do pet
	 *               observations:
	 *                 type: string
	 *                 description: Observações sobre o pet
	 *     responses:
	 *       200:
	 *         description: Pet atualizado com sucesso
	 *       400:
	 *         description: Dados inválidos na requisição
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Pet não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.put("/:id", authenticate, petController.updatePet.bind(petController));

	/**
	 * @swagger
	 * /api/pets/{id}/activate:
	 *   patch:
	 *     summary: Ativa um pet
	 *     tags: [Pets]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: ID do pet
	 *     responses:
	 *       200:
	 *         description: Pet ativado com sucesso
	 *       400:
	 *         description: Pet já está ativo
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Pet não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.patch("/:id/activate", authenticate, petController.activatePet.bind(petController));

	/**
	 * @swagger
	 * /api/pets/{id}/deactivate:
	 *   patch:
	 *     summary: Desativa um pet
	 *     tags: [Pets]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: ID do pet
	 *     responses:
	 *       200:
	 *         description: Pet desativado com sucesso
	 *       400:
	 *         description: Pet já está inativo
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Pet não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.patch("/:id/deactivate", authenticate, petController.deactivatePet.bind(petController));

	/**
	 * @swagger
	 * /api/pets/customer/{customerId}:
	 *   get:
	 *     summary: Busca pets de um cliente
	 *     tags: [Pets]
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
		"/customer/:customerId",
		authenticate,
		petController.getPetsByCustomer.bind(petController),
	);
}
