import {Client} from "@modules/clients/client.model";
import axios, {AxiosInstance} from 'axios';
import * as tough from 'tough-cookie';
import {HttpsCookieAgent} from 'http-cookie-agent/http';
import PortalSunat from "@modules/sunat/PortalSunat";

class PortalRemype {

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
    });
  }

  private async generateMainMenuLoginUrl(client: Client, retries = 3): Promise<string | undefined> {
    let lastError: any;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.client.post(
          'https://api-seguridad.sunat.gob.pe/v1/clientessol/7a486091-6d67-4b47-a215-40f9a9490139/oauth2/j_security_check',
          new URLSearchParams({
            'tipo': '2',
            'dni': '',
            'custom_ruc': client.ruc,
            'j_username': client.userSol,
            'j_password': client.passwordSol,
            'captcha': '',
            'originalUrl': 'https://apps.trabajo.gob.pe/si.remype/index.jsp',
            'state': 'm1ntr4'
          }).toString(),
          {
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
              'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
              'Cache-Control': 'max-age=0',
              'Connection': 'keep-alive',
              'Origin': 'https://api-seguridad.sunat.gob.pe',
              'Referer': 'https://api-seguridad.sunat.gob.pe/v1/clientessol/7a486091-6d67-4b47-a215-40f9a9490139/oauth2/login?originalUrl=https://apps.trabajo.gob.pe/si.remype/index.jsp&state=m1ntr4',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'same-origin',
              'Sec-Fetch-User': '?1',
              'Upgrade-Insecure-Requests': '1',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
              'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"macOS"',
              'Cookie': '_ga=GA1.1.1841574015.1767557965; _ga_6NCEEN6JSV=GS2.1.s1767560276$o2$g0$t1767560285$j51$l0$h0; MENU-SOL-LANGUAGE=es-PE; MENUTIPOLOGIN=2; 10726613457RWILLIAN=1; RECUERDAME=NO; TS019e7fc2=014dc399cbf0e985cf029dc70e5b1a68817cb5371b2afa555119842cd102a20ac38c167cf16171eb961656e597bfc42a06b887f6ca'
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


  async generateAndValidateLoginUrl(
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

export default PortalRemype;
