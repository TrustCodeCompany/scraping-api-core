import axios, { AxiosInstance } from 'axios';
import * as tough from 'tough-cookie';
import { HttpsCookieAgent } from 'http-cookie-agent/http';
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
                        custom_ruc: cliente.ruc_cliente,
                        j_username: cliente.usuario_s_cliente,
                        j_password: cliente.clave_sol_cliente,
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
                      custom_ruc: cliente.ruc_cliente,
                      j_username: cliente.usuario_s_cliente,
                      j_password: cliente.clave_sol_cliente,
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

                // ✅ Detectar mensajes de error de SUNAT en el HTML
                const errorPatterns = [
                    {
                        pattern: /parámetros de configuración de autenticación no coinciden/i,
                        reason: 'URL expirada - Los parámetros de autenticación no coinciden'
                    },
                    {
                        pattern: /sesión expiró|sesión ha expirado|session expired/i,
                        reason: 'Sesión expirada'
                    },
                    {
                        pattern: /usuario y\/o contraseña son incorrectos/i,
                        reason: 'Credenciales incorrectas'
                    },
                    {
                        pattern: /error en la invocación/i,
                        reason: 'Error de invocación del servicio SUNAT'
                    },
                    {
                        pattern: /servicio no disponible|service unavailable/i,
                        reason: 'Servicio SUNAT no disponible'
                    },
                    {
                        pattern: /acceso denegado|access denied/i,
                        reason: 'Acceso denegado'
                    },
                    {
                        pattern: /cierre la ventana y vuelva a ingresar/i,
                        reason: 'URL expirada - Se requiere nuevo ingreso'
                    }
                ];

                // Buscar errores en el HTML
                for (const { pattern, reason } of errorPatterns) {
                    if (pattern.test(htmlContent)) {
                        console.warn(`⚠️ Error detectado: ${reason}`);
                        return { valid: false, reason };
                    }
                }

                // ✅ Verificar que contiene elementos esperados de una sesión válida
                const validIndicators = [
                    'iframeApplication',
                    'AutenticaMenuInternet',
                    'SUNAT Operaciones en Línea',
                    'Buzón Electrónico',
                    'listaMensajes'
                ];

                const hasValidContent = validIndicators.some(indicator =>
                  htmlContent.includes(indicator)
                );

                if (hasValidContent) {
                    console.log(`✅ URL válida y activa`);
                    return { valid: true };
                }

                // Si no tiene contenido válido ni errores, probablemente expiró
                if (htmlContent.length > 0 && htmlContent.length < 1000) {
                    return { valid: false, reason: 'URL expirada o sin contenido válido' };
                }

                // Por defecto, si el status es 200 y no hay errores explícitos
                if (response.status === 200) {
                    return { valid: true };
                }

                return { valid: false, reason: `Error HTTP ${response.status}` };

            } catch (requestError: any) {
                // Si falla el request, intentar determinar el motivo
                if (requestError.code === 'ECONNABORTED' || requestError.code === 'ETIMEDOUT') {
                    return { valid: false, reason: 'Timeout - SUNAT no responde' };
                }

                // Si hay error de red, la URL podría ser válida pero SUNAT caído
                console.warn(`⚠️ Error haciendo request: ${requestError.message}`);
                return {
                    valid: false,
                    reason: `Error de conexión: ${requestError.message}`
                };
            }

        } catch (error: any) {
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
                console.warn(`❌ URL inválida para RUC ${cliente.ruc_cliente}: ${validation.reason}`);
                return {
                    url: url,
                    valid: false,
                    reason: validation.reason
                };
            }

            console.log(`✅ URL válida generada para RUC ${cliente.ruc_cliente}`);
            return {
                url: url,
                valid: true
            };

        } catch (error: any) {
            console.error(`❌ Error generando URL para RUC ${cliente.ruc_cliente}:`, error.message);
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

            console.log(`✅ URL válida generada para RUC ${cliente.ruc_cliente}`);
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

            console.error(`❌ Error para RUC ${cliente.ruc_cliente}: ${reason}`);

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
}

export default PortalSunat;
