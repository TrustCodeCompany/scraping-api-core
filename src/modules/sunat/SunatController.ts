import { Request, Response, NextFunction } from 'express';
import sunatService from "@modules/sunat/SunatService";

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - ruc
 *         - userSol
 *         - passwordSol
 *       properties:
 *         ruc:
 *           type: string
 *           description: RUC del cliente
 *         userSol:
 *           type: string
 *           description: Usuario SOL del cliente
 *         passwordSol:
 *           type: string
 *           description: Clave SOL del cliente
 *         businessName:
 *           type: string
 *           description: Razón social del cliente
 */
class SunatController {

    /**
     * hidden-swagger
     * /sunat/secure-url:
     *   post:
     *     summary: Genera una URL segura de SUNAT que apunta a la bandeja del cliente
     *     description: |
     *       Crea una URL autenticada para acceder directamente al Buzón Electrónico SOL
     *       del cliente usando sus credenciales (RUC, usuario SOL y clave SOL).
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Client'
     *           example:
     *             ruc: "20123456789"
     *             userSol: "USERTEST"
     *             passwordSol: "password123"
     *             businessName: "EMPRESA DEMO SAC"
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
     *                   example: "success"
     *                   description: Indica el estado de la peticion
     *                 data:
     *                   type: object
     *                   properties:
     *                     url:
     *                       type: string
     *                       format: uri
     *                       description: URL segura generada
     *                       example: "https://ww1.sunat.gob.pe/..."
     *                     ruc:
     *                       type: string
     *                       description: RUC del cliente
     *                       example: "20123456789"
     *       400:
     *         description: Error de validación
     *       500:
     *         description: Error al generar URL
     */
    static async secureUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const url = await sunatService.generateSecureUrl(req.body)
            res.json({
                status: 'success',
                data: {
                    url: url,
                    ruc: req.body.ruc_cliente,
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /sunat/secure-url:
     *   post:
     *     summary: Genera URL segura de SUNAT con validación automática
     *     description: |
     *       Crea una URL autenticada para acceder al Buzón Electrónico SOL del cliente.
     *
     *       **IMPORTANTE:** Valida automáticamente las credenciales antes de retornar la URL.
     *       Si las credenciales son incorrectas, retornará un error 400.
     *
     *       **Proceso:**
     *       1. Genera la URL con las credenciales
     *       2. Valida que la URL funcione (hace un request de prueba)
     *       3. Detecta errores de autenticación
     *       4. Solo retorna la URL si es válida
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Client'
     *           example:
     *             ruc: "20123456789"
     *             userSol: "USERTEST"
     *             passwordSol: "password123"
     *             businessName: "EMPRESA DEMO SAC"
     *     responses:
     *       200:
     *         description: URL segura generada y validada con éxito
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 data:
     *                   type: object
     *                   properties:
     *                     url:
     *                       type: string
     *                       format: uri
     *                       description: URL segura generada y validada
     *                       example: "https://ww1.sunat.gob.pe/..."
     *                     ruc:
     *                       type: string
     *                       example: "20123456789"
     *             example:
     *               status: "success"
     *               data:
     *                 url: "https://api-seguridad.sunat.gob.pe/v1/clientessol/..."
     *                 ruc: "20123456789"
     *       400:
     *         description: Credenciales inválidas o URL expirada
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "error"
     *                 error:
     *                   type: string
     *             examples:
     *               credenciales_invalidas:
     *                 summary: Credenciales incorrectas
     *                 value:
     *                   status: "error"
     *                   error: "Credenciales incorrectas"
     *               url_expirada:
     *                 summary: URL expirada
     *                 value:
     *                   status: "error"
     *                   error: "URL expirada o parámetros de autenticación inválidos"
     *               servicio_no_disponible:
     *                 summary: SUNAT no disponible
     *                 value:
     *                   status: "error"
     *                   error: "Servicio SUNAT no disponible"
     *       500:
     *         description: Error interno del servidor
     */
    static async secureUrlV2(req: Request, res: Response, next: NextFunction) {
        try {
            const url = await sunatService.generateSecureUrlV2(req.body)
            res.json({
                status: 'success',
                data: url
            });
        } catch (error: any) {

            // ✅ Si la URL es inválida, retornar 400 en lugar de 500
            if (error.message.includes('inválida') ||
              error.message.includes('expirada') ||
              error.message.includes('incorrectas')) {
                return res.status(400).json({
                    status: 'error',
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * hidden-swagger
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
     *             required:
     *              - login_id
     *             properties:
     *               login_id:
     *                 type: number
     *                 description: id del usuario, necesario para recuperar sus clientes
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
     *     description: |
     *       Consulta informacion a traves del ruc a una api de terceros
     *
     *       **IMPORTANTE:** La api de terceros es un api free
     *
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *              - ruc
     *             properties:
     *               ruc:
     *                 type: string
     *                 description: RUC del cliente
     *                 example: 10728945683
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
     * hidden-swagger
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
     * hidden-swagger
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
     * hidden-swagger
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
     * hidden-swagger
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
     * hidden-swagger
     * /sunat/secure-url-client:
     *   post:
     *   deprecated: true
     *     summary: Genera la URL segura para un cliente (vía POST body directo)
     *     tags: [Deprecadas]
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
            const {ruc, userSol, passwordSol} = req.body;

            if (!ruc || !userSol || !passwordSol) {
                return res.status(400).json({
                    success: false,
                    error: 'ruc_cliente, usuario_s_cliente y clave_sol_cliente son requeridos'
                });
            }

            const client = {ruc, userSol, passwordSol};
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
     *   get:
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
     * /sunat/sunat-shutdown:
     *   get:
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
     * /sunat/secure-url-batch:
     *   post:
     *     summary: Genera URLs seguras masivamente para una lista de clientes
     *     description: |
     *       Genera y valida URLs autenticadas para múltiples clientes simultáneamente.
     *       - Procesa hasta 100 clientes por petición.
     *       - Valida automáticamente las credenciales de cada cliente.
     *       - Retorna el estado individual (éxito/error) para cada cliente procesado.
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - clients
     *             properties:
     *               clients:
     *                 type: array
     *                 minItems: 1
     *                 maxItems: 100
     *                 description: Lista de clientes para generar sus URLs
     *                 items:
     *                   $ref: '#/components/schemas/Client'
     *           example:
     *             clients:
     *               - ruc: "20123456789"
     *                 userSol: "USERTEST"
     *                 passwordSol: "password123"
     *                 businessName: "EMPRESA DEMO SAC"
     *               - ruc: "20987654321"
     *                 userSol: "ADMIN77"
     *                 passwordSol: "clave456"
     *                 businessName: "COMERCIAL XYZ SRL"
     *     responses:
     *       200:
     *         description: Lista de URLs generadas y validadas
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       ruc:
     *                         type: string
     *                         description: RUC del cliente
     *                         example: "20123456789"
     *                       businessName:
     *                         type: string
     *                         description: Razón social del cliente
     *                         example: "EMPRESA DEMO SAC"
     *                       secureUrl:
     *                         type: string
     *                         format: uri
     *                         description: URL segura generada (null si falló)
     *                         example: "https://e-menu.sunat.gob.pe/..."
     *                       valid:
     *                         type: boolean
     *                         description: Indica si la generación fue exitosa y la URL es válida
     *                         example: true
     *                       reason:
     *                         type: string
     *                         description: Motivo del fallo (solo si valid=false)
     *                         example: "Credenciales incorrectas"
     *             example:
     *               status: "success"
     *               data:
     *                 - ruc: "20123456789"
     *                   businessName: "EMPRESA DEMO SAC"
     *                   secureUrl: "https://e-menu.sunat.gob.pe/..."
     *                   valid: true
     *                   reason: ""
     *                 - ruc: "20987654321"
     *                   businessName: "COMERCIAL XYZ SRL"
     *                   secureUrl: null
     *                   valid: false
     *                   reason: "Credenciales incorrectas"
     *       400:
     *         description: Error de validación en la petición (ej. más de 100 clientes o array vacío)
     *       500:
     *         description: Error interno del servidor
     */
    static async secureUrlClients(req: Request, res: Response, next: NextFunction) {
        try {
            const { clients } = req.body;

            if (!clients || !Array.isArray(clients)) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere un array de URLs'
                });
            }

            if (clients.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El array de URLs está vacío'
                });
            }

            if (clients.length > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Máximo 100 URLs por batch'
                });
            }

            const result = await sunatService.getAllSecureUrlOfClients(clients);

            res.json({
                status: 'success',
                data: result
            });

        } catch (error: any) {
            console.error('❌ Error en /secureUrlClients:', error);
            res.status(500).json({
                success: false,
                error: 'Error generando URL',
                message: error.message
            });
        }
    }

    /**
     * @swagger
     * /sunat/process-batch:
     *   post:
     *     summary: Procesa un lote de clientes y extrae sus notificaciones de SUNAT
     *     description: |
     *       Realiza scraping en paralelo de las notificaciones del Buzón Electrónico SOL de múltiples clientes.
     *       - Procesa hasta 100 clientes por batch
     *       - Utiliza procesamiento por chunks para optimizar memoria y concurrencia
     *       - Extrae información completa de cada notificación (título, fecha, estado de lectura)
     *       - Retorna estadísticas detalladas del procesamiento
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       description: Lista de clientes con sus URLs seguras pre-generadas
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - clients
     *             properties:
     *               clients:
     *                 type: array
     *                 minItems: 1
     *                 maxItems: 100
     *                 description: Array de clientes a procesar (máximo 100)
     *                 items:
     *                   type: object
     *                   required:
     *                     - ruc
     *                     - secureUrl
     *                   properties:
     *                     ruc:
     *                       type: string
     *                       pattern: '^[0-9]{11}$'
     *                       description: RUC del cliente (11 dígitos)
     *                       example: "20123456789"
     *                     businessName:
     *                       type: string
     *                       description: Razón social del cliente
     *                       example: "EMPRESA DEMO SAC"
     *                     secureUrl:
     *                       type: string
     *                       format: uri
     *                       description: URL segura pre-generada para acceder al buzón del cliente
     *                       example: "https://ww1.sunat.gob.pe/ol-ti-itconsvalicpe/Login.aspx?..."
     *           examples:
     *             single_client:
     *               summary: Un solo cliente
     *               value:
     *                 clients:
     *                   - ruc: "20123456789"
     *                     businessName: "EMPRESA DEMO SAC"
     *                     secureUrl: "https://ww1.sunat.gob.pe/ol-ti-itconsvalicpe/Login.aspx?..."
     *             multiple_clients:
     *               summary: Múltiples clientes
     *               value:
     *                 clients:
     *                   - ruc: "20123456789"
     *                     businessName: "EMPRESA DEMO SAC"
     *                     secureUrl: "https://ww1.sunat.gob.pe/..."
     *                   - ruc: "20987654321"
     *                     businessName: "COMERCIAL XYZ SRL"
     *                     secureUrl: "https://ww1.sunat.gob.pe/..."
     *     responses:
     *       200:
     *         description: Batch procesado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   enum: [success]
     *                   example: "success"
     *                 data:
     *                   type: object
     *                   properties:
     *                     success:
     *                       type: boolean
     *                       description: Indica si el batch se procesó correctamente
     *                       example: true
     *                     totalClients:
     *                       type: integer
     *                       description: Total de clientes recibidos
     *                       example: 50
     *                     processedClients:
     *                       type: integer
     *                       description: Clientes procesados exitosamente
     *                       example: 48
     *                     failedClients:
     *                       type: integer
     *                       description: Clientes que fallaron durante el scraping
     *                       example: 2
     *                     clientsWithNotifications:
     *                       type: integer
     *                       description: Clientes que tienen notificaciones
     *                       example: 35
     *                     totalNotifications:
     *                       type: integer
     *                       description: Total de notificaciones encontradas
     *                       example: 156
     *                     processedIn:
     *                       type: string
     *                       description: Tiempo total de procesamiento
     *                       example: "45.32s"
     *                     averagePerClient:
     *                       type: string
     *                       description: Tiempo promedio por cliente
     *                       example: "0.91s"
     *                     results:
     *                       type: array
     *                       description: Resultados detallados por cada cliente
     *                       items:
     *                         type: object
     *                         properties:
     *                           ruc:
     *                             type: string
     *                             description: RUC del cliente
     *                             example: "20123456789"
     *                           businessName:
     *                             type: string
     *                             description: Razón social del cliente
     *                             example: "EMPRESA DEMO SAC"
     *                           success:
     *                             type: boolean
     *                             description: Indica si el scraping fue exitoso
     *                             example: true
     *                           notifications:
     *                             type: array
     *                             description: Lista de notificaciones encontradas
     *                             items:
     *                               type: object
     *                               properties:
     *                                 title:
     *                                   type: string
     *                                   description: Asunto de la notificación
     *                                   example: "ASUNTO: Notificación de Resolución de Ejecución Coactiva N° 143-006-0409566"
     *                                 date:
     *                                   type: string
     *                                   description: Fecha de publicación de la notificación
     *                                   example: "15/01/2025"
     *                                 read:
     *                                   type: integer
     *                                   description: Estado de lectura (0=no leído, 1=leído)
     *                                   example: 0
     *                           count:
     *                             type: integer
     *                             description: Cantidad de notificaciones del cliente
     *                             example: 25
     *             examples:
     *               success_response:
     *                 summary: Respuesta exitosa
     *                 value:
     *                   status: "success"
     *                   data:
     *                     success: true
     *                     totalClients: 50
     *                     processedClients: 48
     *                     failedClients: 2
     *                     clientsWithNotifications: 35
     *                     totalNotifications: 156
     *                     processedIn: "45.32s"
     *                     averagePerClient: "0.91s"
     *                     results:
     *                       - ruc: "20123456789"
     *                         businessName: "EMPRESA DEMO SAC"
     *                         success: true
     *                         notifications:
     *                           - title: "ASUNTO: Notificación de Resolución..."
     *                             date: "15/01/2025"
     *                             read: 0
     *                           - title: "ASUNTO: Notificación de Orden de Pago..."
     *                             date: "14/01/2025"
     *                             read: 1
     *                         count: 25
     *                       - ruc: "20987654321"
     *                         businessName: "COMERCIAL XYZ SRL"
     *                         success: true
     *                         notifications: []
     *                         count: 0
     *       400:
     *         description: Error de validación en los datos enviados
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 error:
     *                   type: string
     *                   description: Descripción del error
     *             examples:
     *               empty_array:
     *                 summary: Array vacío
     *                 value:
     *                   success: false
     *                   error: "El array de clientes está vacío"
     *               invalid_type:
     *                 summary: Tipo de dato inválido
     *                 value:
     *                   success: false
     *                   error: "Se requiere un array de clientes válido"
     *               exceeded_limit:
     *                 summary: Límite excedido
     *                 value:
     *                   success: false
     *                   error: "Máximo 100 clientes por batch"
     *               invalid_structure:
     *                 summary: Estructura inválida
     *                 value:
     *                   success: false
     *                   error: "5 cliente(s) con datos inválidos (falta ruc o secure_url)"
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 error:
     *                   type: string
     *                   example: "Error interno al procesar el batch"
     *                 details:
     *                   type: string
     *                   description: Detalles técnicos del error
     */
    static async processBatchV2(req: Request, res: Response, next: NextFunction) {
        try {

            const {clients} = req.body;

            if (!clients || !Array.isArray(clients)) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere un array de URLs'
                });
            }

