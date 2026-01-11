import { Request, Response, NextFunction } from 'express';
import sunatService from "@modules/sunat/SunatService";



class SunatController {

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
