import express from 'express';
import SunatController from "@modules/sunat/SunatController";


const router = express.Router();

router.post('/secure-url', SunatController.secureUrl);
router.post('/process-clients', SunatController.processClients);
router.post('/consultation-ruc', SunatController.consultationRUC);
router.post('/retrieve-secure-url-of-client', SunatController.retrieveSecureUrlOfClient);
//router.post('/process-client', SunatController.processClient);
// nuevos
router.post('/process-all-clients', SunatController.processAllClients);
router.post('/process-batch', SunatController.processBatch);
router.post('/process-client', SunatController.processClient);
router.post('/secure-url-client', SunatController.secureUrl);
router.post('/all-secure-url-clients', SunatController.processAllSecureUrlClients);
router.post('/sunat-status', SunatController.sunatStatus);
router.post('/sunat/shutdown', SunatController.shutdown);

export default router;
