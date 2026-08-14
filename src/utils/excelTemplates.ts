import ExcelJS from 'exceljs';
import {
  needTypeCatalog,
  offerCategoryCatalog,
  productCategoryCatalog,
  productIconCatalog,
} from './excelCatalog';

export type ExcelTemplateType = 'needs' | 'offers';

const acopioGreenArgb = 'FF1F6F5B';
const whiteArgb = 'FFFFFFFF';
const dataRowCount = 500;

const headerFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: acopioGreenArgb },
};

const headerFont: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: whiteArgb },
  name: 'Calibri',
  size: 11,
};

function styleHeaderRow(worksheet: ExcelJS.Worksheet, columnCount: number) {
  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;
  for (let columnNumber = 1; columnNumber <= columnCount; columnNumber += 1) {
    const cell = headerRow.getCell(columnNumber);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: acopioGreenArgb } },
      left: { style: 'thin', color: { argb: acopioGreenArgb } },
      bottom: { style: 'thin', color: { argb: acopioGreenArgb } },
      right: { style: 'thin', color: { argb: acopioGreenArgb } },
    };
  }
}

function addListSheet(
  workbook: ExcelJS.Workbook,
  categoryCatalog: Array<{ key: string; label: string }>
) {
  const listSheet = workbook.addWorksheet('Listas');
  listSheet.state = 'veryHidden';
  listSheet.getColumn(1).values = ['ICONO', ...productIconCatalog.map((item) => item.label)];
  listSheet.getColumn(2).values = ['TIENE LIMITE', 'SI', 'NO'];
  listSheet.getColumn(3).values = [
    'CATEGORIA',
    ...categoryCatalog.map((item) => item.label),
  ];
  listSheet.getColumn(4).values = ['TIPO', ...needTypeCatalog.map((item) => item.label)];

  const iconRange = `Listas!$A$2:$A$${productIconCatalog.length + 1}`;
  const yesNoRange = 'Listas!$B$2:$B$3';
  const categoryRange = `Listas!$C$2:$C$${categoryCatalog.length + 1}`;
  const needTypeRange = `Listas!$D$2:$D$${needTypeCatalog.length + 1}`;

  return { iconRange, yesNoRange, categoryRange, needTypeRange };
}

