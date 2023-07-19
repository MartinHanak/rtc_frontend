'use client'

import { Socket, io } from "socket.io-client";
import { BACKEND_URL } from "@/app/util/config";
import { useEffect, useRef } from "react";

interface Room {
    id: string
}


let socket: Socket;

export default function Room({ id }: Room) {

    const localVideo = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {

        initializeSocket()

        return () => {
            socket.disconnect()
        };
    }, [])

    useEffect(() => {

        (async () => {
            try {
                let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                if (localVideo.current) {
                    localVideo.current.srcObject = stream;
                } else {
                    throw new Error('No video element')
                }

            } catch (error) {
                console.log(error);
            }
        })();


    }, [])

    function initializeSocket() {
        socket = io(`http://${BACKEND_URL}`, {
            extraHeaders: {
                'room': `${id}`
            }
        });

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

            <video ref={localVideo} autoPlay muted />
        </div>
    )
}