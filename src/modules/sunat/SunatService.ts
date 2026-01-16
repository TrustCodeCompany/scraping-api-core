import PortalSunat from "./PortalSunat";
import PortalSunatRuc from "./PortalSunatRuc";
import BaseService from "@modules/base/BaseService";
import {Client} from "@modules/clients/client.model";
import WebScraper from "@core/sunat/SunatScraper"
import {ClientData} from "@modules/sunat/clientinfo.model";
import {logger} from "@utils/logger";

class SunatService extends BaseService {

    constructor() {
        super();
    }

    // ============================================
    // MÉTODO 1: Generar URL segura (MANTENER)
    // ============================================
    /**
     * Genera una URL segura de SUNAT para un cliente
     * USO: Cuando necesitas solo la URL sin hacer scraping
     */
    async generateSecureUrl(client: Client) {
        return this.handleServiceOperation(async () => {
            const portalSunat = new PortalSunat();
            return await portalSunat.generateLoginUrl(client);
        });
    }

    // ============================================
    // MÉTODO : Generar URL segura (MANTENER)
    // ============================================
    /**
     * Genera una URL segura de SUNAT para un cliente
     * USO: Cuando necesitas solo la URL sin hacer scraping
     */
    async generateSecureUrlV2(client: Client) {
        return this.handleServiceOperation(async () => {
            logger.info(`🔐 Generando URL segura para RUC: ${client.ruc_cliente}`);
            const portalSunat = new PortalSunat();
            const result = await portalSunat.generateAndValidateLoginUrlV2(client);
            if (!result.valid) {
                // ❌ URL generada pero inválida
                throw new Error(result.reason || 'URL generada es inválida');
            }
            console.log(`✅ URL válida generada para RUC: ${client.ruc_cliente}`);
            return {
                ruc: client.ruc_cliente,
                razon_social: client.razon_s_cliente,
                secure_url: result.url,
                reason: result.reason,
                valid: result.valid,
            }
        });
    }

    // ============================================
    // MÉTODO 2: Procesar UN SOLO cliente
    // ✅ OPTIMIZADO - Ya no cierra el browser
    // ============================================
    /**
     * Procesa UN cliente individual con scraping
     * USO: Cuando llamas desde frontend cliente por cliente
     * TIEMPO: ~1-2 segundos por cliente
     *
     * @param {string} url - URL segura de SUNAT ya generada
     * @returns {Promise<any>} Array de notificaciones
     */
    async processSingleClientScraping(url: string) {
        return this.handleServiceOperation(async () => {
            if (!url) {
                throw new Error('URL es requerida');
            }

            // ✅ YA NO CIERRAS EL BROWSER - Se reutiliza
            const notificaciones = await WebScraper.scrapeSingle(url);

            return {
                success: true,
                url: url.substring(0, 50) + '...', // URL truncada para logs
                notificaciones: notificaciones,
                count: notificaciones.length
            };
        });
    }

