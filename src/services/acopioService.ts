import { Op, Transaction, col, fn, where } from 'sequelize';
import {
  Acopio,
  AcopioContact,
  AcopioImage,
  AcopioManager,
  AcopioNeed,
  AcopioOffer,
  Address,
  City,
  Country,
  Department,
  NeedCategory,
  User,
  sequelize,
} from '../models';
import { HttpError } from '../middlewares/errorHandler';
import {
  generateTemporaryPassword,
  hashPassword,
} from './authService';
import { sendManagerInvitationEmail } from './mailService';
import { buildInitialsAvatarUrl, buildPublicUploadUrl, maxAcopioGalleryImages } from '../utils/uploads';
import {
  deleteUploadFile,
  saveAcopioGalleryImage,
  saveAvatarFile,
  saveNeedQrFile,
} from '../utils/fileStorage';
import { getClientIp, resolveUserLocationFromIp } from './geoIpService';
import { Request } from 'express';
import { defaultProductIconKey, defaultTalentIconKey, maxMoneyNeedsPerAcopio } from '../utils/excelCatalog';
import { parseNeedsExcel, parseOffersExcel } from '../utils/excelImport';

async function assertUniqueAcopioName(
  name: string,
  options?: { excludeId?: number; transaction?: Transaction }
) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new HttpError(400, 'Name is required');
  }

  const existingAcopio = await Acopio.findOne({
    where: {
      [Op.and]: [
        where(fn('LOWER', col('name')), normalizedName.toLowerCase()),
        ...(options?.excludeId
          ? [{ id: { [Op.ne]: options.excludeId } }]
          : []),
      ],
    },
    transaction: options?.transaction,
  });

  if (existingAcopio) {
    throw new HttpError(409, 'Ya existe un acopio con ese nombre');
  }
}

function resolveAvatarUrl(acopio: { avatarPath?: string | null; avatarUrl?: string | null; name: string }) {
  if (acopio.avatarPath) {
    return buildPublicUploadUrl(acopio.avatarPath);
  }
  if (acopio.avatarUrl) {
    return acopio.avatarUrl;
  }
  return buildInitialsAvatarUrl(acopio.name);
}

function mapImage(image: AcopioImage) {
  return {
    id: image.id,
    idAcopio: image.idAcopio,
    sortOrder: image.sortOrder,
    filePath: image.filePath,
    imageUrl: buildPublicUploadUrl(image.filePath),
  };
}

function emptyToNull(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value);
}

type NeedWithCategory = AcopioNeed & { category?: NeedCategory | null };

const needCategoryInclude = {
  model: NeedCategory,
  as: 'category',
};

function resolveNeedIconKey(payload: { needType?: string; iconKey?: string | null }) {
  if (payload.needType === 'money') {
    return 'bank';
  }
  if (payload.iconKey) {
    return payload.iconKey;
  }
  if (payload.needType === 'talent') {
    return defaultTalentIconKey;
  }
  return defaultProductIconKey;
}

async function resolveNeedCategoryId(
  needType: string | undefined,
  categoryKey: string | null | undefined,
  transaction?: Transaction
): Promise<number | null> {
  if (needType !== 'product') {
    return null;
  }

  const resolvedCategoryKey = categoryKey || 'sin_categoria';
  const category = await NeedCategory.findOne({
    where: { categoryKey: resolvedCategoryKey },
    transaction,
  });
  if (!category) {
    throw new HttpError(400, 'Categoría de producto inválida');
  }
  return category.id;
}

async function buildNeedAttributes(
  idAcopio: number,
  payload: any,
  transaction?: Transaction
) {
  const isMoney = payload.needType === 'money';
  const idCategory = await resolveNeedCategoryId(
    payload.needType,
    payload.categoryKey,
    transaction
  );
  return {
    idAcopio,
    idCategory,
    needType: payload.needType,
    iconKey: resolveNeedIconKey(payload),
    name: payload.name,
    unit: emptyToNull(payload.unit),
    hasLimit: payload.hasLimit,
    targetQuantity: payload.hasLimit ? payload.targetQuantity : null,
    receivedQuantity: payload.receivedQuantity || 0,
    description: emptyToNull(payload.description),
    bankName: isMoney ? payload.bankName : null,
    accountNumber: isMoney ? payload.accountNumber : null,
    accountHolder: isMoney ? emptyToNull(payload.accountHolder) : null,
    documentType: isMoney
      ? (emptyToNull(payload.documentType) as AcopioNeed['documentType'])
      : null,
    documentNumber: isMoney ? emptyToNull(payload.documentNumber) : null,
  };
}

function mapNeed(need: NeedWithCategory) {
  const targetQuantity = need.targetQuantity === null ? null : Number(need.targetQuantity);
  const receivedQuantity = Number(need.receivedQuantity);
  const limitReached =
    need.hasLimit && targetQuantity !== null ? receivedQuantity >= targetQuantity : false;

  return {
    id: need.id,
    idAcopio: need.idAcopio,
    idCategory: need.idCategory,
    categoryKey: need.category?.categoryKey || null,
    categoryName: need.category?.name || null,
    needType: need.needType,
    iconKey: need.iconKey,
    name: need.name,
    unit: need.unit,
    hasLimit: need.hasLimit,
    targetQuantity,
    receivedQuantity,
    description: need.description,
    qrPath: need.qrPath,
    qrUrl: need.qrPath ? buildPublicUploadUrl(need.qrPath) : null,
    bankName: need.bankName,
    accountNumber: need.accountNumber,
    accountHolder: need.accountHolder,
    documentType: need.documentType,
    documentNumber: need.documentNumber,
    limitReached,
  };
}

