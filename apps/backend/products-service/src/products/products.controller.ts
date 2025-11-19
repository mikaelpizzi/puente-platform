import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockOperationDto } from './dto/stock-operation.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('products')
@UseGuards(RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Creates a new product.
   * @param createProductDto - The product creation payload.
   * @returns The created product.
   */
  @Post()
  @Roles(Role.ADMIN, Role.SELLER)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * Retrieves all products.
   * @returns List of products.
   */
  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  /**
   * Retrieves a single product by ID.
   * @param id - The product ID.
   * @returns The product.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Updates a product.
   * @param id - The product ID.
   * @param updateProductDto - The update payload.
   * @returns The updated product.
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SELLER)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Deletes a product.
   * @param id - The product ID.
   * @returns The deleted product.
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.SELLER)
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  /**
   * Reserves stock for items.
   * @param stockOperationDto - The items to reserve.
   * @returns Success message.
   */
  @Post('stock/reserve')
  @Roles(Role.ADMIN, Role.SELLER, Role.BUYER) // Buyers might trigger reservation via order service?
  // Actually, usually the Order Service calls this, and Order Service has a role or system key.
  // For now, let's assume the Gateway forwards the user's role.
  // If a Buyer places an order, the request might come from them.
  async reserveStock(@Body() stockOperationDto: StockOperationDto) {
    await this.productsService.reserveStock(stockOperationDto.items);
    return { success: true, message: 'Stock reserved' };
  }

  /**
   * Releases reserved stock.
   * @param stockOperationDto - The items to release.
   * @returns Success message.
   */
  @Post('stock/release')
  @Roles(Role.ADMIN, Role.SELLER) // Usually system or admin/seller manual override
  async releaseStock(@Body() stockOperationDto: StockOperationDto) {
    await this.productsService.releaseStock(stockOperationDto.items);
    return { success: true, message: 'Stock released' };
  }

  /**
   * Confirms stock usage (finalizes sale).
   * @param stockOperationDto - The items to confirm.
   * @returns Success message.
   */
  @Post('stock/confirm')
  @Roles(Role.ADMIN, Role.SELLER)
  async confirmStock(@Body() stockOperationDto: StockOperationDto) {
    await this.productsService.confirmStock(stockOperationDto.items);
    return { success: true, message: 'Stock confirmed' };
  }
}
