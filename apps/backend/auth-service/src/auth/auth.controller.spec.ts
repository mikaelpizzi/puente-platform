import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../generated/client/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
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
      const result = { accessToken: 'token' };
      mockAuthService.register.mockResolvedValue(result);

      expect(await controller.register(dto)).toEqual(result);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      const result = { accessToken: 'token' };
      mockAuthService.login.mockResolvedValue(result);

      expect(await controller.login(dto)).toEqual(result);
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });
});
