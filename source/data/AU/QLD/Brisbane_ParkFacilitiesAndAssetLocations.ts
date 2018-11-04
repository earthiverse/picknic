import { CommentCreator } from "../../CommentCreator";
import { CSVDownloader } from "../../CSVDownloader";
import { capitalCase } from "../../Downloader";

export const downloader = new CSVDownloader(
  "Brisbane City Council Data Directory",
  "https://www.data.brisbane.qld.gov.au/data/dataset/park-facilities-and-assets",
  "Park Facilities and Assets locations",
  "https://www.data.brisbane.qld.gov.au/data/dataset/39cb83b5-111e-47fb-ae21-6b141cd16f25/resource/66b3c6ce-4731-4b19-bddd-8736e3111f7e/download/open-data---am---datasetparkfacilties.csv",
  "Creative Commons Attribution 4.0 International",
  "https://creativecommons.org/licenses/by/4.0/");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return await downloader.parse(
    async (data: any) => {
      if (data.ITEM_TYPE !== "PICNIC BENCH/TABLE") {
        return;
      }
      const coordinates = [data.LONGITUDE, data.LATITUDE];
      const id = data.ITEM_ID;
      const comment = new CommentCreator();
      comment.add(capitalCase(data.NODES_NAME));
      if (data.DESCRIPTION) {
        comment.add(data.DESCRIPTION.toLowerCase());
      }

      return await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
          comment: comment.toString(),
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
