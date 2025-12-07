import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { SavedAddress, SavedAddressSchema } from './schemas/saved-address.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SavedAddress.name, schema: SavedAddressSchema }])],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
