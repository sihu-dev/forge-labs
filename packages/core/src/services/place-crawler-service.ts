/**
 * @forge/core - Place Crawler Service
 * L2 (Cells) - 플레이스 정보 크롤링 서비스
 */

import type { FolioTypes, IResult, Timestamp } from '@forge/types';
import { calculateDistance, isWithinRadius } from '@forge/utils';

type ICoordinates = FolioTypes.ICoordinates;
type ICompetitor = FolioTypes.ICompetitor;
type IProduct = FolioTypes.IProduct;
type BusinessCategory = FolioTypes.BusinessCategory;
type DataSource = FolioTypes.DataSource;

/**
 * 플레이스 검색 결과
 */
export interface IPlaceSearchResult {
  places: ICompetitor[];
  total: number;
  hasMore: boolean;
}

/**
 * 플레이스 크롤러 인터페이스
 */
export interface IPlaceCrawlerService {
  /** 데이터 소스 */
  readonly source: DataSource;

  /** 주변 장소 검색 */
  searchNearby(
    center: ICoordinates,
    radiusMeters: number,
    category?: BusinessCategory
  ): Promise<IResult<IPlaceSearchResult>>;

  /** 장소 상세 정보 조회 */
  getPlaceDetail(placeId: string): Promise<IResult<ICompetitor>>;

  /** 메뉴/상품 목록 조회 */
  getProducts(placeId: string): Promise<IResult<IProduct[]>>;
}

/**
 * 네이버 플레이스 크롤러
 */
