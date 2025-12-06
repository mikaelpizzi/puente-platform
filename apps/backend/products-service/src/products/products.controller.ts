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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockOperationDto } from './dto/stock-operation.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('products')
@UseGuards(ServiceAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
      // Fallback for local testing if header is missing and not in body
      // In production, Gateway ensures header is present for auth'd routes
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }

    // Enforce sellerId from token if present, otherwise trust body (only for internal/admin?)
    // For now, prefer header.
    const finalSellerId = userId || createProductDto.sellerId;

    console.log('Creating product with data:', JSON.stringify(createProductDto, null, 2));

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
    // Handle tags being a single string or array
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

  /**
   * Generates a signature for client-side upload (Cloudinary/Firebase).
   * Mocked for now if no env vars are present.
   */
  @Post('upload-signature')
  @Roles(Role.ADMIN, Role.SELLER)
  getUploadSignature() {
    // In a real implementation, we would use CLOUDINARY_API_SECRET to sign params.
    // For now, we return a mock signature or a direct upload URL if using a different provider.
    // If using Cloudinary unsigned uploads for dev, we might not even need this,
    // but it's good practice to have the endpoint ready.
    return {
      signature: 'mock_signature_' + Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
      apiKey: process.env.CLOUDINARY_API_KEY || '123456789',
    };
  }
}