            if (clients.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El array de URLs está vacío'
                });
            }

            if (clients.length > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Máximo 100 URLs por batch'
                });
            }

            const result = await sunatService.processBatchScrapingV2(clients);

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
     * /sunat/validate-url:
     *   post:
     *     summary: Valida si una URL segura de SUNAT es válida
     *     description: |
     *       Verifica que una URL generada sea válida y no haya expirado antes de realizar scraping.
     *       - Descarga el HTML de la URL
     *       - Detecta errores comunes de SUNAT (sesión expirada, parámetros inválidos, etc.)
     *       - Retorna si la URL está lista para ser scrapeada
     *     tags: [Sunat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - ruc
     *               - secure_url
     *             properties:
     *               ruc:
     *                 type: string
     *                 pattern: '^[0-9]{11}$'
     *                 description: RUC del cliente (para logging)
     *                 example: "20610789367"
     *               secureUrl:
     *                 type: string
     *                 format: uri
     *                 description: URL segura a validar
     *                 example: "https://e-menu.sunat.gob.pe/cl-ti-itmenu/AutenticaMenuInternet.htm?state=..."
     *           example:
     *             ruc: "20610789367"
     *             secureUrl: "https://e-menu.sunat.gob.pe/cl-ti-itmenu/AutenticaMenuInternet.htm?state=rO0ABXNyABFq..."
     *     responses:
     *       200:
     *         description: Resultado de la validación
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 data:
     *                   type: object
     *                   properties:
     *                     valid:
     *                       type: boolean
     *                       description: Indica si la URL es válida
     *                       example: true
     *                     ruc:
     *                       type: string
     *                       description: RUC del cliente validado
     *                       example: "20610789367"
     *                     message:
     *                       type: string
     *                       description: Mensaje descriptivo
     *                       example: "URL válida y lista para scraping"
     *                     reason:
     *                       type: string
     *                       description: Razón del error (solo si valid=false)
     *                       example: "URL expirada o parámetros de autenticación inválidos"
     *             examples:
     *               url_valida:
     *                 summary: URL válida
     *                 value:
     *                   status: "success"
     *                   data:
     *                     valid: true
     *                     ruc: "20610789367"
     *                     message: "URL válida y lista para scraping"
     *               url_expirada:
     *                 summary: URL expirada
     *                 value:
     *                   status: "success"
     *                   data:
     *                     valid: false
     *                     ruc: "20610789367"
     *                     reason: "URL expirada o parámetros de autenticación inválidos"
     *                     message: "URL no válida para scraping"
     *       400:
     *         description: Error de validación
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 error:
     *                   type: string
     *                   example: "Se requiere ruc y secure_url"
     */
    static async validateURL(req: Request, res: Response, next: NextFunction) {

        try {
            const result = await sunatService.validateUrlBeforeScraping(req.body);

            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

export default SunatController;
