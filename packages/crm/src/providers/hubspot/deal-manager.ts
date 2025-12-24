/**
 * @forge/crm - HubSpot Deal Manager (Stub)
 * L2 Cells - HubSpot 딜 관리 구현 (스케일 시 구현)
 */

import type {
  IDealManager,
  IDeal,
  ICreateDealData,
  IUpdateDealData,
  IDealFilter,
  IDealStats,
  ICRMResponse,
  IPaginatedResponse,
  IPaginationParams,
  DealStage,
  DealPriority
} from '../../interfaces/index.js';

/**
 * HubSpot Deal Manager 구현 (Stub)
 * TODO: 스케일 시 실제 HubSpot API 연동
 */
export class HubSpotDealManager implements IDealManager {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.hubapi.com'
  ) {}

  async create(data: ICreateDealData): Promise<ICRMResponse<IDeal>> {
    return this.notImplemented('create');
  }

  async getById(id: string): Promise<ICRMResponse<IDeal>> {
    return this.notImplemented('getById');
  }

  async update(id: string, data: IUpdateDealData): Promise<ICRMResponse<IDeal>> {
    return this.notImplemented('update');
  }

  async delete(id: string): Promise<ICRMResponse<void>> {
    return this.notImplemented('delete');
  }

  async list(
    filter?: IDealFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<IDeal>>> {
    return this.notImplemented('list');
  }

  async updateStage(id: string, stage: DealStage): Promise<ICRMResponse<IDeal>> {
    return this.notImplemented('updateStage');
  }

  async updatePriority(id: string, priority: DealPriority): Promise<ICRMResponse<IDeal>> {
    return this.notImplemented('updatePriority');
  }

  async addTags(id: string, tags: string[]): Promise<ICRMResponse<IDeal>> {
    return this.notImplemented('addTags');
  }

  async removeTags(id: string, tags: string[]): Promise<ICRMResponse<IDeal>> {
    return this.notImplemented('removeTags');
  }

  async getStats(filter?: IDealFilter): Promise<ICRMResponse<IDealStats>> {
    return this.notImplemented('getStats');
  }

  async markAsWon(id: string, actualCloseDate?: string): Promise<ICRMResponse<IDeal>> {
    return this.notImplemented('markAsWon');
  }

  async markAsLost(id: string, reason?: string): Promise<ICRMResponse<IDeal>> {
    return this.notImplemented('markAsLost');
  }

  private notImplemented(method: string): never {
    throw new Error(`HubSpot ${method} not yet implemented. Use Attio provider or implement HubSpot integration.`);
  }
}
