import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteController } from '../controllers/route.controller';
import { RouteService } from '../services/route.service';
import { HashIdService } from '../services/hash-id.service';
import { Route } from '../models/entities/route.entity';
import { EventsModule } from './events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Route]), EventsModule],
  controllers: [RouteController],
  providers: [RouteService, HashIdService],
  exports: [RouteService],
})
export class RouteModule {}