function digitsOnly(value: string) {
  return String(value).replace(/\D/g, '');
}

function buildContactAttributes(idAcopio: number, contact: any) {
  if (contact.type === 'whatsapp') {
    return {
      idAcopio,
      type: contact.type,
      value: digitsOnly(contact.value),
      idCountry: contact.idCountry,
      localPrefix: null,
      extension: null,
      label: contact.label || null,
    };
  }

  if (contact.type === 'landline') {
    const extensionDigits = contact.extension ? digitsOnly(contact.extension) : '';
    return {
      idAcopio,
      type: contact.type,
      value: digitsOnly(contact.value),
      idCountry: null,
      localPrefix: digitsOnly(contact.localPrefix),
      extension: extensionDigits || null,
      label: contact.label || null,
    };
  }

  return {
    idAcopio,
    type: contact.type,
    value: String(contact.value).toLowerCase(),
    idCountry: null,
    localPrefix: null,
    extension: null,
    label: contact.label || null,
  };
}

function mapContact(contact: AcopioContact & { country?: Country | null }) {
  const phoneCode = contact.country?.phoneCode || null;
  const digits = digitsOnly(contact.value);
  const whatsappLink =
    contact.type === 'whatsapp' && phoneCode
      ? `https://wa.me/${phoneCode.replace('+', '')}${digits}`
      : null;
  const telLink =
    contact.type === 'landline' && contact.localPrefix
      ? `tel:${contact.localPrefix}${digits}${
          contact.extension ? `;ext=${contact.extension}` : ''
        }`
      : null;

  return {
    id: contact.id,
    idAcopio: contact.idAcopio,
    type: contact.type,
    value: contact.value,
    idCountry: contact.idCountry,
    localPrefix: contact.localPrefix,
    extension: contact.extension,
    label: contact.label,
    phoneCode,
    whatsappLink,
    telLink,
    mailtoLink: contact.type === 'email' ? `mailto:${contact.value}` : null,
  };
}

function resolveScheduledStatus(
  startsAt: Date | string | null,
  endsAt: Date | string | null
): 'open' | 'closed' {
  const nowMs = Date.now();
  const startTimeMs = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  const endTimeMs = endsAt ? new Date(endsAt).getTime() : Number.NaN;

  if (!Number.isFinite(startTimeMs) || !Number.isFinite(endTimeMs)) {
    return 'closed';
  }
  if (nowMs < startTimeMs || nowMs >= endTimeMs) {
    return 'closed';
  }
  return 'open';
}

async function syncScheduledAcopioStatuses() {
  await Acopio.update(
    { openingMode: 'indefinite' },
    { where: { openingMode: 'manual' } }
  );

  const now = new Date();
  await Acopio.update(
    { status: 'closed' },
    {
      where: {
        openingMode: 'scheduled',
        status: 'open',
        [Op.or]: [{ endsAt: { [Op.lte]: now } }, { startsAt: { [Op.gt]: now } }],
      },
    }
  );
  await Acopio.update(
    { status: 'open' },
    {
      where: {
        openingMode: 'scheduled',
        status: 'closed',
        startsAt: { [Op.lte]: now },
        endsAt: { [Op.gt]: now },
      },
    }
  );
}

async function applyScheduledStatus(acopio: Acopio, transaction?: Transaction) {
  if (acopio.openingMode === 'manual') {
    await acopio.update({ openingMode: 'indefinite' }, { transaction });
  }
  if (acopio.openingMode === 'scheduled') {
    const nextStatus = resolveScheduledStatus(acopio.startsAt, acopio.endsAt);
    if (acopio.status !== nextStatus) {
      await acopio.update({ status: nextStatus }, { transaction });
    }
  }
}

async function getAcopioOrFail(idAcopio: number, transaction?: Transaction) {
  const acopio = await Acopio.findByPk(idAcopio, { transaction });
  if (!acopio) {
    throw new HttpError(404, 'Acopio not found');
  }
  return acopio;
}

async function assertMoneyNeedsLimit(idAcopio: number) {
  const moneyNeedsCount = await AcopioNeed.count({
    where: { idAcopio, needType: 'money' },
  });
  if (moneyNeedsCount >= maxMoneyNeedsPerAcopio) {
    throw new HttpError(
      400,
      `Solo se permiten ${maxMoneyNeedsPerAcopio} registros de dinero por acopio`
    );
  }
}

async function assertManagersPayloadForOwner(
  ownerId: number,
  managers: Array<{ email: string; name: string }>,
  transaction?: Transaction
) {
  if (!managers.length) {
    return;
  }

  const normalizedEmails = managers.map((managerInvite) =>
    managerInvite.email.toLowerCase().trim()
  );
  const uniqueEmails = new Set(normalizedEmails);
  if (uniqueEmails.size !== normalizedEmails.length) {
    throw new HttpError(400, 'Hay correos de gestores duplicados');
  }

  const owner = await User.findByPk(ownerId, { transaction });
  if (!owner) {
    throw new HttpError(404, 'Owner not found');
  }

  for (const managerInvite of managers) {
    const normalizedEmail = managerInvite.email.toLowerCase().trim();
    if (normalizedEmail === owner.email.toLowerCase()) {
      throw new HttpError(400, 'El dueño ya gestiona este acopio');
    }

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
      transaction,
    });
    if (existingUser) {
      await assertUserCanBeInvitedByOwner(existingUser, ownerId, transaction);
    }
  }
}

