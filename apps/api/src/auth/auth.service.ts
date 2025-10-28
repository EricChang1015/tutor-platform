import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { LoggerService } from '../common/logger.service';

@Injectable()
export class AuthService {
  private readonly logger = new LoggerService('AuthService');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    this.logger.debug(`Validating user: ${username}`);

    const user = await this.userRepository.findOne({
      where: { email: username, active: true },
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      this.logger.log(`User validated successfully: ${username}`);
      const { passwordHash, ...result } = user;
      return result;
    }

    this.logger.warn(`User validation failed: ${username}`);
    return null;
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt: ${loginDto.username}`);

    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      this.logger.warn(`Login failed - invalid credentials: ${loginDto.username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    this.logger.log(`Login successful: ${loginDto.username} (${user.role})`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refresh(refreshToken: string) {
    this.logger.debug('Token refresh attempt');

    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, active: true },
      });

      if (!user) {
        this.logger.warn(`Token refresh failed - user not found: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role
      };

      this.logger.log(`Token refreshed successfully: ${user.email}`);

      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    this.logger.debug(`Getting profile for user: ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'name', 'avatarUrl', 'bio', 'timezone', 'locale', 'settings'],
    });

    if (!user) {
      this.logger.warn(`Profile not found for user: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.log(`Profile retrieved successfully: ${user.email}`);
    return user;
  }
}
