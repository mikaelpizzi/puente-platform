import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LogisticsService } from './logistics.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UsePipes, ValidationPipe, Logger } from '@nestjs/common';

/**
 * Extended WebSocket Gateway for real-time logistics updates.
 *
 * Features:
 * - Room-based subscriptions (orders, couriers, users)
 * - Location updates in real-time
 * - Order status broadcasts
 * - Notification delivery
 * - Heartbeat/ping-pong for connection health
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 10000,
})
export class LogisticsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LogisticsGateway.name);

  constructor(private readonly logisticsService: LogisticsService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Set up heartbeat interval
    setInterval(() => {
      server.emit('heartbeat', { timestamp: Date.now() });
    }, 30000);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send connection confirmation
    client.emit('connected', {
      socketId: client.id,
      timestamp: Date.now(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ==========================================
  // Room Management
  // ==========================================

  /**
   * Join a specific order room to receive updates.
   */
  @SubscribeMessage('order:join')
  handleJoinOrder(@MessageBody() data: { orderId: string }, @ConnectedSocket() client: Socket) {
    const room = `order:${data.orderId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { event: 'order:joined', data: { orderId: data.orderId } };
  }

  /**
   * Leave a specific order room.
   */
  @SubscribeMessage('order:leave')
  handleLeaveOrder(@MessageBody() data: { orderId: string }, @ConnectedSocket() client: Socket) {
    const room = `order:${data.orderId}`;
    client.leave(room);
    this.logger.debug(`Client ${client.id} left ${room}`);
    return { event: 'order:left', data: { orderId: data.orderId } };
  }

  /**
   * Join user-specific room for notifications.
   */
  @SubscribeMessage('user:join')
  handleJoinUser(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    const room = `user:${data.userId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { event: 'user:joined', data: { userId: data.userId } };
  }

  /**
   * Join courier-specific room for tracking.
   */
  @SubscribeMessage('courier:join')
  handleJoinCourier(@MessageBody() data: { courierId: string }, @ConnectedSocket() client: Socket) {
    const room = `courier:${data.courierId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { event: 'courier:joined', data: { courierId: data.courierId } };
  }

  // ==========================================
  // Location Updates
  // ==========================================

  /**
   * Handle courier location updates.
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('location:update')
  async handleLocationUpdate(
    @MessageBody() data: UpdateLocationDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.logisticsService.updateDriverLocation(data.driverId, data.lat, data.lng, 'ws');

    // Broadcast to all clients watching this courier
    const courierRoom = `courier:${data.driverId}`;
    this.server.to(courierRoom).emit('location:updated', {
      courierId: data.driverId,
      lat: data.lat,
      lng: data.lng,
      timestamp: Date.now(),
    });

    return { event: 'location:ack', data: { success: true } };
  }

  /**
   * Legacy handler for backward compatibility.
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @MessageBody() data: UpdateLocationDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.handleLocationUpdate(data, client);
  }

  // ==========================================
  // Server-Side Broadcast Methods
  // ==========================================

  /**
   * Broadcast order status change to all subscribers.
   */
  broadcastOrderStatus(orderId: string, status: string, data?: Record<string, unknown>) {
    const room = `order:${orderId}`;
    this.server.to(room).emit('order:status', {
      orderId,
      status,
      ...data,
      timestamp: Date.now(),
    });
    this.logger.debug(`Broadcasted order:status to ${room}: ${status}`);
  }

  /**
   * Send new message notification to order participants.
   */
  broadcastNewMessage(
    orderId: string,
    message: { senderId: string; content: string; messageId: string },
  ) {
    const room = `order:${orderId}`;
    this.server.to(room).emit('message:new', {
      orderId,
      ...message,
      timestamp: Date.now(),
    });
    this.logger.debug(`Broadcasted message:new to ${room}`);
  }

  /**
   * Send notification to a specific user.
   */
  sendNotification(
    userId: string,
    notification: { type: string; title: string; message: string; data?: Record<string, unknown> },
  ) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification:new', {
      ...notification,
      timestamp: Date.now(),
    });
    this.logger.debug(`Sent notification to ${room}: ${notification.type}`);
  }

  /**
   * Broadcast courier location to order watchers.
   */
  broadcastCourierLocation(orderId: string, courierId: string, lat: number, lng: number) {
    const orderRoom = `order:${orderId}`;
    this.server.to(orderRoom).emit('location:updated', {
      orderId,
      courierId,
      lat,
      lng,
      timestamp: Date.now(),
    });
  }

  // ==========================================
  // Heartbeat / Health
  // ==========================================

  /**
   * Client heartbeat response.
   */
  @SubscribeMessage('pong')
  handlePong(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Pong received from ${client.id}`);
  }
}
