'use client'

import { useRef } from "react";
import { RoomContext } from "./RoomContext";


interface Room {
    roomId: string
}


export default function Room({ roomId }: Room) {

    const localVideo = useRef<HTMLVideoElement | null>(null);
    const remoteVideo = useRef<HTMLVideoElement | null>(null);



    return (
        <RoomContext roomId={roomId}>

            <video ref={localVideo} autoPlay muted />
            <video ref={remoteVideo} autoPlay muted></video>

        </RoomContext>
    )
}