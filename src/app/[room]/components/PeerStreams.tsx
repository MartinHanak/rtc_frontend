import { useState, useEffect } from "react";
import { useWebRTCContext } from "./WebRTCContext";
import { Video } from "./Video";

export function PeerStreams() {

    const [displayedStreams, setDisplayedStreams] = useState<MediaStream[]>([]);


    const { connections, streams, peerStreamReady } = useWebRTCContext();

    useEffect(() => {
        let newStreams: MediaStream[] = [];

        for (const streamReady of peerStreamReady) {
            const readyId = streamReady.fromSocketId;
            const readyStream = streams?.current.filter((stream) => stream.fromSocketId === readyId)

            if (readyStream && readyStream.length > 0) {
                newStreams.push(readyStream[0].stream)
            }
        }

        console.log(`Displaying stream`)
        setDisplayedStreams(newStreams)

        return () => {
            setDisplayedStreams([])
        }
    }, [peerStreamReady, streams])

    return (
        <>{

            displayedStreams.map((stream, index) => {
                return (

                    <Video key={index} stream={stream} />

                )
            })

        } </>
    )
}