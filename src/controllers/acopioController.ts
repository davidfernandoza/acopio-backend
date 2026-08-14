import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as acopioService from '../services/acopioService';
import {
  assertImageFiles,
  assertOptionalImageFile,
  assertValidExcelFile,
  assertValidImageFile,
  getUploadedExcelFile,
  getUploadedFiles,
} from '../requests/fileValidation';
import { maxAcopioGalleryImages } from '../utils/uploads';
import {
  buildExcelTemplateBuffer,
  excelTemplateFileName,
  ExcelTemplateType,
} from '../utils/excelTemplates';
import { parseExcelByTemplateType } from '../utils/excelImport';

export async function createAcopio(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const uploaded = getUploadedFiles(request);
    assertOptionalImageFile(uploaded.avatar, 'avatar');
    assertImageFiles(uploaded.images, maxAcopioGalleryImages);

    const acopio = await acopioService.createAcopio(request.authUser!.id, request.body, {
      avatar: uploaded.avatar,
      images: uploaded.images,
      needQrByIndex: uploaded.needQrByIndex,
    });
    response.status(201).json(acopio);
  } catch (error) {
    next(error);
  }
}

export async function listAcopios(
  _request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const acopios = await acopioService.listAcopios();
    response.status(200).json(acopios);
  } catch (error) {
    next(error);
  }
}

export async function getAcopio(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const idAcopio = Number(request.params.idAcopio);
    const acopio = await acopioService.getAcopioDetail(idAcopio);
    const canManage = await acopioService.userCanManageAcopio(
      idAcopio,
      request.authUser?.id,
      acopio.idOwner
    );
    response.status(200).json({
      ...acopio,
      canManage,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAcopioMap(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const mapData = await acopioService.getAcopioMap(Number(request.params.idAcopio));
    response.status(200).json(mapData);
  } catch (error) {
    next(error);
  }
}

export async function updateAcopio(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const acopio = await acopioService.updateAcopio(
      Number(request.params.idAcopio),
      request.body
    );
    response.status(200).json(acopio);
  } catch (error) {
    next(error);
  }
}

export async function updateAcopioStatus(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const acopio = await acopioService.updateAcopioStatus(
      Number(request.params.idAcopio),
      request.body.status
    );
    response.status(200).json(acopio);
  } catch (error) {
    next(error);
  }
}

export async function listNeeds(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const needs = await acopioService.listNeeds(Number(request.params.idAcopio));
    response.status(200).json(needs);
  } catch (error) {
    next(error);
  }
}

export async function createNeed(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const uploaded = getUploadedFiles(request);
    assertOptionalImageFile(uploaded.qr, 'qr');
    const need = await acopioService.createNeed(
      Number(request.params.idAcopio),
      request.body,
      uploaded.qr
    );
    response.status(201).json(need);
  } catch (error) {
    next(error);
  }
}

export async function updateNeed(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const need = await acopioService.updateNeed(
      Number(request.params.idAcopio),
      Number(request.params.id),
      request.body
    );
    response.status(200).json(need);
  } catch (error) {
    next(error);
  }
}

export async function deleteNeed(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    await acopioService.deleteNeed(
      Number(request.params.idAcopio),
      Number(request.params.id)
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listContacts(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const contacts = await acopioService.listContacts(Number(request.params.idAcopio));
    response.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
}

export async function createContact(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const contact = await acopioService.createContact(
      Number(request.params.idAcopio),
      request.body
    );
    response.status(201).json(contact);
  } catch (error) {
    next(error);
  }
}

export async function updateContact(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const contact = await acopioService.updateContact(
      Number(request.params.idAcopio),
      Number(request.params.id),
      request.body
    );
    response.status(200).json(contact);
  } catch (error) {
    next(error);
  }
}

export async function deleteContact(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    await acopioService.deleteContact(
      Number(request.params.idAcopio),
      Number(request.params.id)
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listOffers(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offers = await acopioService.listOffers(Number(request.params.idAcopio));
    response.status(200).json(offers);
  } catch (error) {
    next(error);
  }
}

export async function createOffer(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offer = await acopioService.createOffer(
      Number(request.params.idAcopio),
      request.body
    );
    response.status(201).json(offer);
  } catch (error) {
    next(error);
  }
}

