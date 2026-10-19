import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Unsubscribe,
  increment,
  runTransaction,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  User,
  ServerMarketRate,
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
  DEFAULT_BUY_RATE_PER_M,
  DEFAULT_SELL_RATE_PER_M,
  INITIAL_SERVERS,
  LEGACY_BUY_RATES,
  LEGACY_SELL_RATES,
} from '../data/mockData';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'servers', 'europe'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore offline notice.');
    }
    return false;
  }
}

// Superadmin configuration
export const SUPERADMIN_EMAILS = ['t0xiboergen@gmail.com', 'admin@albiontr.com'];

// Check admin status securely from server-side Firestore records or token email
export async function checkIsAdmin(firebaseUser: FirebaseUser | null): Promise<boolean> {
  if (!firebaseUser) return false;
  if (firebaseUser.email && SUPERADMIN_EMAILS.includes(firebaseUser.email.toLowerCase())) {
    return true;
  }

  try {
    const adminRef = doc(db, 'admins', firebaseUser.uid);
    const snap = await getDoc(adminRef);
    return snap.exists();
  } catch {
    return false;
  }
}

// Bootstrap initial server rates in Firestore
export async function bootstrapFirestoreData(): Promise<void> {
  try {
    for (const server of INITIAL_SERVERS) {
      const serverRef = doc(db, 'servers', server.id);
      const snap = await getDoc(serverRef);
      if (!snap.exists()) {
        await setDoc(serverRef, server);
      } else {
        const data = snap.data();
        const updates: Partial<ServerMarketRate> = {};
        if (data.buyRatePerM === LEGACY_BUY_RATES[server.id]) {
          updates.buyRatePerM = DEFAULT_BUY_RATE_PER_M;
        }
        if (LEGACY_SELL_RATES[server.id]?.includes(data.sellRatePerM)) {
          updates.sellRatePerM = DEFAULT_SELL_RATE_PER_M;
        }
        if (Object.keys(updates).length) {
          await updateDoc(serverRef, updates);
        }
      }
    }
  } catch (error) {
    console.warn('Bootstrap Firestore veri kontrolü (yetki veya ilk kurulum):', error);
  }
}

// Load or create User profile document in Firestore
export async function syncUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  try {
    const snap = await getDoc(userRef);
    const isAdmin = await checkIsAdmin(firebaseUser);

    // If superadmin, make sure admin document exists in /admins
    if (firebaseUser.email && SUPERADMIN_EMAILS.includes(firebaseUser.email.toLowerCase())) {
      try {
        const adminRef = doc(db, 'admins', firebaseUser.uid);
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
          await setDoc(adminRef, {
            userId: firebaseUser.uid,
            email: firebaseUser.email,
            grantedAt: new Date().toISOString(),
          });
        }
      } catch (adminErr) {
        console.warn('Admin record setup notice:', adminErr);
      }
    }

    if (snap.exists()) {
      const data = snap.data() as User;
      const resolvedRole = isAdmin ? 'admin' : (data.role || 'user');
      return {
        ...data,
        role: resolvedRole,
      };
    } else {
      const newUser: User = {
        id: firebaseUser.uid,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Oyuncu',
        email: firebaseUser.email || '',
        role: isAdmin ? 'admin' : 'user',
        balance: 0.0,
        phone: firebaseUser.phoneNumber || '',
        discordTag: '',
        defaultCharacterName: 'AlbionOyuncusu',
        defaultServer: 'europe',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
  }
}

// Subscribe to real-time server market rates
export function subscribeToServers(callback: (servers: ServerMarketRate[]) => void): Unsubscribe {
  const serversCol = collection(db, 'servers');
  return onSnapshot(
    serversCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: ServerMarketRate[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ServerMarketRate);
        });
        callback(list);
      }
    },
    (error) => {
      console.warn('Servers snapshot notice:', error.message);
    }
  );
}

// Subscribe to real-time Orders
export function subscribeToOrders(
  userId: string | null,
  isAdmin: boolean,
  callback: (orders: SilverOrder[]) => void
): Unsubscribe {
  const ordersCol = collection(db, 'orders');
  let q = query(ordersCol);

  if (!isAdmin && userId) {
    q = query(ordersCol, where('userId', '==', userId));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: SilverOrder[] = [];
      snapshot.forEach((d) => {
        orders.push(d.data() as SilverOrder);
      });
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(orders);
    },
    (error) => {
      console.warn('Orders snapshot notice:', error.message);
    }
  );
}

