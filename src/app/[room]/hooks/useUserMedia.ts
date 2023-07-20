'use client'
import { useEffect, useState } from "react";

export function useUserMedia() {
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {

        (async () => {
            try {
                let newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                setStream(newStream)

            } catch (error) {
                console.log(error);
            }
        })();

        return () => {
            setStream(null)
        }

    }, [])

    return stream;
}