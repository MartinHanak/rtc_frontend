'use client'

import { Socket, io } from "socket.io-client";
import { BACKEND_URL } from "@/app/util/config";
import { useEffect } from "react";

interface Room {
    id: string
}


let socket: Socket;

export default function Room({ id }: Room) {

    useEffect(() => {

        initializeSocket()

        return () => {
            socket.disconnect()
        };
    }, [])

    function initializeSocket() {
        socket = io(`http://${BACKEND_URL}`);

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

    }

    return (
        <div>
            backend: {BACKEND_URL}
        </div>
    )
}