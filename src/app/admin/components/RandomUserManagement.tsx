"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { notifications } from "@mantine/notifications";


type User = {
  id: string;
  fullName: string;
  userName: string;
  age: number;
  city: string;
  gender: string;
  pfpUrl: string;
  selected?: boolean;
};


export default function RandomUsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  // create user form state
  const [form, setForm] = useState({
    fullName: "",
    userName: "",
    age: "",
    city: "",
    gender: "",
    pfpUrl: "",
  });


  const selectedUsers = users.filter(u => u.selected);

  const fetchUsers = async (reset = false) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/random-users?page=${reset ? 1 : page}`);
    const data = await res.json();

    setUsers(prev => (reset ? data : [...prev, ...data]));
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers(true);
  }, []);

  const deleteSelected = async () => {
    await fetch("/api/admin/users/random-users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedUsers.map(u => u.id) }),
    });

    setUsers(users.filter(u => !u.selected));
  };

  const addUser = async () => {
    if (!form.pfpUrl) {
      notifications.show({
        title:"Please enter a image url",
        message:"The image url cannot be empty",
        color:"yellow"
      })
      return
    }

    try {
      const res = await fetch("/api/admin/users/random-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          userName: form.userName,
          age: Number(form.age),
          city: form.city,
          gender: form.gender.toLowerCase(),
          pfpUrl: form.pfpUrl,
        }),
      });

      const createdUser = await res.json();
      if (!res.ok) throw new Error(createdUser.error);

      setUsers(prev => [createdUser, ...prev]);
      setOpen(false);

      setForm({
        fullName: "",
        userName: "",
        age: "",
        city: "",
        gender: "",
        pfpUrl: "",
      });
    } catch (err) {
      console.error(err);
      notifications.show({
        title:"Error",
        message:"Something went wrong",
        color:"red"
      })
    }
  };



  return (
    <div className="flex flex-col gap-5 h-full pr-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            disabled={!selectedUsers.length}
            onClick={deleteSelected}
          >
            Delete ({selectedUsers.length})
          </Button>

          <Button
            className="bg-indigo-600"
            onClick={() => setOpen(true)}
          >
            Add User
          </Button>
        </div>
      </div>


      {/* Add User */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-[#0b0f1a] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-center mb-2">Add New User</DialogTitle>
          </DialogHeader>

          {/* Full Name */}
          <div className="">
            <label className="mb-1 block text-sm text-gray-300">Full Name</label>
            <input
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              placeholder="John Doe"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Username */}
          <div className="">
            <label className="mb-1 block text-sm text-gray-300">Username</label>
            <input
              value={form.userName}
              onChange={e => setForm({ ...form, userName: e.target.value })}
              placeholder="johndoe"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Age */}
          <div className="">
            <label className="mb-1 block text-sm text-gray-300">Age</label>
            <input
              type="number"
              value={form.age}
              onChange={e => setForm({ ...form, age: e.target.value })}
              placeholder="25"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* City */}
          <div className="">
            <label className="mb-1 block text-sm text-gray-300">City</label>
            <input
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="Banglore"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Gender */}
          <div className="">
            <label className="mb-1 block text-sm text-gray-300">Gender</label>
            <input
              value={form.gender}
              onChange={e => setForm({ ...form, gender: e.target.value })}
              placeholder="Male / Female"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Profile Image URL */}
          <div className="mb-6">
            <label className="mb-1 block text-sm text-gray-300">Profile Image URL</label>
            <input
              type="url"
              value={form.pfpUrl}
              onChange={e => setForm({ ...form, pfpUrl: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addUser} className="bg-indigo-600">
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>


      {/* Table */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-white/10 scrollbar-indigo">
        <table className="w-full text-sm">
          <thead className="bg-[#0b0f1a] text-white/50">
            <tr>
              <th className="p-4 w-10" />
              <th className="p-4">PFP</th>
              <th className="p-4 text-left">Full Name</th>
              <th className="p-4 text-left">Username</th>
              <th className="p-4 text-center">Age</th>
              <th className="p-4 text-center">City</th>
              <th className="p-4 text-center">Gender</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={user.id}
                className={`${idx % 2 === 0 ? "bg-[#0f1424]" : "bg-[#0b0f1a]"}`}
              >
                <td className="p-4">
                  <button
                    onClick={() =>
                      setUsers(users.map(u =>
                        u.id === user.id
                          ? { ...u, selected: !u.selected }
                          : u
                      ))
                    }
                    className={`w-5 h-5 rounded border flex items-center justify-center ${user.selected
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-white/20"
                      }`}
                  >
                    {user.selected && <Check size={14} className="text-white" />}
                  </button>
                </td>

                <td className="p-4">
                  <img
                    src={user.pfpUrl}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                </td>

                <td className="p-4 font-medium">{user.fullName}</td>
                <td className="p-4 text-indigo-400">{user.userName}</td>
                <td className="p-4 text-center">{user.age}</td>
                <td className="p-4 text-center">{user.city}</td>
                <td className="p-4 text-center">{user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <Button
          onClick={() => {
            setPage(p => {
              const next = p + 1;
              fetch(`/api/admin/users?page=${next}`)
                .then(res => res.json())
                .then(data => setUsers(prev => [...prev, ...data]));
              return next;
            });

          }}
          disabled={loading}
          className="bg-indigo-600"
        >
          Load More
        </Button>
      </div>
    </div>
  );
}
