import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSocketContext } from "./SocketContext";
import { useWebRTCContext } from "./WebRTCContext";
import { data } from "autoprefixer";

const DataChannelContext = createContext(null);

type dataChannelDictionary = {
    [socketId: string]: RTCDataChannel
}

type readyDictionary = {
    [socketId: string]: boolean
}

interface DataChannelContextProvider {
    children: React.ReactNode
}

export function DataChannelContextProvider({ children }: DataChannelContextProvider) {
    const { hostId, socketRef } = useSocketContext();
    const { ready, connections } = useWebRTCContext();

    const lastMessageTime = useRef();
    const lastMessage = useRef();

    const dataChannelRef = useRef<dataChannelDictionary>({});
    const [dataChannelReady, setDataChannelReady] = useState<readyDictionary>({})

    const handleDataChannel = useCallback((dataChannel: RTCDataChannel, socketId: string) => {

        dataChannel.addEventListener("open", (event) => {
            console.log(`Data channel to ${socketId} is ready.`)
            setDataChannelReady((previous) => {
                return { ...previous, [socketId]: true }
            })

            // test
            setInterval(() => {
                dataChannel.send(`Hello at ${Date.now()}`)
            }, 1000)
        })

        dataChannel.addEventListener("close", (event) => {
            console.log(`Data channel to ${socketId} closed`)
        })

        dataChannel.addEventListener("message", (event) => {
            const message = event.data;
            console.log(`Received a new data channel message`)
            console.log(message)

            // update last message and time
        })

        dataChannelRef.current = { ...dataChannelRef.current, [socketId]: dataChannel }
    }, [])


    useEffect(() => {
        // ONLY HOST opens dataChannel to other connections
        if (hostId !== socketRef?.current?.id || ready.length === 0) {
            return
        }
        console.log(`Host starts a data channel.`)

        for (const connectionState of ready) {
            const correspondingConnection = connections?.current.filter((connection) => connection.fromSocketId === connectionState.fromSocketId)

            if (!(correspondingConnection) || correspondingConnection.length === 0) {
                throw new Error(`Connection for ${connectionState.fromSocketId} not found when opening a data channel.`);
            }

            const socketId = correspondingConnection[0].fromSocketId;
            const peerConnection = correspondingConnection[0].connection;

            if (!(socketId in dataChannelRef.current)) {
                console.log(`Creating a new data channel to ${socketId}`)

                const dataChannel = peerConnection.createDataChannel(socketId, { ordered: false });
                handleDataChannel(dataChannel, socketId);

            }
        }
    }, [ready, hostId, socketRef, connections, handleDataChannel])

    useEffect(() => {
        if (ready.length === 0) {
            return;
        }

        // NON-HOST listens for datachannel event from HOST only
        for (const connectionState of ready) {
            if (connectionState.fromSocketId !== hostId) {
                continue;
            }
            console.log(`Start listening for new data channels`)

            const correspondingConnection = connections?.current.filter((connection) => connection.fromSocketId === hostId)

            if (!(correspondingConnection) || correspondingConnection.length === 0) {
                throw new Error(`Connection for host ${connectionState.fromSocketId} not found when listening for a data channel.`);
            }

            const connectionToHost = correspondingConnection[0].connection;

            connectionToHost.addEventListener('datachannel', (event) => {
                console.log(`Received a datachannel event`)
                const dataChannel = event.channel;

                handleDataChannel(dataChannel, hostId);
            })

        }

    }, [ready, hostId, connections, handleDataChannel])


    useEffect(() => {

        if (Object.keys(dataChannelReady).length === 0) {
            return;
        }

        console.log(`A new data channel is ready.`)
        for (const socketId in dataChannelReady) {
            const dataChannel = dataChannelRef.current[socketId]

            if (!dataChannel) {
                throw new Error(`Data channel not ready when it should be`)
            }

            // start emitting messages

        }
    }, [dataChannelReady])


    return (
        <DataChannelContext.Provider value={null}>
            {children}
        </DataChannelContext.Provider>
    )
}

export const useDataChannel = () => useContext(DataChannelContext);