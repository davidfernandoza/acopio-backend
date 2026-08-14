import * as XLSX from 'xlsx';
import { HttpError } from '../middlewares/errorHandler';
import {
  defaultProductIconKey,
  defaultTalentIconKey,
  normalizeCatalogText,
  parsePositiveInteger,
  parseYesNo,
  resolveNeedTypeKey,
  resolveOfferCategoryKey,
  resolveProductCategoryKey,
  resolveProductIconKey,
} from './excelCatalog';
import { ExcelTemplateType } from './excelTemplates';

export interface ImportedNeedItem {
  needType: 'product' | 'talent';
  categoryKey: string | null;
  iconKey: string;
  name: string;
  description: string | null;
  hasLimit: boolean;
  targetQuantity: number | null;
}

export interface ImportedOffer {
  category: string;
  iconKey: string;
  name: string;
  description: string | null;
  isAvailable: boolean;
}

const needHeaderAliases: Record<
  string,
  'tipo' | 'categoria' | 'icono' | 'nombre' | 'descripcion' | 'tieneLimite' | 'limite'
> = {
  tipo: 'tipo',
  categoria: 'categoria',
  categoria_opcional: 'categoria',
  icono: 'icono',
  icono_nombre: 'icono',
  icono_opcional: 'icono',
  nombre: 'nombre',
  nombre_producto: 'nombre',
  nombre_talento: 'nombre',
  descripcion: 'descripcion',
  descripcion_opcional: 'descripcion',
  tiene_limite: 'tieneLimite',
  tiene_limite_si_no: 'tieneLimite',
  limite: 'limite',
  el_limite: 'limite',
  el_limite_numerico: 'limite',
};

const offerHeaderAliases: Record<string, 'categoria' | 'icono' | 'nombre' | 'descripcion'> = {
  categoria: 'categoria',
  icono: 'icono',
  icono_opcional: 'icono',
  nombre: 'nombre',
  descripcion: 'descripcion',
  descripcion_opcional: 'descripcion',
};

function resolveOptionalIconKey(
  rawValue: unknown,
  defaultIconKey: string
): { iconKey: string | null; isInvalid: boolean } {
  const rawText = cellText(rawValue);
  if (!rawText) {
    return { iconKey: defaultIconKey, isInvalid: false };
  }
  const iconKey = resolveProductIconKey(rawValue);
  if (!iconKey) {
    return { iconKey: null, isInvalid: true };
  }
  return { iconKey, isInvalid: false };
}

function cellText(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
}

function isEmptyRow(row: Record<string, unknown>): boolean {
  return Object.values(row).every((value) => cellText(value) === '');
}

function mapRowKeys(
  row: Record<string, unknown>,
  aliases: Record<string, string>
): Record<string, unknown> {
  const mappedRow: Record<string, unknown> = {};
  for (const [rawHeader, rawValue] of Object.entries(row)) {
    const aliasKey = aliases[normalizeCatalogText(rawHeader)];
    if (aliasKey) {
      mappedRow[aliasKey] = rawValue;
    }
  }
  return mappedRow;
}

function readDataRows(fileBuffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const skippedSheets = new Set(['valores_permitidos', 'ejemplo', 'listas']);
  const dataSheetName =
    workbook.SheetNames.find((sheetName) => !skippedSheets.has(normalizeCatalogText(sheetName))) ||
    workbook.SheetNames[0];

  if (!dataSheetName) {
    throw new HttpError(400, 'El archivo Excel no tiene hojas');
  }

  const worksheet = workbook.Sheets[dataSheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: true,
  });
}

function throwRowErrors(rowErrors: string[]) {
  if (!rowErrors.length) {
    return;
  }
  throw new HttpError(400, rowErrors.join(' | '));
}

