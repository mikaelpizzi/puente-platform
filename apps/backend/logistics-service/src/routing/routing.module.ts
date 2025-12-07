import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OsrmService } from './osrm.service';

@Module({
  imports: [ConfigModule],
  providers: [OsrmService],
  exports: [OsrmService],
})
export class RoutingModule {}
