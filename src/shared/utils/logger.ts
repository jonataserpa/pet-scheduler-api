import winston from "winston";
import { env } from "../config/env.js";
import fs from "fs";
import path from "path";

// Cria o diretório de logs se não existir
const logDir = path.dirname(env.LOG_FILE_PATH);
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

// Formatos personalizados
const formats = [
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	winston.format.errors({ stack: true }),
	winston.format.splat(),
	winston.format.json(),
];

// Configuração do logger
const logger = winston.createLogger({
	level: env.LOG_LEVEL,
	levels: winston.config.npm.levels,
	format: winston.format.combine(...formats),
	transports: [
		// Escreve todos os logs em arquivos
		new winston.transports.File({
			filename: env.LOG_FILE_PATH,
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
		// Escreve apenas logs de erro em um arquivo separado
		new winston.transports.File({
			filename: path.join(logDir, "error.log"),
			level: "error",
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
	],
});

// Adiciona console transport em desenvolvimento
if (env.NODE_ENV !== "production") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.printf(({ timestamp, level, message, ...rest }) => {
					const restString = Object.keys(rest).length ? JSON.stringify(rest, null, 2) : "";
					return `${timestamp} ${level}: ${message} ${restString}`;
				}),
			),
		}),
	);
}

export { logger };
