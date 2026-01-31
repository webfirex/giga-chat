import { RandomUserProfile } from "@/hooks/useModChatSocket";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const removeEmojis = (text: string) => {
  return text.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
    ""
  );
};

type GenderMatch = "male" | "female" | "random";

export async function generateRandomUser(
  genderMatch: GenderMatch
): Promise<RandomUserProfile> {

  const res = await fetch(
    `/api/mod/get-random-user?gender=${genderMatch}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch random user");
  }

  const data = await res.json();

  return {
    name: data.name,
    username: data.username,
    avatarUrl: data.avatarUrl,
    age: data.age,
    city: data.city,
  };
}
