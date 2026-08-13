import app from './app';
import { appConfig } from './config/appConfig';
import { sequelize } from './models';

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    app.listen(appConfig.port, () => {
      console.log(`API listening on http://localhost:${appConfig.port}`);
    });
  } catch (error) {
    console.error('Unable to start server', error);
    process.exit(1);
  }
}

startServer();