function addDropdown(
  worksheet: ExcelJS.Worksheet,
  columnLetter: string,
  listFormula: string,
  errorTitle: string,
  errorMessage: string,
  inputPrompt?: { title: string; message: string }
) {
  for (let rowNumber = 2; rowNumber <= dataRowCount + 1; rowNumber += 1) {
    worksheet.getCell(`${columnLetter}${rowNumber}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [listFormula],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle,
      error: errorMessage,
      showInputMessage: Boolean(inputPrompt),
      promptTitle: inputPrompt?.title,
      prompt: inputPrompt?.message,
    };
  }
}

async function buildNeedsTemplate(workbook: ExcelJS.Workbook) {
  const { iconRange, yesNoRange, categoryRange, needTypeRange } = addListSheet(
    workbook,
    productCategoryCatalog
  );
  const worksheet = workbook.addWorksheet('Necesitamos');

  worksheet.columns = [
    { header: 'TIPO', key: 'tipo', width: 16 },
    { header: 'CATEGORIA (OPCIONAL)', key: 'categoria', width: 32 },
    { header: 'ICONO (OPCIONAL)', key: 'icono', width: 24 },
    { header: 'NOMBRE', key: 'nombre', width: 34 },
    { header: 'DESCRIPCION (OPCIONAL)', key: 'descripcion', width: 42 },
    { header: 'TIENE LIMITE', key: 'tieneLimite', width: 18 },
    { header: 'LIMITE', key: 'limite', width: 16 },
  ];

  styleHeaderRow(worksheet, 7);
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 7 },
  };

  worksheet.addRow({
    tipo: 'Producto',
    categoria: 'Alimentación e hidratación',
    icono: 'Agua',
    nombre: 'Ejemplo agua',
    descripcion: 'Botellas de agua potable',
    tieneLimite: 'SI',
    limite: 100,
  });
  worksheet.addRow({
    tipo: 'Producto',
    categoria: 'Medicamentos',
    icono: 'Medicamentos',
    nombre: 'Ejemplo medicamentos',
    descripcion: 'Botiquín básico',
    tieneLimite: 'NO',
    limite: null,
  });
  worksheet.addRow({
    tipo: 'Talento',
    categoria: '',
    icono: 'Voluntarios',
    nombre: 'Ejemplo médico',
    descripcion: 'Personal de salud para jornadas',
    tieneLimite: 'SI',
    limite: 5,
  });

  addDropdown(
    worksheet,
    'A',
    needTypeRange,
    'Tipo inválido',
    'Selecciona Producto o Talento. Si lo dejas vacío se usará Producto.',
    {
      title: 'Tipo',
      message: 'Producto o Talento. Si lo dejas vacío se usará Producto.',
    }
  );
  addDropdown(
    worksheet,
    'B',
    categoryRange,
    'Categoría inválida',
    'Solo aplica a productos. Si la dejas vacía se usará Sin categoría.',
    {
      title: 'Categoría',
      message: 'Opcional y solo para productos. Si la dejas vacía se usará Sin categoría.',
    }
  );
  addDropdown(
    worksheet,
    'C',
    iconRange,
    'Icono inválido',
    'Selecciona un icono de la lista o déjalo vacío.',
    {
      title: 'Icono',
      message: 'Opcional. Vacío usa caja en producto y voluntarios en talento.',
    }
  );
  addDropdown(
    worksheet,
    'F',
    yesNoRange,
    'Valor inválido',
    'Selecciona SI o NO.'
  );

  for (let rowNumber = 2; rowNumber <= dataRowCount + 1; rowNumber += 1) {
    const limitCell = worksheet.getCell(`G${rowNumber}`);
    limitCell.numFmt = '#,##0';
    limitCell.dataValidation = {
      type: 'custom',
      allowBlank: true,
      formulae: [
        `OR(F${rowNumber}="NO",F${rowNumber}="",AND(ISNUMBER(G${rowNumber}),G${rowNumber}>=1))`,
      ],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Límite obligatorio',
      error:
        'Si TIENE LIMITE es SI, el LIMITE es obligatorio y debe ser un número mayor a 0.',
      showInputMessage: true,
      promptTitle: 'Límite',
      prompt:
        'Completa este campo solo si TIENE LIMITE es SI. Debe ser un número mayor a 0.',
    };
  }
}

async function buildOffersTemplate(workbook: ExcelJS.Workbook) {
  const { iconRange, categoryRange } = addListSheet(workbook, offerCategoryCatalog);
  const worksheet = workbook.addWorksheet('Ayudas');

  worksheet.columns = [
    { header: 'CATEGORIA', key: 'categoria', width: 22 },
    { header: 'ICONO (OPCIONAL)', key: 'icono', width: 24 },
    { header: 'NOMBRE', key: 'nombre', width: 34 },
    { header: 'DESCRIPCION (OPCIONAL)', key: 'descripcion', width: 42 },
  ];

  styleHeaderRow(worksheet, 4);
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 4 },
  };

  worksheet.addRow({
    categoria: 'Comida',
    icono: 'Comida',
    nombre: 'Ejemplo almuerzo',
    descripcion: 'Raciones de almuerzo para entregar',
  });
  worksheet.addRow({
    categoria: 'Mercado',
    icono: 'Caja',
    nombre: 'Ejemplo mercado',
    descripcion: 'Mercados con víveres básicos',
  });
  worksheet.addRow({
    categoria: 'Productos',
    icono: 'Higiene',
    nombre: 'Ejemplo kits de aseo',
    descripcion: 'Kits de aseo para entregar',
  });

  addDropdown(
    worksheet,
    'A',
    categoryRange,
    'Categoría inválida',
    'Selecciona una categoría de la lista desplegable.'
  );
  addDropdown(
    worksheet,
    'B',
    iconRange,
    'Icono inválido',
    'Selecciona un icono de la lista o déjalo vacío para usar caja.',
    {
      title: 'Icono',
      message: 'Opcional. Si lo dejas vacío se usará el icono de caja.',
    }
  );
}

export async function buildExcelTemplateBuffer(
  templateType: ExcelTemplateType
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Acopio';
  workbook.created = new Date();

  if (templateType === 'needs') {
    await buildNeedsTemplate(workbook);
  } else {
    await buildOffersTemplate(workbook);
  }

  const fileBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(fileBuffer);
}

export function excelTemplateFileName(templateType: ExcelTemplateType): string {
  return templateType === 'needs'
    ? 'plantilla-necesitamos.xlsx'
    : 'plantilla-estamos-dando.xlsx';
}
