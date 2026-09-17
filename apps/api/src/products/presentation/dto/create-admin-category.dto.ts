import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateAdminCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  description?: string;

  @IsBoolean()
  isActive!: boolean;
}
