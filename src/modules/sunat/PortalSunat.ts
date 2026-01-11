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
}

export default PortalSunat;
