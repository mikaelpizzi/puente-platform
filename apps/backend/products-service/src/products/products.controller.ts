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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockOperationDto } from './dto/stock-operation.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Creates a new product.
   * @param createProductDto - The product creation payload.
   * @returns The created product.
   */
  @Post()
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
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Deletes a product.
   * @param id - The product ID.
   * @returns The deleted product.
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  /**
   * Reserves stock for items.
   * @param stockOperationDto - The items to reserve.
   * @returns Success message.
   */
  @Post('stock/reserve')
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
  async confirmStock(@Body() stockOperationDto: StockOperationDto) {
    await this.productsService.confirmStock(stockOperationDto.items);
    return { success: true, message: 'Stock confirmed' };
  }
}
