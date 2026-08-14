import Joi from 'joi';

export const googleAuthBodySchema = Joi.object({
  idToken: Joi.string().required(),
});

export const loginBodySchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const recoverPasswordBodySchema = Joi.object({
  email: Joi.string().email().required(),
});

export const emptyBodySchema = Joi.object({}).unknown(false);

export const excelUploadBodySchema = Joi.object({}).unknown(true);

export const excelTemplateTypeParamsSchema = Joi.object({
  templateType: Joi.string().valid('needs', 'offers').required(),
});

export const idCountryParamsSchema = Joi.object({
  idCountry: Joi.number().integer().positive().required(),
});

export const idDepartmentParamsSchema = Joi.object({
  idDepartment: Joi.number().integer().positive().required(),
});

export const idCityParamsSchema = Joi.object({
  idCity: Joi.number().integer().positive().required(),
});

export const idAcopioParamsSchema = Joi.object({
  idAcopio: Joi.number().integer().positive().required(),
});

export const idAcopioAndIdParamsSchema = Joi.object({
  idAcopio: Joi.number().integer().positive().required(),
  id: Joi.number().integer().positive().required(),
});

export const idAcopioAndIdUserParamsSchema = Joi.object({
  idAcopio: Joi.number().integer().positive().required(),
  idUser: Joi.number().integer().positive().required(),
});

const contactSchema = Joi.object({
  type: Joi.string().valid('whatsapp', 'email').required(),
  value: Joi.string().trim().min(3).max(180).required(),
  idCountry: Joi.when('type', {
    is: 'whatsapp',
    then: Joi.number().integer().positive().required(),
    otherwise: Joi.valid(null).optional(),
  }),
  label: Joi.string().trim().max(120).allow(null, ''),
}).custom((contactValue, helpers) => {
  if (contactValue.type === 'email') {
    const emailValidation = Joi.string().email().validate(contactValue.value);
    if (emailValidation.error) {
      return helpers.error('any.invalid');
    }
  }
  if (contactValue.type === 'whatsapp') {
    const digitsOnly = String(contactValue.value).replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      return helpers.error('any.invalid');
    }
  }
  return contactValue;
}, 'contact validation');

const productIconKeys = [
  'caja',
  'comida',
  'agua',
  'ropa',
  'calzado',
  'medicamentos',
  'higiene',
  'bebe',
  'panales',
  'cobijas',
  'utiles',
  'juguetes',
  'mascotas',
  'herramientas',
  'hogar',
  'libros',
  'transporte',
  'primeros_auxilios',
  'limpieza',
  'cocina',
  'energia',
  'comunicacion',
  'voluntarios',
  'mochila',
  'otro',
];

const productCategoryKeys = [
  'cuidado_bienestar',
  'mascotas',
  'movilidad',
  'medicamentos',
  'alimentacion_hidratacion',
  'construccion',
  'transporte',
  'sin_categoria',
];

const needSchema = Joi.object({
  needType: Joi.string().valid('product', 'money', 'talent').required(),
  categoryKey: Joi.when('needType', {
    is: 'product',
    then: Joi.string()
      .valid(...productCategoryKeys)
      .allow('', null)
      .optional()
      .default('sin_categoria'),
    otherwise: Joi.valid(null, '').optional(),
  }),
  iconKey: Joi.when('needType', {
    switch: [
      { is: 'money', then: Joi.string().valid('bank').default('bank') },
      {
        is: 'talent',
        then: Joi.string()
          .valid(...productIconKeys)
          .allow('', null)
          .optional()
          .default('voluntarios'),
      },
    ],
    otherwise: Joi.string()
      .valid(...productIconKeys)
      .allow('', null)
      .optional()
      .default('caja'),
  }),
  name: Joi.string().trim().min(2).max(180).required(),
  unit: Joi.string().trim().max(40).allow(null, ''),
  hasLimit: Joi.boolean().required(),
  targetQuantity: Joi.when('hasLimit', {
    is: true,
    then: Joi.number().integer().min(1).required(),
    otherwise: Joi.number().integer().min(1).allow(null),
  }),
  receivedQuantity: Joi.number().min(0).default(0),
  description: Joi.string().allow(null, ''),
  bankName: Joi.when('needType', {
    is: 'money',
    then: Joi.string().trim().min(2).max(180).required(),
    otherwise: Joi.string().allow(null, ''),
  }),
  accountNumber: Joi.when('needType', {
    is: 'money',
    then: Joi.string().trim().min(3).max(80).required(),
    otherwise: Joi.string().allow(null, ''),
  }),
  accountHolder: Joi.string().trim().max(180).allow(null, ''),
  documentType: Joi.string()
    .valid('cc', 'ce', 'nit', 'passport', 'ti')
    .allow(null, ''),
  documentNumber: Joi.string().trim().max(40).allow(null, ''),
});

