"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const page = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      // Handle signup failure
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Signup failed");
        setLoading(false);
        return; // Stop execution here
      }

      // Attempt automatic login after successful signup
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (login?.error) {
        setError("Account created, but login failed");
        setLoading(false);
        return;
      }

      // Success: Redirect to chat
      router.push("/chat");

    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded bg-white p-6 shadow"
      >
        <h1 className="mb-6 text-2xl font-bold text-center">Sign Up</h1>

        {error && (
          <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

export default page