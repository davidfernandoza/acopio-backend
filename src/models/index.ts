import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import { appConfig } from '../config/appConfig';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: appConfig.database.host,
  port: appConfig.database.port,
  database: appConfig.database.database,
  username: appConfig.database.username,
  password: appConfig.database.password,
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

export class Country extends Model<
  InferAttributes<Country>,
  InferCreationAttributes<Country>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare code: string;
  declare phoneCode: string;
}

export class Department extends Model<
  InferAttributes<Department>,
  InferCreationAttributes<Department>
> {
  declare id: CreationOptional<number>;
  declare idCountry: ForeignKey<Country['id']>;
  declare name: string;
  declare code: string | null;
}

export class City extends Model<InferAttributes<City>, InferCreationAttributes<City>> {
  declare id: CreationOptional<number>;
  declare idDepartment: ForeignKey<Department['id']>;
  declare name: string;
  declare latitude: number;
  declare longitude: number;
}

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare passwordHash: string | null;
  declare googleId: string | null;
  declare name: string;
  declare authProvider: 'google' | 'local';
  declare invitationStatus: CreationOptional<'pending' | 'active'>;
  declare mustChangePassword: CreationOptional<boolean>;
  declare hasSeenWelcome: CreationOptional<boolean>;
  declare isActive: CreationOptional<boolean>;
}

export class Address extends Model<
  InferAttributes<Address>,
  InferCreationAttributes<Address>
> {
  declare id: CreationOptional<number>;
  declare idCity: ForeignKey<City['id']>;
  declare street: string;
  declare neighborhood: string | null;
  declare reference: string | null;
  declare latitude: number;
  declare longitude: number;
}

export class Acopio extends Model<
  InferAttributes<Acopio>,
  InferCreationAttributes<Acopio>
> {
  declare id: CreationOptional<number>;
  declare idOwner: ForeignKey<User['id']>;
  declare idAddress: ForeignKey<Address['id']>;
  declare name: string;
  declare description: string | null;
  declare status: CreationOptional<'open' | 'closed'>;
  declare openingMode: CreationOptional<'indefinite' | 'scheduled' | 'manual'>;
  declare startsAt: Date | null;
  declare endsAt: Date | null;
  declare responsibleName: string;
  declare avatarPath: string | null;
  declare avatarUrl: string | null;
}

export class AcopioImage extends Model<
  InferAttributes<AcopioImage>,
  InferCreationAttributes<AcopioImage>
> {
  declare id: CreationOptional<number>;
  declare idAcopio: ForeignKey<Acopio['id']>;
  declare filePath: string;
  declare sortOrder: number;
}

export class AcopioContact extends Model<
  InferAttributes<AcopioContact>,
  InferCreationAttributes<AcopioContact>
> {
  declare id: CreationOptional<number>;
  declare idAcopio: ForeignKey<Acopio['id']>;
  declare type: 'whatsapp' | 'email';
  declare value: string;
  declare idCountry: ForeignKey<Country['id']> | null;
  declare label: string | null;
}

export class NeedCategory extends Model<
  InferAttributes<NeedCategory>,
  InferCreationAttributes<NeedCategory>
> {
  declare id: CreationOptional<number>;
  declare categoryKey: string;
  declare name: string;
  declare isDefault: CreationOptional<boolean>;
  declare sortOrder: CreationOptional<number>;
}

export class AcopioNeed extends Model<
  InferAttributes<AcopioNeed>,
  InferCreationAttributes<AcopioNeed>
> {
  declare id: CreationOptional<number>;
  declare idAcopio: ForeignKey<Acopio['id']>;
  declare idCategory: ForeignKey<NeedCategory['id']> | null;
  declare needType: 'product' | 'money' | 'talent';
  declare iconKey: string;
  declare name: string;
  declare unit: string | null;
  declare hasLimit: CreationOptional<boolean>;
  declare targetQuantity: number | null;
  declare receivedQuantity: CreationOptional<number>;
  declare description: string | null;
  declare qrPath: string | null;
  declare bankName: string | null;
  declare accountNumber: string | null;
  declare accountHolder: string | null;
  declare documentType: 'cc' | 'ce' | 'nit' | 'passport' | 'ti' | null;
  declare documentNumber: string | null;
}

export class AcopioOffer extends Model<
  InferAttributes<AcopioOffer>,
  InferCreationAttributes<AcopioOffer>
