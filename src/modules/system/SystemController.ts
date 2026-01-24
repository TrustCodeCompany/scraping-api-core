import {Request, Response, NextFunction} from 'express';
import systemService from "@modules/system/SystemService";

/**
 * @swagger
 * components:
 *   schemas:
 *     ScraperStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: string
 *           description: Estado de la peticion
 *           example: "success"
 *         initialized:
 *           type: boolean
 *           description: Estado de activación. Indica si el pool de navegadores ya fue creado e iniciado (true) o si aún no se ha ejecutado la inicialización (false).
 *         browsers:
 *           type: number
 *           description: Nivel de capacidad. Indica la cantidad total de instancias de navegadores (Browser) que están abiertos actualmente en el sistema (el máximo configurado es 3).
 *         availableContexts:
 *           type: string
 *           description: Disponibilidad inmediata. Es el número de "contextos" (sesiones de navegación limpias) que están listos en el pool para ser reutilizados sin tener que crear uno nuevo, lo cual acelera el scraping.
 *         activeRequests:
 *           type: string
 *           description: Carga actual. Representa el número de peticiones de scraping que se están procesando en este preciso momento (aunque en el código actual falta el incremento/decremento manual de este contador, su propósito es medir la concurrencia activa).
 *     ScraperShutdownResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Scraper cerrado correctamente"
 */
class SystemController {

  /**
   * @swagger
   * /system/scraper-status:
   *   get:
   *     summary: Obtiene el estado actual del Web scraper
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Estado del scraper
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ScraperStatusResponse'
   */
  static async scraperStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = systemService.getScraperStatus();
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
   * /system/scraper-shutdown:
   *   get:
   *     summary: Cierra todos los navegadores del scraper
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Scraper cerrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ScraperShutdownResponse'
   */
  static async scraperShutdown(req: Request, res: Response, next: NextFunction) {
    try {
      await systemService.shutdownScraper();
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

}

export default SystemController;
