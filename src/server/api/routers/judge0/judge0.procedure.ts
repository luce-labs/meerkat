import { createTRPCRouter, publicProcedure } from "../../trpc";

import * as inputs from "./judge0.input";
import * as services from "./judge0.service";

export const judge0Router = createTRPCRouter({
  submit: publicProcedure
    .input(inputs.judge0SubmissionSchema)
    .mutation(async ({ input }) => {
      return services.submitCode(input);
    }),

  getLanguages: publicProcedure.mutation(async () => {
    return services.getLanguages();
  }),
});
