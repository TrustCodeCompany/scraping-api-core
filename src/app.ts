import express from 'express';
import cors from 'cors';
import sunatRoutes from "@modules/sunat/sunatRoutes";
import {errorHandler} from "@shared/middleware/errorHandler";
import {logger} from "@utils/logger";
import { setupSwagger } from "@shared/utils/swagger";

//import {logger} from "shared/utils/logger";


const path = process.env.BASE_PATH || '/api/v1';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger
setupSwagger(app);

// Routes
/*app.use(path + '/products', productRoutes);
app.use(path + '/auth', authRoutes);
app.use(path + '/sunat', sunatRoutes);
app.use(path + '/client', clientRoutes);*/

app.use(path + '/sunat', sunatRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  //console.info(`Server running on port ${PORT}`);
});
