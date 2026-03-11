import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth.module';
import { MenuModule } from './modules/menu.module';
import { RouteModule } from './modules/route.module';
import { NavigationResolverModule } from './modules/navigation-resolver.module';
import { EventsModule } from './modules/events.module';
import { MenuItem } from './models/entities/menu-item.entity';
import { Route } from './models/entities/route.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5433),
        database: config.get<string>('DATABASE_NAME', 'zorbit_navigation'),
        username: config.get<string>('DATABASE_USER', 'zorbit'),
        password: config.get<string>('DATABASE_PASSWORD', 'zorbit_dev'),
        entities: [MenuItem, Route],
        synchronize: config.get<string>('DATABASE_SYNCHRONIZE', 'false') === 'true',
        logging: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    MenuModule,
    RouteModule,
    NavigationResolverModule,
    EventsModule,
  ],
})
export class AppModule {}