export function parseNeedsExcel(fileBuffer: Buffer): ImportedNeedItem[] {
  const rows = readDataRows(fileBuffer);
  const importedNeeds: ImportedNeedItem[] = [];
  const rowErrors: string[] = [];

  rows.forEach((row, rowIndex) => {
    const excelRowNumber = rowIndex + 2;
    if (isEmptyRow(row)) {
      return;
    }

    const mappedRow = mapRowKeys(row, needHeaderAliases);
    const needType = resolveNeedTypeKey(mappedRow.tipo);
    const isProduct = needType === 'product';
    const categoryKey = isProduct ? resolveProductCategoryKey(mappedRow.categoria) : null;
    const defaultIconKey = isProduct ? defaultProductIconKey : defaultTalentIconKey;
    const resolvedIcon = resolveOptionalIconKey(mappedRow.icono, defaultIconKey);
    const iconKey = resolvedIcon.iconKey;
    const itemName = cellText(mappedRow.nombre);
    const description = cellText(mappedRow.descripcion) || null;
    const hasLimit = parseYesNo(mappedRow.tieneLimite);
    const targetQuantity = parsePositiveInteger(mappedRow.limite);

    if (!needType) {
      rowErrors.push(`Fila ${excelRowNumber}: el tipo debe ser Producto o Talento`);
    }
    if (isProduct && !categoryKey) {
      rowErrors.push(`Fila ${excelRowNumber}: la categoría no es válida`);
    }
    if (resolvedIcon.isInvalid) {
      rowErrors.push(`Fila ${excelRowNumber}: el icono no es válido`);
    }
    if (itemName.length < 2) {
      rowErrors.push(`Fila ${excelRowNumber}: el nombre es obligatorio`);
    }
    if (hasLimit === null) {
      rowErrors.push(`Fila ${excelRowNumber}: tiene limite debe ser si o no`);
    }
    if (hasLimit === true && !targetQuantity) {
      rowErrors.push(`Fila ${excelRowNumber}: el limite es obligatorio y debe ser un número mayor a 0`);
    }

    if (
      needType &&
      (!isProduct || categoryKey) &&
      iconKey &&
      itemName.length >= 2 &&
      hasLimit !== null &&
      (hasLimit === false || targetQuantity)
    ) {
      importedNeeds.push({
        needType,
        categoryKey: isProduct ? categoryKey : null,
        iconKey,
        name: itemName,
        description,
        hasLimit,
        targetQuantity: hasLimit ? targetQuantity : null,
      });
    }
  });

  throwRowErrors(rowErrors);

  if (!importedNeeds.length) {
    throw new HttpError(400, 'El Excel no tiene productos ni talentos para importar');
  }

  return importedNeeds;
}

export function parseOffersExcel(fileBuffer: Buffer): ImportedOffer[] {
  const rows = readDataRows(fileBuffer);
  const importedOffers: ImportedOffer[] = [];
  const rowErrors: string[] = [];

  rows.forEach((row, rowIndex) => {
    const excelRowNumber = rowIndex + 2;
    if (isEmptyRow(row)) {
      return;
    }

    const mappedRow = mapRowKeys(row, offerHeaderAliases);
    const category = resolveOfferCategoryKey(mappedRow.categoria);
    const resolvedIcon = resolveOptionalIconKey(mappedRow.icono, defaultProductIconKey);
    const iconKey = resolvedIcon.iconKey;
    const offerName = cellText(mappedRow.nombre);
    const description = cellText(mappedRow.descripcion) || null;

    if (!category) {
      rowErrors.push(`Fila ${excelRowNumber}: la categoría no es válida`);
    }
    if (resolvedIcon.isInvalid) {
      rowErrors.push(`Fila ${excelRowNumber}: el icono no es válido`);
    }
    if (offerName.length < 2) {
      rowErrors.push(`Fila ${excelRowNumber}: el nombre es obligatorio`);
    }

    if (category && iconKey && offerName.length >= 2) {
      importedOffers.push({
        category,
        iconKey,
        name: offerName,
        description,
        isAvailable: true,
      });
    }
  });

  throwRowErrors(rowErrors);

  if (!importedOffers.length) {
    throw new HttpError(400, 'El Excel no tiene ayudas para importar');
  }

  return importedOffers;
}

export function parseExcelByTemplateType(templateType: ExcelTemplateType, fileBuffer: Buffer) {
  if (templateType === 'needs') {
    return { templateType, items: parseNeedsExcel(fileBuffer) };
  }
  return { templateType, items: parseOffersExcel(fileBuffer) };
}
