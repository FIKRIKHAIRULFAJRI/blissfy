import {
  Controller,
  Param,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from '../application/inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';

class StockAdjustmentResponseDto {
  variantId: string;
  previousStock: number;
  newStock: number;
  adjustment: number;
  reason: string;
}

@ApiTags('inventory')
@Controller('v1/admin/inventory')
export class AdminInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Patch(':variantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust variant stock manually' })
  @ApiResponse({
    status: 200,
    description: 'Stock adjusted successfully',
    type: StockAdjustmentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Variant not found',
  })
  async adjustStock(
    @Param('variantId') variantId: string,
    @Body() dto: AdjustStockDto,
  ): Promise<StockAdjustmentResponseDto> {
    // TODO: Add admin authentication guard
    // @UseGuards(AdminSessionGuard)

    const result = await this.inventoryService.adjustStock(
      variantId,
      dto.adjustment,
      dto.reason,
    );

    if (!result) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    return {
      variantId: result.variantId,
      previousStock: result.previousStock,
      newStock: result.newStock,
      adjustment: dto.adjustment,
      reason: dto.reason,
    };
  }
}