> {
  declare id: CreationOptional<number>;
  declare idAcopio: ForeignKey<Acopio['id']>;
  declare category: string;
  declare iconKey: string;
  declare name: string;
  declare description: string | null;
  declare isAvailable: CreationOptional<boolean>;
}

export class AcopioManager extends Model<
  InferAttributes<AcopioManager>,
  InferCreationAttributes<AcopioManager>
> {
  declare id: CreationOptional<number>;
  declare idAcopio: ForeignKey<Acopio['id']>;
  declare idUser: ForeignKey<User['id']>;
  declare idInvitedBy: ForeignKey<User['id']>;
  declare role: CreationOptional<'manager'>;
}

Country.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    code: { type: DataTypes.STRING(2), allowNull: false, unique: true },
    phoneCode: { type: DataTypes.STRING(8), allowNull: false, field: 'phone_code' },
  },
  { sequelize, tableName: 'countries' }
);

Department.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idCountry: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_country',
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: true },
  },
  { sequelize, tableName: 'departments' }
);

City.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idDepartment: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_department',
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  },
  { sequelize, tableName: 'cities' }
);

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_hash',
    },
    googleId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      unique: true,
      field: 'google_id',
    },
    name: { type: DataTypes.STRING(180), allowNull: false },
    authProvider: {
      type: DataTypes.ENUM('google', 'local'),
      allowNull: false,
      field: 'auth_provider',
    },
    invitationStatus: {
      type: DataTypes.ENUM('pending', 'active'),
      allowNull: false,
      defaultValue: 'active',
      field: 'invitation_status',
    },
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'must_change_password',
    },
    hasSeenWelcome: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'has_seen_welcome',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  { sequelize, tableName: 'users' }
);

Address.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idCity: { type: DataTypes.INTEGER, allowNull: false, field: 'id_city' },
    street: { type: DataTypes.STRING(255), allowNull: false },
    neighborhood: { type: DataTypes.STRING(120), allowNull: true },
    reference: { type: DataTypes.STRING(255), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  },
  { sequelize, tableName: 'addresses' }
);

Acopio.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idOwner: { type: DataTypes.INTEGER, allowNull: false, field: 'id_owner' },
    idAddress: { type: DataTypes.INTEGER, allowNull: false, field: 'id_address' },
    name: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('open', 'closed'),
      allowNull: false,
      defaultValue: 'open',
    },
    openingMode: {
      type: DataTypes.ENUM('indefinite', 'scheduled', 'manual'),
      allowNull: false,
      defaultValue: 'indefinite',
      field: 'opening_mode',
    },
    startsAt: { type: DataTypes.DATE, allowNull: true, field: 'starts_at' },
    endsAt: { type: DataTypes.DATE, allowNull: true, field: 'ends_at' },
    responsibleName: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: 'responsible_name',
    },
    avatarPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_path',
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_url',
    },
  },
  { sequelize, tableName: 'acopios' }
);

AcopioImage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idAcopio: { type: DataTypes.INTEGER, allowNull: false, field: 'id_acopio' },
    filePath: { type: DataTypes.STRING(500), allowNull: false, field: 'file_path' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, field: 'sort_order' },
  },
  { sequelize, tableName: 'acopio_images' }
);

AcopioContact.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idAcopio: { type: DataTypes.INTEGER, allowNull: false, field: 'id_acopio' },
    type: { type: DataTypes.ENUM('whatsapp', 'email'), allowNull: false },
    value: { type: DataTypes.STRING(180), allowNull: false },
    idCountry: { type: DataTypes.INTEGER, allowNull: true, field: 'id_country' },
    label: { type: DataTypes.STRING(120), allowNull: true },
  },
  { sequelize, tableName: 'acopio_contacts' }
);

NeedCategory.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    categoryKey: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: 'category_key',
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
  },
  { sequelize, tableName: 'need_categories' }
);

