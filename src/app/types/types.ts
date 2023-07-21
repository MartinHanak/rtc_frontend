
export interface ServerToClientEvents {
    "created": () => void,
    "joined": () => void,
    "full": () => void,
    "offer": (offer: RTCSessionDescriptionInit) => void,
    "answer": (answer: RTCSessionDescriptionInit) => void,
    "ice-candidate": (candidate: RTCIceCandidate) => void,
    "ready": () => void,
    "leave": () => void,
    // only for logs
    "reconnect": (attemptNumber: number) => void,
    "reconnect_error": (error: any) => void,
    "reconnect_failed": () => void
}

export interface ClientToServerEvents {
    "offer": (offer: RTCSessionDescriptionInit) => void,
    "answer": (answer: RTCSessionDescriptionInit) => void,
    "ice-candidate": (candidate: RTCIceCandidate ) => void,
    "ready": () => void,
}
