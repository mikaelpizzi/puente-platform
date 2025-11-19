import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '../generated/client/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves a single user based on unique input criteria.
   * @param userWhereUniqueInput - The unique criteria to identify the user (e.g., id or email).
   * @returns The User entity if found, or null.
   */
  async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  /**
   * Creates a new user in the database.
   * @param data - The user creation payload including email, password, and role.
   * @returns The created User entity.
   * @throws PrismaClientKnownRequestError - If the email address is already in use.
   */
  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  /**
   * Updates an existing user's information.
   * @param params - An object containing the unique identifier (where) and the data to update (data).
   * @returns The updated User entity.
   * @throws PrismaClientKnownRequestError - If the user does not exist or the update violates constraints.
   */
  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }
}
