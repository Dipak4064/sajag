import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { authLoginSchema, authRegisterSchema } from '@sajag/validation';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const data = authRegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const defaultMuni = await prisma.municipality.findFirst();
    if (!defaultMuni) {
      return res.status(500).json({ success: false, message: 'No municipality configured' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
        latitude: data.latitude,
        longitude: data.longitude,
        municipalityId: defaultMuni.id
      }
    });

    const secret = process.env.JWT_SECRET || 'sajag_jwt_secret_dev_2026';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, municipalityId: user.municipalityId },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const data = authLoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'sajag_jwt_secret_dev_2026';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, municipalityId: user.municipalityId },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
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
      }
    });
  } catch (err) {
    next(err);
  }
});
