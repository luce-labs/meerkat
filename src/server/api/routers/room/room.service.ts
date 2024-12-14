import { generateRoomName } from "@/lib/room-name-generator";
import { db } from "@/server/db";

import type { CreateRoomInput } from "./room.input";
export async function createRoom(input: CreateRoomInput) {
  const room = await db.room.create({
    data: {
      ...input,
    },
  });

  return room;
}


export async function createInstantRoom() {
  const room = await db.room.create({
    data: {
      roomName: await generateRoomName(),
      controlMicrophone: true,
      allowPasting: true,
    },
  });

  return room;
}
