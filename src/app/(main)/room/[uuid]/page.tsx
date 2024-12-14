import { notFound } from "next/navigation";

import { db } from "@/server/db";

import RoomStatusManager from "./RoomStatusManager";

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

  return <RoomStatusManager room={room} />;
}
