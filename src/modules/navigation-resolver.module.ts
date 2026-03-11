import { Module } from '@nestjs/common';
import { NavigationResolverController } from '../controllers/navigation-resolver.controller';
import { NavigationResolverService } from '../services/navigation-resolver.service';
import { MenuModule } from './menu.module';

@Module({
  imports: [MenuModule],
  controllers: [NavigationResolverController],
  providers: [NavigationResolverService],
})
export class NavigationResolverModule {}
