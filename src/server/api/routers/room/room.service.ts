import * as inputs from "./room.input";
import { db } from "@/server/db";

export async function createRoom(input: inputs.CreateRoomInput) {
  console.log(input);

  try {
    const room = await db.room.create({
      data: input,
    });

    return room;
  } catch (e) {
    console.error("Error creating room:", e);
    throw new Error("Error creating room");
  }
}
