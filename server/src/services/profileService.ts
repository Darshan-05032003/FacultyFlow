import { prisma } from '../utils/prisma';
import { AppError } from '../errors/AppError';

export class ProfileService {
  static async getMyProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        facultyProfile: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        }
      }
    });

    if (!user) throw new AppError('Profile not found', 404);

    return user;
  }

  static async updateMyProfile(userId: string, data: any) {
    const { name, designation, phone, officeLocation, bio } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { facultyProfile: true }
    });

    if (!user) throw new AppError('Profile not found', 404);

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        }
      }),
      prisma.facultyProfile.upsert({
        where: { userId },
        create: {
          userId,
          firstName: name?.split(' ')[0] || user.name?.split(' ')[0] || '',
          lastName: name?.split(' ').slice(1).join(' ') || user.name?.split(' ').slice(1).join(' ') || '',
          designation,
          phone,
          officeLocation,
          bio,
        },
        update: {
          ...(name !== undefined && {
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
          }),
          ...(designation !== undefined && { designation }),
          ...(phone !== undefined && { phone }),
          ...(officeLocation !== undefined && { officeLocation }),
          ...(bio !== undefined && { bio }),
        },
        include: {
          department: {
            select: { id: true, name: true, code: true }
          }
        }
      })
    ]);

    const updatedFacultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId },
      include: { department: { select: { id: true, name: true, code: true } } }
    });

    return { ...updatedUser, facultyProfile: updatedFacultyProfile };
  }

  static async getMyDepartment(userId: string) {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId },
      include: {
        department: {
          include: {
            hod: {
              include: { user: { select: { name: true, email: true } } }
            }
          }
        }
      }
    });

    if (!faculty?.department) {
      throw new AppError('Department not found or not assigned', 404);
    }

    return faculty.department;
  }
}