export async function updateOffer(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offer = await acopioService.updateOffer(
      Number(request.params.idAcopio),
      Number(request.params.id),
      request.body
    );
    response.status(200).json(offer);
  } catch (error) {
    next(error);
  }
}

export async function deleteOffer(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    await acopioService.deleteOffer(
      Number(request.params.idAcopio),
      Number(request.params.id)
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listManagers(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const managers = await acopioService.listManagers(Number(request.params.idAcopio));
    response.status(200).json(managers);
  } catch (error) {
    next(error);
  }
}

export async function inviteManager(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await acopioService.inviteManager(
      Number(request.params.idAcopio),
      request.authUser!.id,
      request.body
    );
    response.status(201).json({
      manager: result.manager,
      user: result.user,
      passwordSent: result.passwordSent,
    });
  } catch (error) {
    next(error);
  }
}

export async function resendManagerInvitation(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await acopioService.resendManagerInvitation(
      Number(request.params.idAcopio),
      Number(request.params.idUser)
    );
    response.status(200).json({
      manager: result.manager,
      user: result.user,
      passwordSent: result.passwordSent,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateManager(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await acopioService.updateManager(
      Number(request.params.idAcopio),
      Number(request.params.idUser),
      request.body
    );
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function removeManager(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    await acopioService.removeManager(
      Number(request.params.idAcopio),
      Number(request.params.idUser)
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function updateAvatar(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const uploaded = getUploadedFiles(request);
    const avatarFile = uploaded.avatar || (request.file as Express.Multer.File | undefined);
    assertValidImageFile(avatarFile, 'avatar');
    const acopio = await acopioService.updateAcopioAvatar(
      Number(request.params.idAcopio),
      avatarFile!
    );
    response.status(200).json(acopio);
  } catch (error) {
    next(error);
  }
}

export async function addImages(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const uploaded = getUploadedFiles(request);
    const imageFiles =
      uploaded.images.length > 0
        ? uploaded.images
        : Array.isArray(request.files)
          ? (request.files as Express.Multer.File[])
          : [];
    assertImageFiles(imageFiles, maxAcopioGalleryImages);
    if (!imageFiles.length) {
      response.status(400).json({ message: 'At least one image is required' });
      return;
    }
    const acopio = await acopioService.addAcopioImages(
      Number(request.params.idAcopio),
      imageFiles
    );
    response.status(201).json(acopio);
  } catch (error) {
    next(error);
  }
}

export async function deleteImage(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const acopio = await acopioService.deleteAcopioImage(
      Number(request.params.idAcopio),
      Number(request.params.id)
    );
    response.status(200).json(acopio);
  } catch (error) {
    next(error);
  }
}

export async function getCarousel(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const carousel = await acopioService.getCarouselSlides(request);
    response.status(200).json(carousel);
  } catch (error) {
    next(error);
  }
}

export async function downloadExcelTemplate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const templateType = request.params.templateType as ExcelTemplateType;
    const fileBuffer = await buildExcelTemplateBuffer(templateType);
    const fileName = excelTemplateFileName(templateType);
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.status(200).send(fileBuffer);
  } catch (error) {
    next(error);
  }
}

export async function parseExcelTemplate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const excelFile = getUploadedExcelFile(request);
    assertValidExcelFile(excelFile, 'file');
    const templateType = request.params.templateType as ExcelTemplateType;
    const parsedExcel = parseExcelByTemplateType(templateType, excelFile!.buffer);
    response.status(200).json(parsedExcel);
  } catch (error) {
    next(error);
  }
}

export async function importNeedsExcel(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const excelFile = getUploadedExcelFile(request);
    assertValidExcelFile(excelFile, 'file');
    const imported = await acopioService.importNeedsFromExcel(
      Number(request.params.idAcopio),
      excelFile!.buffer
    );
    response.status(201).json(imported);
  } catch (error) {
    next(error);
  }
}

export async function importOffersExcel(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const excelFile = getUploadedExcelFile(request);
    assertValidExcelFile(excelFile, 'file');
    const imported = await acopioService.importOffersFromExcel(
      Number(request.params.idAcopio),
      excelFile!.buffer
    );
    response.status(201).json(imported);
  } catch (error) {
    next(error);
  }
}
