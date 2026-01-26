import {NextFunction, Request, Response} from "express";
import remypeService from "@modules/remype/RemypeService";

class RemypeController {

  /**
   * @swagger
   * /remype/secure-url:
   *   post:
   *     summary: Genera URL segura de REMYPE con validación automática
   *     description: |
   *       Crea una URL autenticada para acceder al Menú Principal.
   *
   *       **IMPORTANTE:** Valida automáticamente las credenciales antes de retornar la URL.
   *       Si las credenciales son incorrectas, retornará un error 400.
   *
   *       **Proceso:**
   *       1. Genera la URL con las credenciales
   *       2. Valida que la URL funcione (hace un request de prueba)
   *       3. Detecta errores de autenticación
   *       4. Solo retorna la URL si es válida
   *     tags: [Remype]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SecureUrlRemypeRequest'
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
   *               $ref: '#/components/schemas/SecureUrlResponse'
   *             example:
   *               status: "success"
   *               data:
   *                 ruc: "20123456789"
   *                 businessName: "EMPRESA DEMO SAC"
   *                 secureUrl: "https://apps.trabajo.gob.pe/si.remype/index.jsp?state=m1ntr4..."
   *                 reason: ""
   *                 valid: true
   *       400:
   *         description: Credenciales inválidas o URL expirada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               credenciales_invalidas:
   *                 summary: Credenciales incorrectas
   *                 value:
   *                   success: false
   *                   errors:
   *                     message: "Credenciales incorrectas"
   *                     timeStamp: "2026-01-24T00:17:09.913Z"
   *               url_expirada:
   *                 summary: URL expirada
   *                 value:
   *                   success: false
   *                   errors:
   *                     message: "URL expirada o parámetros de autenticación inválidos"
   *                     timeStamp: "2026-01-24T00:17:09.913Z"
   *               servicio_no_disponible:
   *                 summary: REMYPE no disponible
   *                 value:
   *                   success: false
   *                   errors:
   *                     message: "Servicio REMYPE no disponible"
   *                     timeStamp: "2026-01-24T00:17:09.913Z"
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async secureUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await remypeService.generateSecureUrlV2(req.body)
      res.json({
        status: 'success',
        data: result
      });
    } catch (error: any) {

      // ✅ Si la URL es inválida, retornar 400 en lugar de 500
      if (error.message.includes('inválida') ||
        error.message.includes('expirada') ||
        error.message.includes('incorrectas')) {
        return res.status(400).json({
          success: false,
          errors: {
            message: error.message,
            timeStamp: new Date().toISOString()
          }
        });
      }
      next(error);
    }
  }
}

export default RemypeController;
