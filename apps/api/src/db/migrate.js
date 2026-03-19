import { applyMigrations } from "./client.js";

applyMigrations()
  .then(() => {
    console.log("StackPay API migrations applied");
  })
  .catch((error) => {
    console.error("Failed to apply StackPay API migrations");
    console.error(error);
    process.exitCode = 1;
  });
