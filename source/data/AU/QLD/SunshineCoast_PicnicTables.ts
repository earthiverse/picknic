import { CommentCreator } from "../../CommentCreator";
import { Downloader } from "../../Downloader";

export const downloader = new Downloader(
  "Sunshine Coast Council",
  "https://data.sunshinecoast.qld.gov.au/Facilities-and-Structures/Public-Picnic-Tables/emjg-3ene/data",
  "Public Picnic Tables",
  "https://data.sunshinecoast.qld.gov.au/resource/emjg-3ene.json?$limit=50000&$select=shape,locationdesc,seattype,tablematerial,objectid,sheltered,equalaccess&$where=starts_with(status, 'Active')",
  "Public Domain",
  "https://creativecommons.org/publicdomain/zero/1.0/legalcode");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return await downloader.parse(
    async (data: any) => {
      const coordinates = [data.shape.longitude, data.shape.latitude];
      const id = data.objectid;

      let sheltered: boolean;
      if (data.sheltered === "Yes") {
        sheltered = true;
      } else if (data.sheltered === "No") {
        sheltered = false;
      }

      let accessible: boolean;
      if (data.equalaccess === "Yes") {
        accessible = true;
      } else if (data.equalaccess === "No") {
        accessible = false;
      }

      // TODO: There are a lot more fields you could grab from the dataset.

      const cc = new CommentCreator();
      const locationDescription = data.locationdesc;
      if (locationDescription) {
        cc.add(`Located in ${locationDescription}`);
      }
      const material = data.tablematerial;
      if (material) {
        cc.add(`Made from ${material.toLowerCase()}`);
      }

      return await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
          accessible,
          comment: cc.toString(),
          sheltered,
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
