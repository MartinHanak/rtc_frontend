import React, { MutableRefObject, createContext, useContext, useEffect, useRef, useState } from "react";
import { initializeSocket } from "./initializeSocket";
import { Socket } from "socket.io-client";

interface ContextValue {
    socketRef: MutableRefObject<Socket | null>
    ready: boolean
}

const SocketContext = createContext<ContextValue | null>(null);

interface Context {
    children: React.ReactNode,
    roomId: string
}

export function SocketContextProvider({ children, roomId }: Context) {

    // reference for socket connection for given room
    const socketRef = useRef<Socket | null>(null);
    const [ready, setReady] = useState(false);


    // cleanup socket on dismount 
    // make sure there is only one active socket
    // even with double render React.StrictMode
    useEffect(() => {

        socketRef.current = initializeSocket(roomId)

        socketRef.current.on('connect', () => {
            setReady(true);
        })

        return () => {
            socketRef.current?.disconnect();
        }
    }, [roomId]);

    return (
        <SocketContext.Provider value={{ socketRef, ready }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocketContext = () => useContext(SocketContext);
