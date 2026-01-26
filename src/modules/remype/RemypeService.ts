import BaseService from "@modules/base/BaseService";
import {Client} from "@modules/clients/client.model";
import {logger} from "@utils/logger";
import PortalRemype from "@modules/remype/PortalRemype";

class RemypeService extends BaseService {

  constructor() {
    super();
  }

  /**
   * Genera una URL segura de REMYPE para un cliente
   * USO: Cuando necesitas solo la URL sin hacer scraping
   */
  async generateSecureUrlV2(client: Client) {
    return this.handleServiceOperation(async () => {
      logger.info(`🔐 Generando URL segura para RUC: ${client.ruc}`);
      const portalRemype = new PortalRemype();

      const result = await portalRemype.generateAndValidateLoginUrl(client);

      if (!result.valid) {
        // ❌ URL generada pero inválida
        throw new Error(result.reason || 'URL generada es inválida');
      }
      logger.info(`✅ URL válida generada para RUC: ${client.ruc}`);
      return {
        ruc: client.ruc,
        businessName: client.businessName,
        secureUrl: result.url,
        reason: result.reason,
        valid: result.valid,
      }
    });
  }

}

export default new RemypeService();
