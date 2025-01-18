import { env } from "@/env";
import { generateName } from "@/lib/generic-name-generator";
import { sendMeetingEmail } from "@/lib/mail/mailer";
import { db } from "@/server/db";

import type { CreateRoomInput } from "./room.input";

export async function createRoom(input: CreateRoomInput) {
  const room = await db.room.create({
    data: {
      ...input,
    },
  });

  if (input.hostEmail) {
    const roomLink = `${env.NEXT_PUBLIC_APP_URL}/room/${room.id}`;

    await sendMeetingEmail({
      roomLink,
      scheduledDateAndTime:
        input.startDateTime?.toISOString() ?? new Date().toISOString(),
      to: input.hostEmail,
      from: env.SMTP_FROM_EMAIL ?? "noreply@meerkat.com",
      subject: "Your Meerkat Room is Ready",
    });
  }

  return room;
}

export async function createInstantRoom() {
  return await db.room.create({
    data: {
      roomName: await generateName(),
      controlMicrophone: true,
      allowPasting: true,
    },
  });
}
