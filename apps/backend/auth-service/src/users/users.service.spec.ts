import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a user', async () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      password: 'hash',
      role: 'BUYER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrismaService.user.findUnique.mockResolvedValue(user);

    const result = await service.user({ id: '1' });
    expect(result).toEqual(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should create a user', async () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      password: 'hash',
      role: 'BUYER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrismaService.user.create.mockResolvedValue(user);

    const result = await service.createUser({ email: 'test@test.com', password: 'hash' });
    expect(result).toEqual(user);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'test@test.com', password: 'hash' },
    });
  });
});
