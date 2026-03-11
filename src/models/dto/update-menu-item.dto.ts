import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';

export class UpdateMenuItemDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  route?: string;

  @IsString()
  @IsOptional()
  parentHashId?: string;

  @IsString()
  @IsOptional()
  privilegeCode?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  section?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
