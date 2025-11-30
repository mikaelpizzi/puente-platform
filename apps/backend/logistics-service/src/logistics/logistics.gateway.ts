import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { LogisticsService } from './logistics.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class LogisticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly logisticsService: LogisticsService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @MessageBody() data: UpdateLocationDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.logisticsService.updateDriverLocation(data.driverId, data.lat, data.lng, 'ws');
    return { event: 'locationUpdated', data: { success: true } };
  }
}
