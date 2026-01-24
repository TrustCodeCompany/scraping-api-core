import BaseService from "@modules/base/BaseService";
import WebScraper from "@core/sunat/SunatScraper"

class SystemService extends BaseService {

  constructor() {
    super();
  }

  /**
   * Obtiene el estado actual del pool de browsers
   * USO: Monitoring y debugging
   */
  getScraperStatus() {
    return WebScraper.getStatus();
  }

  /**
   * Cierra todos los browsers del pool
   * ⚠️ SOLO llamar al apagar el servidor
   */
  async shutdownScraper() {
    await WebScraper.shutdown();
  }

}

export default new SystemService();
