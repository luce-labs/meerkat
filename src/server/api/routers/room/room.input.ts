import { z } from "zod";

export const createRoomInput = z.object({
  roomName: z.string(),
  createdAt: z.string(),
  maxParticipants: z.number().nullable(),
  boilerplateCode: z.string().nullable(),
  controlMicrophone: z.boolean(),
  allowPasting: z.boolean(),
  programmingLanguage: z.string().nullable(),
});

export type CreateRoomInput = z.infer<typeof createRoomInput>;
