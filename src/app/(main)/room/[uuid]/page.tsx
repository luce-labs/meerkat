import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { RoomClient } from "./room-client";

interface PageProps {
  params: {
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

  return <RoomClient room={room} />;
}
