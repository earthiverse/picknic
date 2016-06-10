import { IDataModel } from './IDataModel';

export interface ITable extends IDataModel {
  accessible: boolean;
  sheltered: boolean;
  comment: string;
};
