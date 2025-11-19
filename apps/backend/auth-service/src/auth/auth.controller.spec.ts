import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../generated/client/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshTokens: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user', async () => {
      const dto = { email: 'test@test.com', password: 'password', role: Role.BUYER };
      const result = { accessToken: 'token', refreshToken: 'rt' };
      mockAuthService.register.mockResolvedValue(result);

      expect(await controller.register(dto)).toEqual(result);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      const result = { accessToken: 'token', refreshToken: 'rt' };
      mockAuthService.login.mockResolvedValue(result);

      expect(await controller.login(dto)).toEqual(result);
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      const req = { user: { userId: '1' } };
      mockAuthService.logout.mockResolvedValue(undefined);
      await controller.logout(req as any);
      expect(service.logout).toHaveBeenCalledWith('1');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens', async () => {
      const req = { user: { sub: '1', refreshToken: 'rt' } };
      const result = { accessToken: 'token', refreshToken: 'rt' };
      mockAuthService.refreshTokens.mockResolvedValue(result);
      expect(await controller.refreshTokens(req as any)).toEqual(result);
      expect(service.refreshTokens).toHaveBeenCalledWith('1', 'rt');
    });
  });
});
