"use client";

import { useEffect, useState } from "react";
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
  const [meetingStatus, setMeetingStatus] = useState<
    "not_started" | "in_progress"
  >("not_started");

  useEffect(() => {
    const now = new Date();
    const startTime = room.startDateTime
      ? new Date(room.startDateTime)
      : new Date();

    if (now < startTime) {
      setMeetingStatus("not_started");
    } else {
      setMeetingStatus("in_progress");
    }
  }, [room.startDateTime]);

  switch (meetingStatus) {
    case "in_progress": {
      return <RoomClient room={room} />;
    }

    case "not_started": {
      return <PendingMeeting room={room} />;
    }
  }
}
