import type { DocumentType, Ref } from '@typegoose/typegoose';
import mongoose from 'mongoose';

export type ModelRef<T> = Ref<T> | string | mongoose.Types.ObjectId | undefined | DocumentType<T> | {_id: mongoose.Types.ObjectId} | {id: string};
