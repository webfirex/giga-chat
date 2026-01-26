'use client';

import { usePlan } from '@/contexts/PlanContext';
import {
  Modal,
  Avatar,
  Button,
  Group,
  PillsInput,
  Pill,
} from '@mantine/core';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import PremiumModal from './Modal';

interface EditProfileModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function EditProfileModal({
  opened,
  onClose,
}: EditProfileModalProps) {
  const { data: session, update } = useSession();
  const { state } = usePlan();

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [chatCount, setchatCount] = useState('');


  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);


  /* -------------------- Initialize From Session -------------------- */
  useEffect(() => {
    if (!opened) return;

    const fetchUser = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/user/user-details');
        const data = await res.json();

        console.log("USER DATA", data)

        setProfile(data);

        setUsername(data.data.userName ?? '');
        setFirstName(data.data.firstName ?? '');
        setLastName(data.data.lastName ?? '');
        setCity(data.data.city ?? '');
        setStateValue(data.data.state ?? '');
        setAvatar(data.data.pfpUrl ?? null);
        setchatCount(data.data.chatCount)
        // setGender((data.data.gender))
        setGender(
          data.data.gender
            ? data.data.gender.charAt(0).toUpperCase() +
            data.data.gender.slice(1).toLowerCase()
            : ''
        );


        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load profile');
      }
      finally {
        setLoading(false)
      }
    };

    fetchUser();
  }, [opened]);


  /* -------------------- Handlers -------------------- */
  const handleCancelPlan = async () => {
    try {
      await fetch('/api/payu/cancel-subscription', {
        method: 'POST',
      });

      onClose(); // close EditProfileModal
    } catch (err) {
      console.error(err);
    }
  };

  const handleDowngradePlan = async () => {
    try {
      await fetch('/api/payu/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'jnwsdjkbn3kbribt4jb34un',
        }),
      });

      onClose(); // close EditProfileModal
    } catch (err) {
      console.error(err);
    }
  };


  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const payload: Record<string, any> = {};

    if (username.trim() && username !== profile?.userName) {
      payload.username = username.trim();
    }

    if (firstName.trim() && firstName !== profile?.firstName) {
      payload.firstName = firstName.trim();
    }

    if (lastName.trim() && lastName !== profile?.lastName) {
      payload.lastName = lastName.trim();
    }

    if (gender && gender !== profile?.gender) {
      payload.gender = gender;
    }

    if (city.trim() && city !== profile?.city) {
      payload.city = city.trim();
    }

    if (stateValue.trim() && stateValue !== profile?.state) {
      payload.state = stateValue.trim();
    }

    if (avatar && avatar !== profile?.image) {
      payload.avatar = avatar;
    }

    if (Object.keys(payload).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Failed to update profile');
        return;
      }

      await update({
        user: {
          ...session?.user,
          ...(payload.username && { userName: payload.username }),
          ...(payload.firstName && { firstName: payload.firstName }),
          ...(payload.lastName && { lastName: payload.lastName }),
          ...(payload.gender && { gender: payload.gender }),
        },
      });
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };


  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title="Profile Settings"
        centered
        overlayProps={{ opacity: 0.55, blur: 3 }}
        styles={{
          content: { backgroundColor: '#0e1326' },
          header: { backgroundColor: '#0e1326' },
          title: { color: 'white' },
        }}
      >
        {/* Avatar */}
        <Group justify="center" mb="md">
          <Avatar
            size={80}
            radius="xl"
            src={avatar || undefined}
            className="cursor-pointer"
          />
        </Group>



        {/* Interests */}
        <div className="space-y-3">
          {/* Username */}
          {!state?.name_edit && (
            <p className="mb-1 text-sm text-red-400">
              Username editing is disabled on the free plan
            </p>
          )}

          <input
            value={username}
            disabled={!state?.name_edit}
            onChange={(e) => setUsername(e.currentTarget.value)}
            placeholder={session?.user?.userName || 'Username'}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <input
            value={firstName}
            onChange={(e) => setFirstName(e.currentTarget.value)}
            placeholder={session?.user?.firstName || 'First Name'}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <input
            value={lastName}
            onChange={(e) => setLastName(e.currentTarget.value)}
            placeholder={session?.user?.lastName || 'Last Name'}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="relative">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="select-dark"
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* Chevron */}
            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>




          <input
            value={city}
            onChange={(e) => setCity(e.currentTarget.value)}
            placeholder={city || "City"}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <input
            value={stateValue}
            onChange={(e) => setStateValue(e.currentTarget.value)}
            placeholder={stateValue || "State"}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 flex items-center justify-between">

          <div className='flex gap-14'>

            <div className=''>
              <p className="text-sm font-medium text-white">Current Plan</p>
              <p className="text-xs text-zinc-400">
                {state?.planName ?? 'Free'}
              </p>
            </div>
            {/* 
            <div>
              <p className="text-sm font-medium text-white">Chats Left</p>
              <p className="text-xs text-zinc-400">
                {loading ? "Loading..." : (Number(chatCount) > 1000 ? "Inf" : chatCount)}
              </p>
            </div> */}

          </div>

          <div className="flex gap-2">
          <div className='pr-6'>
              <p className="text-sm font-medium text-white">Chats Left</p>
              <p className="text-xs text-zinc-400">
                {loading ? "Loading..." : (Number(chatCount) > 1000 ? "Inf" : chatCount)}
              </p>
            </div>

            {/* BASIC */}
            {/* {state?.planName === 'Basic' && (
              <>
                <Button
                  size="xs"
                  color="red"
                  variant="light"
                  onClick={handleCancelPlan}
                >
                  Cancel Plans
                </Button>
              </>
            )} */}

            {/* PREMIUM */}
            {state?.planName === 'Premium' && (
              <>
                {/* <Button
                size="xs"
                variant="light"
                onClick={handleDowngradePlan}
              >
                Downgrade
              </Button> */}
                {/* <Button
                  size="xs"
                  color="red"
                  variant="light"
                  onClick={handleCancelPlan}
                >
                  Cancel Plans
                </Button> */}
              </>
            )}
          </div>
        </div>





        {/* Error */}
        {error && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        {/* Actions */}
        <Group justify="center" mt="lg">
          <Button variant="default" onClick={onClose} disabled={saving} style={{ borderRadius: "8px" }}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave} className='rounded-lg' style={{ borderRadius: "8px", backgroundColor: "#4f39f6" }}>
            Save
          </Button>
        </Group>
      </Modal>
    </>
  );
}
