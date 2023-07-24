import { useSocketContext } from "../SocketContext"
import { Message } from "./Message"
import { useState } from "react";


export function Chat() {

    const { messages, socketRef } = useSocketContext();

    const [newMessage, setNewMessage] = useState<string>('');

    const handleSendMessage = () => {
        if (socketRef && socketRef.current) {
            socketRef.current.emit("message", socketRef.current.id, newMessage)
        } else {
            console.log(`Socket not ready when sending chat message.`)
        }
        setNewMessage('');
    }



    return (
        <div>
            <div>
                {messages.map((message, index) => {
                    return (
                        <Message key={index} sender={message.fromSocketId} message={message.message} />
                    )
                })}
            </div>

            <div>
                <textarea name="new-message" id="new-message" cols={30} rows={10}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                ></textarea>

                <button onClick={() => handleSendMessage()}>Send Message</button>
            </div>
        </div>
    )
}