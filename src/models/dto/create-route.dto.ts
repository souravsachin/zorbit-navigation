import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsString()
  @IsNotEmpty()
  frontendPath!: string;

  @IsString()
  @IsNotEmpty()
  backendPath!: string;

  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  privilegeCode?: string;
}
