
export interface ServerToClientEvents {
    // room events, specific to one socket
    "created": (hostId: string) => void,
    "joined": (hostId: string) => void,
    "full": () => void,
    // webRTC events
    "offer": (fromSocketId: string, offer: RTCSessionDescriptionInit) => void,
    "answer": (fromSocketId: string, answer: RTCSessionDescriptionInit) => void,
    "ice-candidate": (fromSocketId: string, candidate: RTCIceCandidate) => void,
    "ready": (fromSocketId: string, username?:string) => void,
    "leave": (fromSocketId: string) => void,
    // only for logs
    "reconnect": (attemptNumber: number) => void,
    "reconnect_error": (error: any) => void,
    "reconnect_failed": () => void,
    // chat
    "message": (fromSocketId: string, message: string) => void
}

export interface ClientToServerEvents {
    // webRTC events
    "offer": (fromSocketId: string, offer: RTCSessionDescriptionInit) => void,
    "answer": (fromSocketId: string, answer: RTCSessionDescriptionInit) => void,
    "ice-candidate": (fromSocketId: string, candidate: RTCIceCandidate ) => void,
    "ready": (fromSocketId: string, username?:string) => void,
    "leave": (fromSocketId: string) => void,
    // chat
    "message": (fromSocketId: string, message: string) => void
}
