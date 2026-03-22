"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onClose: () => void;
}

export default function DisplayNameModal({ onClose }: Props) {
  const { profile, updateDisplayName } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("名前を入力してください"); return; }
    if (trimmed.length > 20) { setError("20文字以内で入力してください"); return; }
    setSaving(true);
    try {
      await updateDisplayName(trimmed);
      onClose();
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">表示名を変更</h2>

        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="新しい表示名（20文字以内）"
          maxLength={20}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-1"
          autoFocus
        />
        <p className="text-xs text-gray-400 text-right mb-3">{name.length}/20</p>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
