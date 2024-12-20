import { z } from "zod";

export const judge0ResponseSchema = z.object({
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

export const judge0LanguageSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_archived: z.boolean(),
});

export type judge0ResponseSchema = z.infer<typeof judge0ResponseSchema>;
export type judge0LanguageSchema = z.infer<typeof judge0LanguageSchema>;
