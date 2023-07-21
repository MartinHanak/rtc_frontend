import { rooms } from "../page"
import Room from "./components/Room"

export default function Page({ params }: { params: { room: string } }) {
    return (
        rooms
            .filter((room) => (room.id === decodeURIComponent(params.room)))
            .length > 0 ?
            <div>
                Welcome to room {decodeURIComponent(params.room)}
                <Room roomId={params.room} />
            </div>
            :
            <div>Room {decodeURIComponent(params.room)} does not exist.</div>
    )
}