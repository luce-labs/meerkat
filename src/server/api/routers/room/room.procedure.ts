import { createTRPCRouter, publicProcedure } from "../../trpc";
import * as inputs from "./room.input";
import * as services from "./room.service";

export const roomRouter = createTRPCRouter({
  create: publicProcedure
    .input(inputs.createRoomInput)
    .mutation(async ({ ctx, input }) => {
      return services.createRoom(input);
    }),
});