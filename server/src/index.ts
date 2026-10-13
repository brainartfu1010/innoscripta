import "dotenv/config";
import { createApp } from "./app.ts";
import { createSources } from "./sources/registry.ts";

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const app = createApp(createSources(process.env));
app.listen(port, () => {
  console.log(`News aggregator listening on ${port}`);
});
