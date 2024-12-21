// src/lib/nameService.ts
import { promises as fs } from "fs";

export async function generateName(): Promise<string> {
  try {
    // Read the adjectives and nouns JSON files
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

    if (adjectives.length === 0 || nouns.length === 0) {
      throw new Error("Adjectives or nouns list is empty.");
    }

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adjective}-${noun}`;
  } catch (error: unknown) {
    // Specific error handling for different error cases
    if (error instanceof SyntaxError) {
      throw new Error("Error parsing JSON files. Please check the format.");
    } else if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        "Error reading files. The required JSON files are missing.",
      );
    } else {
      // General error for any other issue
      throw new Error("Error generating name: " + (error as Error).message);
    }
  }
}
