import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository, AuthRepository } from './auth.repository';
import { config } from '../../config/env.config';
import { AppError } from '../../shared/errors/app-error';

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: any;
    latitude: number;
    longitude: number;
    municipalityId?: string;
    status?: string;
  }) {
    const existingUser = await this.repo.findUserByEmail(data.email);
    if (existingUser) {
      throw AppError.badRequest('User with this email already exists');
    }

    let defaultMuni = data.municipalityId
      ? await this.repo.findMunicipalityById(data.municipalityId)
      : await this.repo.findDefaultMunicipality();
    if (!defaultMuni) {
      if (data.municipalityId) throw AppError.badRequest('Municipality not found');
      defaultMuni = await this.repo.createMunicipality({
        name: 'Default Municipality',
        nameNe: 'Default Municipality'
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.repo.createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      latitude: data.latitude,
      longitude: data.longitude,
      municipalityId: defaultMuni.id,
      status: data.status
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, municipalityId: user.municipalityId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.repo.findUserByEmail(data.email);
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, municipalityId: user.municipalityId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        latitude: user.latitude,
        longitude: user.longitude
      }
    };
  }
}

export const authService = new AuthService();
