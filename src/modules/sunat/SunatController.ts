import { Request, Response, NextFunction } from 'express';
import sunatService from "@modules/sunat/SunatService";

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - ruc_cliente
 *         - usuario_s_cliente
 *         - clave_sol_cliente
 *       properties:
 *         ruc_cliente:
 *           type: string
 *           description: RUC del cliente
 *         usuario_s_cliente:
 *           type: string
 *           description: Usuario SOL del cliente
 *         clave_sol_cliente:
 *           type: string
 *           description: Clave SOL del cliente
 *         razon_s_cliente:
 *           type: string
 *           description: Razón social del cliente
 */
class SunatController {

    /**
     * @swagger
     * /sunat/secure-url:
     *   post:
     *     summary: Genera una URL segura de SUNAT para un cliente
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Client'
     *     responses:
     *       200:
     *         description: URL segura generada con éxito
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                 data:
     *                   type: object
     *                   properties:
     *                     url:
     *                       type: string
     *                     ruc:
     *                       type: string
     */
    static async secureUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const url = await sunatService.generateSecureUrl(req.body)
            res.json({
                status: 'success',
                data: {
                    "url": url,
                    "ruc": req.body.ruc_cliente,
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /sunat/process-clients:
     *   post:
     *     summary: Procesa una lista de clientes con scraping (Deprecado - usar process-all-clients)
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               login_id:
     *                 type: number
     *               clients:
     *                 type: array
     *                 items:
     *                   $ref: '#/components/schemas/Client'
     *     responses:
     *       200:
     *         description: Scraping completado
     */
    static async processClients(req: Request, res: Response, next: NextFunction) {
        try {
            const { login_id, clients } = req.body;
            const result = await sunatService.processClientsWithScraping(login_id, clients);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /sunat/consultation-ruc:
     *   post:
     *     summary: Consulta información pública de un RUC
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               ruc:
     *                 type: string
     *     responses:
     *       200:
     *         description: Información del RUC obtenida exitosamente
     */
    static async consultationRUC(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await sunatService.consultationInfoByRUC(req.body.ruc);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /sunat/retrieve-secure-url-of-client:
     *   post:
     *     summary: Obtiene la URL segura para un cliente específico
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Client'
     *     responses:
     *       200:
     *         description: URL recuperada exitosamente
     */
    static async retrieveSecureUrlOfClient(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await sunatService.getSecureUrlClient(req.body);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    static async processClientV1(req: Request, res: Response, next: NextFunction) {
        try {
            console.log("url a procesar", req.body.url)
            const result = await sunatService.processScraping(req.body.url);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /sunat/process-all-clients:
     *   post:
     *     summary: Workflow completo para procesar todos los clientes de un login
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               login_id:
     *                 type: number
     *               clients:
     *                 type: array
     *                 items:
     *                   $ref: '#/components/schemas/Client'
     *     responses:
     *       200:
     *         description: Proceso completado exitosamente
     */
    static async processAllClients(req: Request, res: Response, next: NextFunction) {
        try {
            const { login_id, clients } = req.body;
            const result = await sunatService.processAllClientsScraping(login_id, clients);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /sunat/process-batch:
     *   post:
     *     summary: Procesa un lote de URLs seguras
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               urls:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Batch procesado
     */
    static async processBatch(req: Request, res: Response, next: NextFunction) {
        try {

            const {urls} = req.body;

            if (!urls || !Array.isArray(urls)) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere un array de URLs'
                });
            }

            if (urls.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El array de URLs está vacío'
                });
            }

            if (urls.length > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Máximo 100 URLs por batch'
                });
            }

            const result = await sunatService.processBatchScraping(urls);

            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /sunat/process-client:
     *   post:
     *     summary: Procesa un único cliente mediante su URL segura
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               url:
     *                 type: string
     *     responses:
     *       200:
     *         description: Cliente procesado
     */
    static async processClient(req: Request, res: Response, next: NextFunction) {
        try {

            const {url} = req.body;

            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'URL es requerida'
                });
            }

            const result = await sunatService.processSingleClientScraping(url);
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /sunat/secure-url-client:
     *   post:
     *     summary: Genera la URL segura para un cliente (vía POST body directo)
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Client'
     *     responses:
     *       200:
     *         description: URL generada
     */
    static async secureUrlClient(req: Request, res: Response, next: NextFunction) {
        try {
            const {ruc_cliente, usuario_s_cliente, clave_sol_cliente} = req.body;

            if (!ruc_cliente || !usuario_s_cliente || !clave_sol_cliente) {
                return res.status(400).json({
                    success: false,
                    error: 'ruc_cliente, usuario_s_cliente y clave_sol_cliente son requeridos'
                });
            }

            const client = {ruc_cliente, usuario_s_cliente, clave_sol_cliente};
            const result = await sunatService.getSecureUrlClient(client);

            res.json(result);

        } catch (error: any) {
            console.error('❌ Error en /secure-url:', error);
            res.status(500).json({
                success: false,
                error: 'Error generando URL',
                message: error.message
            });
        }
    }

    /**
     * @swagger
     * /sunat/sunat-status:
     *   post:
     *     summary: Obtiene el estado actual del scraper
     *     tags: [Sunat]
     *     responses:
     *       200:
     *         description: Estado del scraper
     */
    static async sunatStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const status = sunatService.getScraperStatus();
            res.json({
                success: true,
                ...status
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * @swagger
     * /sunat/sunat/shutdown:
     *   post:
     *     summary: Cierra todos los navegadores del scraper
     *     tags: [Sunat]
     *     responses:
     *       200:
     *         description: Scraper cerrado
     */
    static async shutdown(req: Request, res: Response, next: NextFunction) {
        try {
            await sunatService.shutdownScraper();
            res.json({
                success: true,
                message: 'Scraper cerrado correctamente'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * @swagger
     * /sunat/all-secure-url-clients:
     *   post:
     *     summary: Genera URLs seguras para todos los clientes de un login
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               login_id:
     *                 type: number
     *               clients:
     *                 type: array
     *                 items:
     *                   $ref: '#/components/schemas/Client'
     *     responses:
     *       200:
     *         description: URLs generadas
     */
    static async processAllSecureUrlClients(req: Request, res: Response, next: NextFunction) {
        try {
            const { login_id, clients } = req.body;

            const result = await sunatService.getAllSecureUrlOfClients(login_id, clients);

            res.json(result);

        } catch (error: any) {
            console.error('❌ Error en /processAllSecureUrlClients:', error);
            res.status(500).json({
                success: false,
                error: 'Error generando URL',
                message: error.message
            });
        }
    }
}

export default SunatController;
