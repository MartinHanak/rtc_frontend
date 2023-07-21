import { createContext, useContext, useEffect, useRef } from "react";
import { useLocalStreamContext } from "./LocalStreamContext";
import { useSocketContext } from "./SocketContext";

const WebRTCContext = createContext(null);

const ICE_SERVERS = {
    iceServers: [
        {
            urls: 'stun:openrelay.metered.ca:80',
        }
    ],
};

interface WebRTCContextProvider {
    children: React.ReactNode
}

export function WebRTCContextProvider({ children }: WebRTCContextProvider) {

    const peerConnectionRef = useRef<RTCPeerConnection[]>([]);
    const peerStreamRef = useRef([]);

    const { socketRef, roomState, offers, answers, iceCandidates, ready } = useSocketContext();
    const { streamRef: localStreamRef } = useLocalStreamContext();

    useEffect(() => {
        if (ready) {
            // only one side calls, other side sends an answer
            const handleCall = () => {
                // HOST ONLY function
                if (roomState !== "created") {
                    console.log("Non-host user tried to send an offer");
                    return;
                }
                console.log(`Initializing WebRTC call.`)

                const newConnection = createPeerConnection();

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

                peerConnectionRef.current.push(newConnection)
            }

            handleCall()
        }
    }, [ready, localStreamRef, roomState, socketRef])


    // NON-host only: handle received offers
    useEffect(() => {
        if (offers.length > 0) {
            const newOffer = offers[offers.length - 1];

            const handleOffer = (offer: RTCSessionDescriptionInit) => {
                // NON-HOST ONLY function, only host created the room
                if (roomState === "created") {
                    console.log("host user received an offer BY MISTAKE");
                    return;
                }

                const newConnection = createPeerConnection();

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

                peerConnectionRef.current.push(newConnection);
            }

            handleOffer(newOffer.offer);
        }
    }, [offers, roomState, localStreamRef, socketRef])

    // handle answer = host-only
    useEffect(() => {
        if (answers.length > 0) {
            const newAnswer = answers[answers.length - 1];

            // find the corresponding peerConnection

            // set remote description

        }
    }, [answers])

    // ICE candidate
    useEffect(() => {

        // create new candidate

        // update corresponding peerConection using .addIceCandidate

    }, [iceCandidates])

    // connection is saved only 1-to-1
    // room hosts have many connections open
    // others only 1
    const createPeerConnection = () => {
        const connection = new RTCPeerConnection(ICE_SERVERS);

        connection.onicecandidate = (event) => {
            // check if event has candidate

            // emit ice-candidate
        }
        connection.ontrack = (event: RTCTrackEvent) => {
            // extract stream from event

            // save it to ref / update srcObject
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