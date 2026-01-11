import {logger} from "@utils/logger";


abstract class BaseService {
    constructor() {
        if (this.constructor === BaseService) {
            throw new Error('BaseService is an abstract class and cannot be instantiated directly');
        }
    }

    async handleServiceOperation<T>(operation: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
        try {
            return await operation(...args);
        } catch (error: any) {
            logger.error(`Service operation failed: ${error.message}`, {
                service: this.constructor.name,
                error: error.stack
            });
            throw error;
        }
    }
}

export default BaseService;
