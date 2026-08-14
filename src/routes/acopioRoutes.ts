import { Router } from 'express';
import * as acopioController from '../controllers/acopioController';
import {
  optionalAuth,
  requireAcopioManager,
  requireAcopioOwner,
  requireAuth,
} from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { parseMultipartAcopioBody } from '../middlewares/parseMultipartAcopioBody';
import { uploadAcopioMedia, createAcopioUploadFields, maxAcopioGalleryImages, uploadExcelFile } from '../utils/uploads';
import {
  createAcopioBodySchema,
  createContactBodySchema,
  createNeedBodySchema,
  createOfferBodySchema,
  excelTemplateTypeParamsSchema,
  excelUploadBodySchema,
  idAcopioAndIdParamsSchema,
  idAcopioAndIdUserParamsSchema,
  idAcopioParamsSchema,
  inviteManagerBodySchema,
  updateAcopioBodySchema,
  updateAcopioStatusBodySchema,
  updateContactBodySchema,
  updateManagerBodySchema,
  updateNeedBodySchema,
  updateOfferBodySchema,
} from '../requests/schemas';

const acopioRouter = Router();

acopioRouter.get('/carousel', acopioController.getCarousel);

acopioRouter.get('/', acopioController.listAcopios);

acopioRouter.get(
  '/excel-templates/:templateType',
  requireAuth,
  validateRequest(excelTemplateTypeParamsSchema, 'params'),
  acopioController.downloadExcelTemplate
);

acopioRouter.post(
  '/excel-templates/:templateType/parse',
  requireAuth,
  validateRequest(excelTemplateTypeParamsSchema, 'params'),
  uploadExcelFile.single('file'),
  validateRequest(excelUploadBodySchema, 'body'),
  acopioController.parseExcelTemplate
);

acopioRouter.post(
  '/',
  requireAuth,
  uploadAcopioMedia.fields(createAcopioUploadFields),
  parseMultipartAcopioBody,
  validateRequest(createAcopioBodySchema, 'body'),
  acopioController.createAcopio
);

acopioRouter.get(
  '/:idAcopio',
  optionalAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  acopioController.getAcopio
);

acopioRouter.get(
  '/:idAcopio/map',
  validateRequest(idAcopioParamsSchema, 'params'),
  acopioController.getAcopioMap
);

acopioRouter.put(
  '/:idAcopio',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioManager,
  validateRequest(updateAcopioBodySchema, 'body'),
  acopioController.updateAcopio
);

acopioRouter.patch(
  '/:idAcopio/status',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioManager,
  validateRequest(updateAcopioStatusBodySchema, 'body'),
  acopioController.updateAcopioStatus
);

acopioRouter.put(
  '/:idAcopio/avatar',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioManager,
  uploadAcopioMedia.single('avatar'),
  acopioController.updateAvatar
);

acopioRouter.post(
  '/:idAcopio/images',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioManager,
  uploadAcopioMedia.array('images', maxAcopioGalleryImages),
  acopioController.addImages
);

acopioRouter.delete(
  '/:idAcopio/images/:id',
  requireAuth,
  validateRequest(idAcopioAndIdParamsSchema, 'params'),
  requireAcopioManager,
  acopioController.deleteImage
);

acopioRouter.get(
  '/:idAcopio/needs',
  validateRequest(idAcopioParamsSchema, 'params'),
  acopioController.listNeeds
);

acopioRouter.post(
  '/:idAcopio/needs/import',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioManager,
  uploadExcelFile.single('file'),
  validateRequest(excelUploadBodySchema, 'body'),
  acopioController.importNeedsExcel
);

acopioRouter.post(
  '/:idAcopio/needs',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioManager,
  uploadAcopioMedia.single('qr'),
  validateRequest(createNeedBodySchema, 'body'),
  acopioController.createNeed
);

acopioRouter.put(
  '/:idAcopio/needs/:id',
  requireAuth,
  validateRequest(idAcopioAndIdParamsSchema, 'params'),
  requireAcopioManager,
  validateRequest(updateNeedBodySchema, 'body'),
  acopioController.updateNeed
);

acopioRouter.delete(
  '/:idAcopio/needs/:id',
  requireAuth,
  validateRequest(idAcopioAndIdParamsSchema, 'params'),
  requireAcopioManager,
  acopioController.deleteNeed
);

acopioRouter.get(
  '/:idAcopio/contacts',
  validateRequest(idAcopioParamsSchema, 'params'),
  acopioController.listContacts
);

acopioRouter.post(
  '/:idAcopio/contacts',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioManager,
  validateRequest(createContactBodySchema, 'body'),
  acopioController.createContact
);

acopioRouter.put(
  '/:idAcopio/contacts/:id',
  requireAuth,
  validateRequest(idAcopioAndIdParamsSchema, 'params'),
  requireAcopioManager,
  validateRequest(updateContactBodySchema, 'body'),
  acopioController.updateContact
);

acopioRouter.delete(
  '/:idAcopio/contacts/:id',
  requireAuth,
  validateRequest(idAcopioAndIdParamsSchema, 'params'),
  requireAcopioManager,
  acopioController.deleteContact
);

acopioRouter.get(
  '/:idAcopio/offers',
  validateRequest(idAcopioParamsSchema, 'params'),
  acopioController.listOffers
);

acopioRouter.post(
  '/:idAcopio/offers/import',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioManager,
  uploadExcelFile.single('file'),
  validateRequest(excelUploadBodySchema, 'body'),
  acopioController.importOffersExcel
);

acopioRouter.post(
  '/:idAcopio/offers',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioManager,
  validateRequest(createOfferBodySchema, 'body'),
  acopioController.createOffer
);

acopioRouter.put(
  '/:idAcopio/offers/:id',
  requireAuth,
  validateRequest(idAcopioAndIdParamsSchema, 'params'),
  requireAcopioManager,
  validateRequest(updateOfferBodySchema, 'body'),
  acopioController.updateOffer
);

acopioRouter.delete(
  '/:idAcopio/offers/:id',
  requireAuth,
  validateRequest(idAcopioAndIdParamsSchema, 'params'),
  requireAcopioManager,
  acopioController.deleteOffer
);

acopioRouter.get(
  '/:idAcopio/managers',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioOwner,
  acopioController.listManagers
);

acopioRouter.post(
  '/:idAcopio/managers',
  requireAuth,
  validateRequest(idAcopioParamsSchema, 'params'),
  requireAcopioOwner,
  validateRequest(inviteManagerBodySchema, 'body'),
  acopioController.inviteManager
);

acopioRouter.post(
  '/:idAcopio/managers/:idUser/resend-invitation',
  requireAuth,
  validateRequest(idAcopioAndIdUserParamsSchema, 'params'),
  requireAcopioOwner,
  acopioController.resendManagerInvitation
);

acopioRouter.put(
  '/:idAcopio/managers/:idUser',
  requireAuth,
  validateRequest(idAcopioAndIdUserParamsSchema, 'params'),
  requireAcopioOwner,
  validateRequest(updateManagerBodySchema, 'body'),
  acopioController.updateManager
);

acopioRouter.delete(
  '/:idAcopio/managers/:idUser',
  requireAuth,
  validateRequest(idAcopioAndIdUserParamsSchema, 'params'),
  requireAcopioOwner,
  acopioController.removeManager
);

export default acopioRouter;
