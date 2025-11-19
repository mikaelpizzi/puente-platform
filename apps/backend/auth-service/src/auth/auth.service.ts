import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../generated/client/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Registers a new user and generates initial authentication tokens.
   * @param registerDto - The registration data including email, password, and role.
   * @returns An object containing the access and refresh tokens.
   * @throws ConflictException - If a user with the provided email already exists.
   */
  async register(registerDto: RegisterDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, role } = registerDto;

    const existingUser = await this.usersService.user({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(password);

    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
      role,
    });

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  /**
   * Authenticates a user and generates tokens.
   * @param loginDto - The login credentials (email and password).
   * @returns An object containing the access and refresh tokens.
   * @throws UnauthorizedException - If the credentials are invalid.
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;
    const user = await this.usersService.user({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  /**
   * Logs out a user by invalidating their refresh token.
   * @param userId - The ID of the user to logout.
   * @returns void
   */
  async logout(userId: string) {
    await this.usersService.updateUser({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * @param userId - The ID of the user requesting the refresh.
   * @param refreshToken - The refresh token provided by the client.
   * @returns An object containing the new access and refresh tokens.
   * @throws ForbiddenException - If the user is not found or the refresh token is invalid.
   */
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.user({ id: userId });
    if (!user || !user.hashedRefreshToken) throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await argon2.verify(user.hashedRefreshToken, refreshToken);
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  /**
   * Updates the user's hashed refresh token in the database.
   * @param userId - The ID of the user.
   * @param refreshToken - The new refresh token to hash and store.
   * @returns void
   */
  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.updateUser({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  /**
   * Generates access and refresh tokens for a user.
   * @param user - The user entity.
   * @returns An object containing the signed access and refresh tokens.
   */
  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Stub methods for recovery/verification
  /**
   * Initiates the password recovery process (Stub).
   * @param email - The email address of the user.
   * @returns A message indicating the process status.
   */
  async forgotPassword(email: string) {
    const user = await this.usersService.user({ email });
    if (!user) return { message: 'If user exists, email sent' };

    const resetToken = Math.random().toString(36).substring(2, 15);

    await this.usersService.updateUser({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    console.log(`[STUB] Password reset token for ${email}: ${resetToken}`);
    return { message: 'If user exists, email sent' };
  }

  /**
   * Resets the user's password using a valid token (Stub).
   * @param email - The email address of the user.
   * @param token - The password reset token.
   * @param newPassword - The new password to set.
   * @returns A message indicating success.
   * @throws BadRequestException - If the token is invalid or expired.
   */
  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.usersService.user({ email });
    if (
      !user ||
      user.passwordResetToken !== token ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await argon2.hash(newPassword);
    await this.usersService.updateUser({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successful' };
  }

  /**
   * Verifies the user's email address (Stub).
   * @param email - The email address to verify.
   * @returns A message indicating success.
   */
  async verifyEmail(email: string) {
    const user = await this.usersService.user({ email });
    if (user) {
      await this.usersService.updateUser({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    }
    return { message: 'Email verified (stub)' };
  }
}
