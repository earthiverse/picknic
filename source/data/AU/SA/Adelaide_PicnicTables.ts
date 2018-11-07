import { CommentCreator } from "../../CommentCreator";
import { XLSDownloader } from "../../XLSDownloader";

export const downloader = new XLSDownloader(
  "Adelaide City Council",
  "https://opendata.adelaidecitycouncil.com/PicnicTables/",
  "Picnic Tables",
  "https://opendata.adelaidecitycouncil.com/PicnicTables/PicnicTables.xls",
  "Creative Commons Attribution 4.0 International Public License",
  "https://creativecommons.org/licenses/by/4.0/legalcode");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return await downloader.parse(
    async (data: any) => {
      const coordinates = [data.POINT_X, data.POINT_Y];
      const id = data.UniqueAsse;

      // TODO: There are more fields you can grab from the file
      return await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
          source: {
            id,
          },
        },
      });
    });
}

if (require.main === module) {
  run();
}
