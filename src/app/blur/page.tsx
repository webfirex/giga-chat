"use client";

import { useState } from "react";

export default function BlurImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/blur", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      setLoading(false);
      alert("Failed to blur image");
      return;
    }

    const blob = await res.blob();
    const imageUrl = URL.createObjectURL(blob);

    setPreview(imageUrl);
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h2>Blur an Image</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <br />
        <br />

        <button type="submit" disabled={!file || loading}>
          {loading ? "Blurring..." : "Upload & Blur"}
        </button>
      </form>

      {preview && (
        <>
          <h3>Blurred Result</h3>
          <img
            src={preview}
            alt="Blurred"
            style={{ width: "100%", marginTop: 12 }}
          />
        </>
      )}
    </div>
  );
}
