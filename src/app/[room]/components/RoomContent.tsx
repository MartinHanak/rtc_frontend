import { PeerStreams } from "./PeerStreams";
import { useLocalStreamContext } from "./LocalStreamContext";
import { Video } from "./Video";

export function RoomContent() {

    const { streamRef } = useLocalStreamContext()

    return (
        <div>
            {streamRef && streamRef.current && <Video stream={streamRef.current} />}

            <PeerStreams />


        </div>
    )
}