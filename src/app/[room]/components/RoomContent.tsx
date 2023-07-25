import { PeerStreams } from "./PeerStreams";
import { useLocalStreamContext } from "./LocalStreamContext";
import { Video } from "./Video";
import { Chat } from "./chat/Chat";

export function RoomContent() {

    const { streamRef } = useLocalStreamContext()

    return (
        <div>

            <Chat />

            {streamRef && streamRef.current && <Video stream={streamRef.current} />}

            <PeerStreams />


        </div>
    )
}