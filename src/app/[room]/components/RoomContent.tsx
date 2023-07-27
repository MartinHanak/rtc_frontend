"use client"
import { useEffect, useRef } from "react";
import { PeerStreams } from "./PeerStreams";
import { useLocalStreamContext } from "./LocalStreamContext";
import { Video } from "./Video";
import { Chat } from "./chat/Chat";
import { PixiApp } from "../Pixi/PixiApp";

export function RoomContent() {

    const { streamRef } = useLocalStreamContext();

    const PixiAppRef = useRef<PixiApp | null>(null);
    const canvasContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (canvasContainer.current) {
            const newPixiApp = new PixiApp(canvasContainer.current);

            PixiAppRef.current = newPixiApp;
        }

        return () => {
            if (PixiAppRef.current) {
                PixiAppRef.current.cleanup()
            }
        }

    }, []);

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