async function validateCreateAcopioPayload(
  ownerId: number,
  payload: any,
  files?: {
    avatar?: Express.Multer.File;
    images?: Express.Multer.File[];
    needQrByIndex?: Record<number, Express.Multer.File>;
  }
) {
  const managers = payload.managers || [];
  await assertManagersPayloadForOwner(ownerId, managers);

  const city = await City.findByPk(payload.address.idCity);
  if (!city) {
    throw new HttpError(404, 'City not found');
  }

  if (!payload.contacts?.length) {
    throw new HttpError(400, 'Debes agregar al menos un contacto');
  }

  for (const contact of payload.contacts) {
    if (contact.type === 'whatsapp') {
      const country = await Country.findByPk(contact.idCountry);
      if (!country) {
        throw new HttpError(400, 'Invalid country for WhatsApp contact');
      }
    }
  }

  if (!payload.needs?.length) {
    throw new HttpError(400, 'Debes agregar al menos una necesidad');
  }

  const moneyNeedsCount = payload.needs.filter(
    (need: { needType?: string }) => need.needType === 'money'
  ).length;
  if (moneyNeedsCount > maxMoneyNeedsPerAcopio) {
    throw new HttpError(
      400,
      `Solo se permiten ${maxMoneyNeedsPerAcopio} registros de dinero por acopio`
    );
  }

  const galleryFiles = files?.images || [];
  if (galleryFiles.length > maxAcopioGalleryImages) {
    throw new HttpError(400, `At most ${maxAcopioGalleryImages} images are allowed`);
  }

  await assertUniqueAcopioName(String(payload.name).trim());
}

export async function createAcopio(
  ownerId: number,
  payload: any,
  files?: {
    avatar?: Express.Multer.File;
    images?: Express.Multer.File[];
    needQrByIndex?: Record<number, Express.Multer.File>;
  }
) {
  const existingManagerMembership = await AcopioManager.findOne({
    where: { idUser: ownerId },
  });
  if (existingManagerMembership) {
    throw new HttpError(403, 'Los gestores no pueden crear acopios');
  }

  const managers = payload.managers || [];

  // Validate everything first: no DB writes, files or emails until this passes.
  await validateCreateAcopioPayload(ownerId, payload, files);

  const { createdAcopioId, pendingInvitationEmails } = await sequelize.transaction(
    async (transaction: Transaction) => {
      // Re-check inside the transaction to avoid races after pre-validation.
      await assertManagersPayloadForOwner(ownerId, managers, transaction);
      await assertUniqueAcopioName(String(payload.name).trim(), { transaction });

      const acopioName = String(payload.name).trim();

      const address = await Address.create(
        {
          idCity: payload.address.idCity,
          street: payload.address.street,
          neighborhood: payload.address.neighborhood || null,
          reference: payload.address.reference || null,
          latitude: payload.address.latitude,
          longitude: payload.address.longitude,
        },
        { transaction }
      );

      const initialsAvatarUrl = buildInitialsAvatarUrl(acopioName);

      const acopio = await Acopio.create(
        {
          idOwner: ownerId,
          idAddress: address.id,
          name: acopioName,
          description: payload.description || null,
          status:
            payload.openingMode === 'scheduled'
              ? resolveScheduledStatus(payload.startsAt, payload.endsAt)
              : payload.status || 'open',
          openingMode: payload.openingMode,
          startsAt: payload.openingMode === 'scheduled' ? payload.startsAt : null,
          endsAt: payload.openingMode === 'scheduled' ? payload.endsAt : null,
          responsibleName: payload.responsibleName,
          avatarPath: null,
          avatarUrl: initialsAvatarUrl,
        },
        { transaction }
      );

      if (files?.avatar) {
        const savedAvatar = await saveAvatarFile(files.avatar, acopio.id);
        await acopio.update(
          {
            avatarPath: savedAvatar.relativePath,
            avatarUrl: savedAvatar.publicUrl,
          },
          { transaction }
        );
      }

      const galleryFiles = files?.images || [];
      for (let index = 0; index < galleryFiles.length; index += 1) {
        const savedImage = await saveAcopioGalleryImage(
          galleryFiles[index],
          acopio.id,
          index + 1
        );
        await AcopioImage.create(
          {
            idAcopio: acopio.id,
            filePath: savedImage.relativePath,
            sortOrder: index + 1,
          },
          { transaction }
        );
      }

      await AcopioContact.bulkCreate(
        payload.contacts.map((contact: any) => buildContactAttributes(acopio.id, contact)),
        { transaction }
      );

      for (let needIndex = 0; needIndex < payload.needs.length; needIndex += 1) {
        const needPayload = payload.needs[needIndex];
        const need = await AcopioNeed.create(
          {
            ...(await buildNeedAttributes(acopio.id, needPayload, transaction)),
            qrPath: null,
          },
          { transaction }
        );

        const qrFile = files?.needQrByIndex?.[needIndex];
        if (qrFile && needPayload.needType === 'money') {
          const savedQr = await saveNeedQrFile(qrFile, acopio.id, need.id);
          await need.update({ qrPath: savedQr.relativePath }, { transaction });
        }
      }

      if (payload.offers?.length) {
        await AcopioOffer.bulkCreate(
          payload.offers.map((offer: any) => ({
            idAcopio: acopio.id,
            category: offer.category,
            iconKey: offer.iconKey,
            name: offer.name,
            description: offer.description || null,
            isAvailable: offer.isAvailable ?? true,
          })),
          { transaction }
        );
      }

      const pendingInvitationEmails: Array<{
        toEmail: string;
        managerName: string;
        acopioName: string;
        temporaryPassword: string | null;
      }> = [];

      for (const managerInvite of managers) {
        const inviteResult = await inviteManager(
          acopio.id,
          ownerId,
          {
            email: managerInvite.email,
            name: managerInvite.name,
          },
          { transaction, sendEmail: false }
        );
        pendingInvitationEmails.push({
          toEmail: inviteResult.user.email,
          managerName: inviteResult.user.name,
          acopioName: acopio.name,
          temporaryPassword: inviteResult.temporaryPassword,
        });
      }

      return {
        createdAcopioId: acopio.id,
        pendingInvitationEmails,
      };
    }
  );

  for (const invitationEmail of pendingInvitationEmails) {
    await sendManagerInvitationEmail(invitationEmail);
  }

  return getAcopioDetail(createdAcopioId);
}

