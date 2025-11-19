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

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('stock/reserve')
  @HttpCode(HttpStatus.OK)
  async reserveStock(@Body() stockOperationDto: StockOperationDto) {
    await this.productsService.reserveStock(stockOperationDto.items);
    return { success: true, message: 'Stock reserved' };
  }

  @Post('stock/release')
  @HttpCode(HttpStatus.OK)
  async releaseStock(@Body() stockOperationDto: StockOperationDto) {
    await this.productsService.releaseStock(stockOperationDto.items);
    return { success: true, message: 'Stock released' };
  }

  @Post('stock/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmStock(@Body() stockOperationDto: StockOperationDto) {
    await this.productsService.confirmStock(stockOperationDto.items);
    return { success: true, message: 'Stock confirmed' };
  }
}
