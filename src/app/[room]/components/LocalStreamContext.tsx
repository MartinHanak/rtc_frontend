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
    const { socketRef, roomId, roomState } = useSocketContext();

    useEffect(() => {
        if (!(roomId && roomState)) {
            console.log('Socket connection not ready for local stream')
            return;
        }
        console.log('Preparing local stream')

        switch (roomState) {
            case 'full':
                alert(`Room ${roomId} is full`);
                redirect("/");
                break;
            case 'created':
                isHostRef.current = true;
                break;
            case 'joined':
                if (socketRef && socketRef.current) {
                    socketRef.current.emit("ready");
                }
                break;
        }

        (async () => {
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

            } catch (error) {
                console.log(error)
            }
        })();

        // useEffect triggered twice in Strict mode
        const oldStream = streamRef;
        return () => {
            console.log(`Local stream cleanup.`)

            oldStream.current?.getTracks().forEach((track) => track.stop());

            oldStream.current = null;
        }
    }, [socketRef, roomId, roomState]);

    return (
        <LocalStreamContext.Provider value={streamRef}>
            {children}
        </LocalStreamContext.Provider>
    )
}


export const useLocalStreamContext = () => useContext(LocalStreamContext);