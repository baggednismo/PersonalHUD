import { db, auth } from '@/lib/firebase';
import type { Tab, Widget, UrlWidgetData, GridPosition } from '@/types';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  getDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

const mapDocToTab = (doc: QueryDocumentSnapshot<DocumentData>): Tab => {
  const data = doc.data();
  return {
    id: doc.id,
    label: data.label,
    icon: data.icon,
    order: data.order,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as Tab;
};

const mapDocToWidget = (doc: QueryDocumentSnapshot<DocumentData>): Widget => {
  const data = doc.data();
  return {
    id: doc.id,
    type: data.type,
    name: data.name,
    data: data.data,
    color: data.color,
    iconUrl: data.iconUrl,
    gridPosition: data.gridPosition,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as Widget;
};


// User Functions
export const addUser = async (userId: string, userData: { email: string, displayName?: string, photoURL?: string }): Promise<void> => {
  const usersCol = collection(db, 'users');
  const userDoc = doc(usersCol, userId);
  await updateDoc(userDoc, { ...userData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
};



// Tab Functions
export const getTabs = async (userId: string): Promise<Tab[]> => {
  const tabsCol = collection(db, `users/${userId}/tabs`);
  const q = query(tabsCol, orderBy('order'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToTab);
};

export const addTab = async (userId: string, tabData: Pick<Tab, 'label' | 'icon' | 'order'>): Promise<Tab> => {
  const tabsCol = collection(db, `users/${userId}/tabs`);
  const docRef = await addDoc(tabsCol, { ...tabData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return { id: docRef.id, ...tabData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() } as Tab; // approximation
};

export const updateTab = async (userId: string, tabId: string, tabData: Partial<Pick<Tab, 'label' | 'icon' | 'order'>>): Promise<void> => {
  const tabDoc = doc(db, `users/${userId}/tabs/${tabId}`);
  await updateDoc(tabDoc, { ...tabData, updatedAt: serverTimestamp() });
};

export const updateTabsOrder = async (userId: string, tabs: Pick<Tab, 'id' | 'order'>[]): Promise<void> => {
  const batch = writeBatch(db);
  tabs.forEach(tab => {
    const tabDoc = doc(db, `users/${userId}/tabs/${tab.id}`);
    batch.update(tabDoc, { order: tab.order, updatedAt: serverTimestamp() });
  });
  await batch.commit();
};

export const deleteTab = async (userId: string, tabId: string): Promise<void> => {
  // Also delete all widgets under this tab
  const widgetsSnapshot = await getDocs(collection(db, `users/${userId}/tabs/${tabId}/widgets`));
  const batch = writeBatch(db);
  widgetsSnapshot.docs.forEach(widgetDoc => {
    batch.delete(widgetDoc.ref);
  });
  const tabDoc = doc(db, `users/${userId}/tabs/${tabId}`);
  batch.delete(tabDoc);
  await batch.commit();
};

// Widget Functions
export const getWidgets = async (userId: string, tabId: string): Promise<Widget[]> => {
  const widgetsCol = collection(db, `users/${userId}/tabs/${tabId}/widgets`);
  // Add orderBy if needed, e.g., orderBy('gridPosition.y'), then orderBy('gridPosition.x')
  const q = query(widgetsCol, orderBy('createdAt', 'asc')); // Default order by creation
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToWidget);
};

export const addWidget = async (userId: string, tabId: string, widgetData: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Widget> => {
  const widgetsCol = collection(db, `users/${userId}/tabs/${tabId}/widgets`);
  const docRef = await addDoc(widgetsCol, { ...widgetData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  // Fetch the newly created doc to get serverTimestamp evaluated
  const newDoc = await getDoc(docRef);
  return mapDocToWidget(newDoc as QueryDocumentSnapshot<DocumentData>);
};

export const updateWidget = async (userId: string, tabId: string, widgetId: string, widgetData: Partial<Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  const widgetDoc = doc(db, `users/${userId}/tabs/${tabId}/widgets/${widgetId}`);
  await updateDoc(widgetDoc, { ...widgetData, updatedAt: serverTimestamp() });
};

export const deleteWidget = async (userId: string, tabId: string, widgetId: string): Promise<void> => {
  const widgetDoc = doc(db, `users/${userId}/tabs/${tabId}/widgets/${widgetId}`);
  await deleteDoc(widgetDoc);
};
