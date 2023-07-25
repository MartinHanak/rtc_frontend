import { SocketContextProvider } from "./SocketContext"
import { LocalStreamProvider } from "./LocalStreamContext"
import { WebRTCContextProvider } from "./WebRTCContext"
import { DataChannelContextProvider } from "./DataChannelContext"

interface RoomContext {
    children: React.ReactNode,
    roomId: string
}

export function RoomContext({ children, roomId }: RoomContext) {
    return (
        <SocketContextProvider roomId={roomId}>
            <LocalStreamProvider>
                <WebRTCContextProvider>

                    {children}

                </WebRTCContextProvider>
            </LocalStreamProvider>
        </SocketContextProvider>
    )
}