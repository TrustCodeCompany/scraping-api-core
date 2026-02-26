import { chromium, Browser, BrowserContext } from "playwright";
import {ClientData, ClientInfo, NotificationInfo} from "@modules/sunat/clientinfo.model";
import {Client} from "@modules/clients/client.model";

class WebScraper {
    private browserPoolSize: number;
    private contextsPerBrowser: number;
    private browsers: Browser[] = [];
    private contextPool: BrowserContext[] = [];
    private isInitialized: boolean = false;
    private activeRequests: number = 0;
    private maxConcurrent: number;

    constructor(options: any = {}) {
        this.browserPoolSize = options.browserPoolSize || 3;
        this.contextsPerBrowser = options.contextsPerBrowser || 5;
        this.maxConcurrent = options.maxConcurrent || 10;
    }

    /**
     * Inicializa el pool de browsers (solo se ejecuta una vez)
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log(`🚀 Inicializando pool de ${this.browserPoolSize} browsers...`);

        for (let i = 0; i < this.browserPoolSize; i++) {
            const browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-extensions',
                    '--disable-web-security',
                    '--no-first-run',
                    '--no-default-browser-check'
                ]
            });
            this.browsers.push(browser);
        }

        this.isInitialized = true;
        console.log(`✅ Pool de browsers inicializado`);
    }

    /**
     * Obtiene un contexto del pool (o crea uno nuevo)
     */
    async getContext(): Promise<BrowserContext> {
        // Si hay contextos disponibles, reutilizar
        if (this.contextPool.length > 0) {
            return this.contextPool.pop()!;
        }

        // Seleccionar browser con round-robin
        const browserIndex = Math.floor(Math.random() * this.browsers.length);
        const browser = this.browsers[browserIndex];

        if (!browser) {
            throw new Error("No browsers available in pool");
        }

        // Crear nuevo contexto
        const context = await browser.newContext({
            viewport: {width: 1366, height: 768},
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        });

        return context;
    }

    /**
     * Libera un contexto de vuelta al pool
     */
    async releaseContext(context: BrowserContext) {
        try {
            // Limpiar el contexto antes de reutilizar
            await context.clearCookies();

            // Solo guardar si el pool no está lleno
            if (this.contextPool.length < this.browserPoolSize * this.contextsPerBrowser) {
                this.contextPool.push(context);
            } else {
                await context.close();
            }
        } catch (error) {
            // Si falla, simplemente cerramos
            await context.close().catch(() => {
            });
        }
    }

    /**
     * Scrapea una URL individual (OPTIMIZADO)
     */
    async scrapeFromUrl(url: string): Promise<any[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const context = await this.getContext();
        const page = await context.newPage();
        let mensajes: any[] = [];

        try {
            // Navegación con timeout optimizado
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 8000 // Reducido de 12s a 8s
            });

            // Verificar errores comunes PRIMERO (más rápido)
            const errorSelectors = [
                'text=RUC, Usuario y/o contraseña son incorrectos',
                'text=Error en la invocación',
                'text=Error al procesar',
                'text=Sesión expirada'
            ];

            for (const selector of errorSelectors) {
                if (await page.$(selector)) {
                    console.warn(`⚠️ Error detectado en URL: ${url.substring(0, 50)}...`);
                    return [];
                }
            }

            // Esperar iframe con timeout reducido
            const frameEl = await page.waitForSelector('#iframeApplication', {
                timeout: 6000 // Reducido de 10s a 6s
            });

            if (!frameEl) return [];

            const frame = await frameEl.contentFrame();
            if (!frame) return [];

            // Esperar contenido con estrategia inteligente
            try {
                await frame.waitForFunction(() => {
                    const list = document.querySelector('#listaMensajes');
                    // Retornar true si existe y tiene contenido O está vacío pero cargado
                    return list && (
                        list.children.length > 0 ||
                        list.hasAttribute('data-loaded') ||
                        document.readyState === 'complete'
                    );
                }, {
                    timeout: 5000, // Reducido de 8s a 5s
                    polling: 100   // Chequear cada 100ms
                });
            } catch (timeoutError) {
                // Si el timeout expira, intentar extraer igual
                console.warn(`⏱️ Timeout esperando lista, intentando extraer...`);
            }

