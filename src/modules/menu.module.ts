import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from '../controllers/menu.controller';
import { MenuService } from '../services/menu.service';
import { HashIdService } from '../services/hash-id.service';
import { MenuItem } from '../models/entities/menu-item.entity';
import { EventsModule } from './events.module';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem]), EventsModule],
  controllers: [MenuController],
  providers: [MenuService, HashIdService],
  exports: [MenuService],
})
export class MenuModule {}