    // ============================================
    // MÉTODO 3: Procesar BATCH de URLs
    // ✅ OPTIMIZADO - Mucho más rápido
    // ============================================
    /**
     * Procesa múltiples URLs en batch (RECOMENDADO)
     * USO: Cuando ya tienes todas las URLs generadas
     * TIEMPO: ~20-30 segundos para 50 clientes
     *
     * @param {Array<string>} urls - Array de URLs seguras
     * @returns {Promise<any>} Array de resultados
     */
    async processBatchScraping(urls: string[]) {
        return this.handleServiceOperation(async () => {
            if (!urls || !Array.isArray(urls) || urls.length === 0) {
                throw new Error('Se requiere un array de URLs válido');
            }

            console.log(`📦 Procesando batch de ${urls.length} URLs...`);
            const startTime = Date.now();

            // ✅ Usa el nuevo método de batch
            const results = await WebScraper.scrapeBatch(urls);

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ Batch completado en ${elapsed}s`);

            return {
                success: true,
                totalUrls: urls.length,
                processedIn: elapsed + 's',
                averagePerUrl: (Number(elapsed) / urls.length).toFixed(2) + 's',
                results: results
            };
        });
    }

    // ============================================
    // MÉTODO 4: Workflow COMPLETO (TODO EN UNO)
    // ✅ NUEVO - La forma MÁS RÁPIDA
    // ============================================
    /**
     * Workflow completo: obtiene clientes, genera URLs y hace scraping
     * USO: Endpoint principal para procesar todos los clientes de un login
     * TIEMPO: ~25-35 segundos para 50 clientes (TODO incluido)
     *
     * @param {number} loginId - ID del login
     * @param clients
     * @returns {Promise<Object>} Resultados completos
     */
    async processAllClientsScraping(loginId: number, clients: Client[]) {
        return this.handleServiceOperation(async () => {
            console.log(`🚀 Iniciando proceso completo para login ${loginId}...`);
            const totalStart = Date.now();

            // PASO 1: Obtener clientes de la BD
            //const clients = await this.model.findAllClientsByIdLogin(loginId);

            if (!clients || clients.length === 0) {
                return {
                    success: false,
                    message: 'No se encontraron clientes para este login',
                    totalClients: 0,
                    results: []
                };
            }

            console.log(`📊 ${clients.length} clientes encontrados`);

            // PASO 2: Generar URLs en paralelo (RÁPIDO)
            const urlStart = Date.now();
            const portalSunat = new PortalSunat();

            const urlPromises = clients.map(client =>
                portalSunat.generateLoginUrl({
                    ruc_cliente: client.ruc_cliente,
                    usuario_s_cliente: client.usuario_s_cliente,
                    clave_sol_cliente: client.clave_sol_cliente
                })
                    .then(url => ({
                        client: client,
                        url: url,
                        success: true,
                        error: null as string | null
                    }))
                    .catch(error => ({
                        client: client,
                        url: null as string | null,
                        success: false,
                        error: error.message as string
                    }))
            );

            const urlResults = await Promise.all(urlPromises);
            const urlElapsed = ((Date.now() - urlStart) / 1000).toFixed(2);

            // Separar URLs exitosas de las fallidas
            const validResults = urlResults.filter(r => r.success && r.url);
            const failedResults = urlResults.filter(r => !r.success);

            console.log(`✅ URLs generadas: ${validResults.length}/${clients.length} en ${urlElapsed}s`);

            if (validResults.length === 0) {
                return {
                    success: false,
                    message: 'No se pudo generar ninguna URL válida',
                    totalClients: clients.length,
                    urlGenerationTime: urlElapsed + 's',
                    failures: failedResults,
                    results: []
                };
            }

            // PASO 3: Scraping en batch (OPTIMIZADO)
            const scrapeStart = Date.now();
            const validUrls = validResults.map(r => r.url as string);

            const scrapingResults = await WebScraper.scrapeBatch(validUrls);

            const scrapeElapsed = ((Date.now() - scrapeStart) / 1000).toFixed(2);
            console.log(`✅ Scraping completado en ${scrapeElapsed}s`);

            // PASO 4: Mapear resultados con clientes
            const finalResults = urlResults.map((urlResult, index) => {
                if (!urlResult.success || !urlResult.url) {
                    return {
                        ruc: urlResult.client.ruc_cliente,
                        razonSocial: urlResult.client.razon_s_cliente || 'N/A',
                        success: false,
                        error: urlResult.error,
                        notificaciones: [] as any[],
                        count: 0
                    };
                }

                // Encontrar el índice en validUrls
                const validIndex = validUrls.indexOf(urlResult.url);
                const notificaciones = scrapingResults[validIndex] || [];

                return {
                    ruc: urlResult.client.ruc_cliente,
                    razonSocial: urlResult.client.razon_s_cliente || 'N/A',
                    success: true,
                    notificaciones: notificaciones,
                    count: notificaciones.length
                };
            });

            const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(2);

            // Estadísticas
            const totalNotificaciones = finalResults.reduce((sum, r) => sum + (r.count || 0), 0);
            const clientesConNotificaciones = finalResults.filter(r => r.success && r.count > 0).length;

            console.log(`🎉 Proceso completo terminado en ${totalElapsed}s`);

            return {
                success: true,
                totalClients: clients.length,
                processedClients: validResults.length,
                failedClients: failedResults.length,
                clientesConNotificaciones: clientesConNotificaciones,
                totalNotificaciones: totalNotificaciones,
                timing: {
                    urlGeneration: urlElapsed + 's',
                    scraping: scrapeElapsed + 's',
                    total: totalElapsed + 's'
                },
                results: finalResults,
                failures: failedResults.length > 0 ? failedResults.map(f => ({
                    ruc: f.client.ruc_cliente,
                    error: f.error
                })) : []
            };
        });
    }

    // ============================================
    // MÉTODO 5: Consulta de RUC (MANTENER)
    // ============================================
    /**
     * Consulta información de un RUC en SUNAT
     */
    async consultationInfoByRUC(ruc: string) {
        return this.handleServiceOperation(async () => {
            return await PortalSunatRuc.consultationInfoByRUC(ruc);
        });
    }

    // ============================================
    // MÉTODO 6: Generar URL para un cliente específico
    // ============================================
    /** @deprecated
     * Genera URL segura para un cliente específico
     * Similar a generateSecureUrl pero con manejo de errores
     */
    async getSecureUrlClient(client: Client) {
        return this.handleServiceOperation(async () => {
            const portalSunat = new PortalSunat();

            try {
                const url = await portalSunat.generateLoginUrl({
                    ruc_cliente: client.ruc_cliente,
                    usuario_s_cliente: client.usuario_s_cliente,
                    clave_sol_cliente: client.clave_sol_cliente
                });

                return {
                    success: true,
                    ruc: client.ruc_cliente,
                    url: url
                };
            } catch (err: any) {
                console.error(`Error generando URL para ${client.ruc_cliente}:`, err.message);
                return {
                    success: false,
                    ruc: client.ruc_cliente,
                    error: err.message
                };
            }
        });
    }

    // ============================================
    // MÉTODO 7: Status del scraper
    // ============================================
    /**
     * Obtiene el estado actual del pool de browsers
     * USO: Monitoring y debugging
     */
    getScraperStatus() {
        return WebScraper.getStatus();
    }

    // ============================================
    // MÉTODO 8: Shutdown del scraper
    // ============================================
    /**
     * Cierra todos los browsers del pool
     * ⚠️ SOLO llamar al apagar el servidor
     */
    async shutdownScraper() {
        await WebScraper.shutdown();
    }

    // ============================================
    // MÉTODOS DEPRECADOS (Para referencia)
    // ❌ NO USAR - Solo mantenidos por compatibilidad
    // ============================================

    /**
     * @deprecated Usar processAllClientsScraping() en su lugar
     * Este método es lento porque procesa uno por uno
     */
    async processClientsWithScraping(loginId: number, clients: Client[]) {
        console.warn('⚠️ ADVERTENCIA: Usando método deprecado. Usa processAllClientsScraping()');
        return this.handleServiceOperation(async () => {
            //const clients = await this.model.findAllClientsByIdLogin(loginId);
            const portalSunat = new PortalSunat();

            const urls = [];
            for (const client of clients) {
                try {
                    const url = await portalSunat.generateLoginUrl({
                        ruc_cliente: client.ruc_cliente,
                        usuario_s_cliente: client.usuario_s_cliente,
                        clave_sol_cliente: client.clave_sol_cliente
                    });
                    urls.push(url);
                } catch (err: any) {
                    console.error(`Error generando URL para ${client.ruc_cliente}:`, err.message);
                    urls.push(null);
                }
            }

            // ✅ Al menos usa batch en lugar de uno por uno
            const results = await WebScraper.scrapeBatch(urls.filter(u => u !== null) as string[]);

            // ❌ NO cierres el browser aquí
            // await WebScraper.close();

            return results;
        });
    }

    /**
     * @deprecated Usar processSingleClientScraping() en su lugar
     */
    async processScraping(url: string) {
        console.warn('⚠️ ADVERTENCIA: Usando método deprecado. Usa processSingleClientScraping()');
        return this.handleServiceOperation(async () => {
            const results = await WebScraper.scrapeSingle(url);

            // ❌ NO cierres el browser aquí
            // await WebScraper.close();

            return results;
        });
    }


    /**
     * Genera todas las url seguras
     */
    async getAllSecureUrlOfClients(loginId: number, clients: Client[]) {
        return this.handleServiceOperation(async () => {
            console.log(`🚀 Iniciando proceso completo para login ${loginId}...`);

            // PASO 1: Obtener clientes de la BD
            //const clients = await this.model.findAllClientsByIdLogin(loginId);

            if (!clients || clients.length === 0) {
                return {
                    success: false,
                    message: 'No se encontraron clientes para este login',
                    totalClients: 0,
                    results: []
                };
            }

            console.log(`📊 ${clients.length} clientes encontrados`);

            const portalSunat = new PortalSunat();

            const urlPromises = clients.map(client =>
                portalSunat.generateLoginUrl({
                    ruc_cliente: client.ruc_cliente,
                    usuario_s_cliente: client.usuario_s_cliente,
                    clave_sol_cliente: client.clave_sol_cliente
                })
                    .then(url => ({
                        client: client,
                        url: url,
                        success: true
                    }))
                    .catch(error => ({
                        client: client,
                        url: null,
                        success: false,
                        error: error.message
                    }))
            );

            const urlResults = await Promise.all(urlPromises);

            // Separar URLs exitosas de las fallidas
            const validResults = urlResults.filter(r => r.success && r.url);

            if (validResults.length === 0) {
                return {
                    success: false,
                    message: 'No se pudo generar ninguna URL válida',
                    totalClients: clients.length,
                    results: []
                };
            }

            const validUrls = validResults.map(r => r.url);

            return {
                urls: validUrls
            };
        });
    }

    /**
     *
     */
    async processBatchScrapingV2(clients: ClientData[]) {
        return this.handleServiceOperation(async () => {
            if (!clients || !Array.isArray(clients) || clients.length === 0) {
                throw new Error('Se requiere un array de clientes válido');
            }

            console.log(`📦 Procesando batch de ${clients.length} clientes...`);
            const startTime = Date.now();

            const results = await WebScraper.scrapeBatchWithClientInfo(clients);

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

            // Estadísticas
            const successCount = results.filter(r => r.success).length;
            const totalNotifications = results.reduce((sum, r) => sum + r.count, 0);
            const clientsWithNotifications = results.filter(r => r.count > 0).length;

            console.log(`✅ Batch completado en ${elapsed}s`);
            console.log(`📊 ${successCount}/${clients.length} exitosos | ${totalNotifications} notificaciones`);

            return {
                totalClients: clients.length,
                processedClients: successCount,
                failedClients: clients.length - successCount,
                clientsWithNotifications: clientsWithNotifications,
                totalNotifications: totalNotifications,
                processedIn: elapsed + 's',
                averagePerClient: (Number(elapsed) / clients.length).toFixed(2) + 's',
                results: results
            };
        });
    }

    /**
     *
     * @param clientData
     */
    async validateUrlBeforeScraping(clientData: ClientData) {
        return this.handleServiceOperation(async () => {
            const { ruc, secure_url, razon_social } = clientData;

            console.log(`🔍 Validando URL para RUC: ${ruc}`);

            const portalSunat = new PortalSunat();
            const validation = await portalSunat.validateSecureUrl(secure_url);

            return {
                valid: validation.valid,
                ruc: ruc,
                razon_social: razon_social,
                reason: validation.reason,
                message: validation.valid
                  ? 'URL válida y lista para scraping'
                  : 'URL no válida para scraping'
            };
        });
    }
}

export default new SunatService();
