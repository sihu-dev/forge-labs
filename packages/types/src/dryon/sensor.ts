/**
 * @forge/types - DRYON Sensor Types
 * L0 (Atoms) - 센서 관련 타입 정의
 *
 * 자가개선 성장 루프의 SENSE 단계 지원
 */

import type { Timestamp } from '../index';

/**
 * 센서 종류
 */
export type SensorType =
  | 'temperature'  // 온도
  | 'humidity'     // 습도
  | 'pressure'     // 압력
  | 'flow'         // 유량
  | 'level'        // 레벨
  | 'vibration'    // 진동
  | 'energy'       // 에너지 소비
  | 'moisture';    // 수분 함량

/**
 * 센서 통신 프로토콜
 */
export type SensorProtocol =
  | 'modbus_tcp'
  | 'modbus_rtu'
  | 'opcua'
  | 'mqtt'
  | 'http';

/**
 * 데이터 품질 등급
 */
export type DataQuality = 'good' | 'uncertain' | 'bad' | 'missing';

/**
 * 센서 메타데이터
 */
export interface ISensorMeta {
  /** 센서 ID */
  id: string;
  /** 센서 이름 */
  name: string;
  /** 센서 종류 */
  type: SensorType;
  /** 단위 */
  unit: string;
  /** 위치/구역 */
  location: string;
  /** 통신 프로토콜 */
  protocol: SensorProtocol;
  /** 측정 범위 */
  range: {
    min: number;
    max: number;
  };
  /** 정상 범위 */
  normalRange: {
    min: number;
    max: number;
  };
  /** 폴링 간격 (ms) */
  pollingIntervalMs: number;
}

/**
 * 센서 측정값
 */
export interface ISensorReading {
  /** 센서 ID */
  sensorId: string;
  /** 측정값 */
  value: number;
  /** 타임스탬프 */
  timestamp: Timestamp;
  /** 데이터 품질 */
  quality: DataQuality;
  /** 정규화된 값 (0-1) */
  normalizedValue?: number;
  /** 이상치 여부 */
  isAnomaly?: boolean;
}

/**
 * 센서 상태 스냅샷 (결정 시점의 전체 상태)
 */
export interface ISensorState {
  /** 스냅샷 ID */
  id: string;
  /** 타임스탬프 */
  timestamp: Timestamp;
  /** 센서별 측정값 */
  readings: Record<string, ISensorReading>;
  /** 집계 메트릭 */
  aggregates: ISensorAggregates;
}

/**
 * 센서 집계 메트릭
 */
export interface ISensorAggregates {
  /** 입구 온도 */
  temperatureIn: number;
  /** 출구 온도 */
  temperatureOut: number;
  /** 건조실 온도 */
  temperatureDryer: number;
  /** 습도 */
  humidity: number;
  /** 압력 */
  pressure: number;
  /** 에너지 소비량 (kWh) */
  energyConsumption: number;
  /** 처리량 (kg/h) */
  throughput: number;
  /** 수분 함량 (%) */
  moistureContent: number;
}

/**
 * 센서 설정
 */
export interface ISensorConfig {
  /** Modbus 설정 */
  modbus?: {
    host: string;
    port: number;
    unitId: number;
    register: number;
    registerType: 'holding' | 'input';
  };
  /** OPC-UA 설정 */
  opcua?: {
    endpoint: string;
    nodeId: string;
  };
  /** MQTT 설정 */
  mqtt?: {
    broker: string;
    topic: string;
  };
}

/**
 * 센서 등록 정보
 */
export interface ISensor extends ISensorMeta {
  config: ISensorConfig;
  /** 마지막 측정 시간 */
  lastReadingAt?: Timestamp;
  /** 연결 상태 */
  isConnected: boolean;
  /** 에러 횟수 */
  errorCount: number;
}
