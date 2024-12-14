import { notFound } from "next/navigation";

import { db } from "@/server/db";

import { RoomClient } from "./room-client";

interface PageProps {
  readonly params: {
    uuid: string;
  };
}

export default async function RoomPage({ params }: PageProps) {
  let room = await db.room.findUnique({
    where: { id: params.uuid },
  });

  if (!room) {
    try {
      room = await db.room.create({
        data: {
          id: params.uuid,
          roomName: `Room ${params.uuid.slice(0, 8)}`,
          createdAt: new Date(),
          maxParticipants: 10,
          participantsJoined: 0,
          controlMicrophone: true,
          allowPasting: true,
          boilerplateCode: null,
          programmingLanguage: null,
        },
      });
    } catch (error) {
      console.error("Failed to create room:", error);
      notFound();
    }
  }

  return <RoomClient room={room} />;
}
