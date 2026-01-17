'use client';

import { usePlan } from "@/contexts/PlanContext";
import { Settings, UserPlus2Icon, Search, ArrowRightCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

interface ChatHeaderProps {
  connected: boolean;
  partner: {
    name: string;
    avatarUrl?: string;
  } | null;
  onNext: () => void;
}


interface Friend {
  id: string;
  name: string;
}

export default function ModChatHeader({ connected, partner, onNext }: ChatHeaderProps) {
  const { state } = usePlan();
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* -------------------------------
     Friends menu state
  -------------------------------- */
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const [friends, setFriends] = useState<Friend[]>([
    { id: '1', name: 'Arjun' },
    { id: '2', name: 'Rohit' },
    { id: '3', name: 'Ananya' },
    { id: '4', name: 'Karan' },
    { id: '5', name: 'Ishita' }
  ]);

  // Backend placeholder
  /*
  useEffect(() => {
    const fetchFriends = async () => {
      const res = await fetch('/api/friends');
      const data = await res.json();
      setFriends(data);
    };
    fetchFriends();
  }, []);
  */

  /* -------------------------------
     Close menu on outside click
  -------------------------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFriendsOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (connected) {
      setFriendsOpen(false);
    }
  }, [connected]);
  

  const isFreePlan = state?.planName === "Free";

  // const displayName = connected ? partner?.name ?? 'User' : 'ME';
  const displayName = connected && partner
  ? partner.name
  : 'Me';

  const initial = displayName.charAt(0).toUpperCase();

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 bg-[#0e1326]">
      
      {/* LEFT SIDE */}
      <div className="relative flex items-center gap-3">

        {/* PROFILE + NAME */}
        <button
          onClick={() => !connected && setFriendsOpen(v => !v)}
          className="flex items-center gap-3"
        >
          {/* Fake Avatar */}
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm select-none">
            {initial}
          </div>

          <div className="flex flex-col">
            <h1 className="font-semibold text-white text-sm">
              {displayName}
            </h1>

            {connected && (
              <span className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
        </button>

        {/* FRIENDS MENU */}
        {!connected && friendsOpen && (
          <div
            ref={menuRef}
            className="absolute top-14 left-0 w-64 bg-[#151a35] border border-white/10 rounded-xl shadow-xl z-50 p-3"
          >
            {/* SEARCH */}
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-2 py-1.5 mb-2">
              <Search className="w-4 h-4 text-white/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search friends..."
                className="bg-transparent outline-none text-sm text-white w-full placeholder:text-white/40"
              />
            </div>

            {/* FRIEND LIST */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredFriends.length === 0 ? (
                <div className="text-white/40 text-sm text-center py-4">
                  No friends found
                </div>
              ) : (
                filteredFriends.map(friend => (
                  <button
                    key={friend.id}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                      {friend.name.charAt(0)}
                    </div>
                    <span className="text-sm text-white">
                      {friend.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 relative">
        {connected ? (
            <>
          <button 
            onClick={onNext}
            className={`px-3 py-1.5 flex gap-2 text-xs rounded-md font-medium transition bg-indigo-950`}>
            <span className="">Skip</span><ArrowRightCircle />
          </button>
          <button
            disabled={isFreePlan}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition
                ${isFreePlan
                    ? "text-white/40 cursor-not-allowed"
                    : "hover:bg-white/10 text-white"
                }`}
                >
            <UserPlus2Icon />
          </button>
              </>
        ) : (
          <>
            <button
              onClick={() => setSettingsOpen(v => !v)}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Settings className="hover:text-white/80"/>
            </button>

            {settingsOpen && (
              <div className="absolute right-0 top-10 w-40 bg-[#151a35] border border-white/10 rounded-md shadow-lg overflow-hidden">
                <button 
                  onClick={async () => await signOut()}
                  className="w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-white/10"
                >
                  Log Out
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}