export default function Page({ params }: { params: { room: string } }) {
    return <div>My room: {decodeURIComponent(params.room)}</div>
}