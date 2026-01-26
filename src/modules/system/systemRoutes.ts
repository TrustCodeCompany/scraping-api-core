import express from 'express';
import SunatController from "@modules/sunat/SunatController";
import SystemController from "@modules/system/SystemController";

const router = express.Router();

router.get('/scraper-status', SystemController.scraperStatus);
router.get('/scraper-shutdown', SystemController.scraperShutdown);

export default router;
