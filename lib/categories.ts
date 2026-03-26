import type { ComponentType } from 'react';
import { Smartphone, Car, Home, Zap, Shirt, Building, Wrench, Package } from 'lucide-react';

export interface MarketplaceCategory {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  subcategories: string[];
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    id: 'tecnologia',
    label: 'Tecnología y Electrónica',
    icon: Smartphone,
    subcategories: [
      'Celulares y Tablets',
      'Computadoras y Laptops',
      'Consolas y Videojuegos',
      'Audio y Video',
      'Accesorios y Componentes',
    ],
  },
  {
    id: 'vehiculos',
    label: 'Vehículos y Repuestos',
    icon: Car,
    subcategories: [
      'Carros y Camionetas',
      'Motos',
      'Repuestos para Carros',
      'Repuestos para Motos',
      'Accesorios',
    ],
  },
  {
    id: 'hogar',
    label: 'Hogar y Electrodomésticos',
    icon: Home,
    subcategories: [
      'Línea Blanca',
      'Línea Marrón y Entretenimiento',
      'Muebles y Decoración',
      'Electrodomésticos Menores',
    ],
  },
  {
    id: 'energia',
    label: 'Energía y Herramientas',
    icon: Zap,
    subcategories: [
      'Plantas Eléctricas e Inversores',
      'Tanques y Bombas de Agua',
      'Herramientas de Construcción',
      'Materiales de Construcción',
    ],
  },
  {
    id: 'moda',
    label: 'Moda y Accesorios',
    icon: Shirt,
    subcategories: [
      'Ropa para Damas',
      'Ropa para Caballeros',
      'Ropa para Bebés/Niños',
      'Zapatos y Calzado',
      'Relojes y Joyas',
    ],
  },
  {
    id: 'inmuebles',
    label: 'Inmuebles',
    icon: Building,
    subcategories: [
      'Alquileres',
      'Ventas',
      'Locales Comerciales',
    ],
  },
  {
    id: 'servicios',
    label: 'Servicios y Oficios',
    icon: Wrench,
    subcategories: [
      'Fletes y Mudanzas',
      'Servicio Técnico',
      'Oficios del Hogar',
      'Belleza a Domicilio',
      'Clases y Tutorías',
    ],
  },
  {
    id: 'otros',
    label: 'Otros',
    icon: Package,
    subcategories: [
      'Deportes y Bicicletas',
      'Instrumentos Musicales',
      'Juguetes',
      'Artículos de Oficina',
    ],
  },
];
