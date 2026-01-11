import axios, { AxiosInstance } from 'axios';
import * as tough from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import {HttpsCookieAgent} from "http-cookie-agent/http";
import {CookieJar} from "tough-cookie";

class PortalSunatRuc {
    //private cookieJar: tough.CookieJar;
    private client: AxiosInstance;

    constructor() {
        // Create a cookie jar
        //this.cookieJar = new tough.CookieJar();
        const jar = new CookieJar();

        // Create axios instance with cookie support
        /*this.client = wrapper(axios.create({
            jar: this.cookieJar,
            withCredentials: true
        } as any)) as AxiosInstance;*/

        this.client = axios.create({
            httpsAgent: new HttpsCookieAgent({
                cookies: { jar }
            }),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

    }

    async consultationInfoByRUC(rucCliente: string) {
        const url = "https://apiperu.dev/api/ruc";
        const token = "711175e8316f3d0d1ad47e9bfe88205f3dab579d4903ea1d8e06a73b8f116352";

        try {
            const response = await axios.post(
                url,
                { ruc: rucCliente },
                {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            return response.data; // Devuelve los datos de la respuesta
        } catch (error: any) {
            console.error("Error al consultar el RUC:", error.message);
            throw error; // Lanza el error para que pueda manejarse en otro lugar
        }
    }

}

export default new PortalSunatRuc();