            // Extraer mensajes
            const listaMensajes = await frame.$('#listaMensajes');

            if (listaMensajes) {
                mensajes = await frame.$$eval('#listaMensajes > li', items =>
                    items.map(item => {
                        const link = item.querySelector('.linkMensaje');
                        return link ? link.textContent?.trim() : null;
                    }).filter(Boolean)
                );
            }

        } catch (error: any) {
            // Log más informativo
            if (error.name === 'TimeoutError') {
                console.error(`⏱️ Timeout scraping: ${url.substring(0, 50)}...`);
            } else {
                console.error(`❌ Error scraping: ${error.message}`);
            }
            return [];
        } finally {
            // Cerrar página
            await page.close().catch(() => {
            });
            // Liberar contexto al pool
            await this.releaseContext(context);
        }

        return mensajes;
    }

    /**
     * Procesa múltiples URLs con concurrencia controlada
     */
    async scrapeBatch(urls: string[]): Promise<any[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`📦 Procesando batch de ${urls.length} URLs...`);

        // Procesar en chunks para controlar concurrencia
        const results: any[] = [];
        const chunks = this.chunkArray(urls, this.maxConcurrent);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk) continue;
            console.log(`   Procesando chunk ${i + 1}/${chunks.length} (${chunk.length} URLs)`);

            const chunkResults = await Promise.all(
                chunk.map(url => this.scrapeFromUrl(url))
            );

            results.push(...chunkResults);
        }

        console.log(`✅ Batch completado: ${results.length} resultados`);
        return results;
    }

    /**
     * Divide array en chunks
     */
    private chunkArray(array: string[], chunkSize: number): string[][] {
        const chunks: string[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Divide un array en chunks de tamaño específico
     */
    private chunkArrayV2<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Procesa UN SOLO cliente (para API uno por uno)
     */
    async scrapeSingle(url: string): Promise<any[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return await this.scrapeFromUrl(url);
    }

    /**
     * Cierra todo el pool (solo al apagar el servidor)
     */
    async shutdown() {
        console.log('🔴 Cerrando pool de browsers...');

        // Cerrar todos los contextos
        for (const context of this.contextPool) {
            await context.close().catch(() => {
            });
        }
        this.contextPool = [];

        // Cerrar todos los browsers
        for (const browser of this.browsers) {
            await browser.close().catch(() => {
            });
        }
        this.browsers = [];

        this.isInitialized = false;
        console.log('✅ Pool cerrado');
    }

    /**
     * Health check del pool
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            browsers: this.browsers.length,
            availableContexts: this.contextPool.length,
            activeRequests: this.activeRequests
        };
    }

    /**
     * Scrapea con información del cliente incluida
     */
    async scrapeFromUrlWithClientInfo( url: string, clientData: ClientData): Promise<ClientInfo> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const context = await this.getContext();
        const page = await context.newPage();
        let notifications: NotificationInfo[] = [];
        let success = true;

        try {
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 8000
            });

            // Verificar errores
            const errorSelectors = [
                'text=RUC, Usuario y/o contraseña son incorrectos',
                'text=Error en la invocación',
                'text=Error al procesar',
                'text=Sesión expirada'
            ];

            for (const selector of errorSelectors) {
                if (await page.$(selector)) {
                    success = false;
                    break;
                }
            }

            if (success) {
                const frameEl = await page.waitForSelector('#iframeApplication', {
                    timeout: 6000
                });

                if (frameEl) {
                    const frame = await frameEl.contentFrame();

                    if (frame) {
                        try {
                            await frame.waitForFunction(() => {
                                const list = document.querySelector('#listaMensajes');
                                return list && (
                                  list.children.length > 0 ||
                                  list.hasAttribute('data-loaded') ||
                                  document.readyState === 'complete'
                                );
                            }, { timeout: 5000, polling: 100 });
                        } catch (timeoutError) {
                            console.warn(`⏱️ Timeout esperando lista para ${clientData.ruc}`);
                        }

                        const listaMensajes = await frame.$('#listaMensajes');

                        if (listaMensajes) {
                            // ✅ EXTRACCIÓN MEJORADA: título + fecha
                            notifications = await frame.$$eval('#listaMensajes > li', items =>
                              items.map((item, index) => {
                                  const link = item.querySelector('.linkMensaje');
                                  const dateEl = item.querySelector('.separate, .fecPublica');
                                  const read = (item.querySelector('input#idLeido') as HTMLInputElement)?.value || '0';
                                  return {
                                      title: link?.textContent?.trim() || '',
                                      date: dateEl?.textContent?.trim() || '',
                                      read: parseInt(read?.trim() || '0') || 6,
                                      index: index,
                                  };
                              }).filter(n => n.title)
                            );
                        }
                    }
                }
            }

        } catch (error: any) {
            success = false;
            if (error.name === 'TimeoutError') {
                console.error(`⏱️ Timeout scraping Client: ${clientData.ruc}`);
            } else {
                console.error(`❌ Error scraping Client ${clientData.ruc}: ${error.message}`);
            }
        } finally {
            await page.close().catch(() => {});
            await this.releaseContext(context);
        }

        return {
            ruc: clientData.ruc,
            businessName: clientData.businessName || 'N/A',
            success: success,
            notifications: notifications,
            //url: url,
            count: notifications.length
        };
    }

    /**
     * Scrapea múltiples URLs con información de clientes v2
     */
    async scrapeBatchWithClientInfo(clients: ClientData[]): Promise<ClientInfo[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`📦 Procesando batch de ${clients.length} clientes...`);

        // ✅ PROCESAR EN CHUNKS (igual que v1)
        const results: ClientInfo[] = [];
        const chunks = this.chunkArrayV2(clients, this.maxConcurrent);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk) continue;

            console.log(`   📊 Procesando chunk ${i + 1}/${chunks.length} (${chunk.length} clientes)`);

            const chunkResults = await Promise.all(
              chunk.map(client => this.scrapeFromUrlWithClientInfo(client.secureUrl, client))
            );

            results.push(...chunkResults);
        }

        console.log(`✅ Batch completado: ${results.length} resultados`);
        return results;
    }

    /**
     *
     */
    async getNotificationDetailByIndex(
      url: string,
      client: Client,
      index: number
    ): Promise<{ success: boolean; data?: string; error?: string }> {

        if (!this.isInitialized) {
            await this.initialize();
        }

        const context = await this.getContext();
        const page = await context.newPage();

        try {
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 20000
            });

            // 🔎 Entrar al iframe principal
            const frameEl = await page.waitForSelector('#iframeApplication', {
                timeout: 15000
            });

            const frame = await frameEl.contentFrame();
            if (!frame) {
                return { success: false, error: 'No se pudo acceder al iframe principal' };
            }

            // 🔎 Esperar lista
            await frame.waitForSelector('#listaMensajes > li', { timeout: 15000 });

            const listaItems = frame.locator('#listaMensajes > li');
            const count = await listaItems.count();

            if (index < 0 || index >= count) {
                return { success: false, error: 'Índice fuera de rango' };
            }

            const item = listaItems.nth(index);
            const link = item.locator('.linkMensaje');

            // 🔥 CLICK
            await link.click();

            // 🔥 Esperar que aparezca el panel de detalle
            await frame.waitForSelector('#detallePanel', {
                state: 'visible',
                timeout: 15000
            });

            // 🔥 Ahora sí buscar el iframe del detalle
            const iframeLocator = frame.locator('#detallePanel iframe');

            await iframeLocator.waitFor({
                state: 'attached',
                timeout: 15000
            });

            const iframeElement = await iframeLocator.elementHandle();
            const detailFrame = await iframeElement?.contentFrame();

            if (!detailFrame) {
                return { success: false, error: 'No se pudo acceder al frame del detalle' };
            }

            await detailFrame.waitForLoadState('domcontentloaded');

            const detailHtml = await detailFrame.content();

            return {
                success: true,
                data: detailHtml
            };

        } catch (error: any) {

            console.error(`❌ Error obteniendo detalle ${client.ruc}:`, error.message);

            return {
                success: false,
                error: error.message
            };

        } finally {
            await page.close().catch(() => {});
            await this.releaseContext(context);
        }
    }

}

// Exportar singleton
const scraperInstance = new WebScraper({
    browserPoolSize: 3,        // 3 browsers persistentes
    contextsPerBrowser: 5,     // hasta 5 contextos por browser
    maxConcurrent: 10          // 10 scrapes simultáneos
});

export default scraperInstance;
