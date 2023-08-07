import { MutableRefObject, createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useLocalStreamContext } from "./LocalStreamContext";
import { useSocketContext } from "./SocketContext";
import { data } from "autoprefixer";


interface WebRTCContextValue {
    connections: MutableRefObject<peerConnectionWithSocketId[]> | null,
    streams: MutableRefObject<streamWithSocketId[]> | null,
    peerStreamReady: readyWithSocketId[],
    dataChannels: MutableRefObject<dataChannelWithSocketId[]> | null,
    dataChannelReady: readyWithSocketId[],
}

const WebRTCContext = createContext<WebRTCContextValue>({ connections: null, streams: null, peerStreamReady: [], dataChannels: null, dataChannelReady: [] });

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
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                //'stun:stun3.l.google.com:19302',
                //'stun:stun4.l.google.com:19302'
            ]
        }
    ],
};

interface WebRTCContextProvider {
    children: React.ReactNode
}

export type streamWithSocketId = {
    fromSocketId: string,
    stream: MediaStream
}

export type peerConnectionWithSocketId = {
    fromSocketId: string,
    connection: RTCPeerConnection
}

export type readyWithSocketId = {
    fromSocketId: string,
    ready: boolean,
}

export type dataChannelWithSocketId = {
    fromSocketId: string,
    dataChannel: RTCDataChannel
}

