import axios, {AxiosInstance} from 'axios';
import * as tough from 'tough-cookie';
import {HttpsCookieAgent} from 'http-cookie-agent/http';
import {Client} from "@modules/clients/client.model";


class PortalSunat {
    private cookieJar: tough.CookieJar;
    private httpsAgent: any;
    private client: AxiosInstance;

    constructor() {
        // Create a cookie jar
        this.cookieJar = new tough.CookieJar();

        // HTTPS Agent with keepAlive and cookie support
        this.httpsAgent = new HttpsCookieAgent({
            cookies: { jar: this.cookieJar },
            keepAlive: true,
            rejectUnauthorized: false
        });

        // Create axios instance
        this.client = axios.create({
            httpsAgent: this.httpsAgent,
            withCredentials: true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            }
        });
    }

    async generateLoginUrl(cliente: Client, retries = 3): Promise<string | undefined> {
        let lastError: any;
        for (let i = 0; i < retries; i++) {
            try {
                const response = await this.client.post(
                    'https://api-seguridad.sunat.gob.pe/v1/clientessol/4f3b88b3-d9d6-402a-b85d-6a0bc857746a/oauth2/j_security_check',
                    new URLSearchParams({
                        tipo: '2',
                        dni: "",
                        custom_ruc: cliente.ruc,
                        j_username: cliente.userSol,
                        j_password: cliente.passwordSol,
                        captcha: '',
                        originalUrl: 'https://e-menu.sunat.gob.pe/cl-ti-itmenu/AutenticaMenuInternet.htm',
                        state: 'rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAx3CAAAABAAAAADdAAEZXhlY3B0AAZwYXJhbXN0AEsqJiomL2NsLXRpLWl0bWVudS9NZW51SW50ZXJuZXQuaHRtJmI2NGQyNmE4YjVhZjA5MTkyM2IyM2I2NDA3YTFjMWRiNDFlNzMzYTZ0AANleGV0AAVidXpvbng='
                    }).toString(),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Origin': 'https://api-seguridad.sunat.gob.pe',
                            'Referer': 'https://api-seguridad.sunat.gob.pe/v1/clientessol/4f3b88b3-d9d6-402a-b85d-6a0bc857746a/oauth2/login?originalUrl=https://e-menu.sunat.gob.pe/cl-ti-itmenu/AutenticaMenuInternet.htm&state=rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAx3CAAAABAAAAADdAAEZXhlY3B0AAZwYXJhbXN0AEsqJiomL2NsLXRpLWl0bWVudS9NZW51SW50ZXJuZXQuaHRtJmI2NGQyNmE4YjVhZjA5MTkyM2IyM2I2NDA3YTFjMWRiNDFlNzMzYTZ0AANleGV0AAVidXpvbng='
                        },
                        maxRedirects: 0,
                        validateStatus: function (status) {
                            return status >= 200 && status < 400;
                        }
                    }
                );

                // Get location from headers
                let location: string | undefined;
                if (response.headers && response.headers.location) {
                    location = response.headers.location;
                } else if ((response as any).response && (response as any).response.headers && (response as any).response.headers.location) {
                    location = (response as any).response.headers.location;
                }

                return location;

            } catch (error: any) {
                lastError = error;
                // Si es un error de redirección (302), intentamos obtener la ubicación del error
                if (error.response && error.response.headers && error.response.headers.location) {
                    return error.response.headers.location
                }

                // Si es un error de conexión (ECONNRESET, ETIMEDOUT, etc.), reintentamos
                const recoverableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'];
                if (recoverableErrors.includes(error.code)) {
                    console.warn(`Intento ${i + 1} fallido por error de conexión (${error.code}). Reintentando...`);
                    // Esperar un poco antes de reintentar (backoff simple)
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                    continue;
                }

                // Si es otro tipo de error, lo lanzamos inmediatamente
                throw error;
            }
        }
        throw lastError;
    }

    async generateLoginUrlV2(cliente: Client, retries = 3): Promise<string | undefined> {
        let lastError: any;

        for (let i = 0; i < retries; i++) {
            try {
                const response = await this.client.post(
                  'https://api-seguridad.sunat.gob.pe/v1/clientessol/4f3b88b3-d9d6-402a-b85d-6a0bc857746a/oauth2/j_security_check',
                  new URLSearchParams({
                      tipo: '2',
                      dni: "",
                      custom_ruc: cliente.ruc,
                      j_username: cliente.userSol,
                      j_password: cliente.passwordSol,
                      captcha: '',
                      originalUrl: 'https://e-menu.sunat.gob.pe/cl-ti-itmenu/AutenticaMenuInternet.htm',
                      state: 'rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAx3CAAAABAAAAADdAAEZXhlY3B0AAZwYXJhbXN0AEsqJiomL2NsLXRpLWl0bWVudS9NZW51SW50ZXJuZXQuaHRtJmI2NGQyNmE4YjVhZjA5MTkyM2IyM2I2NDA3YTFjMWRiNDFlNzMzYTZ0AANleGV0AAVidXpvbng='
                  }).toString(),
                  {
                      headers: {
                          'Content-Type': 'application/x-www-form-urlencoded',
                          'Origin': 'https://api-seguridad.sunat.gob.pe',
                          'Referer': 'https://api-seguridad.sunat.gob.pe/v1/clientessol/4f3b88b3-d9d6-402a-b85d-6a0bc857746a/oauth2/login?originalUrl=https://e-menu.sunat.gob.pe/cl-ti-itmenu/AutenticaMenuInternet.htm&state=rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAx3CAAAABAAAAADdAAEZXhlY3B0AAZwYXJhbXN0AEsqJiomL2NsLXRpLWl0bWVudS9NZW51SW50ZXJuZXQuaHRtJmI2NGQyNmE4YjVhZjA5MTkyM2IyM2I2NDA3YTFjMWRiNDFlNzMzYTZ0AANleGV0AAVidXpvbng='
                      },
                      maxRedirects: 0,
                      validateStatus: function (status) {
                          return status >= 200 && status < 400;
                      }
                  }
                );

                // ✅ Obtener location de los headers
                let location: string | undefined;
                if (response.headers?.location) {
                    location = response.headers.location;
                } else if ((response as any).response?.headers?.location) {
                    location = (response as any).response.headers.location;
                }

                // ✅ VALIDACIÓN CRÍTICA: Verificar si la URL contiene "error"
                if (location && location.includes('/error')) {
                    throw new Error('Credenciales incorrectas - SUNAT retornó URL de error');
                }

                // ✅ VALIDACIÓN CRÍTICA: Verificar que la URL tenga los parámetros esperados
                if (location && !location.includes('state=')) {
                    throw new Error('URL generada no contiene parámetros de autenticación válidos');
                }

                return location;

            } catch (error: any) {
                lastError = error;

                // ✅ Si es error de credenciales, NO reintentar
                if (error.message?.includes('Credenciales incorrectas') ||
                  error.message?.includes('error')) {
                    throw new Error('Credenciales incorrectas');
                }

                // Si es error de redirección (302), verificar la ubicación
                if (error.response?.headers?.location) {
                    const location = error.response.headers.location;

                    // ✅ Si la URL contiene "error", las credenciales son inválidas
                    if (location.includes('/error')) {
                        throw new Error('Credenciales incorrectas');
                    }

                    return location;
                }

                // Si es error de conexión recuperable, reintentar
                const recoverableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'];
                if (recoverableErrors.includes(error.code)) {
                    console.warn(`Intento ${i + 1} fallido por error de conexión (${error.code}). Reintentando...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                    continue;
                }

                // Otro tipo de error
                throw error;
            }
        }

        throw lastError;
    }

    /**
     * ✅ NUEVO: Valida si una URL segura es válida
     * Retorna: { valid: boolean, reason?: string }
     */
    async validateSecureUrll(url: string): Promise<{ valid: boolean; reason?: string }> {
        try {
            if (!url || typeof url !== 'string') {
                return { valid: false, reason: 'URL vacía o inválida' };
            }

            const validDomains = [
                'https://ww1.sunat.gob.pe',
                'https://e-menu.sunat.gob.pe',
                'https://api-seguridad.sunat.gob.pe'
            ];

            const isValidDomain = validDomains.some(domain => url.startsWith(domain));

            if (!isValidDomain) {
                return { valid: false, reason: 'URL no pertenece al dominio de SUNAT' };
            }

            // ✅ Verificar que NO sea URL de error
            if (url.includes('/error')) {
                return { valid: false, reason: 'URL de error - Credenciales inválidas' };
            }

            const requiredParams = ['state='];
            const hasRequiredParams = requiredParams.some(param => url.includes(param));

            if (!hasRequiredParams) {
                return { valid: false, reason: 'URL no contiene parámetros de autenticación' };
            }

            return { valid: true };

        } catch (error: any) {
            return { valid: false, reason: error.message || 'Error validando URL' };
        }
    }

    async validateSecureUrl(url: string): Promise<{ valid: boolean; reason?: string }> {
        try {
            // ✅ VALIDACIÓN 1: Estructura básica
            if (!url || typeof url !== 'string') {
                return { valid: false, reason: 'URL vacía o inválida' };
            }

            // ✅ VALIDACIÓN 2: Dominio válido
            const validDomains = [
                'https://ww1.sunat.gob.pe',
                'https://e-menu.sunat.gob.pe',
                'https://api-seguridad.sunat.gob.pe'
            ];

            const isValidDomain = validDomains.some(domain => url.startsWith(domain));

            if (!isValidDomain) {
                return { valid: false, reason: 'URL no pertenece al dominio de SUNAT' };
            }

            // ✅ VALIDACIÓN 3: No debe ser URL de error
            if (url.includes('/error')) {
                return { valid: false, reason: 'URL de error - Credenciales inválidas' };
            }

            // ✅ VALIDACIÓN 4: Debe tener parámetros mínimos
            if (!url.includes('state=')) {
                return { valid: false, reason: 'URL no contiene parámetros de autenticación' };
            }

            // ✅ VALIDACIÓN 5: Hacer request real para detectar si expiró
            console.log(`🔍 Verificando si URL ha expirado...`);

            try {
                const response = await this.client.get(url, {
                    maxRedirects: 5,
                    timeout: 8000,
                    validateStatus: (status) => status < 500
                });

                const htmlContent = response.data || '';

                // 📝 LOG para debugging
                console.log('Status HTTP:', response.status);
                console.log('Tamaño HTML:', htmlContent.length);

                // ========================================================================
                // PASO 1: BUSCAR MENSAJES DE ERROR ESPECÍFICOS DE SUNAT (ALTA PRIORIDAD)
                // ========================================================================

                // Extraer solo texto visible (sin scripts ni styles)
                let visibleText = htmlContent
                  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                  .replace(/<!--[\s\S]*?-->/g, '') // Remover comentarios HTML
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();

                console.log('📄 Texto visible (primeros 300 chars):', visibleText.substring(0, 300));

                // Lista de mensajes de error que SUNAT muestra cuando hay problemas
                const errorMessages = [
                    {
                        text: 'parámetros de configuración de autenticación no coinciden',
                        reason: 'URL expirada - Parámetros de autenticación no coinciden'
                    },
                    {
                        text: 'los parámetros de configuración',
                        reason: 'URL expirada - Error en parámetros de configuración'
                    },
                    {
                        text: 'cierre la ventana y vuelva a ingresar',
                        reason: 'URL expirada - Se requiere nuevo ingreso'
                    },
                    {
                        text: 'sesión expiró',
                        reason: 'Sesión expirada'
                    },
                    {
                        text: 'sesión ha expirado',
                        reason: 'Sesión expirada'
                    },
                    {
                        text: 'usuario y/o contraseña son incorrectos',
                        reason: 'Credenciales incorrectas'
                    },
                    {
                        text: 'error en la invocación',
                        reason: 'Error de invocación del servicio'
                    },
                    {
                        text: 'servicio no disponible',
                        reason: 'Servicio SUNAT no disponible'
                    },
                    {
                        text: 'acceso denegado',
                        reason: 'Acceso denegado'
                    }
                ];

                // Normalizar texto para búsqueda case-insensitive
                const normalizedText = visibleText.toLowerCase();

                // Buscar cada mensaje de error
                for (const { text, reason } of errorMessages) {
                    if (normalizedText.includes(text.toLowerCase())) {
                        console.error(`❌ ERROR DETECTADO: "${text}"`);
                        return { valid: false, reason };
                    }
                }

                // ========================================================================
                // PASO 2: VERIFICAR INDICADORES POSITIVOS DE SESIÓN VÁLIDA
                // ========================================================================

                const validIndicators = [
                    'iframeApplication',
                    'AutenticaMenuInternet',
                    'SUNAT Operaciones en Línea',
                    'Buzón Electrónico',
                    'listaMensajes',
                    'MenuInternet.htm',
                    'menu-principal', // Posible ID/clase del menú
                    'opciones-menu'   // Posible contenedor de opciones
                ];

                let validIndicatorFound = false;
                for (const indicator of validIndicators) {
                    if (htmlContent.includes(indicator)) {
                        console.log(`✅ Indicador válido encontrado: "${indicator}"`);
                        validIndicatorFound = true;
                        break;
                    }
                }

                if (validIndicatorFound) {
                    console.log(`✅ URL VÁLIDA - Sesión activa detectada`);
                    return { valid: true };
                }

                // ========================================================================
                // PASO 3: ANÁLISIS ADICIONAL SI NO HAY ERRORES NI CONTENIDO VÁLIDO
                // ========================================================================

                // Si el título contiene "SUNAT Operaciones en Línea" sin errores, es válido
                const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
                if (titleMatch && titleMatch[1].includes('SUNAT Operaciones')) {
                    console.log(`✅ Título válido detectado: "${titleMatch[1]}"`);
                    return { valid: true };
                }

                // Si la página tiene muy poco contenido, probablemente es un error
                if (htmlContent.length < 1000) {
                    console.warn(`⚠️ Contenido sospechosamente pequeño: ${htmlContent.length} bytes`);
                    return {
                        valid: false,
                        reason: 'Respuesta incompleta o página de error'
                    };
                }

                // Si llegamos aquí, la página tiene contenido pero no reconocemos ni errores ni éxito
                // Esto podría ser una página de carga, mantenimiento, etc.
                if (response.status === 200) {
                    console.warn(`⚠️ Página desconocida - status 200 pero sin indicadores claros`);
                    // Ser conservador: si no vemos indicadores de éxito, considerar inválido
                    return {
                        valid: false,
                        reason: 'No se pudo verificar el estado de la sesión'
                    };
                }

                return { valid: false, reason: `Error HTTP ${response.status}` };

            } catch (requestError: any) {
                if (requestError.code === 'ECONNABORTED' || requestError.code === 'ETIMEDOUT') {
                    return { valid: false, reason: 'Timeout - SUNAT no responde' };
                }

                console.error(`❌ Error en request: ${requestError.message}`);
                return {
                    valid: false,
                    reason: `Error de conexión: ${requestError.message}`
                };
            }

        } catch (error: any) {
            console.error(`❌ Error general: ${error.message}`);
            return { valid: false, reason: error.message || 'Error validando URL' };
        }
    }

    /**
     * ✅ NUEVO: Genera URL Y la valida antes de retornarla
     */
    async generateAndValidateLoginUrl(
      cliente: Client,
      retries = 3
    ): Promise<{ url?: string; valid: boolean; reason?: string }> {

        try {
            // Paso 1: Generar URL
            const url = await this.generateLoginUrl(cliente, retries);

            if (!url) {
                return {
                    valid: false,
                    reason: 'No se pudo generar la URL de login'
                };
            }

            // Paso 2: Validar URL generada
            const validation = await this.validateSecureUrl(url);

            if (!validation.valid) {
                console.warn(`❌ URL inválida para RUC ${cliente.ruc}: ${validation.reason}`);
                return {
                    url: url,
                    valid: false,
                    reason: validation.reason
                };
            }

            console.log(`✅ URL válida generada para RUC ${cliente.ruc}`);
            return {
                url: url,
                valid: true
            };

        } catch (error: any) {
            console.error(`❌ Error generando URL para RUC ${cliente.ruc}:`, error.message);
            return {
                valid: false,
                reason: error.message || 'Error al generar URL'
            };
        }
    }

    async generateAndValidateLoginUrlV2(
      cliente: Client,
      retries = 3
    ): Promise<{ url?: string; valid: boolean; reason?: string }> {
        try {
            // ✅ generateLoginUrl ya valida las credenciales internamente
            const url = await this.generateLoginUrlV2(cliente, retries);

            if (!url) {
                return {
                    url: "",
                    valid: false,
                    reason: 'No se pudo generar la URL de login'
                };
            }

            console.log(`✅ URL válida generada para RUC ${cliente.ruc}`);
            return {
                url: url,
                valid: true,
                reason: ""
            };

        } catch (error: any) {
            // ✅ Capturar errores específicos
            let reason = error.message || 'Error al generar URL';

            // Normalizar mensaje de error
            if (reason.includes('Credenciales incorrectas') ||
              reason.includes('error')) {
                reason = 'Credenciales incorrectas';
            }

            console.error(`❌ Error para RUC ${cliente.ruc}: ${reason}`);

            return {
                url: "",
                valid: false,
                reason: reason
            };
        }
    }

    /**
     * ✅ ALTERNATIVA: Validación profunda solo cuando sea necesario
     * Úsala solo si realmente necesitas verificar que la URL funciona
     */
    async validateSecureUrlDeep(url: string): Promise<{ valid: boolean; reason?: string }> {
        try {
            // Primero hacer validación básica
            const basicValidation = await this.validateSecureUrl(url);
            if (!basicValidation.valid) {
                return basicValidation;
            }

            // ⚠️ NOTA: Esta validación hace un request HTTP adicional
            // Solo úsala si realmente lo necesitas
            const response = await this.client.get(url, {
                maxRedirects: 5,
                timeout: 5000,
                validateStatus: (status) => status < 500
            });

            const htmlContent = response.data || '';

            // Detectar errores específicos en el HTML
            const errorPatterns = [
                /parámetros de configuración de autenticación no coinciden/i,
                /usuario y\/o contraseña son incorrectos/i,
                /error en la invocación/i
            ];

            for (const pattern of errorPatterns) {
                if (pattern.test(htmlContent)) {
                    return { valid: false, reason: 'Credenciales inválidas detectadas' };
                }
            }

            return { valid: true };

        } catch (error: any) {
            // Si falla el request, pero la URL tiene buena estructura, es válida
            const basicValidation = await this.validateSecureUrl(url);
            return basicValidation;
        }
    }

    async generateMainMenuLoginUrl(cliente: Client, retries = 3): Promise<string | undefined> {
        let lastError: any;

        for (let i = 0; i < retries; i++) {
            try {
                const response = await this.client.post(
                  'https://api-seguridad.sunat.gob.pe/v1/clientessol/4f3b88b3-d9d6-402a-b85d-6a0bc857746a/oauth2/j_security_check',
                  new URLSearchParams({
                      tipo: '2',
                      dni: '',
                      custom_ruc: cliente.ruc,
                      j_username: cliente.userSol,
                      j_password: cliente.passwordSol,
                      captcha: '',
                      originalUrl: 'https://e-menu.sunat.gob.pe/cl-ti-itmenu/AutenticaMenuInternet.htm',
                      lang: 'es-PE',
                      state: 'rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAx3CAAAABAAAAADdAADZXhlcHQABnBhcmFtc3QASyomKiYvY2wtdGktaXRtZW51L01lbnVJbnRlcm5ldC5odG0mYjY0ZDI2YThiNWFmMDkxOTIzYjIzYjY0MDdhMWMxZGI0MWU3MzNhNnQABGV4ZWNweA=='
                  }).toString(),
                  {
                      headers: {
                          'Content-Type': 'application/x-www-form-urlencoded',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                          'Cache-Control': 'max-age=0',
                          'Connection': 'keep-alive',
                          'Origin': 'https://api-seguridad.sunat.gob.pe',
                          'Referer': 'https://api-seguridad.sunat.gob.pe/v1/clientessol/4f3b88b3-d9d6-402a-b85d-6a0bc857746a/oauth2/loginMenuSol?lang=es-PE&showDni=true&showLanguages=false&originalUrl=https://e-menu.sunat.gob.pe/cl-ti-itmenu/AutenticaMenuInternet.htm&state=rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAx3CAAAABAAAAADdAADZXhlcHQABnBhcmFtc3QASyomKiYvY2wtdGktaXRtZW51L01lbnVJbnRlcm5ldC5odG0mYjY0ZDI2YThiNWFmMDkxOTIzYjIzYjY0MDdhMWMxZGI0MWU3MzNhNnQABGV4ZWNweA==',
                          'Sec-Fetch-Dest': 'document',
                          'Sec-Fetch-Mode': 'navigate',
                          'Sec-Fetch-Site': 'same-origin',
                          'Sec-Fetch-User': '?1',
                          'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                          'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                          'sec-ch-ua-mobile': '?0',
                          'sec-ch-ua-platform': '"macOS"'
                      },
                      maxRedirects: 0,
                      validateStatus: function (status) {
                          return status >= 200 && status < 400;
                      }
                  }
                );

                // Obtener location de los headers
                let location: string | undefined;
                if (response.headers?.location) {
                    location = response.headers.location;
                } else if ((response as any).response?.headers?.location) {
                    location = (response as any).response.headers.location;
                }

                // Validar si la URL contiene "error"
                if (location && location.includes('/error')) {
                    throw new Error('Credenciales incorrectas - SUNAT retornó URL de error');
                }

                // Validar que la URL tenga los parámetros esperados
                if (location && !location.includes('state=')) {
                    throw new Error('URL generada no contiene parámetros de autenticación válidos');
                }

                return location;

            } catch (error: any) {
                lastError = error;

                // Si es error de credenciales, NO reintentar
                if (error.message?.includes('Credenciales incorrectas') ||
                  error.message?.includes('error')) {
                    throw new Error('Credenciales incorrectas');
                }

                // Si es error de redirección (302), verificar la ubicación
                if (error.response?.headers?.location) {
                    const location = error.response.headers.location;

                    // Si la URL contiene "error", las credenciales son inválidas
                    if (location.includes('/error')) {
                        throw new Error('Credenciales incorrectas');
                    }

                    return location;
                }

                // Si es error de conexión recuperable, reintentar
                const recoverableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'];
                if (recoverableErrors.includes(error.code)) {
                    console.warn(`Intento ${i + 1} fallido por error de conexión (${error.code}). Reintentando...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                    continue;
                }

                // Otro tipo de error
                throw error;
            }
        }

        throw lastError;
    }

    async generateAndValidateLoginUrlV3(
      cliente: Client,
      retries = 3
    ): Promise<{ url?: string; valid: boolean; reason?: string }> {
        try {
            // ✅ generateLoginUrl ya valida las credenciales internamente
            const url = await this.generateMainMenuLoginUrl(cliente, retries);

            if (!url) {
                return {
                    url: "",
                    valid: false,
                    reason: 'No se pudo generar la URL de login'
                };
            }

            console.log(`✅ URL válida generada para RUC ${cliente.ruc}`);
            return {
                url: url,
                valid: true,
                reason: ""
            };

        } catch (error: any) {
            // ✅ Capturar errores específicos
            let reason = error.message || 'Error al generar URL';

            // Normalizar mensaje de error
            if (reason.includes('Credenciales incorrectas') ||
              reason.includes('error')) {
                reason = 'Credenciales incorrectas';
            }

            console.error(`❌ Error para RUC ${cliente.ruc}: ${reason}`);

            return {
                url: "",
                valid: false,
                reason: reason
            };
        }
    }
}

export default PortalSunat;
