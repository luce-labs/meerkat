"use client";

import { AlertTitle, Alert, AlertDescription } from "@/components/ui/alert";

export function PendingMeeting({ room }: { room: any }) {
  return (
    <div className="pointer-events-auto fixed inset-0 flex items-center justify-center">
      <Alert variant="default" className="m-4 w-fit">
        <AlertTitle>Meeting Has Not Started</AlertTitle>
        <AlertDescription>
          This meeting room will be active from{" "}
          {room.startDateTime?.toLocaleString()
            ? new Date(room.startDateTime).toLocaleString()
            : "Invalid start time"}
        </AlertDescription>
      </Alert>
    </div>
  );
}
