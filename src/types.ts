export type ServerRegion = string;

export interface ServerMarketRate {
  id: ServerRegion;
  gameId?: string;
  gameName?: string;
  currencyLabel?: string;
  coinImage?: string;
  name: string;
  location: string;
  buyRatePerM: number; // Kullanıcının satın aldığı fiyat (₺ / 1M)
  sellRatePerM: number; // Kullanıcının siteye sattığı fiyat (₺ / 1M)
  stockM: number; // Milyon cinsinden stok
  goldRatePer100: number; // 100 Gold fiyatı (₺)
  isOnline: boolean;
  averageDeliveryMinutes: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  balance: number; // ₺
  phone?: string;
  discordTag?: string;
  defaultCharacterName?: string;
  defaultServer?: ServerRegion;
  createdAt: string;
}
export type UserDashboardTab = 'orders' | 'sales' | 'topups' | 'withdrawals' | 'profile';

export type DeliveryMethod = 
  | 'direct_trade' 
  | 'island_chest' 
  | 'guild_transfer' 
  | 'auction_buyout';

export type OrderStatus = 'preparing' | 'in_delivery' | 'delivered' | 'cancelled';

export interface SilverOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  server: ServerRegion;
  characterName: string;
  deliveryMethod: DeliveryMethod;
  deliveryLocation: string;
  amountM: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
  paymentMethod: 'balance' | 'credit_card_sim' | 'havale';
  status: OrderStatus;
  secretCode: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type SaleStatus = 'pending' | 'reviewing' | 'trade_ready' | 'completed' | 'rejected';

export interface SilverSaleRequest {
  id: string;
  requestNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  server: ServerRegion;
  characterName: string;
  deliveryLocation?: string;
  amountM: number;
  ratePerM: number;
  totalPayout: number;
  payoutMethod: 'balance' | 'bank_transfer' | 'papara';
  payoutDetails: string; // IBAN or Papara No or "Bakiye Olarak Ekle"
  status: SaleStatus;
  tradeMeetPoint?: string;
  assignedCharacterName?: string;
  tradeVerificationCode: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentNotificationStatus = 'pending' | 'approved' | 'rejected';

export interface BalanceTopUpRequest {
  id: string;
  transactionNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  method: 'havale' | 'papara' | 'credit_card_sim';
  bankName?: string;
  senderFullName: string;
  amount: number;
  referenceCode: string;
  note?: string;
  status: PaymentNotificationStatus;
  createdAt: string;
  approvedAt?: string;
}

export type WithdrawalStatus = 'pending' | 'paid' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  requestNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  method: 'bank_transfer' | 'papara';
  recipientName: string;
  accountDetails: string;
  status: WithdrawalStatus;
  createdAt: string;
  processedAt?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  branchCode?: string;
  accountNumber?: string;
  logoColor: string;
  isFastAvailable: boolean;
}

export interface ProductItem {
  id: string;
  category: 'silver_package' | 'gold_token' | 'premium' | 'skin';
  name: string;
  server?: ServerRegion;
  amountM?: number;
  price: number;
  originalPrice?: number;
  tag?: string;
  image: string;
  description: string;
  popular?: boolean;
}

export interface LiveFeedItem {
  id: string;
  characterMasked: string;
  serverName: string;
  actionText: string;
  amount: string;
  timeAgo: string;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'support' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  userId?: string;
  createdAt?: string;
}
