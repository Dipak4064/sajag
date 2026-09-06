import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public init(httpServer: HttpServer, corsOrigin: string | string[] = '*') {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST', 'PATCH'],
        credentials: true
      }
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected to WebSocket: ${socket.id}`);

      // Client joins specific rooms (e.g. 'authority', 'citizens', 'disaster:id')
      socket.on('join:room', (room: string) => {
        socket.join(room);
        logger.debug(`Socket ${socket.id} joined room: ${room}`);
      });

      socket.on('leave:room', (room: string) => {
        socket.leave(room);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    logger.info('Socket.IO real-time server initialized.');
  }

  public emit<T>(event: string, payload: T, room?: string) {
    if (!this.io) {
      logger.warn(`Cannot emit '${event}': WebSocket server not initialized.`);
      return;
    }
    if (room) {
      this.io.to(room).emit(event, payload);
    } else {
      this.io.emit(event, payload);
    }
  }
}
