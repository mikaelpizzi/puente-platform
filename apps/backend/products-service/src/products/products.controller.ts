import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Headers,
  UnauthorizedException,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockOperationDto } from './dto/stock-operation.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CloudinaryService, MulterFile } from '../cloudinary/cloudinary.service';

@Controller('products')
@UseGuards(ServiceAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Creates a new product.
   * @param createProductDto - The product creation payload.
   * @param userId - The user ID from the gateway header.
   * @returns The created product.
   */
  @Post()
  @Roles(Role.ADMIN, Role.SELLER)
  async create(@Body() createProductDto: CreateProductDto, @Headers('x-user-id') userId: string) {
    if (!userId && !createProductDto.sellerId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }

    const finalSellerId = userId || createProductDto.sellerId;

    return this.productsService.create({
      ...createProductDto,
      sellerId: finalSellerId!,
    });
  }

  /**
   * Retrieves all products.
   * @returns List of products.
   */
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('tags') tags?: string | string[],
    @Query('vertical') vertical?: string,
  ) {
    const tagList = tags ? (Array.isArray(tags) ? tags : [tags]) : undefined;

    return this.productsService.findAll({
      search,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      tags: tagList,
      vertical,
    });
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
  @Roles(Role.ADMIN, Role.SELLER, Role.BUYER)
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
  @Roles(Role.ADMIN, Role.SELLER)
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

  /**
   * Uploads an image to Cloudinary.
   */
  @Post('upload')
  @Roles(Role.ADMIN, Role.SELLER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new Error('No file provided');
    }
    return this.cloudinaryService.uploadImage(file);
  }
}
