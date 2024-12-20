import { postRouter } from "@/server/api/routers/post";
import { roomRouter } from "@/server/api/routers/room/room.procedure";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { judge0Router } from "./routers/judge0";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  room: roomRouter,
  judge0: judge0Router,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
