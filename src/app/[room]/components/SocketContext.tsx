import React, { MutableRefObject, createContext, useContext, useEffect, useRef, useState } from "react";
import { initializeSocket } from "./initializeSocket";
import { Socket } from "socket.io-client";

interface ContextValue {
    socketRef: MutableRefObject<Socket | null> | null,
    roomId: string,
    roomState: roomState | null
}

const SocketContext = createContext<ContextValue>({ socketRef: null, roomId: '', roomState: null });

interface Context {
    children: React.ReactNode,
    roomId: string
}

type roomState = "full" | "joined" | "created"

export function SocketContextProvider({ children, roomId }: Context) {

    // reference for socket connection for given room
    const socketRef = useRef<Socket | null>(null);
    const [roomState, setRoomState] = useState<roomState | null>(null);


    // cleanup socket on dismount 
    // make sure there is only one active socket
    // even with double render React.StrictMode
    useEffect(() => {

        socketRef.current = initializeSocket(roomId)

        socketRef.current.on('full', () => {
            setRoomState('full')
        })

        socketRef.current.on('created', () => {
            setRoomState('created')
        })

        socketRef.current.on('joined', () => {
            setRoomState('joined')
        })

        return () => {
            socketRef.current?.disconnect();
        }
    }, [roomId]);


    // socket connection ready when roomState !== null
    return (
        <>{roomState ?
            <SocketContext.Provider value={{ socketRef, roomId, roomState }}>
                {children}
            </SocketContext.Provider>
            :
            <div>
                Socket connecting ....
            </div>
        }</>
    )
}

export const useSocketContext = () => useContext(SocketContext);
