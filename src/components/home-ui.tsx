"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeUI() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const handleNewRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-16 xl:gap-24">
        {/* Left content section */}
        <div className="mt-8 flex flex-col space-y-8 lg:mt-24 lg:max-w-3xl xl:max-w-4xl">
          <div className="space-y-6">
            <h1 className="text-3xl font-normal leading-tight text-gray-900 md:text-4xl lg:text-5xl">
              Collaborative editing
              <br />
              for everyone
            </h1>
            <p className="text-base leading-relaxed text-gray-500 md:text-xl">
              Connect, collaborate, and code together from <br />
              anywhere with Meerkat
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button
              onClick={handleNewRoom}
              className="w-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
            >
              New room
            </Button>

            <form onSubmit={handleJoinRoom} className="w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Input
                  type="text"
                  placeholder="Enter a room code"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="h-10 w-full rounded-l border-r-0 bg-white pr-12 text-sm placeholder:text-gray-500 sm:w-64"
                />
                <Button
                  type="submit"
                  className="absolute right-0 top-0 h-full rounded-l-none border border-l-0 border-gray-300 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Join
                </Button>
              </div>
            </form>
          </div>

          <div className="text-sm">
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Learn more
            </a>{" "}
            about Meerkat
          </div>
        </div>

        {/* Right decorative section */}
        <div className="relative mt-12 flex items-center justify-center lg:mt-0">
          <div className="relative h-48 w-48 overflow-hidden rounded-full bg-blue-50 md:h-72 md:w-72 lg:h-96 lg:w-96">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex -space-x-4">
                <div className="h-16 w-16 rounded-full bg-yellow-400 md:h-24 md:w-24 lg:h-32 lg:w-32" />
                <div className="h-16 w-16 rounded-full bg-green-400 md:h-24 md:w-24 lg:h-32 lg:w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
