import express from 'express';
import SunatController from "@modules/sunat/SunatController";

const router = express.Router();

//router.post('/secure-url', SunatController.secureUrl);
//router.post('/process-clients', SunatController.processClients);
//router.post('/information-ruc', SunatController.consultationRUC);
//router.post('/retrieve-secure-url-of-client', SunatController.retrieveSecureUrlOfClient);
//router.post('/process-all-clients', SunatController.processAllClients);
//router.post('/process-batch', SunatController.processBatch);
router.post('/process-batch', SunatController.processBatchV2);
//router.post('/process-client', SunatController.processClient);
//router.post('/secure-url-client', SunatController.secureUrl);
router.post('/secure-url-batch', SunatController.secureUrlBatch);
router.post('/validate-url', SunatController.validateURL);
router.post('/secure-url', SunatController.secureUrlV2);
router.post('/notification-detail', SunatController.getDetailClientByIndex);


export default router;
