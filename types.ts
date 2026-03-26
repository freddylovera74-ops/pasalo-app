
export enum Category {
  ELECTRONICA = 'Electronica',
  ROPA = 'Ropa',
  HOGAR = 'Hogar',
  VEHICULOS = 'Vehiculos',
  LIBROS = 'Libros',
  DEPORTES = 'Deportes',
  HERRAMIENTAS = 'Herramientas',
  MASCOTAS = 'Mascotas',
  OTROS = 'Otros'
}

export enum Condition {
  NUEVO = 'Nuevo',
  USADO = 'Usado',
  DANADO = 'Dañado'
}

export type TransactionStatus = 'PENDING_PAYMENT' | 'PAYMENT_REPORTED' | 'PAYMENT_VERIFIED' | 'COMPLETED' | 'CANCELLED';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  reputation?: number;
  averageRating?: number;
  totalRatings?: number;
  location?: { lat: number; lng: number };
  role?: 'user' | 'admin';
  fcmToken?: string;
  createdAt?: any;
}

export interface Notification {
  id: string;
  type: 'new_message' | 'new_interest' | 'price_drop' | 'listing_sold';
  title: string;
  body: string;
  listingId?: string;
  chatId?: string;
  read: boolean;
  createdAt: any;
}

export interface Rating {
  id: string;
  raterId: string;
  ratedUserId: string;
  listingId: string;
  transactionId: string;
  score: number;
  comment: string;
  createdAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  read?: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails: {
    [uid: string]: {
      displayName: string | null;
      photoURL: string | null;
    };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: any;
  };
  listingId?: string;
  listingTitle?: string;
  listingImage?: string;
  updatedAt: any;
}

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string;
  priceUsd: number;
  priceVes: number;
  category: Category;
  condition: Condition;
  images: string[];
  location: { lat: number; lng: number; address: string };
  createdAt: string;
  status: 'active' | 'sold' | 'deleted';
  views: number;
  isBundle?: boolean;
  isReported?: boolean;
  isPromoted?: boolean;
  sellerName?: string;
  sellerPhotoURL?: string;
  sellerRating?: number;
  sellerTotalRatings?: number;
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: TransactionStatus;
  priceUsd: number;
  paymentReference?: string;
  paymentScreenshot?: string;
  createdAt: string;
  listing?: Listing;
}

export interface SafePlace {
  id: string;
  name: string;
  type: string;
  address: string;
  coords: { lat: number; lng: number };
  description: string;
}
