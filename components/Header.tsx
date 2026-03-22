"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import DisplayNameModal from "./DisplayNameModal";

export default function Header() {
  const { user, profile, signInWithGoogle, signInAsGuest, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-90">
            BookRoom
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-1 text-sm hover:opacity-80 transition group"
                  title="プロフィール"
                >
                  <span>{profile?.displayName ?? "ユーザー"}</span>
                  {user.isAnonymous && (
                    <span className="text-indigo-200 text-xs">(匿名)</span>
                  )}
                </Link>
                <button
                  onClick={() => setShowModal(true)}
                  className="hidden sm:flex text-indigo-200 hover:text-white text-sm transition"
                  title="表示名を変更"
                >
                  ✏️
                </button>
                <Link
                  href="/mypage"
                  className="text-sm bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-md transition"
                >
                  マイページ
                </Link>
                <button
                  onClick={logout}
                  className="text-sm bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-md transition"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={signInWithGoogle}
                  className="text-sm bg-white text-indigo-600 font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-md transition"
                >
                  Googleでログイン
                </button>
                <button
                  onClick={signInAsGuest}
                  className="text-sm bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-md transition"
                >
                  匿名で参加
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {showModal && <DisplayNameModal onClose={() => setShowModal(false)} />}
    </>
  );
}
