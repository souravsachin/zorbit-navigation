import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemDto {
  @ApiProperty({ description: 'Menu item label', example: 'Dashboard' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiPropertyOptional({ description: 'Icon name or class', example: 'dashboard' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Frontend route path', example: '/dashboard' })
  @IsString()
  @IsOptional()
  route?: string;

  /** hashId of the parent menu item (for nested menus) */
  @ApiPropertyOptional({ description: 'Parent menu item hashId for nested menus', example: 'NAV-92AF' })
  @IsString()
  @IsOptional()
  parentHashId?: string;

  @ApiPropertyOptional({ description: 'Required privilege code to see this item', example: 'dashboard.view' })
  @IsString()
  @IsOptional()
  privilegeCode?: string;

  @ApiPropertyOptional({ description: 'Sort order (lower = first)', example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Menu section grouping', example: 'main' })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiPropertyOptional({ description: 'Whether the menu item is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
