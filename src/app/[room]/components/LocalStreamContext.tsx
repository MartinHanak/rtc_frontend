import { MutableRefObject, createContext, useRef, useContext, useEffect, useState } from "react";
import { useSocketContext } from "./SocketContext";
import { redirect } from "next/navigation";


interface LocalStreamContextValue {
    streamRef: MutableRefObject<MediaStream | null> | null
}

const LocalStreamContext = createContext<LocalStreamContextValue>({ streamRef: null });

interface LocalStreamContext {
    children: React.ReactNode
}

export function LocalStreamProvider({ children }: LocalStreamContext) {

    const [streamReady, setStreamReady] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const { socketRef, roomId, roomState } = useSocketContext();

    useEffect(() => {
        if (!(roomId && roomState)) {
            console.log('Socket connection not ready for local stream')
            return;
        }

        console.log('Preparing local stream');

        (async () => {
            try {
                console.log(`Setting local stream`)
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

                // check if stream already set
                // otherwise issues with double-render react strict mode
                // because one stream is not cleaned-up and camera does not shut off
                if (streamRef && streamRef.current) {
                    console.log(`Local stream already set`);
                    stream.getTracks().forEach((track) => track.stop());
                } else {
                    streamRef.current = stream;
                }
                setStreamReady(true);

            } catch (error) {
                console.log(error)
            }
        })();

        // useEffect triggered twice in Strict mode
        const oldStream = streamRef;
        return () => {
            console.log(`Local stream cleanup.`)
            if (oldStream && oldStream.current) {
                oldStream.current.getTracks().forEach((track) => track.stop());
            } else {
                console.log(`No stream or stream.current when local stream cleanup`)
            }

            oldStream.current = null;
        }
    }, [socketRef, roomId, roomState]);


    return (
        <LocalStreamContext.Provider value={{ streamRef }}>
            {streamReady ? children : <div> Loading stream... </div>}
        </LocalStreamContext.Provider>
    )
}


export const useLocalStreamContext = () => useContext(LocalStreamContext);