export async function listAcopios() {
  await syncScheduledAcopioStatuses();
  const acopios = await Acopio.findAll({
    include: [
      {
        model: Address,
        as: 'address',
        include: [{ model: City, as: 'city' }],
      },
      {
        model: AcopioContact,
        as: 'contacts',
        include: [{ model: Country, as: 'country' }],
      },
      {
        model: AcopioImage,
        as: 'images',
      },
      { model: AcopioNeed, as: 'needs', include: [needCategoryInclude] },
      { model: AcopioOffer, as: 'offers' },
    ],
    order: [
      ['createdAt', 'DESC'],
      [{ model: AcopioImage, as: 'images' }, 'sortOrder', 'ASC'],
    ],
  });

  return acopios.map((acopio) => {
    const plain = acopio.get({ plain: true }) as any;
    return {
      ...plain,
      avatarUrl: resolveAvatarUrl(plain),
      contacts: (plain.contacts || []).map((contact: any) => mapContact(contact)),
      images: (plain.images || []).map((image: any) => mapImage(image)),
      needs: (plain.needs || []).map((need: any) => mapNeed(need as AcopioNeed)),
      offers: plain.offers || [],
    };
  });
}

export async function userCanManageAcopio(
  idAcopio: number,
  userId?: number,
  idOwner?: number
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  if (idOwner === userId) {
    return true;
  }

  const manager = await AcopioManager.findOne({
    where: { idAcopio, idUser: userId },
  });

  return Boolean(manager);
}

