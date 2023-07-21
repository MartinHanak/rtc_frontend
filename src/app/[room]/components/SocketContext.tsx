import { MutableRefObject, createContext, useContext, useEffect, useRef, useState } from "react";
import { initializeSocket } from "./initializeSocket";
import { Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@/app/types/types";

interface SocketContextValue {
    socketRef: MutableRefObject<Socket<ServerToClientEvents, ClientToServerEvents> | null> | null,
    roomId: string,
    roomState: roomState | null,
    offers: RTCSessionDescriptionInit[],
    answers: RTCSessionDescriptionInit[],
    iceCandidates: RTCIceCandidate[],
    ready: boolean
}

const SocketContext = createContext<SocketContextValue>({ socketRef: null, roomId: '', roomState: null, offers: [], answers: [], iceCandidates: [], ready: false });

interface SocketContextProvider {
    children: React.ReactNode,
    roomId: string
}

type roomState = "full" | "joined" | "created"

export function SocketContextProvider({ children, roomId }: SocketContextProvider) {

    // reference for socket connection for given room
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [roomState, setRoomState] = useState<roomState | null>(null);

    // state for WebRTC offers, answers, ICE-candidates
    const [offers, setOffers] = useState<RTCSessionDescriptionInit[]>([]);
    const [answers, setAnswers] = useState<RTCSessionDescriptionInit[]>([]);
    const [iceCandidates, setIceCandidates] = useState<RTCIceCandidate[]>([]);

    const [ready, setReady] = useState(false);


    // cleanup socket on dismount 
    // make sure there is only one active socket
    // even with double render React.StrictMode
    useEffect(() => {

        socketRef.current = initializeSocket(roomId)

        // room events
        socketRef.current.on('full', () => {
            setRoomState('full')
        })
        socketRef.current.on('created', () => {
            setRoomState('created')
        })
        socketRef.current.on('joined', () => {
            setRoomState('joined')
        })


        // webRTC events
        socketRef.current.on("offer", (offer) => {
            console.log(`Received WebRTC offer`);
            setOffers((oldOffers) => [...oldOffers, offer])
        })
        socketRef.current.on("answer", (answer) => {
            console.log(`Received WebRTC answer`);
            setAnswers((oldAnswers) => [...oldAnswers, answer])
        })
        socketRef.current.on("ice-candidate", (candidate) => {
            console.log(`Received WebRTC ICE candidate`);
            setIceCandidates((oldCandidates) => [...oldCandidates, candidate])
        })

        socketRef.current.on("ready", () => {
            console.log("All rooms participants are ready to start broadcasting");
            setReady(true)
        })

        return () => {
            socketRef.current?.disconnect();
            setOffers([]);
            setAnswers([]);
            setIceCandidates([]);
        }
    }, [roomId]);


    // socket connection ready when roomState !== null
    return (
        <>{roomState ?
            <SocketContext.Provider value={{ socketRef, roomId, roomState, offers, answers, iceCandidates, ready }}>
                {children}
            </SocketContext.Provider>
            :
            <div>
                Socket connecting ....
            </div>
        }</>
    )
}

export const useSocketContext = () => useContext(SocketContext);
