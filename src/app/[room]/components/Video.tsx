import { useEffect, useRef } from "react"

interface Video {
    stream: MediaStream
}

export function Video({ stream }: Video) {

    const localRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
        if (localRef && localRef.current) {
            localRef.current.srcObject = stream;
        }
    }, [stream])

    return (
        <>
            <video ref={localRef} autoPlay muted ></video>
        </>
    )
}