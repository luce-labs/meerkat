// src/server/api/routers/nameRouter.ts
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { generateName } from "./generic-name.service";

export const nameRouter = createTRPCRouter({
  generate: publicProcedure.query(async () => {
    try {
      const name = await generateName();
      return name;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error("Error generating name: " + error.message);
      } else {
        throw new Error("Error generating name");
      }
    }
  }),
});
