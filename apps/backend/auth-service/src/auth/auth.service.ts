import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/auth-client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  /**
   * Registers a new user and generates initial authentication tokens.
   * Sends a welcome email to the user.
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

    // Send welcome email (async, don't block registration)
    this.emailService.sendWelcome(email, email.split('@')[0]).catch((err) => {
      this.logger.warn(`Failed to send welcome email to ${email}: ${err.message}`);
    });

    return tokens;
  }

  /**
   * Authenticates a user and generates tokens.
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
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateUser({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }

  /**
   * Refreshes the access token using a valid refresh token.
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
   */
  async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.updateUser({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  /**
   * Generates access and refresh tokens for a user.
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

    return { accessToken, refreshToken };
  }

  /**
   * Initiates the password recovery process.
   * Generates a secure token and sends a password reset email.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.user({ email });

    // Always return the same message to prevent email enumeration
    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return { message: 'If user exists, email sent' };
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await this.usersService.updateUser({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // Send password reset email
    const emailResult = await this.emailService.sendPasswordReset(email, resetToken);

    if (emailResult.success) {
      this.logger.log(`Password reset email sent to ${email}`);
    } else {
      this.logger.error(`Failed to send password reset email to ${email}: ${emailResult.error}`);
    }

    return { message: 'If user exists, email sent' };
  }

  /**
   * Resets the user's password using a valid token.
   */
  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.user({ email });

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    if (
      !user ||
      user.passwordResetToken !== hashedToken ||
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

    this.logger.log(`Password reset successful for ${email}`);
    return { message: 'Password reset successful' };
  }

  /**
   * Sends an email verification link to the user.
   */
  async sendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.usersService.user({ email });

    if (!user) {
      return { message: 'If user exists, verification email sent' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email already verified' };
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await this.usersService.updateUser({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedToken,
      },
    });

    const emailResult = await this.emailService.sendVerification(email, verificationToken);

    if (emailResult.success) {
      this.logger.log(`Verification email sent to ${email}`);
    }

    return { message: 'If user exists, verification email sent' };
  }

  /**
   * Verifies the user's email address using a valid token.
   */
  async verifyEmail(email: string, token: string): Promise<{ message: string }> {
    const user = await this.usersService.user({ email });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    if (!user || user.emailVerificationToken !== hashedToken) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.usersService.updateUser({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });

    this.logger.log(`Email verified for ${email}`);
    return { message: 'Email verified successfully' };
  }
}
