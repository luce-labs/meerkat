import { createTRPCRouter, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { Judge0Response, Judge0Submission } from "@/types/judge0";
import { z } from "zod";
import { judge0ResponseSchema, judge0LanguageSchema } from "./judge0.input";
import { env } from "@/env";

const JUDGE0_URL = env.JUDGE0_URL ?? "http://localhost:2358";

export const judge0Router = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        source_code: z.string().min(1, "Source code cannot be empty"),
        language_id: z.number().positive("Invalid language ID"),
        stdin: z.string().optional(),
      }),
    )
    .mutation(async ({ input }: { input: Judge0Submission }) => {
      try {
        const response = await fetch(`${JUDGE0_URL}/submissions?wait=false`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...input,
            wait: true,
            cpu_time_limit: 5,
            memory_limit: 512000,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawResult = await response.json();

        const result: Judge0Response = judge0ResponseSchema.parse(rawResult);

        if (result.status.id >= 6) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.status.description,
            cause: {
              compile_output: result.compile_output,
              stderr: result.stderr,
            },
          });
        }

        return result;
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error) {
          console.error("Judge0 submission error:", error.message);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to execute code",
            cause: error.message,
          });
        }

        console.error("Unexpected error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred",
          cause: String(error),
        });
      }
    }),

  getLanguages: publicProcedure.query(async () => {
    try {
      const response = await fetch(`${JUDGE0_URL}/languages`);

      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status}`);
      }

      const rawLanguages = await response.json();

      const languages = z.array(judge0LanguageSchema).parse(rawLanguages);

      return languages
        .filter((lang) => !lang.is_archived)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Failed to fetch languages:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch supported languages",
        cause: error,
      });
    }
  }),
});
