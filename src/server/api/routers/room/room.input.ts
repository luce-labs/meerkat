import { z } from "zod";


export const createRoomInput = z.object({
  boilerplateCode: z.string(),
  controlMicrophone: z.boolean(),
  // other stuff we talked about but if there is something else, you should add it.
});

export type CreateRoomInput = z.infer<typeof createRoomInput>;