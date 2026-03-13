import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuAssemblyController } from '../controllers/menu-assembly.controller';
import { MenuAssemblyService } from '../services/menu-assembly.service';
import { HandlebarsTemplateService } from '../services/handlebars-template.service';
import { MenuItem } from '../models/entities/menu-item.entity';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
    TypeOrmModule.forFeature([MenuItem]),
  ],
  controllers: [MenuAssemblyController],
  providers: [MenuAssemblyService, HandlebarsTemplateService],
  exports: [MenuAssemblyService],
})
export class MenuAssemblyModule {}
