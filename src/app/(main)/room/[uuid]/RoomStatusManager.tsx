"use client";

import { useState, useEffect } from "react";
import { RoomClient } from "./room-client";
import { PendingMeeting } from "./pending-meeting";

export default function RoomStatusManager({ room }: { room: any }) {
  const [meetingStatus, setMeetingStatus] = useState<
    "not_started" | "in_progress"
  >("not_started");

  useEffect(() => {
    const now = new Date();
    const startTime = new Date(room.startDateTime || now);

    setMeetingStatus(now < startTime ? "not_started" : "in_progress");
  }, [room.startDateTime]);

  if (meetingStatus === "in_progress") {
    return <RoomClient room={room} />;
  }

  return <PendingMeeting room={room} />;
}
