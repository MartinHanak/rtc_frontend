'use client'

import { RoomContext } from "./RoomContext";
import { RoomContent } from "./RoomContent";


interface Room {
    roomId: string
}


export default function Room({ roomId }: Room) {
    // RoomContent has to wait for RoomContext to load
    return (
        <RoomContext roomId={roomId}>
            {null && <RoomContent />}
        </RoomContext>
    )
}