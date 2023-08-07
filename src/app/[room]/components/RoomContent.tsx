"use client"
import { useEffect, useRef } from "react";
import { PeerStreams } from "./PeerStreams";
import { useLocalStreamContext } from "./LocalStreamContext";
import { Video } from "./Video";
import { Chat } from "./chat/Chat";
import { PixiApp } from "../Pixi/PixiApp";
import { useSocketContext } from "./SocketContext";
import { useWebRTCContext } from "./WebRTCContext";

export function RoomContent() {

    const { socketRef, hostId } = useSocketContext();
    const { streamRef } = useLocalStreamContext();
    const { dataChannels } = useWebRTCContext()

    const PixiAppRef = useRef<PixiApp | null>(null);
    const canvasContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (canvasContainer.current && socketRef?.current && dataChannels) {
            const newPixiApp = new PixiApp(canvasContainer.current, socketRef.current.id, hostId, dataChannels.current);

            PixiAppRef.current = newPixiApp;
        }

        return () => {
            if (PixiAppRef.current) {
                PixiAppRef.current.cleanup()
            }
        }

    }, [dataChannels, hostId, socketRef]);

    return (
        <div className="w-full h-full">

            <Chat />

            <div className="w-full max-w-screen-lg aspect-video">
                <div ref={canvasContainer} className="w-full h-full">
                </div>
            </div>

            {null && streamRef && streamRef.current && <Video stream={streamRef.current} />}

            <PeerStreams />


        </div>
    )
}