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