// Subscribe to real-time Silver Sales
export function subscribeToSales(
  userId: string | null,
  isAdmin: boolean,
  callback: (sales: SilverSaleRequest[]) => void
): Unsubscribe {
  const salesCol = collection(db, 'sales');
  let q = query(salesCol);

  if (!isAdmin && userId) {
    q = query(salesCol, where('userId', '==', userId));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const sales: SilverSaleRequest[] = [];
      snapshot.forEach((d) => {
        sales.push(d.data() as SilverSaleRequest);
      });
      sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(sales);
    },
    (error) => {
      console.warn('Sales snapshot notice:', error.message);
    }
  );
}

// Subscribe to real-time Top-ups
export function subscribeToTopUps(
  userId: string | null,
  isAdmin: boolean,
  callback: (topups: BalanceTopUpRequest[]) => void
): Unsubscribe {
  const topupsCol = collection(db, 'topups');
  let q = query(topupsCol);

  if (!isAdmin && userId) {
    q = query(topupsCol, where('userId', '==', userId));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const topups: BalanceTopUpRequest[] = [];
      snapshot.forEach((d) => {
        topups.push(d.data() as BalanceTopUpRequest);
      });
      topups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(topups);
    },
    (error) => {
      console.warn('Topups snapshot notice:', error.message);
    }
  );
}

export function subscribeToWithdrawals(
  userId: string | null,
  isAdmin: boolean,
  callback: (withdrawals: WithdrawalRequest[]) => void
): Unsubscribe {
  const withdrawalsCol = collection(db, 'withdrawals');
  const q = !isAdmin && userId
    ? query(withdrawalsCol, where('userId', '==', userId))
    : query(withdrawalsCol);

  return onSnapshot(
    q,
    (snapshot) => {
      const withdrawals: WithdrawalRequest[] = [];
      snapshot.forEach((item) => withdrawals.push(item.data() as WithdrawalRequest));
      withdrawals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(withdrawals);
    },
    (error) => console.warn('Withdrawals snapshot notice:', error.message)
  );
}

export function subscribeToSupportMessages(
  userId: string | null,
  isAdmin: boolean,
  callback: (messages: SupportMessage[]) => void
): Unsubscribe {
  const messagesCol = collection(db, 'supportMessages');
  const q = !isAdmin && userId
    ? query(messagesCol, where('userId', '==', userId))
    : query(messagesCol);

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: SupportMessage[] = [];
      snapshot.forEach((item) => messages.push(item.data() as SupportMessage));
      messages.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      callback(messages);
    },
    (error) => console.warn('Support messages snapshot notice:', error.message)
  );
}

// Subscribe to all Users (Admin only)
export function subscribeToUsers(callback: (users: User[]) => void): Unsubscribe {
  const usersCol = collection(db, 'users');
  return onSnapshot(
    usersCol,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((d) => {
        users.push(d.data() as User);
      });
      callback(users);
    },
    (error) => {
      console.warn('Users snapshot notice (requires admin):', error.message);
    }
  );
}

