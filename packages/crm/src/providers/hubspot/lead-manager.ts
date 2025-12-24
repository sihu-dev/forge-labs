/**
 * @forge/crm - HubSpot Lead Manager (Stub)
 * L2 Cells - HubSpot 리드 관리 구현 (스케일 시 구현)
 */

import type {
  ILeadManager,
  ILead,
  ICreateLeadData,
  IUpdateLeadData,
  ILeadFilter,
  ICRMResponse,
  IPaginatedResponse,
  IPaginationParams,
  LeadStatus
} from '../../interfaces/index.js';

/**
 * HubSpot Lead Manager 구현 (Stub)
 * TODO: 스케일 시 실제 HubSpot API 연동
 */
export class HubSpotLeadManager implements ILeadManager {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.hubapi.com'
  ) {}

  async create(data: ICreateLeadData): Promise<ICRMResponse<ILead>> {
    return this.notImplemented('create');
  }

  async getById(id: string): Promise<ICRMResponse<ILead>> {
    return this.notImplemented('getById');
  }

  async getByEmail(email: string): Promise<ICRMResponse<ILead | null>> {
    return this.notImplemented('getByEmail');
  }

  async update(id: string, data: IUpdateLeadData): Promise<ICRMResponse<ILead>> {
    return this.notImplemented('update');
  }

  async delete(id: string): Promise<ICRMResponse<void>> {
    return this.notImplemented('delete');
  }

  async list(
    filter?: ILeadFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<ILead>>> {
    return this.notImplemented('list');
  }

  async updateStatus(id: string, status: LeadStatus): Promise<ICRMResponse<ILead>> {
    return this.notImplemented('updateStatus');
  }

  async updateScore(id: string, score: number): Promise<ICRMResponse<ILead>> {
    return this.notImplemented('updateScore');
  }

  async addTags(id: string, tags: string[]): Promise<ICRMResponse<ILead>> {
    return this.notImplemented('addTags');
  }

  async removeTags(id: string, tags: string[]): Promise<ICRMResponse<ILead>> {
    return this.notImplemented('removeTags');
  }

  async convertToDeal(
    id: string,
    dealData?: Record<string, unknown>
  ): Promise<ICRMResponse<{ leadId: string; dealId: string }>> {
    return this.notImplemented('convertToDeal');
  }

  private notImplemented(method: string): never {
    throw new Error(`HubSpot ${method} not yet implemented. Use Attio provider or implement HubSpot integration.`);
  }
}
