import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Role } from '@prisma/auth-client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('argon2');

const mockUsersService = {
  user: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
};

const mockJwtService = {
  signAsync: vi.fn(),
};

const mockConfigService = {
  get: vi.fn((key: string) => {
    if (key === 'JWT_SECRET') return 'secret';
    if (key === 'JWT_REFRESH_SECRET') return 'refreshSecret';
    return null;
  }),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = { email: 'test@test.com', password: 'password', role: Role.BUYER };
      const hashedPassword = 'hashedPassword';
      const user = {
        id: '1',
        ...dto,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const token = 'token';

      mockUsersService.user.mockResolvedValue(null);
      (argon2.hash as any).mockResolvedValue(hashedPassword);
      mockUsersService.createUser.mockResolvedValue(user);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.register(dto);

      expect(result).toEqual({ accessToken: token, refreshToken: token });
      expect(usersService.user).toHaveBeenCalledWith({ email: dto.email });
      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(usersService.createUser).toHaveBeenCalledWith({
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      });
      expect(usersService.updateUser).toHaveBeenCalled();
    });

    it('should throw ConflictException if user exists', async () => {
      const dto = { email: 'test@test.com', password: 'password', role: Role.BUYER };
      mockUsersService.user.mockResolvedValue({ id: '1' });

      await expect(service.register(dto)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      const user = { id: '1', email: dto.email, password: 'hashedPassword', role: Role.BUYER };
      const token = 'token';

      mockUsersService.user.mockResolvedValue(user);
      (argon2.verify as any).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.login(dto);

      expect(result).toEqual({ accessToken: token, refreshToken: token });
      expect(usersService.user).toHaveBeenCalledWith({ email: dto.email });
      expect(argon2.verify).toHaveBeenCalledWith(user.password, dto.password);
      expect(usersService.updateUser).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      mockUsersService.user.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      const user = { id: '1', email: dto.email, password: 'hashedPassword', role: Role.BUYER };
      mockUsersService.user.mockResolvedValue(user);
      (argon2.verify as any).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens', async () => {
      const userId = '1';
      const refreshToken = 'rt';
      const user = {
        id: userId,
        email: 'test@test.com',
        role: Role.BUYER,
        hashedRefreshToken: 'hrt',
      };
      const token = 'token';

      mockUsersService.user.mockResolvedValue(user);
      (argon2.verify as any).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.refreshTokens(userId, refreshToken);

      expect(result).toEqual({ accessToken: token, refreshToken: token });
      expect(usersService.updateUser).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user not found or no rt', async () => {
      mockUsersService.user.mockResolvedValue(null);
      await expect(service.refreshTokens('1', 'rt')).rejects.toThrow('Access Denied');
    });
  });
});
