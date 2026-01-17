'use client';

import { Smile } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
// Import the Theme enum
import { Theme } from 'emoji-picker-react';

const Picker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function EmojiInput({ value, onChange, disabled }: any) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShow(!show)}
        className="p-2 rounded-md disabled:opacity-50"
      >
        <Smile className="w-5 h-5 text-zinc-300" />
      </button>

      {show && (
        <div className="absolute bottom-full right-1 z-50 mt-2">
          <Picker
            theme={Theme.DARK} // Use the enum here
            onEmojiClick={(emoji) => {
              onChange(value + emoji.emoji);
              setShow(false);
            }}
          />
        </div>
      )}
    </div>
  );
}