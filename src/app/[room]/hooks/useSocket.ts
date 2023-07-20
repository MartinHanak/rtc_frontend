'use client'
import { Socket, io } from "socket.io-client";
import { BACKEND_URL } from "@/app/util/config";
import { useEffect, useState } from "react";

const { RTCPeerConnection, RTCSessionDescription } = window;


let socket: Socket;
const peerConnection = new RTCPeerConnection();
let isAlreadyCalling = false;



export function useSocket(roomId: string, stream: MediaStream | null) {

    const [users, setUsers] = useState<string[]>([])
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

    useEffect(() => {

        if(stream) {
            stream.getTracks()
            .forEach((track) => peerConnection.addTrack(track, stream))
        }

    },[stream])

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

        newSocket.on("call-made", async (data) => {
            console.log(`call made`)
            console.log(data)

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(data.offer)
            );

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

            newSocket.emit("make-answer", {
                answer,
                to: data.socket
            });

        })

        newSocket.on("answer-made", async (data) => {
            console.log(`answer made`)
            console.log(data)

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(data.answer)
            );

            if(!isAlreadyCalling) {
                callUser(data.socket);
                isAlreadyCalling = true;
            }
        });

        newSocket.on("call-rejected", data => {
            console.log(`call rejected`)

            console.log(`User: "Socket: ${data.socket}" rejected your call.`);
        });


        socket = newSocket;
    }

    async function callUser(socketId: string) {
        console.log(`calling user with socketId: ${socketId}`)

        const offer = await peerConnection.createOffer();

        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    
        socket.emit("call-user", {
            offer,
            to: socketId
        });
    }

    peerConnection.ontrack = ({streams: [stream]}) => {
        console.log(`adding track to peerConnection`)
        setRemoteStream(stream)
    }

    return {socket, users, callUser, remoteStream};
}