export function WebRTCContextProvider({ children }: WebRTCContextProvider) {

    const peerConnectionRef = useRef<peerConnectionWithSocketId[]>([]);
    const peerStreamRef = useRef<streamWithSocketId[]>([]);
    const dataChannelRef = useRef<dataChannelWithSocketId[]>([]);

    const [peerStreamReady, setPeerStreamReady] = useState<readyWithSocketId[]>([]);
    const [dataChannelReady, setDataChannelReady] = useState<readyWithSocketId[]>([])

    const { socketRef, roomState, hostId, offers, answers, iceCandidates, ready, idsLeft } = useSocketContext();
    const { streamRef: localStreamRef } = useLocalStreamContext();

    // connection is saved only 1-to-1
    // room hosts have many connections open
    // others only 1
    const createPeerConnection = useCallback((fromSocketId: string) => {
        const connection = new RTCPeerConnection(ICE_SERVERS);

        // data channels have to be created BEFORE answer/offer
        // https://stackoverflow.com/questions/43788872/how-are-data-channels-negotiated-between-two-peers-with-webrtc/43788873#43788873

        const dataChannel = connection.createDataChannel(fromSocketId, { negotiated: true, id: 0, ordered: false });

        dataChannel.binaryType = 'arraybuffer';

        dataChannel.addEventListener('open', (event) => {
            console.log(`Data channel opened`);
            setDataChannelReady((previous) => [...previous, { fromSocketId, ready: true }])
        })

        dataChannel.addEventListener('close', () => {
            console.log(`Data channel closed`)
        })

        dataChannel.addEventListener('message', () => {
            console.log(`Data channel message received`)
        })

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
                console.log(`Added peer stream`)

                peerStreamRef.current.push({ fromSocketId, stream: event.streams[0] })

                setPeerStreamReady((previous) => [...previous, { fromSocketId, ready: true }])
            }
        }

        return { connection, dataChannel };
    }, [socketRef])


    useEffect(() => {
        // HOST ONLY function
        if (roomState !== "created") {
            //console.log("Non-host user tried to send an offer");
            return;
        }

        // only one side calls, other side sends an answer
        const handleCall = (fromSocketId: string) => {
            console.log(`Initializing WebRTC call.`)

            const { connection: newConnection, dataChannel: newDataChannel } = createPeerConnection(fromSocketId);

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

            peerConnectionRef.current.push({ fromSocketId, connection: newConnection });
            dataChannelRef.current.push({ fromSocketId, dataChannel: newDataChannel });
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


    }, [ready, localStreamRef, roomState, socketRef, createPeerConnection])


    // NON-host only: handle received offers
    useEffect(() => {
        // NON-HOST ONLY function, only host created the room
        if (roomState === "created") {
            //console.log("host user received an offer BY MISTAKE");
            return;
        }

        const handleOffer = (fromSocketId: string, offer: RTCSessionDescriptionInit) => {
            // non-host reacts only to host offers
            if (fromSocketId !== hostId) {
                return;
            }

            const { connection: newConnection, dataChannel: newDataChannel } = createPeerConnection(fromSocketId);

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
            dataChannelRef.current.push({ fromSocketId, dataChannel: newDataChannel })
        }

        for (const offer of offers) {
            const existingConnection = peerConnectionRef.current.filter((connection) =>
                connection.fromSocketId === offer.fromSocketId)

            if (existingConnection.length === 0
                && offer.fromSocketId !== socketRef?.current?.id) {
                console.log(`Reacting to an offer by creating an answer.`)
                handleOffer(offer.fromSocketId, offer.offer)
            }
        }


    }, [offers, roomState, localStreamRef, socketRef, createPeerConnection, hostId]);

    // handle answer = HOST-ONLY
    useEffect(() => {
        if (roomState !== "created") {
            return;
        }

        for (const answer of answers) {
            const correspondingConnection = peerConnectionRef.current.filter((connection) => connection.fromSocketId === answer.fromSocketId)

            if (correspondingConnection.length === 0) {
                console.log(`No connection with socketId: ${answer.fromSocketId} found when answer received`)
            } else {
                const connection = correspondingConnection[0];

                if (!connection.connection.remoteDescription) {
                    connection.connection.setRemoteDescription(answer.answer)
                        .then(() => console.log(`Answer successfully set as remote description.`))
                        .catch((error) => console.log(error))
                }
            }
        }


    }, [answers, roomState])

    // ICE candidate
    useEffect(() => {

        for (const iceCandidate of iceCandidates) {
            // host handles all ICE-candidate
            // others only ICE-candidates from hostId
            if (roomState !== "created") {
                if (iceCandidate.fromSocketId !== hostId) {
                    continue;
                }
            }

            const correspondingConnection = peerConnectionRef.current.filter((connection) => connection.fromSocketId === iceCandidate.fromSocketId)

            if (correspondingConnection.length === 0) {
                console.log(`No connection with socketId: ${iceCandidate.fromSocketId} found when ice-candidate received.`)
            } else {
                const connection = correspondingConnection[0];

                // check if already added ?
                // right now: adds one candidate multiple times


                const newIceCandidate = new RTCIceCandidate(iceCandidate.candidate);

                // ICE-candidates are send to all users
                // but they are specific to 1-to-1 connection
                // avoid adding ICE-candidates that are not specified for this 1-to-1 connection
                // code at the end of the page: https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate/usernameFragment

                // issue: getParameters() method specified in docs does not exist, date: 26/7/2023

                /*
                const receivers = connection.connection.getReceivers();
                receivers.forEach((receiver) => {
                    let parameters = receiver.transport?.iceTransport?.
                    console.log(parameters.usernameFragment)
                    console.log(newIceCandidate.usernameFragment)

                })
                */
                // SOLUTION:
                const localSdp = connection.connection.remoteDescription?.sdp;
                if (localSdp) {
                    const iceUfragRegex = /a=ice-ufrag:(.+)\r?\n/;
                    const match = localSdp.match(iceUfragRegex);
                    const usernameFragment = match ? match[1] : null;

                    // if connection to host has usernameFragment already set in remoteDescription
                    // check incoming ICE cadidates usernameFragment
                    // that specifies which user to go to
                    // skip incoming ICE-candidates that are not meant for this connection
                    if (usernameFragment) {
                        if (newIceCandidate.usernameFragment !== usernameFragment) {
                            continue;
                        }
                    }
                }

                connection.connection.addIceCandidate(newIceCandidate)
                    .then(() => {
                        //console.log(connection.connection.iceConnectionState)
                        console.log(`ICE candidate added successfully`)
                    })
                    .catch((error) => console.log(error))

            }
        }


    }, [iceCandidates, hostId, roomState])

    // cleanup combined
    useEffect(() => {

        return () => {
            console.log('WebRTC context cleanup');

            for (const stream of peerStreamRef.current) {
                stream.stream.getTracks().forEach((track) => track.stop())
            }

            for (const connection of peerConnectionRef.current) {
                connection.connection.ontrack = null;
                connection.connection.onicecandidate = null;
                connection.connection.close()
            }
            peerConnectionRef.current = [];
        }
    }, [])

    // handle leaving events

    useEffect(() => {
        if (idsLeft.length > 0) {
            console.log(`Someone left the connection`)
            console.log(idsLeft)

            peerConnectionRef.current = peerConnectionRef.current.filter((connection) => !idsLeft.includes(connection.fromSocketId))

            peerStreamRef.current = peerStreamRef.current.filter((stream) => !idsLeft.includes(stream.fromSocketId))

            setPeerStreamReady((previous) => previous.filter((ready) => !idsLeft.includes(ready.fromSocketId)))
        }
    }, [idsLeft])


    return (
        <WebRTCContext.Provider value={{ streams: peerStreamRef, connections: peerConnectionRef, peerStreamReady: peerStreamReady, dataChannels: dataChannelRef, dataChannelReady: dataChannelReady }}>
            {children}
        </WebRTCContext.Provider>
    )
}

export const useWebRTCContext = () => useContext(WebRTCContext);