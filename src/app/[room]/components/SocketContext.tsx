import { MutableRefObject, createContext, useContext, useEffect, useRef, useState } from "react";
import { initializeSocket } from "./initializeSocket";
import { Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@/app/types/types";

interface SocketContextValue {
    socketRef: MutableRefObject<Socket<ServerToClientEvents, ClientToServerEvents> | null> | null,
    roomId: string,
    roomState: roomState | null,
    // webRTC
    offers: offerWithSocketId[],
    answers: answerWithSocketId[],
    iceCandidates: iceCandidateWithSocketId[],
    ready: readyWithSocketId[],
    idsLeft: string[]
    // chat
    messages: messageWithSocketId[]
}

const SocketContext = createContext<SocketContextValue>({ socketRef: null, roomId: '', roomState: null, offers: [], answers: [], iceCandidates: [], ready: [], idsLeft: [], messages: [] });

interface SocketContextProvider {
    children: React.ReactNode,
    roomId: string
}

type roomState = "full" | "joined" | "created"

type offerWithSocketId = {
    fromSocketId: string,
    offer: RTCSessionDescriptionInit
}

type answerWithSocketId = {
    fromSocketId: string,
    answer: RTCSessionDescriptionInit
}

type iceCandidateWithSocketId = {
    fromSocketId: string,
    candidate: RTCIceCandidate
}

type readyWithSocketId = {
    fromSocketId: string,
    ready: boolean,
    username?: string
}

type messageWithSocketId = {
    fromSocketId: string,
    message: string
}


export function SocketContextProvider({ children, roomId }: SocketContextProvider) {

    // reference for socket connection for given room
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [roomState, setRoomState] = useState<roomState | null>(null);

    // state for WebRTC offers, answers, ICE-candidates
    const [offers, setOffers] = useState<offerWithSocketId[]>([]);
    const [answers, setAnswers] = useState<answerWithSocketId[]>([]);
    const [iceCandidates, setIceCandidates] = useState<iceCandidateWithSocketId[]>([]);

    const [ready, setReady] = useState<readyWithSocketId[]>([]);
    const [idsLeft, setIdsLeft] = useState<string[]>([]);

    // chat 
    const [messages, setMessages] = useState<messageWithSocketId[]>([])


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
        socketRef.current.on("offer", (fromSocketId: string, offer) => {
            console.log(`Received WebRTC offer`);
            setOffers((oldOffers) => [...oldOffers, { fromSocketId, offer }])
        })
        socketRef.current.on("answer", (fromSocketId: string, answer) => {
            console.log(`Received WebRTC answer`);
            setAnswers((oldAnswers) => [...oldAnswers, { fromSocketId, answer }])
        })
        socketRef.current.on("ice-candidate", (fromSocketId: string, candidate) => {
            console.log(`Received WebRTC ICE candidate`);
            setIceCandidates((oldCandidates) => [...oldCandidates, { fromSocketId, candidate }])
        })

        socketRef.current.on("ready", (fromSocketId: string, username?: string) => {
            let fromUsername = fromSocketId;
            if (username) {
                fromUsername = username
            }

            console.log("All rooms participants are ready to start broadcasting");
            setReady((previous) => [...previous, { fromSocketId, ready: true, username: fromUsername }])
        })

        socketRef.current.on("leave", (fromSocketId) => {
            setIdsLeft((previous) => [...previous, fromSocketId])
        })

        // chat messages
        socketRef.current.on("message", (fromSocketId: string, message: string) => {
            setMessages((previous) => [...previous, { fromSocketId, message }])
        })

        return () => {
            console.log(`SOCKET DISCONNECTING`)

            if (socketRef && socketRef.current) {
                socketRef.current.emit('leave', socketRef.current.id)
            }

            socketRef.current?.disconnect();
        }
    }, [roomId]);


    // socket connection ready when roomState !== null
    return (
        <>{roomState ?
            <SocketContext.Provider value={{ socketRef, roomId, roomState, offers, answers, iceCandidates, ready, idsLeft, messages }}>
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
