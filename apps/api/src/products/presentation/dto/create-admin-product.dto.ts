import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class InitialVariantDto {
  @IsString() @MinLength(3) @MaxLength(80) @Transform(trim) sku!: string;
  @IsString() @MinLength(2) @Transform(trim) colorName!: string;
  @IsOptional() @IsString() @Matches(/^#[0-9A-Fa-f]{6}$/) colorHex?: string;
  @IsString() @MinLength(1) @MaxLength(20) @Transform(trim) size!: string;
  @Type(() => Number) @IsInt() @Min(1) weightGram!: number;
  @Type(() => Number) @IsInt() @Min(0) stock!: number;
  @IsBoolean() isActive!: boolean;
}

export class InitialDiscountDto {
  @IsString() @Matches(/^(PERCENTAGE|FIXED_AMOUNT)$/) type!: 'PERCENTAGE' | 'FIXED_AMOUNT';
  @Type(() => Number) @IsInt() @Min(1) value!: number;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsBoolean() isActive!: boolean;
}

export class CreateAdminProductDto {
  @IsString()
  categoryId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(trim)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Transform(trim)
  slug!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  @Transform(trim)
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  normalPrice!: number;

  @IsBoolean()
  isActive!: boolean;

  @IsOptional() @ValidateNested() @Type(() => InitialVariantDto)
  initialVariant?: InitialVariantDto;

  @IsOptional() @ValidateNested() @Type(() => InitialDiscountDto)
  initialDiscount?: InitialDiscountDto;
}
