import {
  ServerMarketRate,
  User,
  SilverOrder,
  SilverSaleRequest,
  BalanceTopUpRequest,
    WithdrawalRequest,
    WithdrawalStatus,
  SupportMessage,
  OrderStatus,
  SaleStatus,
  PaymentNotificationStatus,
} from '../types';
import {
  INITIAL_SERVERS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_SALES,
  INITIAL_TOPUPS,
  DEFAULT_BUY_RATE_PER_M,
  DEFAULT_SELL_RATE_PER_M,
  LEGACY_BUY_RATES,
  LEGACY_SELL_RATES,
} from '../data/mockData';
import {
  db,
  auth,
  createFirestoreOrder,
  createFirestoreSale,
  createFirestoreTopUp,
  createFirestoreSupportMessage,
    createFirestoreWithdrawal,
  updateOrderStatusInFirestore,
  updateSaleStatusInFirestore,
  approveTopUpInFirestore,
  rejectTopUpInFirestore,
    updateWithdrawalStatusInFirestore,
  updateServerRatesInFirestore,
  checkIsAdmin,
} from './firebase';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'albion_market_users',
  CURRENT_USER_ID: 'albion_current_user_id',
  SERVERS: 'albion_market_servers',
  ORDERS: 'albion_market_orders',
  SALES: 'albion_market_sales',
  TOPUPS: 'albion_market_topups',
    WITHDRAWALS: 'albion_market_withdrawals',
    BUY_BUDGET: 'albion_market_buy_budget',
  CHAT: 'albion_market_chat',
};

// Event to notify UI of data modifications
export const STORE_UPDATE_EVENT = 'albion_store_updated';

export function emitUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT));
  }
}

// Helper to safely load data
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    emitUpdate();
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

