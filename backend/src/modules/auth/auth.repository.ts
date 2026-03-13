import { prisma } from '../../lib/prisma';

export const authRepository = {
  findUserByEmail: async (email: string) => {
    return prisma.user.findUnique({ where: { email } });
  },

  findUserById: async (id: string) => {
    return prisma.user.findUnique({ where: { id } });
  },
};
