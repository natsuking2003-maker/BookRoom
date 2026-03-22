"use client";

interface Props {
  message: string;
  show: boolean;
}

export default function Toast({ message, show }: Props) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50
        bg-gray-800 text-white text-sm px-5 py-2.5 rounded-full shadow-lg
        transition-all duration-300 whitespace-nowrap
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}
    >
      {message}
    </div>
  );
}
