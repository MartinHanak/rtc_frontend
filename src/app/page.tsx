import Link from "next/link"

const rooms = [
  { id: 'room-one' },
  { id: 'abcsfda' },
  { id: '1234' },
  { id: 'český s mezerou' }
]

export default function Home() {
  return (
    <main className="">
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
            <Link href={`/${room.id}`}> {room.id} </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
