"use client";

interface Room {
  roomId: string;
  userId: string;
}

interface RoomListProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

export default function RoomList({
  rooms,
  activeRoomId,
  onSelectRoom,
}: RoomListProps) {
  return (
    <div className="w-64 border-r border-white/10 bg-[#0e1322]">
      <div className="p-3 font-semibold border-b border-white/10">
        Active Chats
      </div>

      {rooms.length === 0 && (
        <div className="p-4 text-sm text-white/40">
          No active chats
        </div>
      )}

      <div className="overflow-y-auto">
        {rooms.map((room) => (
          <button
            key={room.roomId}
            onClick={() => onSelectRoom(room.roomId)}
            className={`w-full text-left px-4 py-3 border-b border-white/5
              ${
                room.roomId === activeRoomId
                  ? "bg-indigo-900/40"
                  : "hover:bg-white/5"
              }`}
          >
            <div className="text-sm font-medium text-white">
              User {room.userId.slice(0, 6)}
            </div>

            <div className="text-xs text-white/40">
              Room {room.roomId.slice(0, 6)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
