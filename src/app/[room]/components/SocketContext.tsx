import React, { MutableRefObject, createContext, useContext, useEffect, useRef, useState } from "react";
import { initializeSocket } from "./initializeSocket";
import { Socket } from "socket.io-client";

const SocketContext = createContext<MutableRefObject<Socket | null> | null>(null);

interface Context {
    children: React.ReactNode,
    roomId: string
}

export function SocketContextProvider({ children, roomId }: Context) {

    // initializes socket connection for given room
    //const socketRef = useRef(initializeSocket(roomId));
    const socketRef = useRef<Socket | null>(null)


    // cleanup socket on dismount 
    // make sure there is only one active socket
    // even with double render React.StrictMode
    useEffect(() => {

        socketRef.current = initializeSocket(roomId)

        return () => {
            socketRef.current?.disconnect();
        }
    }, [roomId]);

    return (
        <SocketContext.Provider value={socketRef}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocketContext = () => useContext(SocketContext);
