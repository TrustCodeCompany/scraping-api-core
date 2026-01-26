import express from 'express';
import RemypeController from "@modules/remype/RemypeController";

const router = express.Router();

router.post('/secure-url', RemypeController.secureUrl);

export default router;
