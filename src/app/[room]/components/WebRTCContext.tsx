import { createContext, useContext, useEffect, useRef } from "react";
import { useLocalStreamContext } from "./LocalStreamContext";
import { useSocketContext } from "./SocketContext";

const WebRTCContext = createContext(null);

/*
stun1.l.google.com:19302
stun2.l.google.com:19302
stun3.l.google.com:19302
stun4.l.google.com:19302
*/

interface RTCPeerConnectionConfig {
    iceServers: RTCIceServer[]
}

const ICE_SERVERS: RTCPeerConnectionConfig = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302', 'stun:stun4.l.google.com:19302']
        }
    ],
};

interface WebRTCContextProvider {
    children: React.ReactNode
}

type streamWithSocketId = {
    fromSocketId: string,
    stream: MediaStream
}

type peerConnectionWithSocketId = {
    fromSocketId: string,
    connection: RTCPeerConnection
}

export function WebRTCContextProvider({ children }: WebRTCContextProvider) {

    const peerConnectionRef = useRef<peerConnectionWithSocketId[]>([]);
    const peerStreamRef = useRef<streamWithSocketId[]>([]);

    const { socketRef, roomState, offers, answers, iceCandidates, ready } = useSocketContext();
    const { streamRef: localStreamRef } = useLocalStreamContext();

    useEffect(() => {
        // HOST ONLY function
        if (roomState !== "created") {
            //console.log("Non-host user tried to send an offer");
            return;
        }

        // only one side calls, other side sends an answer
        const handleCall = (fromSocketId: string) => {
            console.log(`Initializing WebRTC call.`)

            const newConnection = createPeerConnection(fromSocketId);

            if (localStreamRef && localStreamRef.current) {
                newConnection.addTrack(
                    localStreamRef.current.getTracks()[0],
                    localStreamRef.current
                )
                newConnection.addTrack(
                    localStreamRef.current.getTracks()[1],
                    localStreamRef.current
                )
            } else {
                console.log(`Local stream not ready while initiating WebRTC call.`)
                return;
            }

            // send WebRTC connection offer
            (async () => {
                try {
                    const offer = await newConnection.createOffer();

                    newConnection.setLocalDescription(offer);

                    if (socketRef && socketRef.current) {
                        console.log('Sending WebRTC offer')
                        socketRef.current.emit('offer', socketRef.current.id, offer)
                    } else {
                        throw new Error(`Socket not ready while emitting offer.`)
                    }

                } catch (error) {
                    console.log(error)
                }
            })()

            peerConnectionRef.current.push({ fromSocketId, connection: newConnection })
        }

        // every time ready array changes
        // check if any ready socket has no peer connection
        // create peer connection if not already done
        for (const socketState of ready) {
            const existingConnection = peerConnectionRef.current
                .filter((connection) => connection.fromSocketId === socketState.fromSocketId)

            // host cannot call himself
            if (existingConnection.length === 0
                && socketState.fromSocketId !== socketRef?.current?.id) {
                console.log(`Making webRTC call.`)
                handleCall(socketState.fromSocketId)
            }
        }

        return () => {
            console.log('handleCall cleanup')
        }
    }, [ready, localStreamRef, roomState, socketRef])


    // NON-host only: handle received offers
    useEffect(() => {
        // NON-HOST ONLY function, only host created the room
        if (roomState === "created") {
            //console.log("host user received an offer BY MISTAKE");
            return;
        }

        const handleOffer = (fromSocketId: string, offer: RTCSessionDescriptionInit) => {

            const newConnection = createPeerConnection(fromSocketId);

            if (localStreamRef && localStreamRef.current) {
                newConnection.addTrack(
                    localStreamRef.current.getTracks()[0],
                    localStreamRef.current
                )
                newConnection.addTrack(
                    localStreamRef.current.getTracks()[1],
                    localStreamRef.current
                )
            } else {
                console.log(`Local stream not ready when offer received.`)
            }

            // non-host saves offer as remote description
            newConnection.setRemoteDescription(offer);

            (async () => {
                try {
                    const answer = await newConnection.createAnswer();

                    newConnection.setLocalDescription(answer);

                    if (socketRef && socketRef.current) {
                        console.log(`Sending WebRTC answer`)
                        socketRef.current.emit("answer", socketRef.current.id, answer)
                    } else {
                        throw new Error(`Socket not ready when sending WebRTC answer`)
                    }
                } catch (error) {
                    console.log(error)
                }
            })();

            peerConnectionRef.current.push({ fromSocketId, connection: newConnection });
        }

        //handleOffer(newOffer.offer);
        for (const offer of offers) {
            const existingConnection = peerConnectionRef.current.filter((connection) =>
                connection.fromSocketId === offer.fromSocketId)

            if (existingConnection.length === 0
                && offer.fromSocketId !== socketRef?.current?.id) {
                console.log(`Reacting to an offer by creating an answer.`)
                handleOffer(offer.fromSocketId, offer.offer)
            }
        }

        return () => {
            console.log('handleOffer cleanup')
        }
    }, [offers, roomState, localStreamRef, socketRef]);

    // handle answer = host-only
    useEffect(() => {
        for (const answer of answers) {
            const correspondingConnection = peerConnectionRef.current.filter((connection) => connection.fromSocketId === answer.fromSocketId)

            if (correspondingConnection.length === 0) {
                throw new Error(`No connection with socketId: ${answer.fromSocketId} found when answer received`)
            } else {
                const connection = correspondingConnection[0];

                if (!connection.connection.remoteDescription) {
                    connection.connection.setRemoteDescription(answer.answer)
                        .then(() => console.log(`Answer successfully set as remote description.`))
                        .catch((error) => console.log(error))
                }
            }
        }

        return () => {
            console.log('handleAnswer cleanup')
        }
    }, [answers])

    // ICE candidate
    useEffect(() => {

        for (const iceCandidate of iceCandidates) {
            const correspondingConnection = peerConnectionRef.current.filter((connection) => connection.fromSocketId === iceCandidate.fromSocketId)

            if (correspondingConnection.length === 0) {
                throw new Error(`No connection with socketId: ${iceCandidate.fromSocketId} found when ice-candidate received.`)
            } else {
                const connection = correspondingConnection[0];

                // check if already added ?
                // right now: adds one candidate multiple times

                const newIceCandidate = new RTCIceCandidate(iceCandidate.candidate);

                connection.connection.addIceCandidate(newIceCandidate)
                    .then(() => console.log(`ICE candidate added successfully`))
                    .catch((error) => console.log(error))
            }


        }

        return () => {
            console.log('handle ICE Candidate cleanup')
        }
    }, [iceCandidates])

    // connection is saved only 1-to-1
    // room hosts have many connections open
    // others only 1
    const createPeerConnection = (fromSocketId: string) => {
        const connection = new RTCPeerConnection(ICE_SERVERS);

        connection.onicecandidate = (event) => {

            if (event.candidate) {

                if (socketRef && socketRef.current) {
                    socketRef.current.emit("ice-candidate", socketRef.current.id, event.candidate);
                } else {
                    console.log(`Socket not ready when ice-candidate event triggered.`)
                }
            }
        }
        connection.ontrack = (event: RTCTrackEvent) => {
            const existingPeerStream = peerStreamRef.current.filter((stream) => stream.fromSocketId === fromSocketId)

            if (existingPeerStream.length === 0) {
                peerStreamRef.current.push({ fromSocketId, stream: event.streams[0] })
            }
        }

        return connection;
    }

    // handle leaving events


    return (
        <WebRTCContext.Provider value={null}>
            {children}
        </WebRTCContext.Provider>
    )
}

export const useWebRTCContext = () => useContext(WebRTCContext);