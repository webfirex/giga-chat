'use client';

import { Button } from "@/components/ui/button";
import { usePlan } from "@/contexts/PlanContext";
import { RandomUserProfile, UserDetails, useModChatSocket } from "@/hooks/useModChatSocket";
import { Settings, UserPlus2Icon, ArrowRightCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { MouseEventHandler, useEffect, useRef, useState } from "react";

type ModChatHeaderProps = {
  connected: boolean;
  userDetails: UserDetails | null;
  randomProfile: RandomUserProfile | null;
  onNext: () => void;
  roomId: string
  sendFriendRequest: (roomId: string) => void;
};



export default function ModChatHeader({ connected, userDetails, randomProfile, onNext, sendFriendRequest, roomId }: ModChatHeaderProps) {
  const { state } = usePlan();
  const [settingsOpen, setSettingsOpen] = useState(false);
  /* -------------------------------
     Friends menu state
  -------------------------------- */
  // const [friendsOpen, setFriendsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);


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


  

  const isFreePlan = state?.planName === "Free";

  // const displayName = connected ? partner?.name ?? 'User' : 'ME';
  const displayName = connected && userDetails
  ? userDetails.firstName + "  "+userDetails.lastName
  : 'Me';

  const initial = displayName.charAt(0).toUpperCase();


  return (
    <header className="relative h-16 border-b border-white/5 flex items-center justify-between px-4 bg-[#0e1326]">
      
      {/* LEFT SIDE */}
      <div className="relative flex items-center gap-3">

        {/* PROFILE + NAME */}
        <button
          className="flex items-center gap-3"
        >
          {/* Fake Avatar */}
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm select-none">
            {initial}
          </div>

          <div className="flex flex-col">
            <h1 className="font-semibold text-white text-sm text-left">
              {displayName}
            </h1>

            {connected && (
              <span className="text-[10px] text-green-400 flex items-center gap-1">
                {userDetails?.planName} Plan
                <span className="ml-1 text-white/50">Gifts Purchased: ₹{userDetails?.totalGiftAmount}</span>
              </span>
            )}
          </div>
        </button>


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
          <Button
            disabled={userDetails?.planName == "Free"}
            onClick={()=>sendFriendRequest(roomId)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition
                ${userDetails?.planName == "Free"
                    ? "text-white/40 cursor-not-allowed"
                    : "hover:bg-white/10 text-white"
                }`}
                >
            <UserPlus2Icon />
          </Button>
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
      {connected && randomProfile && (
    <div className="absolute left-1/2 -translate-x-1/2 top-full bg-[#0e1326] border border-t-0 border-white/10 px-3 py-1.5 text-[11px] text-white/80 shadow-md">
      <div className="flex gap-2 text-lg p-4">
        <span className="font-medium text-white">
          {randomProfile.name}
        </span>
        <span>•</span>
        <span>{randomProfile.age}</span>
        <span>•</span>
        <span>{randomProfile.city}</span>
      </div>
    </div>
  )}
    </header>
  );
}