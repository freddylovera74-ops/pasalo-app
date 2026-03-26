
import React from 'react';
import { Category, Listing, Condition, SafePlace } from './types';

export const EXCHANGE_RATE = 36.5; // VES per USD (Mocked average)

export const CATEGORIES_CONFIG = [
  { id: Category.ELECTRONICA, icon: <i className="fa-solid fa-laptop text-blue-500"></i> },
  { id: Category.ROPA, icon: <i className="fa-solid fa-shirt text-pink-500"></i> },
  { id: Category.HOGAR, icon: <i className="fa-solid fa-house text-orange-500"></i> },
  { id: Category.VEHICULOS, icon: <i className="fa-solid fa-car text-red-500"></i> },
  { id: Category.LIBROS, icon: <i className="fa-solid fa-book text-green-500"></i> },
  { id: Category.DEPORTES, icon: <i className="fa-solid fa-volleyball text-yellow-500"></i> },
  { id: Category.HERRAMIENTAS, icon: <i className="fa-solid fa-wrench text-gray-500"></i> },
  { id: Category.MASCOTAS, icon: <i className="fa-solid fa-paw text-purple-500"></i> },
  { id: Category.OTROS, icon: <i className="fa-solid fa-ellipsis text-indigo-500"></i> },
];

export const SAFE_PLACES: SafePlace[] = [
  {
    id: 'sp1',
    name: 'Sambil Chacao',
    type: 'Centro Comercial',
    address: 'Av. Libertador, Chacao',
    coords: { lat: 10.4901, lng: -66.8545 },
    description: 'Vigilancia 20/7 y cámaras de seguridad.'
  },
  {
    id: 'sp2',
    name: 'CCCT',
    type: 'Centro Ciudad Comercial Tamanaco',
    address: 'Chuao, Caracas',
    coords: { lat: 10.4847, lng: -66.8488 },
    description: 'Punto de encuentro clásico con múltiples accesos.'
  },
  {
    id: 'sp3',
    name: 'Tolón Fashion Mall',
    type: 'Centro Comercial',
    address: 'Las Mercedes, Caracas',
    coords: { lat: 10.4816, lng: -66.8584 },
    description: 'Zona segura concurrida y excelente iluminación.'
  },
  {
    id: 'sp4',
    name: 'Centro San Ignacio',
    type: 'Centro Comercial y Empresarial',
    address: 'La Castellana, Caracas',
    coords: { lat: 10.4939, lng: -66.8533 },
    description: 'Espacios abiertos con seguridad privada.'
  }
];

export const VENEZUELAN_CITIES = [
  { name: 'Caracas', lat: 10.4806, lng: -66.9036 },
  { name: 'Maracaibo', lat: 10.6445, lng: -71.6408 },
  { name: 'Valencia', lat: 10.1620, lng: -68.0077 },
  { name: 'Barquisimeto', lat: 10.0678, lng: -69.3474 },
  { name: 'Maracay', lat: 10.2469, lng: -67.5958 },
  { name: 'Ciudad Guayana', lat: 8.3460, lng: -62.6682 },
  { name: 'San Cristóbal', lat: 7.7669, lng: -72.2250 },
  { name: 'Barcelona', lat: 10.1362, lng: -64.6862 },
  { name: 'Maturín', lat: 9.7457, lng: -63.1767 },
  { name: 'Puerto La Cruz', lat: 10.2167, lng: -64.6333 },
  { name: 'Mérida', lat: 8.5897, lng: -71.1546 },
  { name: 'Coro', lat: 11.4045, lng: -69.6734 },
  { name: 'Cumaná', lat: 10.4536, lng: -64.1826 },
  { name: 'Los Teques', lat: 10.3422, lng: -67.0422 },
  { name: 'Barinas', lat: 8.6226, lng: -70.2075 },
];

export const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    userId: 'u1',
    title: 'Monitor 24" Dell Full HD',
    description: 'Excelente estado, poco uso. Se entrega con cable HDMI.',
    priceUsd: 120,
    priceVes: 120 * EXCHANGE_RATE,
    category: Category.ELECTRONICA,
    condition: Condition.USADO,
    images: ['https://picsum.photos/seed/mon1/400/400'],
    location: { lat: 10.4806, lng: -66.9036, address: 'Caracas, Chacao' },
    createdAt: new Date().toISOString(),
    status: 'active',
    views: 142
  },
  {
    id: '2',
    userId: 'u2',
    title: 'Zapatos Deportivos Nike',
    description: 'Talla 42, color blanco. Originales.',
    priceUsd: 85,
    priceVes: 85 * EXCHANGE_RATE,
    category: Category.ROPA,
    condition: Condition.NUEVO,
    images: ['https://picsum.photos/seed/shoe1/400/400'],
    location: { lat: 10.4910, lng: -66.8300, address: 'Caracas, Las Mercedes' },
    createdAt: new Date().toISOString(),
    status: 'active',
    views: 89
  },
  {
    id: '3',
    userId: 'u3',
    title: 'Cafetera Oster 12 Tazas',
    description: 'Nueva en caja. Programable.',
    priceUsd: 45,
    priceVes: 45 * EXCHANGE_RATE,
    category: Category.HOGAR,
    condition: Condition.NUEVO,
    images: ['https://picsum.photos/seed/coffee1/400/400'],
    location: { lat: 10.2469, lng: -67.5958, address: 'Maracay, Centro' },
    createdAt: new Date().toISOString(),
    status: 'active',
    views: 215
  }
];