export async function getAcopioDetail(idAcopio: number, transaction?: Transaction) {
  const existingAcopio = await getAcopioOrFail(idAcopio, transaction);
  await applyScheduledStatus(existingAcopio, transaction);

  const acopio = await Acopio.findByPk(idAcopio, {
    transaction,
    include: [
      {
        model: Address,
        as: 'address',
        include: [
          {
            model: City,
            as: 'city',
            include: [
              {
                model: Department,
                as: 'department',
                include: [{ model: Country, as: 'country' }],
              },
            ],
          },
        ],
      },
      {
        model: AcopioContact,
        as: 'contacts',
        include: [{ model: Country, as: 'country' }],
      },
      { model: AcopioNeed, as: 'needs', include: [needCategoryInclude] },
      { model: AcopioOffer, as: 'offers' },
      { model: AcopioImage, as: 'images' },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [[{ model: AcopioImage, as: 'images' }, 'sortOrder', 'ASC']],
  });

  if (!acopio) {
    throw new HttpError(404, 'Acopio not found');
  }

  const plain = acopio.get({ plain: true }) as any;
  return {
    ...plain,
    avatarUrl: resolveAvatarUrl(plain),
    contacts: (plain.contacts || []).map((contact: any) => mapContact(contact)),
    needs: (plain.needs || []).map((need: any) => mapNeed(need as AcopioNeed)),
    images: (plain.images || []).map((image: any) => mapImage(image)),
  };
}

export async function getAcopioMap(idAcopio: number) {
  const existingAcopio = await getAcopioOrFail(idAcopio);
  await applyScheduledStatus(existingAcopio);

  const acopio = await Acopio.findByPk(idAcopio, {
    include: [
      {
        model: Address,
        as: 'address',
        include: [{ model: City, as: 'city' }],
      },
    ],
  });

  if (!acopio) {
    throw new HttpError(404, 'Acopio not found');
  }

  const address = (acopio as any).address as Address & { city?: City };
  return {
    idAcopio: acopio.id,
    name: acopio.name,
    latitude: Number(address.latitude),
    longitude: Number(address.longitude),
    address: {
      street: address.street,
      neighborhood: address.neighborhood,
      reference: address.reference,
      cityName: address.city?.name || null,
    },
  };
}

export async function updateAcopio(idAcopio: number, payload: any) {
  const acopio = await getAcopioOrFail(idAcopio);
  const { address, ...acopioFields } = payload;

  if (acopioFields.name) {
    const acopioName = String(acopioFields.name).trim();
    await assertUniqueAcopioName(acopioName, { excludeId: idAcopio });
    acopioFields.name = acopioName;
  }

  if (acopioFields.openingMode === 'indefinite') {
    acopioFields.startsAt = null;
    acopioFields.endsAt = null;
  }

  if (acopioFields.openingMode === 'scheduled') {
    acopioFields.status = resolveScheduledStatus(
      acopioFields.startsAt,
      acopioFields.endsAt
    );
  }

  if (Object.keys(acopioFields).length) {
    await acopio.update(acopioFields);
  }

  if (address) {
    const existingAddress = await Address.findByPk(acopio.idAddress);
    if (!existingAddress) {
      throw new HttpError(404, 'Address not found');
    }
    const city = await City.findByPk(address.idCity);
    if (!city) {
      throw new HttpError(400, 'Invalid city');
    }
    await existingAddress.update({
      idCity: address.idCity,
      street: address.street,
      neighborhood: address.neighborhood || null,
      reference: address.reference || null,
      latitude: address.latitude,
      longitude: address.longitude,
    });
  }

  return getAcopioDetail(idAcopio);
}

export async function updateAcopioStatus(idAcopio: number, status: 'open' | 'closed') {
  const acopio = await getAcopioOrFail(idAcopio);
  if (acopio.openingMode === 'scheduled') {
    throw new HttpError(
      400,
      'Este acopio se cierra automáticamente según las fechas. Actualiza la fecha de cierre para cambiar el estado.'
    );
  }
  await acopio.update({ status });
  return getAcopioDetail(idAcopio);
}

export async function listNeeds(idAcopio: number) {
  await getAcopioOrFail(idAcopio);
  const needs = await AcopioNeed.findAll({
    where: { idAcopio },
    include: [needCategoryInclude],
  });
  return needs.map((need) => mapNeed(need as NeedWithCategory));
}

export async function createNeed(
  idAcopio: number,
  payload: any,
  qrFile?: Express.Multer.File
) {
  await getAcopioOrFail(idAcopio);
  if (payload.needType === 'money') {
    await assertMoneyNeedsLimit(idAcopio);
  }
  const need = await AcopioNeed.create({
    ...(await buildNeedAttributes(idAcopio, payload)),
    qrPath: null,
  });

  if (qrFile && payload.needType === 'money') {
    const savedQr = await saveNeedQrFile(qrFile, idAcopio, need.id);
    await need.update({ qrPath: savedQr.relativePath });
  }

  const createdNeed = await AcopioNeed.findByPk(need.id, {
    include: [needCategoryInclude],
  });
  return mapNeed(createdNeed as NeedWithCategory);
}

export async function updateNeed(idAcopio: number, idNeed: number, payload: any) {
  const need = await AcopioNeed.findOne({
    where: { id: idNeed, idAcopio },
    include: [needCategoryInclude],
  });
  if (!need) {
    throw new HttpError(404, 'Need not found');
  }

  if (payload.needType === 'money' && need.needType !== 'money') {
    await assertMoneyNeedsLimit(idAcopio);
  }

  const { categoryKey, ...needFields } = payload;
  const nextNeedType = needFields.needType || need.needType;
  const nextHasLimit = needFields.hasLimit ?? need.hasLimit;
  const nextCategoryKey =
    categoryKey !== undefined ? categoryKey : (need as NeedWithCategory).category?.categoryKey;

  await need.update({
    ...needFields,
    iconKey: resolveNeedIconKey({
      needType: nextNeedType,
      iconKey: needFields.iconKey ?? need.iconKey,
    }),
    idCategory: await resolveNeedCategoryId(nextNeedType, nextCategoryKey),
    targetQuantity: nextHasLimit
      ? needFields.targetQuantity ?? need.targetQuantity
      : null,
  });

  await need.reload({ include: [needCategoryInclude] });
  return mapNeed(need as NeedWithCategory);
}

export async function deleteNeed(idAcopio: number, idNeed: number) {
  const need = await AcopioNeed.findOne({ where: { id: idNeed, idAcopio } });
  if (!need) {
    throw new HttpError(404, 'Need not found');
  }
  await deleteUploadFile(need.qrPath);
  await need.destroy();
}

export async function listContacts(idAcopio: number) {
  await getAcopioOrFail(idAcopio);
  const contacts = await AcopioContact.findAll({
    where: { idAcopio },
    include: [{ model: Country, as: 'country' }],
  });
  return contacts.map((contact) => mapContact(contact as any));
}

export async function createContact(idAcopio: number, payload: any) {
  await getAcopioOrFail(idAcopio);

  if (payload.type === 'whatsapp') {
    const country = await Country.findByPk(payload.idCountry);
    if (!country) {
      throw new HttpError(400, 'Invalid country for WhatsApp contact');
    }
  }

  const contact = await AcopioContact.create(buildContactAttributes(idAcopio, payload));

  const created = await AcopioContact.findByPk(contact.id, {
    include: [{ model: Country, as: 'country' }],
  });
  return mapContact(created as any);
}

export async function updateContact(idAcopio: number, idContact: number, payload: any) {
  const contact = await AcopioContact.findOne({ where: { id: idContact, idAcopio } });
  if (!contact) {
    throw new HttpError(404, 'Contact not found');
  }

  if (payload.type === 'whatsapp') {
    const country = await Country.findByPk(payload.idCountry);
    if (!country) {
      throw new HttpError(400, 'Invalid country for WhatsApp contact');
    }
  }

  await contact.update(buildContactAttributes(idAcopio, payload));

  const updated = await AcopioContact.findByPk(contact.id, {
    include: [{ model: Country, as: 'country' }],
  });
  return mapContact(updated as any);
}

export async function deleteContact(idAcopio: number, idContact: number) {
  const contact = await AcopioContact.findOne({ where: { id: idContact, idAcopio } });
  if (!contact) {
    throw new HttpError(404, 'Contact not found');
  }

  const contactsCount = await AcopioContact.count({ where: { idAcopio } });
  if (contactsCount <= 1) {
    throw new HttpError(400, 'Acopio must keep at least one contact');
  }

  await contact.destroy();
}

export async function listOffers(idAcopio: number) {
  await getAcopioOrFail(idAcopio);
  return AcopioOffer.findAll({ where: { idAcopio }, order: [['createdAt', 'DESC']] });
}

export async function createOffer(idAcopio: number, payload: any) {
  await getAcopioOrFail(idAcopio);
  return AcopioOffer.create({
    idAcopio,
    category: payload.category,
    iconKey: payload.iconKey || defaultProductIconKey,
    name: payload.name,
    description: payload.description || null,
    isAvailable: payload.isAvailable ?? true,
  });
}

export async function importNeedsFromExcel(idAcopio: number, fileBuffer: Buffer) {
  await getAcopioOrFail(idAcopio);
  const importedNeeds = parseNeedsExcel(fileBuffer);

  const createdNeeds = await sequelize.transaction(async (transaction: Transaction) => {
    const savedNeeds = [];
    for (const needPayload of importedNeeds) {
      const need = await AcopioNeed.create(
        {
          ...(await buildNeedAttributes(idAcopio, needPayload, transaction)),
          qrPath: null,
        },
        { transaction }
      );
      savedNeeds.push(need);
    }
    return savedNeeds;
  });

  const createdNeedIds = createdNeeds.map((need) => need.id);
  const needsWithCategory = await AcopioNeed.findAll({
    where: { id: { [Op.in]: createdNeedIds } },
    include: [needCategoryInclude],
  });

  return {
    importedCount: needsWithCategory.length,
    items: needsWithCategory.map((need) => mapNeed(need as NeedWithCategory)),
  };
}

export async function importOffersFromExcel(idAcopio: number, fileBuffer: Buffer) {
  await getAcopioOrFail(idAcopio);
  const importedOffers = parseOffersExcel(fileBuffer);

  const createdOffers = await AcopioOffer.bulkCreate(
    importedOffers.map((offerPayload) => ({
      idAcopio,
      category: offerPayload.category,
      iconKey: offerPayload.iconKey,
      name: offerPayload.name,
      description: offerPayload.description,
      isAvailable: true,
    }))
  );

  return {
    importedCount: createdOffers.length,
    items: createdOffers,
  };
}

export async function updateOffer(idAcopio: number, idOffer: number, payload: any) {
  const offer = await AcopioOffer.findOne({ where: { id: idOffer, idAcopio } });
  if (!offer) {
    throw new HttpError(404, 'Offer not found');
  }
  await offer.update(payload);
  return offer;
}

export async function deleteOffer(idAcopio: number, idOffer: number) {
  const offer = await AcopioOffer.findOne({ where: { id: idOffer, idAcopio } });
  if (!offer) {
    throw new HttpError(404, 'Offer not found');
  }
  await offer.destroy();
}

export async function listManagers(idAcopio: number) {
  await getAcopioOrFail(idAcopio);
  const managers = await AcopioManager.findAll({
    where: { idAcopio },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'invitationStatus'],
      },
    ],
  });
  return managers;
}

