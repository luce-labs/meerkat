import { notFound } from "next/navigation";

import { db } from "@/server/db";

import { RoomClient } from "./room-client";
import { PendingMeeting } from "./pending-meeting";

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
  const startTime = new Date(room.startDateTime || now);
  const meetingStatus = now < startTime ? "not_started" : "in_progress";

  if (meetingStatus === "not_started") {
    return <RoomClient room={room} />;
  }

  return <PendingMeeting room={room} />;
}
