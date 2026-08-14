export const maxMoneyNeedsPerAcopio = 3;
export const defaultProductIconKey = 'caja';
export const defaultTalentIconKey = 'voluntarios';
export const defaultProductCategoryKey = 'sin_categoria';

export const productCategoryCatalog: Array<{
  key: string;
  label: string;
  isDefault: boolean;
  sortOrder: number;
}> = [
  { key: 'cuidado_bienestar', label: 'Cuidado y bienestar', isDefault: false, sortOrder: 1 },
  { key: 'mascotas', label: 'Mascotas', isDefault: false, sortOrder: 2 },
  { key: 'movilidad', label: 'Movilidad', isDefault: false, sortOrder: 3 },
  { key: 'medicamentos', label: 'Medicamentos', isDefault: false, sortOrder: 4 },
  {
    key: 'alimentacion_hidratacion',
    label: 'Alimentación e hidratación',
    isDefault: false,
    sortOrder: 5,
  },
  { key: 'construccion', label: 'Construcción', isDefault: false, sortOrder: 6 },
  { key: 'transporte', label: 'Transporte', isDefault: false, sortOrder: 7 },
  { key: 'sin_categoria', label: 'Sin categoría', isDefault: true, sortOrder: 8 },
];

export const productIconCatalog: Array<{ key: string; label: string }> = [
  { key: 'caja', label: 'Caja' },
  { key: 'comida', label: 'Comida' },
  { key: 'agua', label: 'Agua' },
  { key: 'ropa', label: 'Ropa' },
  { key: 'calzado', label: 'Calzado' },
  { key: 'medicamentos', label: 'Medicamentos' },
  { key: 'higiene', label: 'Higiene' },
  { key: 'bebe', label: 'Bebé' },
  { key: 'panales', label: 'Pañales' },
  { key: 'cobijas', label: 'Cobijas' },
  { key: 'utiles', label: 'Útiles' },
  { key: 'juguetes', label: 'Juguetes' },
  { key: 'mascotas', label: 'Mascotas' },
  { key: 'herramientas', label: 'Herramientas' },
  { key: 'hogar', label: 'Hogar' },
  { key: 'libros', label: 'Libros' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'primeros_auxilios', label: 'Primeros auxilios' },
  { key: 'limpieza', label: 'Limpieza' },
  { key: 'cocina', label: 'Cocina' },
  { key: 'energia', label: 'Energía' },
  { key: 'comunicacion', label: 'Comunicación' },
  { key: 'voluntarios', label: 'Voluntarios' },
  { key: 'mochila', label: 'Mochila' },
  { key: 'otro', label: 'Otro' },
];

export const needTypeCatalog: Array<{ key: 'product' | 'talent'; label: string }> = [
  { key: 'product', label: 'Producto' },
  { key: 'talent', label: 'Talento' },
];

export const offerCategoryCatalog: Array<{ key: string; label: string }> = [
  { key: 'comida', label: 'Comida' },
  { key: 'mercado', label: 'Mercado' },
  { key: 'productos', label: 'Productos' },
  { key: 'otro', label: 'Otro' },
];

export function normalizeCatalogText(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function findCatalogKey(
  catalog: Array<{ key: string; label: string }>,
  rawValue: unknown
): string | null {
  const normalizedValue = normalizeCatalogText(rawValue);
  if (!normalizedValue) {
    return null;
  }

  const matchedItem = catalog.find(
    (item) =>
      normalizeCatalogText(item.key) === normalizedValue ||
      normalizeCatalogText(item.label) === normalizedValue
  );

  return matchedItem?.key || null;
}

export function resolveNeedTypeKey(rawValue: unknown): 'product' | 'talent' | null {
  const normalizedValue = normalizeCatalogText(rawValue);
  if (!normalizedValue) {
    return 'product';
  }
  const matchedType = needTypeCatalog.find(
    (item) =>
      normalizeCatalogText(item.key) === normalizedValue ||
      normalizeCatalogText(item.label) === normalizedValue
  );
  return matchedType?.key || null;
}

export function resolveProductIconKey(rawValue: unknown): string | null {
  return findCatalogKey(productIconCatalog, rawValue);
}

export function resolveOfferCategoryKey(rawValue: unknown): string | null {
  return findCatalogKey(offerCategoryCatalog, rawValue);
}

export function resolveProductCategoryKey(rawValue: unknown): string | null {
  const normalizedValue = normalizeCatalogText(rawValue);
  if (!normalizedValue) {
    return defaultProductCategoryKey;
  }
  if (normalizedValue.startsWith('sin_categoria')) {
    return defaultProductCategoryKey;
  }
  return findCatalogKey(productCategoryCatalog, rawValue);
}

export function parseYesNo(rawValue: unknown): boolean | null {
  const normalizedValue = normalizeCatalogText(rawValue);
  if (!normalizedValue) {
    return null;
  }
  if (['si', 's', 'yes', 'y', 'true', '1'].includes(normalizedValue)) {
    return true;
  }
  if (['no', 'n', 'false', '0'].includes(normalizedValue)) {
    return false;
  }
  return null;
}

export function parsePositiveInteger(rawValue: unknown): number | null {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return null;
  }
  const numericValue = Number(String(rawValue).replace(/[^\d]/g, ''));
  if (!Number.isInteger(numericValue) || numericValue < 1) {
    return null;
  }
  return numericValue;
}
