import { z } from "zod";

export const createRoomInput = z.object({
  roomName: z.string(),
  createdAt: z.string(),
  maxParticipants: z.number(),
  participantsJoined: z.number(),
  boilerplateCode: z.string(),
  controlMicrophone: z.boolean(),
  allowPasting: z.boolean(),
  programmingLanguage: z.string(),
});

export type CreateRoomInput = z.infer<typeof createRoomInput>;
