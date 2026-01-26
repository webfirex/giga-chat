'use client';

import { usePlan } from '@/contexts/PlanContext';
import { Settings, UserPlus2Icon, Pencil } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button } from '@mantine/core';
import EditProfileModal from './EditProfileModal';
import { RandomUserProfile } from '@/hooks/useModChatSocket';
import PlanBadge from '../ui/planBadge';
import InterestsModal from './InterestsModal';
import { notifications } from '@mantine/notifications';

interface ChatHeaderProps {
  connected: boolean;
  searchingText: string | undefined
  partnerProfile?: RandomUserProfile | null;
  sendFriendRequest: ()=> void
}

export default function ChatHeader({ connected, partnerProfile, searchingText, sendFriendRequest }: ChatHeaderProps) {
  const { state, clearPlan } = usePlan();
  const { data } = useSession();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editInterestsOpen, setEditInterestsOpen] = useState(false);

  /* -------------------- Interests Logic -------------------- */
  const userInterests: string[] = data?.user.interests ?? [];

  const latestThreeInterests = useMemo(
    () => userInterests.slice(-3),
    [userInterests]
  );

  const [randomCommonInterests, setRandomCommonInterests] = useState<string[] | null>(null);

  const sendFriendRequest2 = () =>{
    notifications.show({
      title:"Coming soon",
      message:"Friend requests will be available in the next update"
    })
  }
  useEffect(() => {
    // Not connected or no interests → nothing
    if (!connected || userInterests.length === 0) {
      setRandomCommonInterests(null);
      return;
    }

    // FREE plan → mostly null
    if (state?.planName === 'Free') {
      const showAnything = Math.random() < 0.25; // 25% chance

      if (!showAnything) {
        setRandomCommonInterests(null);
        return;
      }

      // Free plan can show only 1 interest
      const shuffled = [...userInterests].sort(() => 0.5 - Math.random());
      setRandomCommonInterests(shuffled.slice(0, 1));
      return;
    }

    // BASIC / PREMIUM → always show 1–2
    const shuffled = [...userInterests].sort(() => 0.5 - Math.random());
    const count = Math.min(
      userInterests.length,
      Math.random() > 0.5 ? 2 : 1
    );

    setRandomCommonInterests(shuffled.slice(0, count));
  }, [
    connected,
    partnerProfile?.name,      // or partner?.id (preferred)
    userInterests,
    state?.planName,
  ]);


  const displayedInterests = connected
    ? randomCommonInterests
    : latestThreeInterests;


  /* -------------------- Render -------------------- */
  return (
    <header className="h-18 border-b border-white/5 flex items-center justify-between px-4 bg-[#0e1326]">
      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <EditProfileModal
          opened={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
        />
      )}
      {editInterestsOpen && (
        <InterestsModal
          opened={editInterestsOpen}
          onClose={() => setEditInterestsOpen(false)}
        />
      )}

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {/* Avatar */}
        {!connected ? (
          // NOT connected → show current user
          data?.user?.image ? (
            <img
              src={data.user.image}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 shadow-lg">
              <span className="text-white text-sm font-semibold">
                {data?.user?.firstName?.[0] ?? 'U'}
              </span>
            </div>
          )
        ) : (
          // CONNECTED → show partner
          partnerProfile?.avatarUrl ? (
            <img
              src={partnerProfile.avatarUrl}
              alt="partner avatar"
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 shadow-lg">
              <span className="text-white text-sm font-semibold">
                {partnerProfile?.name?.[0] ?? 'U'}
              </span>
            </div>
          )
        )}


        {/* User Info */}
        <div className="flex flex-col leading-tight">
          {/* Name + Plan */}
          {!connected &&
            <>
              <div className="flex items-center gap-2">
                <h2 className="text-white text-sm font-medium">
                  {data?.user?.firstName} {data?.user?.lastName}
                </h2>
                <PlanBadge planName={state?.planName} />
              </div>

              {/* Username / Status */}
              <span className="text-zinc-400 text-[10px] tracking-wider">
                {connected ? partnerProfile?.username : data?.user?.userName}
              </span>
            </>
          }
          {connected &&
            <>
              <div className="flex items-center gap-2">
                <h2 className="text-white text-sm font-medium">
                  {partnerProfile?.name}
                </h2>
              </div>

              {/* Username / Status */}
              <span className="text-zinc-400 text-[10px] tracking-wider">
                {connected ? partnerProfile?.username : data?.user?.userName}<span className='px-4'>{partnerProfile?.city}</span><span></span>
              </span>
            </>
          }

          {/* Interests */}
          {displayedInterests && displayedInterests.length == 0 &&
            <div className='mt-1 flex items-center gap-1 flex-wrap'>
              <Button
                size="xs"
                variant="subtle"
                color="indigo"
                h={18}
                px={0} // Forces horizontal padding to 0
                vars={(theme) => ({
                  root: {
                    '--button-hover': 'transparent', // Disables the background change
                    '--button-active': 'transparent', // Disables the click/pressed effect
                  },
                })}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  },
                }}
                onClick={() => setEditInterestsOpen(true)}
              >
                <span>Add Interests</span> <Pencil size={10} className="ml-2" />
              </Button>
            </div>
          }
          {displayedInterests && displayedInterests.length > 0 && (
            <div className="mt-1 flex items-center gap-1 flex-wrap">
              {displayedInterests.map((interest, index) => (
                <Badge
                  key={index}
                  size="xs"
                  color="indigo"
                  variant="light"
                  className="px-1.5 py-[2px] text-[9px]"
                >
                  {interest}
                </Badge>
              ))}

              {!connected && (
                <Button
                  size="xs"
                  variant="subtle"
                  color="indigo"
                  px={2}
                  h={18}
                  className="min-w-0"
                  onClick={() => setEditInterestsOpen(true)}
                >
                  <Pencil size={10} />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 relative">
        {connected ? (
          <button
            disabled={state?.max_friend_req == 0}
            onClick={sendFriendRequest2}
            className="px-3 text-xs rounded-md font-medium hover:bg-white/10 text-white disabled:text-white/50"
          >
            <UserPlus2Icon size={24} />
          </button>
        ) : (
          <>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Settings size={18} className="hover:text-white/80" />
            </button>

            {settingsOpen && (
              <div className="absolute right-0 top-10 w-40 bg-[#151a35] border border-white/10 rounded-md shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    setEditProfileOpen(true);
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-white/10"
                >
                  Edit Profile
                </button>

                <button
                  onClick={async () => {
                    await signOut();
                    clearPlan();
                  }}
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