async function assertUserCanBeInvitedByOwner(
  user: User,
  ownerId: number,
  transaction?: Transaction
) {
  if (user.id === ownerId) {
    return;
  }

  const ownedAcopiosCount = await Acopio.count({
    where: { idOwner: user.id },
    transaction,
  });
  if (ownedAcopiosCount > 0) {
    throw new HttpError(
      409,
      'Este correo ya pertenece a un administrador de otros acopios'
    );
  }

  const existingManagerLinks = await AcopioManager.findAll({
    where: { idUser: user.id },
    include: [{ model: Acopio, as: 'acopio', attributes: ['id', 'idOwner'] }],
    transaction,
  });

  const belongsToOtherOwner = existingManagerLinks.some(
    (managerLink) => {
      const linkedAcopio = managerLink.get('acopio') as Acopio | undefined;
      return Boolean(linkedAcopio && linkedAcopio.idOwner !== ownerId);
    }
  );

  if (belongsToOtherOwner) {
    throw new HttpError(
      409,
      'Este usuario ya está asignado a un acopio de otro administrador'
    );
  }
}

export async function inviteManager(
  idAcopio: number,
  invitedById: number,
  payload: { email: string; name: string },
  options?: { transaction?: Transaction; sendEmail?: boolean }
) {
  const transaction = options?.transaction;
  const shouldSendEmail = options?.sendEmail !== false;
  const acopio = await getAcopioOrFail(idAcopio, transaction);
  const normalizedEmail = payload.email.toLowerCase();

  let user = await User.findOne({
    where: { email: normalizedEmail },
    transaction,
  });
  let temporaryPassword: string | null = null;

  if (user) {
    await assertUserCanBeInvitedByOwner(user, acopio.idOwner, transaction);
  }

  if (!user) {
    temporaryPassword = generateTemporaryPassword();
    user = await User.create(
      {
        email: normalizedEmail,
        name: payload.name,
        passwordHash: await hashPassword(temporaryPassword),
        googleId: null,
        authProvider: 'local',
        invitationStatus: 'pending',
        mustChangePassword: true,
        isActive: true,
      },
      { transaction }
    );
  } else if (user.invitationStatus === 'pending') {
    temporaryPassword = generateTemporaryPassword();
    user.name = payload.name || user.name;
    user.passwordHash = await hashPassword(temporaryPassword);
    user.authProvider = 'local';
    user.mustChangePassword = true;
    await user.save({ transaction });
  } else if (!user.passwordHash) {
    temporaryPassword = generateTemporaryPassword();
    user.passwordHash = await hashPassword(temporaryPassword);
    user.mustChangePassword = true;
    await user.save({ transaction });
  }

  if (acopio.idOwner === user.id) {
    throw new HttpError(400, 'El dueño ya gestiona este acopio');
  }

  const existing = await AcopioManager.findOne({
    where: { idAcopio, idUser: user.id },
    transaction,
  });
  if (existing) {
    if (user.invitationStatus === 'pending') {
      return resendManagerInvitation(idAcopio, user.id, {
        transaction,
        sendEmail: shouldSendEmail,
      });
    }
    throw new HttpError(409, 'El usuario ya es gestor de este acopio');
  }

  let manager: AcopioManager;
  try {
    manager = await AcopioManager.create(
      {
        idAcopio,
        idUser: user.id,
        idInvitedBy: invitedById,
        role: 'manager',
      },
      { transaction }
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      throw new HttpError(409, 'El usuario ya es gestor de este acopio');
    }
    throw error;
  }

  if (shouldSendEmail) {
    await sendManagerInvitationEmail({
      toEmail: user.email,
      managerName: user.name,
      acopioName: acopio.name,
      temporaryPassword,
    });
  }

  return {
    manager,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      invitationStatus: user.invitationStatus,
    },
    passwordSent: Boolean(temporaryPassword),
    temporaryPassword,
  };
}

