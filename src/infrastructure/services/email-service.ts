import nodemailer from "nodemailer";
import { env } from "../../shared/config/env.js";
import { logger } from "../../shared/utils/logger.js";

interface EmailOptions {
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
	from?: string;
}

/**
 * Serviço para envio de emails
 */
export class EmailService {
	private transporter: nodemailer.Transporter;
	private defaultFrom: string;

	/**
	 * Inicializa o serviço de email
	 */
	constructor() {
		this.defaultFrom = env.EMAIL_FROM
			? `"${env.EMAIL_FROM_NAME || "Pet Scheduler"}" <${env.EMAIL_FROM}>`
			: "noreply@petscheduler.com";

		// Verifica se temos configuração de email
		if (!env.EMAIL_HOST || !env.EMAIL_PORT) {
			logger.warn(
				"Configuração de email incompleta. O serviço de email não funcionará corretamente.",
			);
		}

		// Configura o transporter do nodemailer
		this.transporter = nodemailer.createTransport({
			host: env.EMAIL_HOST,
			port: env.EMAIL_PORT,
			secure: env.EMAIL_SECURE,
			auth:
				env.EMAIL_USER && env.EMAIL_PASSWORD
					? {
							user: env.EMAIL_USER,
							pass: env.EMAIL_PASSWORD,
						}
					: undefined,
		});
	}

	/**
	 * Envia um email
	 */
	public async sendEmail(options: EmailOptions): Promise<boolean> {
		try {
			if (!env.EMAIL_HOST || !env.EMAIL_PORT) {
				logger.warn("Tentativa de envio de email com configuração incompleta", { ...options });
				return false;
			}

			const mailOptions = {
				from: options.from || this.defaultFrom,
				to: options.to,
				subject: options.subject,
				text: options.text,
				html: options.html,
			};

			const info = await this.transporter.sendMail(mailOptions);
			logger.info("Email enviado com sucesso", { messageId: info.messageId, to: options.to });
			return true;
		} catch (error) {
			logger.error("Erro ao enviar email", { error, to: options.to, subject: options.subject });
			return false;
		}
	}

	/**
	 * Envia um email de recuperação de senha
	 */
	public async sendPasswordResetEmail(
		to: string,
		resetToken: string,
		username: string,
	): Promise<boolean> {
		const resetUrl = `${env.API_URL}/reset-password?token=${resetToken}`;

		const subject = "Recuperação de Senha - Pet Scheduler";

		const text =
			`Olá ${username},\n\n` +
			`Você solicitou a recuperação de senha da sua conta no Pet Scheduler.\n\n` +
			`Para redefinir sua senha, acesse o link abaixo (válido por 1 hora):\n\n` +
			`${resetUrl}\n\n` +
			`Se você não solicitou esta recuperação, ignore este email.\n\n` +
			`Atenciosamente,\n` +
			`Equipe Pet Scheduler`;

		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3f51b5;">Recuperação de Senha - Pet Scheduler</h2>
        <p>Olá <strong>${username}</strong>,</p>
        <p>Você solicitou a recuperação de senha da sua conta no Pet Scheduler.</p>
        <p>Para redefinir sua senha, clique no botão abaixo (válido por 1 hora):</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3f51b5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Redefinir Senha
          </a>
        </div>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
        <p>Atenciosamente,<br>Equipe Pet Scheduler</p>
      </div>
    `;

		return this.sendEmail({ to, subject, text, html });
	}

	/**
	 * Envia um email de notificação de senha alterada
	 */
	public async sendPasswordChangedEmail(to: string, username: string): Promise<boolean> {
		const subject = "Senha Alterada - Pet Scheduler";

		const text =
			`Olá ${username},\n\n` +
			`Sua senha foi alterada com sucesso no Pet Scheduler.\n\n` +
			`Se você não fez esta alteração, entre em contato com nosso suporte imediatamente.\n\n` +
			`Atenciosamente,\n` +
			`Equipe Pet Scheduler`;

		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3f51b5;">Senha Alterada - Pet Scheduler</h2>
        <p>Olá <strong>${username}</strong>,</p>
        <p>Sua senha foi alterada com sucesso no Pet Scheduler.</p>
        <p style="color: #D32F2F; font-weight: bold;">Se você não fez esta alteração, entre em contato com nosso suporte imediatamente.</p>
        <p>Atenciosamente,<br>Equipe Pet Scheduler</p>
      </div>
    `;

		return this.sendEmail({ to, subject, text, html });
	}

	/**
	 * Testa a conexão com o servidor SMTP
	 */
	public async verifyConnection(): Promise<boolean> {
		try {
			if (!env.EMAIL_HOST || !env.EMAIL_PORT) {
				return false;
			}
			await this.transporter.verify();
			return true;
		} catch (error) {
			logger.error("Erro ao verificar conexão com servidor de email", { error });
			return false;
		}
	}
}
