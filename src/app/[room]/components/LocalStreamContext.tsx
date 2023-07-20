import React, { MutableRefObject, createContext, useRef, useContext, useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import { redirect } from "next/navigation";

const LocalStreamContext = createContext<MutableRefObject<MediaStream | null> | null>(null);

interface LocalStreamContext {
    children: React.ReactNode
}

export function LocalStreamProvider({ children }: LocalStreamContext) {

    const isHostRef = useRef(false);
    const streamRef = useRef<MediaStream | null>(null);
    const { socketRef, ready } = useSocketContext();




    useEffect(() => {
        if (!(socketRef && socketRef.current)) {
            console.log('Socket not ready for local stream')
            return;
        }
        console.log('Preparing local stream')

        socketRef.current.on("full", () => {
            alert("Room is full");
            redirect("/");
        })

        socketRef.current.on("created", async () => {
            isHostRef.current = true;
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            } catch (error) {
                console.log(error)
            }
        })

        socketRef.current.on("joined", async () => {
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

                if (socketRef && socketRef.current) {
                    socketRef.current.emit("ready");
                }
            } catch (error) {
                console.log(error)
            }
        })

        return () => {
            streamRef.current = null;
            if (socketRef && socketRef.current) {
                socketRef.current.removeAllListeners("full");
                socketRef.current.removeAllListeners("created");
                socketRef.current.removeAllListeners("joined");
            }
        }
    })

    return (
        <LocalStreamContext.Provider value={streamRef}>
            {children}
        </LocalStreamContext.Provider>
    )
}


export const useLocalStreamContext = () => useContext(LocalStreamContext);