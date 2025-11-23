import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type JwtUserPayload = {
  userId?: string;
  sub?: string;
  refreshToken?: string;
};

type RequestWithUser = Request & { user?: JwtUserPayload };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user.
   * @param registerDto - The registration payload.
   * @returns The access and refresh tokens.
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Authenticates a user.
   * @param loginDto - The login payload.
   * @returns The access and refresh tokens.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Logs out the current user.
   * @param req - The request object containing the user ID.
   * @returns void
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: RequestWithUser) {
    const userId = req.user?.userId ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user context missing user id');
    }

    return this.authService.logout(userId);
  }

  /**
   * Refreshes the access token.
   * @param req - The request object containing the user ID and refresh token.
   * @returns New access and refresh tokens.
   */
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: RequestWithUser) {
    const userId = req.user?.userId ?? req.user?.sub;
    const refreshToken = req.user?.refreshToken;

    if (!userId || !refreshToken) {
      throw new UnauthorizedException('Missing credentials to refresh the session');
    }

    return this.authService.refreshTokens(userId, refreshToken);
  }

  /**
   * Initiates password recovery.
   * @param email - The user's email.
   * @returns Status message.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  /**
   * Resets the password.
   * @param body - Object containing email, token, and newPassword.
   * @returns Status message.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body.email, body.token, body.newPassword);
  }

  /**
   * Verifies the email address.
   * @param email - The email to verify.
   * @returns Status message.
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('email') email: string) {
    return this.authService.verifyEmail(email);
  }
}
