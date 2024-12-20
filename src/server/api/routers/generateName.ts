import { promises as fs } from "fs";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const nameRouter = createTRPCRouter({
  generate: publicProcedure.query(async () => {
    try {
      const adjectives = JSON.parse(
        await fs.readFile(
          process.cwd() + "/src/lib/generic-name-generator/adjectives.json",
          "utf-8",
        ),
      ) as string[];
      const nouns = JSON.parse(
        await fs.readFile(
          process.cwd() + "/src/lib/generic-name-generator/names.json",
          "utf-8",
        ),
      ) as string[];

      const adjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];

      return `${adjective}-${noun}`;
    } catch (error) {
      throw new Error("Error reading JSON files or generating name");
    }
  }),
});
