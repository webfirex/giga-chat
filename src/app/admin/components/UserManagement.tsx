"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

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

// 🔥 dummy upload function
const uploadImageToDB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  // Replace this with your actual endpoint (e.g., Cloudinary, S3, or local API)
  const response = await fetch("/api/mod/upload-image", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!data.success) {
    console.log("MESSAGE IMAGE BB", data)
    throw new Error("Upload failed");
  }

  return data.imageUrl; // The hosted link returned by your DB/Storage
};

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // create user form state
  const [form, setForm] = useState({
    fullName: "",
    userName: "",
    age: "",
    city: "",
    gender: "",
    image: null as File | null,
  });

  const selectedUsers = users.filter(u => u.selected);

  const fetchUsers = async (reset = false) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${reset ? 1 : page}`);
    const data = await res.json();

    setUsers(prev => (reset ? data : [...prev, ...data]));
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers(true);
  }, []);

  const deleteSelected = async () => {
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedUsers.map(u => u.id) }),
    });

    setUsers(users.filter(u => !u.selected));
  };

  const addUser = async () => {
    if (!form.image) return alert("Please select an image");
  
    try {
      const pfpUrl = await uploadImageToDB(form.image);
  
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          userName: form.userName,
          age: Number(form.age),
          city: form.city,
          gender: form.gender,
          pfpUrl,
        }),
      });
  
      const createdUser = await res.json();
  
      if (!res.ok) throw new Error(createdUser.error);
  
      setUsers(prev => [createdUser, ...prev]);
  
      setForm({
        fullName: "",
        userName: "",
        age: "",
        city: "",
        gender: "",
        image: null,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create user");
    }
  };
  

  return (
    <div className="flex flex-col gap-5 h-full pr-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>

        <Button
          variant="destructive"
          disabled={!selectedUsers.length}
          onClick={deleteSelected}
        >
          Delete ({selectedUsers.length})
        </Button>
      </div>

      {/* Add User */}
      <div className="grid grid-cols-7 gap-3 bg-[#0b0f1a] p-4 rounded-lg border border-white/10">
        <input
          className="input"
          placeholder="Full Name"
          value={form.fullName}
          onChange={e => setForm({ ...form, fullName: e.target.value })}
        />
        <input
          className="input"
          placeholder="Username"
          value={form.userName}
          onChange={e => setForm({ ...form, userName: e.target.value })}
        />
        <input
          className="input"
          placeholder="Age"
          type="number"
          value={form.age}
          onChange={e => setForm({ ...form, age: e.target.value })}
        />
        <input
          className="input"
          placeholder="City"
          value={form.city}
          onChange={e => setForm({ ...form, city: e.target.value })}
        />
        <input
          className="input"
          placeholder="Gender"
          value={form.gender}
          onChange={e => setForm({ ...form, gender: e.target.value })}
        />
        <input
          type="file"
          accept="image/*"
          onChange={e =>
            setForm({ ...form, image: e.target.files?.[0] ?? null })
          }
        />
        <Button onClick={addUser} className="bg-indigo-600">
          Add
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-white/10">
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
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                      user.selected
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
                <td className="p-4 text-center">{user.gender}</td>
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
