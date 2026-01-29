
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}

export interface RegistrationDetails {
  mobile: string;
  tradingExperience: string;
  preferredMarket: string;
  capitalSize: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  payment_details?: {
    transactionId: string;
    amount: number;
    date: string;
    screenshotUrl: string;
    rejectionReason?: string;
  };
  registration_details?: RegistrationDetails;
}

export interface ApprovalLog {
  id: string;
  userId: string;
  adminId: string;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
  createdAt: string;
}

export enum AssetType {
  STOCK = 'STOCK',
  OPTION = 'OPTION',
  INDEX = 'INDEX'
}

export enum Side {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum MarketType {
  INTRADAY = 'INTRADAY',
  SWING = 'SWING',
  POSITIONAL = 'POSITIONAL'
}

export enum Emotion {
  CALM = 'CALM',
  ANXIOUS = 'ANXIOUS',
  GREEDY = 'GREEDY',
  FEARFUL = 'FEARFUL',
  CONFIDENT = 'CONFIDENT',
  REVENGE = 'REVENGE'
}

export interface Trade {
  id: string;
  userId: string;
  assetType: AssetType;
  instrument: string;
  side: Side;
  qty: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  target: number;
  timestamp: string;
  marketType: MarketType;
  screenshotUrl?: string;
  notes?: string;
  mistakes: string[];
  psychology: {
    emotionBefore: Emotion;
    emotionDuring: Emotion;
    emotionAfter: Emotion;
    confidence: number;
    stress: number;
  };
  strategyId: string;
  // Added riskReward property to fix type errors in store.ts
  riskReward: number;
}

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  entryRules: string;
  exitRules: string;
  timeframe: string;
  instrument: string;
  riskRules: string;
}

export const COMMON_MISTAKES = [
  'Overtrading',
  'Revenge trading',
  'No stop loss',
  'Early exit',
  'Late entry',
  'Emotional trade',
  'News based trade',
  'Breaking rules'
];