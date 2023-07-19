import { Socket, io } from "socket.io-client";
import { BACKEND_URL } from "@/app/util/config";
import { useEffect, useState } from "react";

const { RTCPeerConnection, RTCSessionDescription } = window;


let socket: Socket;

export function useSocket(roomId: string) {

    const [users, setUsers] = useState<string[]>([])

    useEffect(() => {
        initializeSocket(roomId);

        return () => {
            socket.disconnect();
        }
    },[roomId])

    function initializeSocket(roomId: string) {
        const newSocket = io(`http://${BACKEND_URL}`, {
            extraHeaders: {
                'room': `${roomId}`
            }
        });

        newSocket.on('connect', () => {
            console.log('Connected to the server');
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from the server');
        });

        newSocket.on('connect_error', (error) => {
            console.log('Connection error:', error);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected to the server. Attempt:', attemptNumber);
        });

        newSocket.on('reconnect_error', (error) => {
            console.log('Reconnection error:', error);
        });

        newSocket.on('reconnect_failed', () => {
            console.log('Failed to reconnect to the server');
        });

        newSocket.on('update-user-list', (args) => {
            console.log('Updating user list')
            console.log(args.users)
            setUsers(args.users)
        })

        socket = newSocket;
    }

    return {socket, users};
}


async function callUser(socketId: string) {

    const peerConnection = new RTCPeerConnection();

    const offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
 
    socket.emit("call-user", {
        offer,
        to: socketId
    });
}



