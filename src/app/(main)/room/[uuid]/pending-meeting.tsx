import { AlertTitle, Alert, AlertDescription } from "@/components/ui/alert";
import { Room } from "@prisma/client";

interface PendingMeetingProps {
  room: Room;
}

export function PendingMeeting({ room }: Readonly<PendingMeetingProps>) {
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
