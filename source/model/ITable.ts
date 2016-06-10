import { IDataModel } from './IDataModel.ts';

interface ITable extends IDataModel {
  accessible: boolean;
  sheltered: boolean;
  comment: string;
};

export = ITable;
