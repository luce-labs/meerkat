import { promises as fs } from "fs";

export async function generateName(): Promise<string> {
  const adjectives = JSON.parse(
    await fs.readFile(
      process.cwd() + "/src/lib/room-name-generator/adjectives.json",
      "utf-8",
    ),
  ) as string[];
  const nouns = JSON.parse(
    await fs.readFile(
      process.cwd() + "/src/lib/room-name-generator/names.json",
      "utf-8",
    ),
  ) as string[];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective}-${noun}`;
}
