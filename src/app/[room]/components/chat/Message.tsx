interface Message {
    sender: string,
    message: string
}

export function Message({ sender, message }: Message) {
    return (
        <div>
            <div>From: {sender}</div>
            <div>{message}</div>
        </div>
    )
}