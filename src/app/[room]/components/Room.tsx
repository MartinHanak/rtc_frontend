'use client'

import { io } from "socket.io-client";
import { BACKEND_URL } from "@/app/util/config";

interface Room {
    id: string
}


const socket = io("https://server-domain.com");

export default function Room({ id }: Room) {
    return (
        <div>
            backend: {BACKEND_URL}
        </div>
    )
}