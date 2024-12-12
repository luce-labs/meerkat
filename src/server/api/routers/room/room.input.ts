import { z } from "zod";

export const createRoomInput = z.object({
  userName: z.string(),
  roomName: z.string(),
  maxParticipants: z.number().optional(),
  boilerplateCode: z.string().optional(),
  controlMicrophone: z.boolean().default(false),
  allowPasting: z.boolean().default(false),
  programmingLanguage: z.string().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomInput>;
