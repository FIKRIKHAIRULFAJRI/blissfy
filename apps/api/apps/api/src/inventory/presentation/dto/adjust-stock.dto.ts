import { IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({
    description: 'Stock adjustment delta (positive to add, negative to reduce)',
    example: 10,
  })
  @IsInt()
  adjustment: number;

  @ApiProperty({
    description: 'Reason for the stock adjustment',
    example: 'Restock from supplier',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  reason: string;
}
