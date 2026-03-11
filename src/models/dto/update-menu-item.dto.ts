import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ description: 'Menu item label', example: 'Settings' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ description: 'Icon name or class', example: 'settings' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Frontend route path', example: '/settings' })
  @IsString()
  @IsOptional()
  route?: string;

  @ApiPropertyOptional({ description: 'Parent menu item hashId for nested menus', example: 'NAV-92AF' })
  @IsString()
  @IsOptional()
  parentHashId?: string;

  @ApiPropertyOptional({ description: 'Required privilege code to see this item', example: 'settings.view' })
  @IsString()
  @IsOptional()
  privilegeCode?: string;

  @ApiPropertyOptional({ description: 'Sort order (lower = first)', example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Menu section grouping', example: 'admin' })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiPropertyOptional({ description: 'Whether the menu item is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
