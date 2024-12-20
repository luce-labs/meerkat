import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  Judge0Response,
  Judge0Submission,
  Judge0Language,
} from "@/types/judge0";

const JUDGE0_URL = "http://localhost:2358";

const judge0ResponseSchema = z.object({
  token: z.string(),
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  compile_output: z.string().nullable(),
  message: z.string().nullable(),
  status: z.object({
    id: z.number(),
    description: z.string(),
  }),
});

const judge0LanguageSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_archived: z.boolean(),
});

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
        const response = await fetch(`${JUDGE0_URL}/submissions?wait=true`, {
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
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Judge0 submission error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to execute code",
          cause: error,
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
