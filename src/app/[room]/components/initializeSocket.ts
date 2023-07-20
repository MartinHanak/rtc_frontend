import { Socket, io } from "socket.io-client";
import { BACKEND_URL } from "@/app/util/config";
import { ClientToServerEvents, ServerToClientEvents } from "@/app/types/types";
import { redirect } from "next/navigation";

export function initializeSocket(roomId: string) {
    const socket : Socket<ServerToClientEvents,ClientToServerEvents> = io(`http://${BACKEND_URL}`, {
        extraHeaders: {
            'room': `${roomId}`
        }
    });

    // events provided by socket.io
    socket.on('connect', () => {
        console.log('Connected to the server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from the server');
    });

    socket.on('connect_error', (error) => {
        console.log('Connection error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to the server. Attempt:', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
        console.log('Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
        console.log('Failed to reconnect to the server');
    });


    return socket
}