export async function resendManagerInvitation(
  idAcopio: number,
  idUser: number,
  options?: { transaction?: Transaction; sendEmail?: boolean }
) {
  const transaction = options?.transaction;
  const shouldSendEmail = options?.sendEmail !== false;
  const acopio = await getAcopioOrFail(idAcopio, transaction);
  const manager = await AcopioManager.findOne({
    where: { idAcopio, idUser },
    include: [{ model: User, as: 'user' }],
    transaction,
  });
  if (!manager) {
    throw new HttpError(404, 'Gestor no encontrado');
  }

  const user = await User.findByPk(idUser, { transaction });
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  if (user.invitationStatus !== 'pending') {
    throw new HttpError(
      400,
      'Solo se puede reenviar la invitación si el usuario está pendiente'
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  user.passwordHash = await hashPassword(temporaryPassword);
  user.authProvider = 'local';
  user.mustChangePassword = true;
  await user.save({ transaction });

  if (shouldSendEmail) {
    await sendManagerInvitationEmail({
      toEmail: user.email,
      managerName: user.name,
      acopioName: acopio.name,
      temporaryPassword,
    });
  }

  return {
    manager,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      invitationStatus: user.invitationStatus,
    },
    passwordSent: true,
    temporaryPassword,
  };
}

export async function listOwnedAcopios(ownerId: number) {
  await syncScheduledAcopioStatuses();
  const acopios = await Acopio.findAll({
    where: { idOwner: ownerId },
    attributes: ['id', 'name', 'status', 'responsibleName'],
    order: [['name', 'ASC']],
  });
  return acopios.map((acopio) => ({
    id: acopio.id,
    name: acopio.name,
    status: acopio.status,
    responsibleName: acopio.responsibleName,
    membershipRole: 'owner' as const,
  }));
}

export async function listMyAcopios(userId: number) {
  await syncScheduledAcopioStatuses();
  const managerMemberships = await AcopioManager.findAll({
    where: { idUser: userId },
    attributes: ['idAcopio'],
  });
  const managedAcopioIds = managerMemberships.map(
    (membership) => membership.idAcopio
  );

  const acopioFilters =
    managedAcopioIds.length > 0
      ? {
          [Op.or]: [
            { idOwner: userId },
            { id: { [Op.in]: managedAcopioIds } },
          ],
        }
      : { idOwner: userId };

  const acopios = await Acopio.findAll({
    where: acopioFilters,
    attributes: ['id', 'name', 'status', 'responsibleName', 'idOwner'],
    order: [['name', 'ASC']],
  });

  return acopios.map((acopio) => ({
    id: acopio.id,
    name: acopio.name,
    status: acopio.status,
    responsibleName: acopio.responsibleName,
    membershipRole:
      acopio.idOwner === userId ? ('owner' as const) : ('manager' as const),
  }));
}

export async function updateManager(
  idAcopio: number,
  idUser: number,
  payload: { email?: string; name?: string; resetPassword?: boolean }
) {
  const manager = await AcopioManager.findOne({
    where: { idAcopio, idUser },
    include: [{ model: User, as: 'user' }],
  });
  if (!manager) {
    throw new HttpError(404, 'Manager not found');
  }

  const user = await User.findByPk(idUser);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (payload.name) {
    user.name = payload.name;
  }

  if (payload.email && payload.email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({
      where: { email: payload.email.toLowerCase() },
    });
    if (existingUser && existingUser.id !== user.id) {
      throw new HttpError(409, 'Email is already in use');
    }
    user.email = payload.email.toLowerCase();
  }

  let temporaryPassword: string | null = null;
  if (payload.resetPassword) {
    if (user.invitationStatus !== 'pending') {
      throw new HttpError(
        400,
        'Solo se puede regenerar la contraseña si el usuario está pendiente'
      );
    }
    temporaryPassword = generateTemporaryPassword();
    user.passwordHash = await hashPassword(temporaryPassword);
    user.authProvider = 'local';
    user.mustChangePassword = true;
  }

  await user.save();

  if (temporaryPassword) {
    const acopio = await getAcopioOrFail(idAcopio);
    await sendManagerInvitationEmail({
      toEmail: user.email,
      managerName: user.name,
      acopioName: acopio.name,
      temporaryPassword,
    });
  }

  return {
    manager,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      invitationStatus: user.invitationStatus,
    },
    passwordSent: Boolean(temporaryPassword),
  };
}

