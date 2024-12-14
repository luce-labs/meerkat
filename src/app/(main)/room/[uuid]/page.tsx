import { notFound } from "next/navigation";

import { db } from "@/server/db";

import { PendingMeeting } from "./pending-meeting";
import { RoomClient } from "./room-client";

interface PageProps {
  readonly params: {
    uuid: string;
  };
}

export default async function RoomPage({ params }: PageProps) {
  const room = await db.room.findUnique({
    where: { id: params.uuid },
  });

  if (!room) {
    notFound();
  }

  const now = new Date();
  const startTime = new Date(room.startDateTime ?? now);
  const isMeetingStarted = now >= startTime;

  if (!isMeetingStarted) {
    return <PendingMeeting room={room} />;
  }

  return <RoomClient room={room} />;
}
