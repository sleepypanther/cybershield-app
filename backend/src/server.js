import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";

async function boot() {
  await connectDb();

  const app = createApp();
  app.listen(env.port, env.host, () => {
    console.log(
      `CyberShield backend running on http://${env.host}:${env.port}`
    );
  });
}

boot().catch((error) => {
  console.error("Failed to start backend");
  console.error(error);
  process.exit(1);
});