// Initializer to ensure seeded data is populated on first visit
export function initializeStore(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
  } else {
    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const migratedUsers = users.map((user) =>
      user.id === 'usr-admin' && user.username === 'AlbionPazar_Admin'
        ? { ...user, username: 'OYNAGAME_Admin' }
        : user
    );
    if (migratedUsers.some((user, index) => user !== users[index])) {
      setStored(STORAGE_KEYS.USERS, migratedUsers);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
    setStored(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SERVERS)) {
    setStored(STORAGE_KEYS.SERVERS, INITIAL_SERVERS);
  } else {
    const storedServers = getStored<ServerMarketRate[]>(STORAGE_KEYS.SERVERS, INITIAL_SERVERS);
    const migratedServers = storedServers.map((server) => {
      const updates: Partial<ServerMarketRate> = {};
      const initialServer = INITIAL_SERVERS.find((initial) => initial.id === server.id);
      if (!server.gameId) {
        updates.gameId = 'albion-online';
        updates.gameName = 'Albion Online';
      }
      if (!server.coinImage && initialServer?.coinImage) {
        updates.coinImage = initialServer.coinImage;
      }
      if (server.buyRatePerM === LEGACY_BUY_RATES[server.id]) {
        updates.buyRatePerM = DEFAULT_BUY_RATE_PER_M;
      }
      if (LEGACY_SELL_RATES[server.id]?.includes(server.sellRatePerM)) {
        updates.sellRatePerM = DEFAULT_SELL_RATE_PER_M;
      }
      return Object.keys(updates).length ? { ...server, ...updates } : server;
    });
    const existingIds = new Set(migratedServers.map((server) => server.id));
    const mergedServers = [...migratedServers, ...INITIAL_SERVERS.filter((server) => !existingIds.has(server.id))];
    if (mergedServers.length !== storedServers.length || mergedServers.some((server, index) => server !== storedServers[index])) {
      setStored(STORAGE_KEYS.SERVERS, mergedServers);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    setStored(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    setStored(STORAGE_KEYS.SALES, INITIAL_SALES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TOPUPS)) {
    setStored(STORAGE_KEYS.TOPUPS, INITIAL_TOPUPS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.WITHDRAWALS)) {
    setStored(STORAGE_KEYS.WITHDRAWALS, [] as WithdrawalRequest[]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BUY_BUDGET)) {
    setStored(STORAGE_KEYS.BUY_BUDGET, 100000);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHAT)) {
    const defaultChat: SupportMessage[] = [
      {
        id: 'msg-1',
        sender: 'support',
        senderName: 'Müşteri Temsilcisi (Canan)',
        text: 'Merhaba, OYNAGAME desteğe hoş geldiniz. Oyun parası alım satım talepleri ve sipariş takibiyle ilgili sorularınızı buraya yazabilirsiniz.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setStored(STORAGE_KEYS.CHAT, defaultChat);
  } else {
    const chat = getStored<SupportMessage[]>(STORAGE_KEYS.CHAT, []);
    const migratedChat = chat.map((message) =>
      message.id === 'msg-1' && message.sender === 'support' && message.text.includes('AlbionPazar')
        ? { ...message, text: 'Merhaba, OYNAGAME desteğe hoş geldiniz. Oyun parası alım satım talepleri ve sipariş takibiyle ilgili sorularınızı buraya yazabilirsiniz.' }
        : message
    );
    if (migratedChat.some((message, index) => message !== chat[index])) {
      setStored(STORAGE_KEYS.CHAT, migratedChat);
    }
  }
}

// USER OPERATIONS
export function getUsers(): User[] {
  return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function getCurrentUser(): User | null {
  const users = getUsers();
  const currentId = getStored<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
  if (!currentId) return null;
  return users.find((u) => u.id === currentId) || null;
}

export function setCurrentUser(user: User | null): void {
  if (user === null) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  } else {
    // Upsert into users
    const users = getUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    setStored(STORAGE_KEYS.USERS, users);
    setStored(STORAGE_KEYS.CURRENT_USER_ID, user.id);
  }
  emitUpdate();
}

export function setCurrentUserId(userId: string | null): void {
  if (userId === null) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  } else {
    setStored(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }
  emitUpdate();
}

export function loginUser(email: string): { success: boolean; user?: User; message?: string } {
  const users = getUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (found) {
    setCurrentUserId(found.id);
    return { success: true, user: found };
  }
  return { success: false, message: 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.' };
}

export function registerUser(data: {
  username: string;
  email: string;
  phone?: string;
  discordTag?: string;
  defaultCharacterName?: string;
  defaultServer?: string;
}): { success: boolean; user?: User; message?: string } {
  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
  if (existing) {
    return { success: false, message: 'Bu e-posta adresi zaten kullanımda.' };
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    username: data.username.trim(),
    email: data.email.trim(),
    role: data.email.toLowerCase() === 'admin@albiontr.com' || data.email.toLowerCase() === 't0xiboergen@gmail.com' ? 'admin' : 'user',
    balance: 0.00, // Starts at 0.00 for authentic accounting
    phone: data.phone?.trim() || '',
    discordTag: data.discordTag?.trim() || '',
    defaultCharacterName: data.defaultCharacterName?.trim() || 'AlbionOyuncusu',
    defaultServer: data.defaultServer || 'europe',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  setStored(STORAGE_KEYS.USERS, users);
  setCurrentUserId(newUser.id);
  return { success: true, user: newUser };
}

export function updateUserProfile(id: string, updates: Partial<User>): void {
  const users = getUsers();
  const updated = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
  setStored(STORAGE_KEYS.USERS, updated);

  // Sync to Firestore if authenticated
  if (auth.currentUser && auth.currentUser.uid === id) {
    try {
      const allowedUpdates: any = {};
      if (updates.defaultCharacterName !== undefined) allowedUpdates.defaultCharacterName = updates.defaultCharacterName;
      if (updates.defaultServer !== undefined) allowedUpdates.defaultServer = updates.defaultServer;
      if (updates.phone !== undefined) allowedUpdates.phone = updates.phone;
      if (updates.discordTag !== undefined) allowedUpdates.discordTag = updates.discordTag;
      if (updates.username !== undefined) allowedUpdates.username = updates.username;

      if (Object.keys(allowedUpdates).length > 0) {
        updateDoc(doc(db, 'users', id), allowedUpdates).catch((err) =>
          console.warn('Firestore profile update non-critical warning:', err)
        );
      }
    } catch (err) {
      console.warn('Firestore user update skipped:', err);
    }
  }
}

export function adjustUserBalance(userId: string, amountDiff: number): void {
  const users = getUsers();
  const updated = users.map((u) => {
    if (u.id === userId) {
      const newBal = Math.max(0, Math.round((u.balance + amountDiff) * 100) / 100);
      return { ...u, balance: newBal };
    }
    return u;
  });
  setStored(STORAGE_KEYS.USERS, updated);
}

// SERVER OPERATIONS
export function getServers(): ServerMarketRate[] {
  return getStored<ServerMarketRate[]>(STORAGE_KEYS.SERVERS, INITIAL_SERVERS);
}

export function getBuyBudget(): number {
  return getStored<number>(STORAGE_KEYS.BUY_BUDGET, 100000);
}

export function setBuyBudget(amount: number): void {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Alım bütçesi sıfır veya daha büyük olmalıdır.');
  setStored(STORAGE_KEYS.BUY_BUDGET, Math.round(amount * 100) / 100);
}

export function getReservedBuyBudget(): number {
  return getSales()
    .filter((sale) => sale.status === 'pending' || sale.status === 'reviewing' || sale.status === 'trade_ready')
    .reduce((total, sale) => total + sale.totalPayout, 0);
}

export function updateServerRates(
  serverId: string,
  updates: Partial<ServerMarketRate>
): void {
  const servers = getServers();
  const existing = servers.find((server) => server.id === serverId);
  const updated = existing
    ? servers.map((server) => (server.id === serverId ? { ...server, ...updates } : server))
    : [...servers, { ...updates, id: serverId } as ServerMarketRate];
  setStored(STORAGE_KEYS.SERVERS, updated);

  // Sync to Firestore if authenticated
  if (auth.currentUser) {
    updateServerRatesInFirestore(serverId, updates).catch((err) =>
      console.warn('Firestore server rate sync notice:', err)
    );
  }
}

// ORDER OPERATIONS
export function getOrders(): SilverOrder[] {
  return getStored<SilverOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
}

export function createOrder(
  data: Omit<SilverOrder, 'id' | 'orderNumber' | 'status' | 'secretCode' | 'createdAt' | 'updatedAt'>
): SilverOrder {
  const server = getServers().find((item) => item.id === data.server);
  if (!server || server.stockM < data.amountM) {
    throw new Error(`Stok yetersiz. Mevcut stok: ${server?.stockM ?? 0} ${server?.currencyLabel || 'birim'}.`);
  }
  if (data.paymentMethod === 'balance') {
    const user = getUsers().find((item) => item.id === data.userId);
    if (!user || user.balance < data.totalPrice) throw new Error('Bakiye yetersiz.');
  }
  const orders = getOrders();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ALB-${randomNum}`;
  const secretCode = `TR-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: SilverOrder = {
    ...data,
    id: `ord-${Date.now()}`,
    orderNumber,
    status: 'preparing',
    secretCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // If paid via balance, deduct user's balance
  if (data.paymentMethod === 'balance') {
    adjustUserBalance(data.userId, -data.totalPrice);
  }

  // Deduct server stock
  updateServerRates(data.server, { stockM: Math.max(0, server.stockM - data.amountM) });

  orders.unshift(newOrder);
  setStored(STORAGE_KEYS.ORDERS, orders);

  // Persist to Cloud Firestore if connected
  if (auth.currentUser) {
    createFirestoreOrder({ ...data }).catch((err) =>
      console.warn('Firestore order sync warning:', err)
    );
  }

  return newOrder;
}

export function updateOrderStatus(orderId: string, status: OrderStatus, note?: string): void {
  const orders = getOrders();
  const updated = orders.map((ord) => {
    if (ord.id === orderId) {
      return {
        ...ord,
        status,
        note: note !== undefined ? note : ord.note,
        updatedAt: new Date().toISOString(),
      };
    }
    return ord;
  });
  setStored(STORAGE_KEYS.ORDERS, updated);

  if (auth.currentUser) {
    updateOrderStatusInFirestore(orderId, status, note).catch((err) =>
      console.warn('Firestore order status sync notice:', err)
    );
  }
}

export function cancelOrder(orderId: string): void {
  const orders = getOrders();
  const ord = orders.find((o) => o.id === orderId);
  if (!ord || ord.status === 'cancelled') return;

  // Refund user balance if paid with balance
  if (ord.paymentMethod === 'balance') {
    adjustUserBalance(ord.userId, ord.totalPrice);
  }

  // Restore server stock
  const servers = getServers();
  const srv = servers.find((s) => s.id === ord.server);
  if (srv) {
    updateServerRates(ord.server, { stockM: srv.stockM + ord.amountM });
  }

  updateOrderStatus(orderId, 'cancelled', 'Sipariş kullanıcı veya yönetici tarafından iptal edildi.');
}

// SILVER SALE OPERATIONS
export function getSales(): SilverSaleRequest[] {
  return getStored<SilverSaleRequest[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
}

export function createSaleRequest(
  data: Omit<SilverSaleRequest, 'id' | 'requestNumber' | 'status' | 'tradeVerificationCode' | 'createdAt' | 'updatedAt'>
): SilverSaleRequest {
  const server = getServers().find((item) => item.id === data.server);
  if (!server) throw new Error('Seçilen oyun sunucusu bulunamadı.');
  const ratePerM = server.sellRatePerM;
  const payoutMultiplier = data.payoutMethod === 'balance' ? 1.02 : 1;
  const totalPayout = Math.round(data.amountM * ratePerM * payoutMultiplier * 100) / 100;
  const spendableBudget = Math.max(0, getBuyBudget() - getReservedBuyBudget());
  if (totalPayout > spendableBudget) {
    throw new Error(`Alım bütçesi yetersiz. Şu an kullanılabilir tutar ${spendableBudget.toFixed(2)} ₺.`);
  }
  data = {
    ...data,
    ratePerM,
    totalPayout,
    payoutMethod: 'balance',
    payoutDetails: 'Site bakiyesine aktarım (+%2 bonus)',
  };
  const sales = getSales();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const requestNumber = `SAT-${randomNum}`;
  const tradeVerificationCode = `SAT-KOD-${Math.floor(100 + Math.random() * 900)}`;

  const newSale: SilverSaleRequest = {
    ...data,
    id: `sale-${Date.now()}`,
    requestNumber,
    status: 'pending',
    tradeVerificationCode,
    tradeMeetPoint: data.deliveryLocation || 'İnceleme sonrası yetkili teslimat karakteri ve buluşma noktası atanacaktır.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  sales.unshift(newSale);
  setStored(STORAGE_KEYS.SALES, sales);

  if (auth.currentUser) {
    createFirestoreSale(newSale).catch((err) =>
      console.warn('Firestore sale sync warning:', err)
    );
  }

  return newSale;
}

export function updateSaleStatus(
  saleId: string,
  status: SaleStatus,
  tradeMeetPoint?: string,
  adminNote?: string,
  assignedCharacterName?: string
): void {
  const sales = getSales();
  const sale = sales.find((s) => s.id === saleId);
  if (!sale) return;

  // If transitioning to completed and payout is balance, add funds to user's balance!
  if (status === 'completed' && sale.status !== 'completed' && sale.payoutMethod === 'balance') {
    adjustUserBalance(sale.userId, sale.totalPayout);
  }

  if (status === 'completed' && sale.status !== 'completed') {
    setBuyBudget(Math.max(0, getBuyBudget() - sale.totalPayout));
  }

  // Also increase server stock when sale is completed
  if (status === 'completed' && sale.status !== 'completed') {
    const servers = getServers();
    const srv = servers.find((s) => s.id === sale.server);
    if (srv) {
      updateServerRates(sale.server, { stockM: srv.stockM + sale.amountM });
    }
  }

  const updated = sales.map((s) => {
    if (s.id === saleId) {
      return {
        ...s,
        status,
        tradeMeetPoint: tradeMeetPoint || s.tradeMeetPoint,
        assignedCharacterName: assignedCharacterName !== undefined ? assignedCharacterName : s.assignedCharacterName,
        adminNote: adminNote !== undefined ? adminNote : s.adminNote,
        updatedAt: new Date().toISOString(),
      };
    }
    return s;
  });

  setStored(STORAGE_KEYS.SALES, updated);

  if (auth.currentUser) {
    updateSaleStatusInFirestore(saleId, status, tradeMeetPoint, adminNote, assignedCharacterName).catch((err) =>
      console.warn('Firestore sale update notice:', err)
    );
  }
}

// BALANCE TOP-UP OPERATIONS
export function getTopUps(): BalanceTopUpRequest[] {
  return getStored<BalanceTopUpRequest[]>(STORAGE_KEYS.TOPUPS, INITIAL_TOPUPS);
}

export function createTopUpRequest(
  data: Omit<BalanceTopUpRequest, 'id' | 'transactionNumber' | 'status' | 'createdAt'>
): BalanceTopUpRequest {
  const topups = getTopUps();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const transactionNumber = `BAK-${randomNum}`;

  const newTopUp: BalanceTopUpRequest = {
    ...data,
    id: `top-${Date.now()}`,
    transactionNumber,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  topups.unshift(newTopUp);
  setStored(STORAGE_KEYS.TOPUPS, topups);

  if (auth.currentUser) {
    createFirestoreTopUp({ ...data }).catch((err) =>
      console.warn('Firestore topup sync warning:', err)
    );
  }

  return newTopUp;
}

export function approveTopUp(topUpId: string): void {
  const topups = getTopUps();
  const topup = topups.find((t) => t.id === topUpId);
  if (!topup || topup.status === 'approved') return;

  // Credit user's balance
  adjustUserBalance(topup.userId, topup.amount);

  const updated = topups.map((t) => {
    if (t.id === topUpId) {
      return {
        ...t,
        status: 'approved' as PaymentNotificationStatus,
        approvedAt: new Date().toISOString(),
      };
    }
    return t;
  });

  setStored(STORAGE_KEYS.TOPUPS, updated);

  if (auth.currentUser) {
    approveTopUpInFirestore(topUpId, topup.userId, topup.amount).catch((err) =>
      console.warn('Firestore topup approve notice:', err)
    );
  }
}

export function rejectTopUp(topUpId: string): void {
  const topups = getTopUps();
  const updated = topups.map((t) => {
    if (t.id === topUpId) {
      return {
        ...t,
        status: 'rejected' as PaymentNotificationStatus,
      };
    }
    return t;
  });
  setStored(STORAGE_KEYS.TOPUPS, updated);

  if (auth.currentUser) {
    rejectTopUpInFirestore(topUpId).catch((err) =>
      console.warn('Firestore topup reject notice:', err)
    );
  }
}

export function getWithdrawals(): WithdrawalRequest[] {
  return getStored<WithdrawalRequest[]>(STORAGE_KEYS.WITHDRAWALS, []);
}

export function createWithdrawalRequest(
  data: Omit<WithdrawalRequest, 'id' | 'requestNumber' | 'status' | 'createdAt' | 'processedAt'>
): WithdrawalRequest | null {
  const amount = Math.round(data.amount * 100) / 100;
  const user = getUsers().find((candidate) => candidate.id === data.userId);
  if (!user || !Number.isFinite(amount) || amount <= 0 || user.balance < amount) return null;

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const withdrawal: WithdrawalRequest = {
    ...data,
    amount,
    id: `withdraw-${Date.now()}`,
    requestNumber: `CEK-${randomNum}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  adjustUserBalance(user.id, -amount);
  const withdrawals = getWithdrawals();
  withdrawals.unshift(withdrawal);
  setStored(STORAGE_KEYS.WITHDRAWALS, withdrawals);

  if (auth.currentUser) {
    createFirestoreWithdrawal(withdrawal).catch((err) =>
      console.warn('Firestore withdrawal sync warning:', err)
    );
  }

  return withdrawal;
}

export function updateWithdrawalStatus(withdrawalId: string, status: WithdrawalStatus): void {
  const withdrawals = getWithdrawals();
  const withdrawal = withdrawals.find((item) => item.id === withdrawalId);
  if (!withdrawal || withdrawal.status !== 'pending' || status === 'pending') return;

  if (status === 'rejected') {
    adjustUserBalance(withdrawal.userId, withdrawal.amount);
  }

  const updated = withdrawals.map((item) =>
    item.id === withdrawalId
      ? { ...item, status, processedAt: new Date().toISOString() }
      : item
  );
  setStored(STORAGE_KEYS.WITHDRAWALS, updated);

  if (auth.currentUser) {
    updateWithdrawalStatusInFirestore(withdrawalId, status).catch((err) =>
      console.warn('Firestore withdrawal status notice:', err)
    );
  }
}

// NOTE: Honest accounting - without real payment gateway webhook, requests remain PENDING for admin review
export function simulateCardTopUpRequest(
  userId: string,
  userEmail: string,
  userName: string,
  amount: number
): BalanceTopUpRequest {
  const topups = getTopUps();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const transactionNumber = `KRT-${randomNum}`;

  const pendingTopUp: BalanceTopUpRequest = {
    id: `top-${Date.now()}`,
    transactionNumber,
    userId,
    userEmail,
    userName,
    method: 'credit_card_sim',
    bankName: 'Simüle 3D Secure / Test POS',
    senderFullName: userName,
    amount,
    referenceCode: `SIM-POS-${Math.floor(100000 + Math.random() * 900000)}`,
    note: 'Simüle 3D Secure işlemi yapıldı. Gerçek banka entegrasyonu olmadığı için yönetici onayı bekliyor.',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  topups.unshift(pendingTopUp);
  setStored(STORAGE_KEYS.TOPUPS, topups);

  if (auth.currentUser) {
    createFirestoreTopUp({
      userId,
      userEmail,
      userName,
      method: 'credit_card_sim',
      bankName: 'Simüle 3D Secure / Test POS',
      senderFullName: userName,
      amount,
      referenceCode: pendingTopUp.referenceCode,
      note: pendingTopUp.note,
    }).catch((err) => console.warn('Firestore topup sync warning:', err));
  }

  return pendingTopUp;
}

// SUPPORT CHAT OPERATIONS
export function getSupportMessages(): SupportMessage[] {
  return getStored<SupportMessage[]>(STORAGE_KEYS.CHAT, []);
}

export function sendSupportMessage(
  sender: 'user' | 'support' | 'system',
  senderName: string,
  text: string,
  userId?: string
): void {
  const messages = getSupportMessages();
  const newMsg: SupportMessage = {
    id: `msg-${Date.now()}`,
    sender,
    senderName,
    text,
    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    userId,
    createdAt: new Date().toISOString(),
  };
  messages.push(newMsg);
  setStored(STORAGE_KEYS.CHAT, messages);

  if (auth.currentUser && userId) {
    createFirestoreSupportMessage(newMsg).catch((err) =>
      console.warn('Firestore support message sync warning:', err)
    );
  }
}

// RESET TO DEMO DATA
export function resetStoreToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, JSON.stringify(INITIAL_USERS[0].id));
  localStorage.setItem(STORAGE_KEYS.SERVERS, JSON.stringify(INITIAL_SERVERS));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
  localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(INITIAL_TOPUPS));
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify([]));
  localStorage.removeItem(STORAGE_KEYS.CHAT);
  initializeStore();
  emitUpdate();
}
