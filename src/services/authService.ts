import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { appConfig } from '../config/appConfig';
import { Acopio, AcopioManager, User } from '../models';
import { HttpError } from '../middlewares/errorHandler';
import { AuthUserPayload } from '../middlewares/auth';
import { sendPasswordRecoveryEmail } from './mailService';
const googleClient = new OAuth2Client(appConfig.googleClientId);

function createAccessToken(user: User): string {
  const payload: AuthUserPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, appConfig.jwtSecret, {
    expiresIn: appConfig.jwtExpiresIn,
  } as jwt.SignOptions);
}

async function buildAuthUserResponse(user: User) {
  const [ownedAcopioCount, managedAcopioCount] = await Promise.all([
    Acopio.count({ where: { idOwner: user.id } }),
    AcopioManager.count({ where: { idUser: user.id } }),
  ]);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    authProvider: user.authProvider,
    mustChangePassword: Boolean(user.mustChangePassword),
    hasSeenWelcome: Boolean(user.hasSeenWelcome),
    isManager: managedAcopioCount > 0,
    canCreateAcopio: managedAcopioCount === 0,
    canManageUsers: ownedAcopioCount > 0,
  };
}

export async function loginWithGoogle(idToken: string) {
  if (!appConfig.googleClientId) {
    throw new HttpError(500, 'GOOGLE_CLIENT_ID is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: appConfig.googleClientId,
  });
  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.sub) {
    throw new HttpError(401, 'Invalid Google token');
  }

  let user = await User.findOne({ where: { googleId: payload.sub } });

  if (!user) {
    user = await User.findOne({ where: { email: payload.email } });
    if (user) {
      user.googleId = payload.sub;
      if (user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      user.invitationStatus = 'active';
      user.mustChangePassword = false;
      await user.save();
    } else {
      user = await User.create({
        email: payload.email,
        name: payload.name || payload.email,
        googleId: payload.sub,
        passwordHash: null,
        authProvider: 'google',
        invitationStatus: 'active',
        mustChangePassword: false,
        isActive: true,
      });
    }
  } else if (user.invitationStatus !== 'active' || user.mustChangePassword) {
    user.invitationStatus = 'active';
    user.mustChangePassword = false;
    await user.save();
  }

  if (!user.isActive) {
    throw new HttpError(403, 'User is inactive');
  }

  return {
    token: createAccessToken(user),
    user: await buildAuthUserResponse(user),
  };
}

export async function loginWithPassword(email: string, password: string) {
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !user.passwordHash) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new HttpError(403, 'User is inactive');
  }

  if (user.invitationStatus !== 'active') {
    user.invitationStatus = 'active';
    await user.save();
  }

  return {
    token: createAccessToken(user),
    user: await buildAuthUserResponse(user),
  };
}

export async function getCurrentUser(userId: number) {
  const user = await User.findByPk(userId);
  if (!user || !user.isActive) {
    throw new HttpError(404, 'User not found');
  }

  return buildAuthUserResponse(user);
}

export async function updateCredentials(
  userId: number,
  payload: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }
) {
  const user = await User.findByPk(userId);
  if (!user || !user.isActive) {
    throw new HttpError(404, 'User not found');
  }

  const isGoogleAccount = user.authProvider === 'google';

  if (isGoogleAccount) {
    if (payload.email || payload.newPassword || payload.currentPassword) {
      throw new HttpError(
        400,
        'Google accounts can only update the name'
      );
    }
    if (!payload.name) {
      throw new HttpError(400, 'Name is required');
    }
    user.name = payload.name;
    await user.save();
    return {
      token: createAccessToken(user),
      user: await buildAuthUserResponse(user),
    };
  }

  if (user.mustChangePassword && !payload.newPassword) {
    throw new HttpError(400, 'Debes definir una nueva contraseña');
  }

  if (payload.newPassword) {
    if (user.passwordHash && !user.mustChangePassword) {
      if (!payload.currentPassword) {
        throw new HttpError(400, 'Current password is required');
      }
      const passwordMatches = await bcrypt.compare(
        payload.currentPassword,
        user.passwordHash
      );
      if (!passwordMatches) {
        throw new HttpError(401, 'Current password is incorrect');
      }
    }
    user.passwordHash = await hashPassword(payload.newPassword);
    user.mustChangePassword = false;
  }

  if (payload.name) {
    user.name = payload.name;
  }

  if (payload.email && payload.email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({
      where: { email: payload.email.toLowerCase() },
    });
    if (existingUser && existingUser.id !== user.id) {
      throw new HttpError(409, 'Email is already in use');
    }
    user.email = payload.email.toLowerCase();
  }

  await user.save();

  return {
    token: createAccessToken(user),
    user: await buildAuthUserResponse(user),
  };
}

export async function recoverManagerPassword(email: string) {
  const genericResponse = {
    message:
      'Si el correo corresponde a un gestor, te enviaremos una contraseña temporal.',
  };

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user || !user.isActive) {
    return genericResponse;
  }

  const managerMembership = await AcopioManager.findOne({
    where: { idUser: user.id },
  });
  if (!managerMembership) {
    return genericResponse;
  }

  if (user.authProvider === 'google' && !user.passwordHash) {
    return genericResponse;
  }

  const temporaryPassword = generateTemporaryPassword();
  user.passwordHash = await hashPassword(temporaryPassword);
  user.authProvider = 'local';
  user.mustChangePassword = true;
  await user.save();

  await sendPasswordRecoveryEmail({
    toEmail: user.email,
    managerName: user.name,
    temporaryPassword,
  });

  return genericResponse;
}

export async function markWelcomeSeen(userId: number) {
  const user = await User.findByPk(userId);
  if (!user || !user.isActive) {
    throw new HttpError(404, 'User not found');
  }

  if (!user.hasSeenWelcome) {
    user.hasSeenWelcome = true;
    await user.save();
  }

  return buildAuthUserResponse(user);
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let temporaryPassword = '';
  for (let index = 0; index < 10; index += 1) {
    temporaryPassword += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return temporaryPassword;
}
