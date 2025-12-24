/**
 * @forge/crm - HubSpot Company Manager (Stub)
 * L2 Cells - HubSpot 회사 관리 구현 (스케일 시 구현)
 */

import type {
  ICompanyManager,
  ICompany,
  ICreateCompanyData,
  IUpdateCompanyData,
  ICompanyFilter,
  ICRMResponse,
  IPaginatedResponse,
  IPaginationParams,
  CompanyStatus
} from '../../interfaces/index.js';

/**
 * HubSpot Company Manager 구현 (Stub)
 * TODO: 스케일 시 실제 HubSpot API 연동
 */
export class HubSpotCompanyManager implements ICompanyManager {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.hubapi.com'
  ) {}

  async create(data: ICreateCompanyData): Promise<ICRMResponse<ICompany>> {
    return this.notImplemented('create');
  }

  async getById(id: string): Promise<ICRMResponse<ICompany>> {
    return this.notImplemented('getById');
  }

  async getByDomain(domain: string): Promise<ICRMResponse<ICompany | null>> {
    return this.notImplemented('getByDomain');
  }

  async update(id: string, data: IUpdateCompanyData): Promise<ICRMResponse<ICompany>> {
    return this.notImplemented('update');
  }

  async delete(id: string): Promise<ICRMResponse<void>> {
    return this.notImplemented('delete');
  }

  async list(
    filter?: ICompanyFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<ICompany>>> {
    return this.notImplemented('list');
  }

  async updateStatus(id: string, status: CompanyStatus): Promise<ICRMResponse<ICompany>> {
    return this.notImplemented('updateStatus');
  }

  async addTags(id: string, tags: string[]): Promise<ICRMResponse<ICompany>> {
    return this.notImplemented('addTags');
  }

  async removeTags(id: string, tags: string[]): Promise<ICRMResponse<ICompany>> {
    return this.notImplemented('removeTags');
  }

  async getContacts(id: string): Promise<ICRMResponse<unknown[]>> {
    return this.notImplemented('getContacts');
  }

  async getDeals(id: string): Promise<ICRMResponse<unknown[]>> {
    return this.notImplemented('getDeals');
  }

  async enrichByDomain(domain: string): Promise<ICRMResponse<Partial<ICompany>>> {
    return this.notImplemented('enrichByDomain');
  }

  private notImplemented(method: string): never {
    throw new Error(`HubSpot ${method} not yet implemented. Use Attio provider or implement HubSpot integration.`);
  }
}
