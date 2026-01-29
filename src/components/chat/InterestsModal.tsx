'use client';

import { Modal, Button, Group, PillsInput, Pill } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePlan } from '@/contexts/PlanContext';

interface InterestsModalProps {
    opened: boolean;
    onClose: () => void;
}

export default function InterestsModal({ opened, onClose }: InterestsModalProps) {
    const { data: session, update } = useSession();
    const { state } = usePlan();

    const [interests, setInterests] = useState<string[]>([]);
    const [interestValue, setInterestValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* -------------------- Initialize from plan state first -------------------- */
    useEffect(() => {
        if (opened && session?.user?.interests?.length) {
            setInterests(session?.user?.interests);
        }
    }, [opened, session?.user?.interests]);

    /* -------------------- Load from API (source of truth) -------------------- */
    useEffect(() => {
        if (!opened) return;

        const fetchUser = async () => {
            try {
                // const res = await fetch('/api/user');
                // const data = await res.json();

                // console.log("USER DATA", data)

                // if (Array.isArray(data.interests)) {
                //     setInterests(data.interests);
                // }

                setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to load interests');
            }
        };

        fetchUser();
    }, [opened]);

    /* -------------------- Save -------------------- */
    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interests }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data?.error || 'Failed to update interests');
                return;
            }

            await update({
                user: {
                    ...session?.user,
                    interests,
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
        <Modal
            opened={opened}
            onClose={onClose}
            title="Edit Interests"
            centered
            size="md"
            overlayProps={{ opacity: 0.55, blur: 3 }}
            styles={{
                content: {
                    backgroundColor: '#0e1326',
                },
                header: { backgroundColor: '#0e1326' },
                title: { color: 'white' },
            }}
        >
            <PillsInput label="Your interests">
                <Pill.Group>
                    {interests.map((item, index) => (
                        <Pill
                            key={index}
                            withRemoveButton
                            classNames={{
                                root:
                                    'bg-white/10 border border-white/10 text-white rounded-md',
                                remove: 'text-gray-400 hover:text-red-400',
                            }}
                            onRemove={() =>
                                setInterests(interests.filter((_, i) => i !== index))
                            }
                        >
                            {item}
                        </Pill>
                    ))}

                    <PillsInput.Field
                        value={interestValue}
                        onChange={(e) => setInterestValue(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && interestValue.trim()) {
                                e.preventDefault();

                                if (!interests.includes(interestValue.trim())) {
                                    setInterests([...interests, interestValue.trim()]);
                                }

                                setInterestValue('');
                            }
                        }}
                        placeholder="Type and press Enter"
                        className="bg-transparent text-white focus:outline-none"
                    />
                </Pill.Group>
            </PillsInput>

            {error && (
                <p className="mt-4 text-sm text-red-400">{error}</p>
            )}

            <Group justify="center" mt="xl">
                <Button variant="default" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    loading={saving}
                    onClick={handleSave}
                    style={{ backgroundColor: '#4f39f6' }}
                >
                    Save
                </Button>
            </Group>
        </Modal>
    );

}
