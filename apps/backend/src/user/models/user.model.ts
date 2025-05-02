import { DocumentType, prop, ReturnModelType } from '@typegoose/typegoose';
import { UserRole } from '../enums/role.enum';

export type UserDocumentType = DocumentType<UserModel>;
export type UserReturnModelType = ReturnModelType<typeof UserModel>;

export class UserModel {
  @prop({ default: '', text: true })
  readonly firstName: string;

  @prop({ default: '', text: true })
  readonly lastName: string;

  @prop({ lowercase: true, trim: true, text: true })
  readonly email?: string;

  @prop()
  readonly password?: string;

  @prop()
  readonly phone?: string;

  @prop({ default: UserRole.CLIENT, type: String, enum: UserRole})
  readonly role: UserRole;

  @prop({ default: Date.now })
  readonly created: Date;

  initialize(this: Mod.Writeable<UserDocumentType>): UserDocumentType {
    return this;
  }

  setPassword(this: Mod.Writeable<UserDocumentType>, password: string) {
    this.password = password;
  }

  setValues(this: Mod.Writeable<UserModel>, user: Partial<UserModel>) {
    const data = Object.assign({}, user) as Mod.Writeable<UserModel>;

    delete data.password;

    Object.assign(this, data);
  }

  isAdmin() {
    return this.role === 'admin';
  }

  toJSON() {
    const data = Object.assign(
      {},
      (this as any)._doc,
    ) as Mod.Writeable<UserDocumentType>;

    data.id = data._id;
    delete data._id;
    delete data.password;

    return data;
  }
}
