import { z } from "zod";

export const createRoomInput = z.object({
  roomName: z.string(),
  hostEmail: z.string(),
  startDateTime: z.date().optional(),
  participantsEmails: z.string().optional(),
  maxParticipants: z.number().optional(),
  boilerplateCode: z.string().optional(),
  controlMicrophone: z.boolean().default(false),
  allowPasting: z.boolean().default(false),
  programmingLanguage: z.string().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomInput>;
