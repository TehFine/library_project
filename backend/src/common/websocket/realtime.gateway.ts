import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

const wsCorsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000']

@WebSocketGateway({
    namespace: '/events',
    cors: {
        origin: wsCorsOrigins,
        credentials: true,
    },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server

    private connectedClients = new Map<string, Socket>()

    handleConnection(client: Socket) {
        this.connectedClients.set(client.id, client)

        // Lắng nghe sự kiện 'auth' từ client để join room userId
        const userId = client.handshake.query?.userId as string | undefined
        if (userId) {
            client.join(`user:${userId}`)
            console.log(`[WS] Client ${client.id} joined room user:${userId}`)
        }

        client.on('auth', (data: { userId?: string }) => {
            if (data?.userId) {
                client.join(`user:${data.userId}`)
                console.log(`[WS] Client ${client.id} joined room user:${data.userId}`)
            }
        })

        console.log(`[WS] Client connected: ${client.id}`)
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id)
        console.log(`[WS] Client disconnected: ${client.id}`)
    }

    /** Emit an event to all connected clients */
    emit(event: string, data?: any) {
        this.server.emit(event, data)
    }

    /** Emit an event to a specific user by userId */
    emitToUser(userId: string, event: string, data?: any) {
        this.server.to(`user:${userId}`).emit(event, data)
    }

    get connectedCount(): number {
        return this.connectedClients.size
    }
}