const offerSchema = Joi.object({
  category: Joi.string().trim().min(2).max(80).required(),
  iconKey: Joi.string()
    .valid(...productIconKeys)
    .allow('', null)
    .optional()
    .default('caja'),
  name: Joi.string().trim().min(2).max(180).required(),
  description: Joi.string().allow(null, ''),
  isAvailable: Joi.boolean().default(true),
});

const addressSchema = Joi.object({
  idCity: Joi.number().integer().positive().required(),
  street: Joi.string().trim().min(3).max(255).required(),
  neighborhood: Joi.string().trim().max(120).allow(null, ''),
  reference: Joi.string().trim().max(255).allow(null, ''),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

export const createAcopioBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(180).required(),
  description: Joi.string().allow(null, ''),
  status: Joi.string().valid('open', 'closed').default('open'),
  openingMode: Joi.string().valid('indefinite', 'scheduled').required(),
  startsAt: Joi.when('openingMode', {
    is: 'scheduled',
    then: Joi.date().required(),
    otherwise: Joi.date().allow(null),
  }),
  endsAt: Joi.when('openingMode', {
    is: 'scheduled',
    then: Joi.date().min(Joi.ref('startsAt')).required(),
    otherwise: Joi.date().allow(null),
  }),
  responsibleName: Joi.string().trim().min(2).max(180).required(),
  address: addressSchema.required(),
  contacts: Joi.array().items(contactSchema).min(1).required(),
  needs: Joi.array().items(needSchema).min(1).required(),
  offers: Joi.array().items(offerSchema).default([]),
  managers: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().trim().min(2).max(180).required(),
      })
    )
    .default([]),
});

export const updateAcopioBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(180),
  description: Joi.string().allow(null, ''),
  openingMode: Joi.string().valid('indefinite', 'scheduled'),
  startsAt: Joi.when('openingMode', {
    is: 'scheduled',
    then: Joi.date().required(),
    otherwise: Joi.date().allow(null),
  }),
  endsAt: Joi.when('openingMode', {
    is: 'scheduled',
    then: Joi.date().min(Joi.ref('startsAt')).required(),
    otherwise: Joi.date().allow(null),
  }),
  responsibleName: Joi.string().trim().min(2).max(180),
  address: addressSchema,
}).min(1);

export const updateAcopioStatusBodySchema = Joi.object({
  status: Joi.string().valid('open', 'closed').required(),
});

export const createContactBodySchema = contactSchema;

export const updateContactBodySchema = contactSchema;

export const createNeedBodySchema = needSchema;

export const updateNeedBodySchema = Joi.object({
  needType: Joi.string().valid('product', 'money', 'talent'),
  categoryKey: Joi.string()
    .valid(...productCategoryKeys)
    .allow(null, ''),
  iconKey: Joi.string().trim().max(40),
  name: Joi.string().trim().min(2).max(180),
  unit: Joi.string().trim().max(40).allow(null, ''),
  hasLimit: Joi.boolean(),
  targetQuantity: Joi.number().integer().min(1).allow(null),
  receivedQuantity: Joi.number().min(0),
  description: Joi.string().allow(null, ''),
  bankName: Joi.string().trim().max(180).allow(null, ''),
  accountNumber: Joi.string().trim().max(80).allow(null, ''),
  accountHolder: Joi.string().trim().max(180).allow(null, ''),
  documentType: Joi.string()
    .valid('cc', 'ce', 'nit', 'passport', 'ti')
    .allow(null, ''),
  documentNumber: Joi.string().trim().max(40).allow(null, ''),
}).min(1);

export const createOfferBodySchema = offerSchema;

export const updateOfferBodySchema = Joi.object({
  category: Joi.string().trim().min(2).max(80),
  iconKey: Joi.string()
    .valid(...productIconKeys)
    .optional(),
  name: Joi.string().trim().min(2).max(180),
  description: Joi.string().allow(null, ''),
  isAvailable: Joi.boolean(),
}).min(1);

export const inviteManagerBodySchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().trim().min(2).max(180).required(),
});

export const updateManagerBodySchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string().trim().min(2).max(180),
  resetPassword: Joi.boolean().default(false),
}).min(1);

export const updateCredentialsBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(180),
  email: Joi.string().email(),
  currentPassword: Joi.string().min(6).allow('', null),
  newPassword: Joi.string().min(6),
}).min(1);

export const contactBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(180).required(),
  email: Joi.string().email().required(),
  message: Joi.string().trim().min(10).max(4000).required(),
});
