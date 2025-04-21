import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import { hash } from 'bcrypt';
import { env } from '../../shared/config/env.js';
import { logger } from '../../shared/utils/logger.js';
import { IUserRepository } from '../../domain/services/auth/auth-service.js';
import { User, UserRole } from '../../domain/entities/user.js';

// Variável para armazenar a última senha aleatória gerada (para uso do OAuth)
let lastRandomPassword = '';

/**
 * Configura a estratégia de autenticação com Google
 */
export function setupPassportStrategies(userRepository: IUserRepository): void {
  // Serialização do usuário (o que vai para a sessão)
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  // Deserialização do usuário (recupera o usuário da sessão)
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await userRepository.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Configuração da estratégia do Google
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.OAUTH_CALLBACK_URL) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.OAUTH_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            // Informações do perfil
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();

            if (!email) {
              return done(new Error('Email não disponível no perfil do Google'));
            }

            // Verifica se o usuário já existe
            let user = await userRepository.findByEmail(email);

            if (user) {
              // Se o usuário estiver inativo, ativa-o
              if (!user.active) {
                user.activate();
                user = await userRepository.save(user);
              }
              return done(null, user);
            }

            // Cria um novo usuário com uma senha aleatória (que será alterada pelo usuário)
            lastRandomPassword = uuidv4();
            const newUser = await User.create(
              uuidv4(), // ID aleatório
              email,
              lastRandomPassword, // Esta será a senha em texto plano
              name,
              UserRole.EMPLOYEE, // Papel padrão para usuários OAuth
            );

            // Salva o novo usuário
            const savedUser = await userRepository.create(newUser, await getUserHashedPassword());
            return done(null, savedUser);
          } catch (error) {
            logger.error('Erro na autenticação com Google:', error);
            return done(error as Error);
          }
        },
      ),
    );

    logger.info('Estratégia de autenticação com Google configurada');
  } else {
    logger.warn('Autenticação com Google não configurada. Variáveis de ambiente ausentes.');
  }
}

/**
 * Função auxiliar para obter a senha hasheada do usuário criado
 * Esta é uma solução alternativa, pois não podemos acessar diretamente a senha hasheada
 */
async function getUserHashedPassword(): Promise<string> {
  if (!lastRandomPassword) {
    throw new Error('Senha aleatória não definida');
  }
  
  return hash(lastRandomPassword, 10);
} 