export class NaverPlaceCrawlerService implements IPlaceCrawlerService {
  readonly source: DataSource = 'naver_place';
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://openapi.naver.com/v1/search/local.json';

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async searchNearby(
    center: ICoordinates,
    radiusMeters: number,
    category?: BusinessCategory
  ): Promise<IResult<IPlaceSearchResult>> {
    const startTime = Date.now();

    try {
      const query = this.buildSearchQuery(category);
      const response = await fetch(
        `${this.baseUrl}?query=${encodeURIComponent(query)}&display=20&sort=random`,
        {
          headers: {
            'X-Naver-Client-Id': this.clientId,
            'X-Naver-Client-Secret': this.clientSecret,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Naver API error: ${response.status}`);
      }

      const data = await response.json() as NaverSearchResponse;

      // 결과를 ICompetitor로 변환
      const places = data.items
        .map((item) => this.toCompetitor(item))
        .filter((place) =>
          isWithinRadius(place.location.coordinates, center, radiusMeters)
        );

      return {
        success: true,
        data: {
          places,
          total: data.total,
          hasMore: data.start + data.display < data.total,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getPlaceDetail(placeId: string): Promise<IResult<ICompetitor>> {
    // 네이버 상세 조회 구현 (실제로는 추가 API 필요)
    return {
      success: false,
      error: new Error('Detail API not implemented'),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      },
    };
  }

  async getProducts(placeId: string): Promise<IResult<IProduct[]>> {
    // 메뉴 크롤링 구현 필요
    return {
      success: true,
      data: [],
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      },
    };
  }

  private buildSearchQuery(category?: BusinessCategory): string {
    const categoryKeywords: Record<BusinessCategory, string> = {
      food: '음식점',
      cafe: '카페',
      retail: '편의점',
      service: '서비스',
      beauty: '미용실',
      health: '병원',
      education: '학원',
      other: '매장',
    };

    return category ? categoryKeywords[category] : '음식점';
  }

  private toCompetitor(item: NaverPlaceItem): ICompetitor {
    const now = new Date().toISOString();

    // 좌표 변환 (KATEC -> WGS84 간략화)
    const coordinates = this.convertCoordinates(item.mapx, item.mapy);

    return {
      id: `naver_${item.link}`,
      name: this.stripHtml(item.title),
      category: this.parseCategory(item.category),
      location: {
        coordinates,
        address: {
          full: item.address,
          road: item.roadAddress,
          sido: '',
          sigungu: '',
        },
      },
      phone: item.telephone,
      rating: 0, // 네이버 검색 API에서는 평점 미제공
      reviewCount: 0,
      priceRange: { min: 0, max: 0, currency: 'KRW' },
      products: [],
      source: 'naver_place',
      sourceId: item.link,
      crawledAt: now,
      updatedAt: now,
    };
  }

  private stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, '');
  }

  private parseCategory(categoryStr: string): BusinessCategory {
    if (categoryStr.includes('음식점') || categoryStr.includes('식당')) return 'food';
    if (categoryStr.includes('카페') || categoryStr.includes('커피')) return 'cafe';
    if (categoryStr.includes('미용') || categoryStr.includes('헤어')) return 'beauty';
    if (categoryStr.includes('병원') || categoryStr.includes('의원')) return 'health';
    return 'other';
  }

  private convertCoordinates(mapx: string, mapy: string): ICoordinates {
    // 간략화된 좌표 변환 (실제로는 KATEC -> WGS84 변환 필요)
    return {
      lng: parseFloat(mapx) / 10000000,
      lat: parseFloat(mapy) / 10000000,
    };
  }
}

/**
 * 카카오 로컬 크롤러
 */
export class KakaoLocalCrawlerService implements IPlaceCrawlerService {
  readonly source: DataSource = 'kakao_local';
  private restApiKey: string;
  private baseUrl = 'https://dapi.kakao.com/v2/local/search/keyword.json';

  constructor(restApiKey: string) {
    this.restApiKey = restApiKey;
  }

  async searchNearby(
    center: ICoordinates,
    radiusMeters: number,
    category?: BusinessCategory
  ): Promise<IResult<IPlaceSearchResult>> {
    const startTime = Date.now();

    try {
      const query = category ? this.getCategoryQuery(category) : '음식점';
      const url = new URL(this.baseUrl);
      url.searchParams.set('query', query);
      url.searchParams.set('x', center.lng.toString());
      url.searchParams.set('y', center.lat.toString());
      url.searchParams.set('radius', radiusMeters.toString());
      url.searchParams.set('size', '15');

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `KakaoAK ${this.restApiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Kakao API error: ${response.status}`);
      }

      const data = await response.json() as KakaoSearchResponse;

      const places = data.documents.map((doc) => this.toCompetitor(doc, center));

      return {
        success: true,
        data: {
          places,
          total: data.meta.total_count,
          hasMore: !data.meta.is_end,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getPlaceDetail(placeId: string): Promise<IResult<ICompetitor>> {
    return {
      success: false,
      error: new Error('Not implemented'),
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      },
    };
  }

  async getProducts(placeId: string): Promise<IResult<IProduct[]>> {
    return {
      success: true,
      data: [],
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      },
    };
  }

  private getCategoryQuery(category: BusinessCategory): string {
    const queries: Record<BusinessCategory, string> = {
      food: '음식점',
      cafe: '카페',
      retail: '편의점',
      service: '서비스',
      beauty: '미용실',
      health: '병원',
      education: '학원',
      other: '매장',
    };
    return queries[category];
  }

  private toCompetitor(doc: KakaoPlace, center: ICoordinates): ICompetitor {
    const now = new Date().toISOString();
    const coordinates = { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };

    return {
      id: `kakao_${doc.id}`,
      name: doc.place_name,
      category: this.parseCategory(doc.category_name),
      location: {
        coordinates,
        address: {
          full: doc.address_name,
          road: doc.road_address_name,
          sido: '',
          sigungu: '',
        },
      },
      phone: doc.phone,
      rating: 0,
      reviewCount: 0,
      priceRange: { min: 0, max: 0, currency: 'KRW' },
      products: [],
      source: 'kakao_local',
      sourceId: doc.id,
      crawledAt: now,
      updatedAt: now,
    };
  }

  private parseCategory(categoryName: string): BusinessCategory {
    if (categoryName.includes('음식점')) return 'food';
    if (categoryName.includes('카페')) return 'cafe';
    if (categoryName.includes('미용')) return 'beauty';
    return 'other';
  }
}

/**
 * 플레이스 크롤러 팩토리
 */
export function createPlaceCrawlerService(
  source: DataSource,
  credentials: { clientId?: string; clientSecret?: string; restApiKey?: string }
): IPlaceCrawlerService {
  switch (source) {
    case 'naver_place':
      if (!credentials.clientId || !credentials.clientSecret) {
        throw new Error('Naver credentials required');
      }
      return new NaverPlaceCrawlerService(
        credentials.clientId,
        credentials.clientSecret
      );
    case 'kakao_local':
      if (!credentials.restApiKey) {
        throw new Error('Kakao REST API key required');
      }
      return new KakaoLocalCrawlerService(credentials.restApiKey);
    default:
      throw new Error(`Unsupported source: ${source}`);
  }
}

// API 응답 타입
interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverPlaceItem[];
}

interface NaverPlaceItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

interface KakaoSearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoPlace[];
}

interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}
