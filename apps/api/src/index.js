import { createStackPayServer } from "./server.js";

const port = Number(process.env.STACKPAY_API_PORT ?? 4000);

createStackPayServer().listen(port, () => {
  console.log(`StackPay API listening on http://localhost:${port}`);
});
