import { env } from "@/env";
import { sendMeetingEmail } from "@/lib/mail/mailer";
import { generateRoomName } from "@/lib/room-name-generator";
import { db } from "@/server/db";

import type { CreateRoomInput } from "./room.input";

export async function createRoom(input: CreateRoomInput) {
  const room = await db.room.create({
    data: {
      ...input,
    },
  });

  if (input.hostEmail) {
    const roomLink = `http://localhost:3000/room/${room.id}`;
    
    await sendMeetingEmail({
      roomLink,
      scheduledDateAndTime: input.startDateTime?.toISOString() ?? new Date().toISOString(),
      to: input.hostEmail,
      from: env.SMTP_FROM_EMAIL ?? "noreply@meerkat.com",
      subject: "Your Meerkat Room is Ready",
    });
  }

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