AcopioNeed.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idAcopio: { type: DataTypes.INTEGER, allowNull: false, field: 'id_acopio' },
    idCategory: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'id_category',
    },
    needType: {
      type: DataTypes.ENUM('product', 'money', 'talent'),
      allowNull: false,
      field: 'need_type',
    },
    iconKey: { type: DataTypes.STRING(40), allowNull: false, field: 'icon_key' },
    name: { type: DataTypes.STRING(180), allowNull: false },
    unit: { type: DataTypes.STRING(40), allowNull: true },
    hasLimit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'has_limit',
    },
    targetQuantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'target_quantity',
    },
    receivedQuantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'received_quantity',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    qrPath: { type: DataTypes.STRING(500), allowNull: true, field: 'qr_path' },
    bankName: { type: DataTypes.STRING(180), allowNull: true, field: 'bank_name' },
    accountNumber: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'account_number',
    },
    accountHolder: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: 'account_holder',
    },
    documentType: {
      type: DataTypes.ENUM('cc', 'ce', 'nit', 'passport', 'ti'),
      allowNull: true,
      field: 'document_type',
    },
    documentNumber: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: 'document_number',
    },
  },
  { sequelize, tableName: 'acopio_needs' }
);

AcopioOffer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idAcopio: { type: DataTypes.INTEGER, allowNull: false, field: 'id_acopio' },
    category: { type: DataTypes.STRING(80), allowNull: false },
    iconKey: { type: DataTypes.STRING(40), allowNull: false, field: 'icon_key' },
    name: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_available',
    },
  },
  { sequelize, tableName: 'acopio_offers' }
);

AcopioManager.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idAcopio: { type: DataTypes.INTEGER, allowNull: false, field: 'id_acopio' },
    idUser: { type: DataTypes.INTEGER, allowNull: false, field: 'id_user' },
    idInvitedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_invited_by',
    },
    role: {
      type: DataTypes.ENUM('manager'),
      allowNull: false,
      defaultValue: 'manager',
    },
  },
  { sequelize, tableName: 'acopio_managers' }
);

Country.hasMany(Department, { foreignKey: 'idCountry', as: 'departments' });
Department.belongsTo(Country, { foreignKey: 'idCountry', as: 'country' });

Department.hasMany(City, { foreignKey: 'idDepartment', as: 'cities' });
City.belongsTo(Department, { foreignKey: 'idDepartment', as: 'department' });

City.hasMany(Address, { foreignKey: 'idCity', as: 'addresses' });
Address.belongsTo(City, { foreignKey: 'idCity', as: 'city' });

User.hasMany(Acopio, { foreignKey: 'idOwner', as: 'ownedAcopios' });
Acopio.belongsTo(User, { foreignKey: 'idOwner', as: 'owner' });

Address.hasOne(Acopio, { foreignKey: 'idAddress', as: 'acopio' });
Acopio.belongsTo(Address, { foreignKey: 'idAddress', as: 'address' });

Acopio.hasMany(AcopioContact, { foreignKey: 'idAcopio', as: 'contacts' });
AcopioContact.belongsTo(Acopio, { foreignKey: 'idAcopio', as: 'acopio' });
AcopioContact.belongsTo(Country, { foreignKey: 'idCountry', as: 'country' });

Acopio.hasMany(AcopioImage, { foreignKey: 'idAcopio', as: 'images' });
AcopioImage.belongsTo(Acopio, { foreignKey: 'idAcopio', as: 'acopio' });

Acopio.hasMany(AcopioNeed, { foreignKey: 'idAcopio', as: 'needs' });
AcopioNeed.belongsTo(Acopio, { foreignKey: 'idAcopio', as: 'acopio' });
NeedCategory.hasMany(AcopioNeed, { foreignKey: 'idCategory', as: 'needs' });
AcopioNeed.belongsTo(NeedCategory, { foreignKey: 'idCategory', as: 'category' });

Acopio.hasMany(AcopioOffer, { foreignKey: 'idAcopio', as: 'offers' });
AcopioOffer.belongsTo(Acopio, { foreignKey: 'idAcopio', as: 'acopio' });

Acopio.hasMany(AcopioManager, { foreignKey: 'idAcopio', as: 'managers' });
AcopioManager.belongsTo(Acopio, { foreignKey: 'idAcopio', as: 'acopio' });
AcopioManager.belongsTo(User, { foreignKey: 'idUser', as: 'user' });
AcopioManager.belongsTo(User, { foreignKey: 'idInvitedBy', as: 'invitedBy' });

export const models = {
  Country,
  Department,
  City,
  User,
  Address,
  Acopio,
  AcopioImage,
  AcopioContact,
  NeedCategory,
  AcopioNeed,
  AcopioOffer,
  AcopioManager,
};
