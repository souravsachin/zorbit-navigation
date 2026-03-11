import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../middleware/jwt.strategy';

/**
 * Auth module for JWT validation.
 * This service validates JWTs issued by zorbit-identity.
 * It does not issue tokens — only validates them.
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
