import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export type JwtPayload = {
  sub: string; // app_user.id
  role: 'admin' | 'teacher' | 'student';
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') || 'change_me',
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    // payload becomes req.user
    return {
      id: payload.sub,
      ...payload
    };
  }
}