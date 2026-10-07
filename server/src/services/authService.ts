import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AppError } from '../errors/AppError';
import { generateToken } from '../utils/jwt';
import { Role } from '@prisma/client';

export class AuthService {
  static async register(data: any) {
    const { name, email, password, role, departmentId } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    if (departmentId) {
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department) throw new AppError('Department not found', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || Role.FACULTY,
        facultyProfile: {
          create: {
            firstName: name?.split(' ')[0] || '',
            lastName: name?.split(' ').slice(1).join(' ') || '',
            departmentId,
          }
        }
      },
      include: {
        facultyProfile: {
          include: { department: true }
        }
      }
    });

    const token = generateToken({ id: user.id, role: user.role });

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      facultyProfile: user.facultyProfile,
    };

    return { user: userWithoutPassword, token };
  }

  static async login(data: any) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        facultyProfile: {
          include: { department: true }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({ id: user.id, role: user.role });

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      facultyProfile: user.facultyProfile,
    };

    return { user: userWithoutPassword, token };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        facultyProfile: {
          include: { department: true }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 404);
    }

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      facultyProfile: user.facultyProfile,
    };

    return userWithoutPassword;
  }
}
