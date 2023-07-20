'use client'

import { useRef } from "react";
import { SocketContextProvider } from "./SocketContext";
import { LocalStreamProvider } from "./LocalStreamContext";


interface Room {
    id: string
}


export default function Room({ id }: Room) {

    const localVideo = useRef<HTMLVideoElement | null>(null);
    const remoteVideo = useRef<HTMLVideoElement | null>(null);



    return (
        <SocketContextProvider roomId={id}>
            <LocalStreamProvider>

                <video ref={localVideo} autoPlay muted />
                <video ref={remoteVideo} autoPlay muted></video>

            </LocalStreamProvider>
        </SocketContextProvider>
    )
}