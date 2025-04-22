import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
	// Limpar tabelas existentes (em ordem inversa para evitar problemas de chave estrangeira)
	console.log("🧹 Limpando dados existentes...");
	await prisma.notification.deleteMany();
	await prisma.schedulingService.deleteMany();
	await prisma.scheduling.deleteMany();
	await prisma.pet.deleteMany();
	await prisma.customer.deleteMany();
	await prisma.service.deleteMany();
	await prisma.loginHistory.deleteMany();
	await prisma.user.deleteMany();

	console.log("🌱 Iniciando seed de dados...");

	// Criar usuários
	console.log("👤 Criando usuários...");
	const adminPassword = await bcrypt.hash("admin123", 10);
	const employeePassword = await bcrypt.hash("employee123", 10);

	const admin = await prisma.user.create({
		data: {
			name: "Administrador",
			email: "admin@petshop.com",
			password: adminPassword,
			role: "ADMIN",
		},
	});

	const employee = await prisma.user.create({
		data: {
			name: "Funcionário Exemplo",
			email: "funcionario@petshop.com",
			password: employeePassword,
			role: "EMPLOYEE",
		},
	});

	console.log(`Usuários criados: ${admin.id}, ${employee.id}`);

	// Criar histórico de login
	console.log("🔐 Criando histórico de login...");
	await prisma.loginHistory.create({
		data: {
			userId: admin.id,
			email: admin.email,
			status: "SUCCESS",
			ipAddress: "127.0.0.1",
			userAgent: "Seed Script",
			authMethod: "PASSWORD",
			details: { source: "seed" },
			location: { country: "Brasil", city: "São Paulo" },
		},
	});

	// Criar serviços
	console.log("🛠️ Criando serviços...");
	const services = await Promise.all([
		prisma.service.create({
			data: {
				name: "Banho Básico",
				description: "Banho com shampoo e condicionador básicos",
				duration: 60,
				price: 50.0,
				petSizes: ["SMALL", "MEDIUM"],
			},
		}),
		prisma.service.create({
			data: {
				name: "Banho Premium",
				description: "Banho com produtos premium e hidratação especial",
				duration: 90,
				price: 80.0,
				petSizes: ["SMALL", "MEDIUM", "LARGE"],
			},
		}),
		prisma.service.create({
			data: {
				name: "Tosa Higiênica",
				description: "Tosa nas áreas íntimas, patas e face",
				duration: 45,
				price: 40.0,
				petSizes: ["SMALL", "MEDIUM", "LARGE"],
			},
		}),
		prisma.service.create({
			data: {
				name: "Tosa Completa",
				description: "Tosa completa do corpo conforme solicitação do cliente",
				duration: 120,
				price: 90.0,
				petSizes: ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"],
			},
		}),
		prisma.service.create({
			data: {
				name: "Combo Banho e Tosa",
				description: "Banho premium e tosa completa",
				duration: 180,
				price: 130.0,
				petSizes: ["SMALL", "MEDIUM", "LARGE"],
			},
		}),
	]);

	console.log(`Serviços criados: ${services.length}`);

	// Criar clientes
	console.log("👨‍👩‍👧‍👦 Criando clientes...");
	const customers = await Promise.all([
		prisma.customer.create({
			data: {
				name: "João Silva",
				email: "joao.silva@exemplo.com",
				phone: "11987654321",
				address: "Rua das Flores, 123 - São Paulo/SP",
			},
		}),
		prisma.customer.create({
			data: {
				name: "Maria Oliveira",
				email: "maria.oliveira@exemplo.com",
				phone: "11976543210",
				address: "Avenida Paulista, 1500 - São Paulo/SP",
			},
		}),
		prisma.customer.create({
			data: {
				name: "Pedro Santos",
				email: "pedro.santos@exemplo.com",
				phone: "11965432109",
			},
		}),
	]);

	console.log(`Clientes criados: ${customers.length}`);

	// Criar pets
	console.log("🐶 Criando pets...");
	const birthDateDog1 = new Date();
	birthDateDog1.setFullYear(birthDateDog1.getFullYear() - 3);

	const birthDateDog2 = new Date();
	birthDateDog2.setFullYear(birthDateDog2.getFullYear() - 2);

	const birthDateCat = new Date();
	birthDateCat.setFullYear(birthDateCat.getFullYear() - 5);

	const pets = await Promise.all([
		prisma.pet.create({
			data: {
				name: "Rex",
				species: "Cachorro",
				breed: "Golden Retriever",
				size: "LARGE",
				birthDate: birthDateDog1,
				allergies: "Nenhuma",
				observations: "Dócil com outros animais",
				customerId: customers[0].id,
			},
		}),
		prisma.pet.create({
			data: {
				name: "Bella",
				species: "Cachorro",
				breed: "Poodle",
				size: "SMALL",
				birthDate: birthDateDog2,
				allergies: "Alergia a shampoo com sulfato",
				customerId: customers[0].id,
			},
		}),
		prisma.pet.create({
			data: {
				name: "Luna",
				species: "Gato",
				breed: "Siamês",
				size: "SMALL",
				birthDate: birthDateCat,
				observations: "Prefere não ser manipulada por muito tempo",
				customerId: customers[1].id,
			},
		}),
		prisma.pet.create({
			data: {
				name: "Thor",
				species: "Cachorro",
				breed: "Bulldog",
				size: "MEDIUM",
				allergies: "Sensibilidade na pele",
				customerId: customers[2].id,
			},
		}),
	]);

	console.log(`Pets criados: ${pets.length}`);

	// Criar agendamentos
	console.log("📅 Criando agendamentos...");

	// Data para agendamentos (próximos 7 dias)
	const today = new Date();
	const nextWeek = new Date(today);
	nextWeek.setDate(today.getDate() + 7);

	// Agendamento 1 - daqui a 2 dias às 10h
	const schedulingDate1 = new Date(today);
	schedulingDate1.setDate(today.getDate() + 2);
	schedulingDate1.setHours(10, 0, 0, 0);

	const endTime1 = new Date(schedulingDate1);
	endTime1.setMinutes(schedulingDate1.getMinutes() + services[4].duration);

	const scheduling1 = await prisma.scheduling.create({
		data: {
			startTime: schedulingDate1,
			endTime: endTime1,
			status: "CONFIRMED",
			totalPrice: services[4].price,
			notes: "Cliente solicitou uso de perfume suave",
			customerId: customers[0].id,
			petId: pets[0].id,
		},
	});

	await prisma.schedulingService.create({
		data: {
			schedulingId: scheduling1.id,
			serviceId: services[4].id,
		},
	});

	// Agendamento 2 - daqui a 3 dias às 14h
	const schedulingDate2 = new Date(today);
	schedulingDate2.setDate(today.getDate() + 3);
	schedulingDate2.setHours(14, 0, 0, 0);

	const endTime2 = new Date(schedulingDate2);
	endTime2.setMinutes(schedulingDate2.getMinutes() + services[0].duration);

	const scheduling2 = await prisma.scheduling.create({
		data: {
			startTime: schedulingDate2,
			endTime: endTime2,
			status: "SCHEDULED",
			totalPrice: services[0].price,
			customerId: customers[1].id,
			petId: pets[2].id,
		},
	});

	await prisma.schedulingService.create({
		data: {
			schedulingId: scheduling2.id,
			serviceId: services[0].id,
		},
	});

	// Agendamento 3 - daqui a 5 dias às 11h
	const schedulingDate3 = new Date(today);
	schedulingDate3.setDate(today.getDate() + 5);
	schedulingDate3.setHours(11, 0, 0, 0);

	const endTime3 = new Date(schedulingDate3);
	endTime3.setMinutes(schedulingDate3.getMinutes() + (services[2].duration + services[1].duration));

	const totalPrice3 = services[2].price + services[1].price;

	const scheduling3 = await prisma.scheduling.create({
		data: {
			startTime: schedulingDate3,
			endTime: endTime3,
			status: "SCHEDULED",
			totalPrice: totalPrice3,
			notes: "Pet tem medo de secador. Utilizar toalhas.",
			customerId: customers[2].id,
			petId: pets[3].id,
		},
	});

	await prisma.schedulingService.create({
		data: {
			schedulingId: scheduling3.id,
			serviceId: services[2].id,
		},
	});

	await prisma.schedulingService.create({
		data: {
			schedulingId: scheduling3.id,
			serviceId: services[1].id,
		},
	});

	console.log(`Agendamentos criados: 3`);

	// Criar notificações
	console.log("📩 Criando notificações...");

	await Promise.all([
		prisma.notification.create({
			data: {
				type: "EMAIL",
				content: `Olá ${customers[0].name}, seu agendamento para ${pets[0].name} foi confirmado para o dia ${schedulingDate1.toLocaleDateString()}.`,
				status: "SENT",
				schedulingId: scheduling1.id,
			},
		}),
		prisma.notification.create({
			data: {
				type: "SMS",
				content: `Olá ${customers[0].name}, lembramos que o agendamento de ${pets[0].name} é amanhã às ${schedulingDate1.getHours()}:00.`,
				status: "PENDING",
				schedulingId: scheduling1.id,
			},
		}),
		prisma.notification.create({
			data: {
				type: "EMAIL",
				content: `Olá ${customers[1].name}, seu agendamento para ${pets[2].name} foi registrado para o dia ${schedulingDate2.toLocaleDateString()}.`,
				status: "DELIVERED",
				schedulingId: scheduling2.id,
			},
		}),
		prisma.notification.create({
			data: {
				type: "WHATSAPP",
				content: `Olá ${customers[2].name}, seu agendamento para ${pets[3].name} foi registrado para o dia ${schedulingDate3.toLocaleDateString()}.`,
				status: "SENT",
				schedulingId: scheduling3.id,
			},
		}),
	]);

	console.log("📩 Notificações criadas: 4");

	console.log("✅ Seed concluído com sucesso!");
}

main()
	.catch((e) => {
		console.error("❌ Erro durante o seed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
