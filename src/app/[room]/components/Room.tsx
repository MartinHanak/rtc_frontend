'use client'

import { BACKEND_URL } from "@/app/util/config";
import { useEffect, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import { useUserMedia } from "../hooks/useUserMedia";

interface Room {
    id: string
}


export default function Room({ id }: Room) {

    const localVideo = useRef<HTMLVideoElement | null>(null);

    const { socket, users } = useSocket(id);

    const stream = useUserMedia();

    useEffect(() => {
        if (localVideo.current) {
            localVideo.current.srcObject = stream;
        }

        return () => {
            if (localVideo.current) {
                localVideo.current.srcObject = null;
            }
        }
    })

    return (
        <div>
            backend: {BACKEND_URL}

            <ul>
                {users.map((user) => {
                    return (<li key={user}>{user}</li>)
                })}
            </ul>

            <video ref={localVideo} autoPlay muted />
        </div>
    )
}