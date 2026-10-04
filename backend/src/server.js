import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { config } from './config/env.js';

const app = createApp();

await connectDatabase();

app.listen(config.port, () => {
  console.log(`CloudNet Monitor API listening on port ${config.port}`);
});