// Firestore Order creation
export async function createFirestoreOrder(
  order: Omit<SilverOrder, 'id' | 'orderNumber' | 'status' | 'secretCode' | 'createdAt' | 'updatedAt'>
): Promise<SilverOrder> {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ALB-${randomNum}`;
  const secretCode = `TR-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord-${Date.now()}`;

  const newOrder: SilverOrder = {
    ...order,
    id: orderId,
    orderNumber,
    status: 'preparing',
    secretCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const orderPath = `orders/${orderId}`;
  try {
    await setDoc(doc(db, 'orders', orderId), newOrder);
    return newOrder;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, orderPath);
  }
}

// Firestore Sale request creation
export async function createFirestoreSale(
  sale: SilverSaleRequest
): Promise<SilverSaleRequest> {
  const salePath = `sales/${sale.id}`;
  try {
    await setDoc(doc(db, 'sales', sale.id), sale);
    return sale;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, salePath);
  }
}

// Firestore TopUp notification creation
export async function createFirestoreTopUp(
  topUp: Omit<BalanceTopUpRequest, 'id' | 'transactionNumber' | 'status' | 'createdAt'>
): Promise<BalanceTopUpRequest> {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const transactionNumber = `BAK-${randomNum}`;
  const topUpId = `top-${Date.now()}`;

  const newTopUp: BalanceTopUpRequest = {
    ...topUp,
    id: topUpId,
    transactionNumber,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const topUpPath = `topups/${topUpId}`;
  try {
    await setDoc(doc(db, 'topups', topUpId), newTopUp);
    return newTopUp;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, topUpPath);
  }
}

export async function createFirestoreWithdrawal(withdrawal: WithdrawalRequest): Promise<void> {
  const userRef = doc(db, 'users', withdrawal.userId);
  const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
  try {
    await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      const balance = Number(userSnapshot.data()?.balance ?? 0);
      if (!userSnapshot.exists() || balance < withdrawal.amount) {
        throw new Error('Yetersiz bakiye.');
      }
      transaction.update(userRef, { balance: increment(-withdrawal.amount) });
      transaction.set(withdrawalRef, withdrawal);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `withdrawals/${withdrawal.id}`);
  }
}

export async function createFirestoreSupportMessage(message: SupportMessage): Promise<void> {
  if (!message.userId) return;
  try {
    await setDoc(doc(db, 'supportMessages', message.id), message);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `supportMessages/${message.id}`);
  }
}

// ADMIN ACTIONS IN FIRESTORE

// Update Order status
export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      note: note || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Update Sale status
export async function updateSaleStatusInFirestore(
  saleId: string,
  status: SaleStatus,
  tradeMeetPoint?: string,
  adminNote?: string,
  assignedCharacterName?: string
): Promise<void> {
  const path = `sales/${saleId}`;
  try {
    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, 'sales', saleId);
      const snapshot = await transaction.get(saleRef);
      if (!snapshot.exists()) throw new Error('Satış talebi bulunamadı.');
      const sale = snapshot.data() as SilverSaleRequest;
      const updates: Record<string, unknown> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (tradeMeetPoint !== undefined) updates.tradeMeetPoint = tradeMeetPoint;
      if (assignedCharacterName !== undefined) updates.assignedCharacterName = assignedCharacterName;
      if (adminNote !== undefined) updates.adminNote = adminNote;
      transaction.update(saleRef, updates);

      if (status === 'completed' && sale.status !== 'completed' && sale.payoutMethod === 'balance') {
        transaction.update(doc(db, 'users', sale.userId), {
          balance: increment(sale.totalPayout),
        });
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Approve Top-Up in Firestore: updates top-up record and increments user balance
export async function approveTopUpInFirestore(
  topupId: string,
  userId: string,
  amount: number
): Promise<void> {
  const topupPath = `topups/${topupId}`;
  try {
    await updateDoc(doc(db, 'topups', topupId), {
      status: 'approved',
      approvedAt: new Date().toISOString(),
    });

    // Credit user's balance
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      balance: increment(amount),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, topupPath);
  }
}

// Reject Top-Up in Firestore
export async function rejectTopUpInFirestore(topupId: string): Promise<void> {
  const path = `topups/${topupId}`;
  try {
    await updateDoc(doc(db, 'topups', topupId), {
      status: 'rejected',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateWithdrawalStatusInFirestore(
  withdrawalId: string,
  status: Exclude<WithdrawalStatus, 'pending'>
): Promise<void> {
  const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(withdrawalRef);
      if (!snapshot.exists() || snapshot.data().status !== 'pending') return;

      const withdrawal = snapshot.data() as WithdrawalRequest;
      transaction.update(withdrawalRef, { status, processedAt: new Date().toISOString() });
      if (status === 'rejected') {
        transaction.update(doc(db, 'users', withdrawal.userId), {
          balance: increment(withdrawal.amount),
        });
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${withdrawalId}`);
  }
}

// Update Server Market Rates & Stock in Firestore
export async function updateServerRatesInFirestore(
  serverId: string,
  updates: Partial<ServerMarketRate>
): Promise<void> {
  const path = `servers/${serverId}`;
  try {
    await setDoc(doc(db, 'servers', serverId), updates, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Grant Admin Role in Firestore
export async function grantAdminRoleInFirestore(userId: string, email: string): Promise<void> {
  const adminPath = `admins/${userId}`;
  try {
    await setDoc(doc(db, 'admins', userId), {
      userId,
      email,
      grantedAt: new Date().toISOString(),
    });
    // Also update role field on user record
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, adminPath);
  }
}

// Revoke Admin Role in Firestore
export async function revokeAdminRoleInFirestore(userId: string): Promise<void> {
  const adminPath = `admins/${userId}`;
  try {
    await deleteDoc(doc(db, 'admins', userId));
    await updateDoc(doc(db, 'users', userId), {
      role: 'user',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, adminPath);
  }
}
