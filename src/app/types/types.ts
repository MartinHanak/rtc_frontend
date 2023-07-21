
export interface ServerToClientEvents {
    // room events, specific to one socket
    "created": () => void,
    "joined": () => void,
    "full": () => void,
    // webRTC events
    "offer": (fromSocketId: string, offer: RTCSessionDescriptionInit) => void,
    "answer": (fromSocketId: string, answer: RTCSessionDescriptionInit) => void,
    "ice-candidate": (fromSocketId: string, candidate: RTCIceCandidate) => void,
    "ready": (fromSocketId: string) => void,
    "leave": () => void,
    // only for logs
    "reconnect": (attemptNumber: number) => void,
    "reconnect_error": (error: any) => void,
    "reconnect_failed": () => void
}

export interface ClientToServerEvents {
    "offer": (fromSocketId: string, offer: RTCSessionDescriptionInit) => void,
    "answer": (fromSocketId: string, answer: RTCSessionDescriptionInit) => void,
    "ice-candidate": (fromSocketId: string, candidate: RTCIceCandidate ) => void,
    "ready": (fromSocketId: string) => void,
}
