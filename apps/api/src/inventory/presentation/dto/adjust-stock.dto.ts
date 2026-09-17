import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, NotEquals } from 'class-validator';

export class AdjustStockDto {
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  adjustment!: number;

  @IsString()
  @MaxLength(500)
  reason!: string;
}
