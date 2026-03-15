import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "tether",
  // Force Cloud mode unless explicitly in dev (avoids routing to localhost)
  isDev: process.env.INNGEST_DEV === "1",
});