export async function removeManager(idAcopio: number, idUser: number) {
  const manager = await AcopioManager.findOne({ where: { idAcopio, idUser } });
  if (!manager) {
    throw new HttpError(404, 'Manager not found');
  }
  await manager.destroy();
}

export async function updateAcopioAvatar(idAcopio: number, avatarFile: Express.Multer.File) {
  const acopio = await getAcopioOrFail(idAcopio);
  const previousPath = acopio.avatarPath;
  const savedAvatar = await saveAvatarFile(avatarFile, idAcopio);

  await acopio.update({
    avatarPath: savedAvatar.relativePath,
    avatarUrl: savedAvatar.publicUrl,
  });

  if (previousPath && previousPath !== savedAvatar.relativePath) {
    await deleteUploadFile(previousPath);
  }

  return getAcopioDetail(idAcopio);
}

export async function addAcopioImages(idAcopio: number, imageFiles: Express.Multer.File[]) {
  await getAcopioOrFail(idAcopio);
  const existingCount = await AcopioImage.count({ where: { idAcopio } });
  if (existingCount + imageFiles.length > maxAcopioGalleryImages) {
    throw new HttpError(400, `Acopio can have at most ${maxAcopioGalleryImages} images`);
  }

  const existingImages = await AcopioImage.findAll({
    where: { idAcopio },
    order: [['sortOrder', 'ASC']],
  });
  let nextSortOrder = existingImages.length
    ? Math.max(...existingImages.map((image) => image.sortOrder)) + 1
    : 1;

  for (const imageFile of imageFiles) {
    const savedImage = await saveAcopioGalleryImage(imageFile, idAcopio, nextSortOrder);
    await AcopioImage.create({
      idAcopio,
      filePath: savedImage.relativePath,
      sortOrder: nextSortOrder,
    });
    nextSortOrder += 1;
  }

  return getAcopioDetail(idAcopio);
}

export async function deleteAcopioImage(idAcopio: number, idImage: number) {
  const image = await AcopioImage.findOne({ where: { id: idImage, idAcopio } });
  if (!image) {
    throw new HttpError(404, 'Image not found');
  }

  await deleteUploadFile(image.filePath);
  await image.destroy();
  return getAcopioDetail(idAcopio);
}

export async function getCarouselSlides(request: Request) {
  await syncScheduledAcopioStatuses();
  const clientIp = getClientIp(request);
  const userIpLocation = await resolveUserLocationFromIp(clientIp);
  const matchedCity = userIpLocation.city;

  async function loadSlides(idCityFilter: number | null) {
    return AcopioImage.findAll({
      include: [
        {
          model: Acopio,
          as: 'acopio',
          required: true,
          where: { status: 'open' },
          include: [
            {
              model: Address,
              as: 'address',
              required: Boolean(idCityFilter),
              where: idCityFilter ? { idCity: idCityFilter } : undefined,
              include: [{ model: City, as: 'city' }],
            },
          ],
        },
      ],
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  let images = await loadSlides(matchedCity ? matchedCity.id : null);
  if (matchedCity && images.length === 0) {
    images = await loadSlides(null);
  }

  return {
    matchedCity: matchedCity
      ? { id: matchedCity.id, name: matchedCity.name }
      : null,
    userLocation:
      userIpLocation.latitude != null && userIpLocation.longitude != null
        ? {
            latitude: userIpLocation.latitude,
            longitude: userIpLocation.longitude,
            cityName: matchedCity?.name || null,
          }
        : null,
    clientIp,
    slides: images.map((image) => {
      const plainImage = image.get({ plain: true }) as any;
      const acopio = plainImage.acopio;
      return {
        id: plainImage.id,
        imageUrl: buildPublicUploadUrl(plainImage.filePath),
        idAcopio: acopio.id,
        acopioName: acopio.name,
        shortDescription: acopio.description
          ? String(acopio.description).slice(0, 140)
          : null,
        status: acopio.status,
        cityName: acopio.address?.city?.name || null,
        avatarUrl: resolveAvatarUrl(acopio),
      };
    }),
  };
}
