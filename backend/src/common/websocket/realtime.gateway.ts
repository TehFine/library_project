import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
    namespace: '/events',
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
    },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server

    private connectedClients = new Map<string, Socket>()

    handleConnection(client: Socket) {
        this.connectedClients.set(client.id, client)
        console.log(`[WS] Client connected: ${client.id}`)
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id)
        console.log(`[WS] Client disconnected: ${client.id}`)
    }

    /** Emit an event to all connected librarian clients */
    emit(event: string, data?: any) {
        this.server.emit(event, data)
    }

    get connectedCount(): number {
        return this.connectedClients.size
    }
}
