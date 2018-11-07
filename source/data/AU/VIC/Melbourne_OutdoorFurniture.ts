import { CommentCreator } from "../../CommentCreator";
import { Downloader } from "../../Downloader";

export const downloader = new Downloader(
  "Melbourne Data",
  "https://data.melbourne.vic.gov.au/Assets-Infrastructure/Street-furniture-including-bollards-bicycle-rails-/8fgn-5q6t",
  "Street Furniture",
  "https://data.melbourne.vic.gov.au/resource/w4fc-iq27.json?$limit=50000&asset_type=Picnic%20Setting&$select=geometry,description,condition_rating,gis_id,location_desc",
  "Creative Commons Attribution 4.0 International",
  "https://creativecommons.org/licenses/by/4.0/legalcode");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return await downloader.parse(
    async (data: any) => {
      const geometry = data.geometry;
      const id = data.gis_id;

      const cc = new CommentCreator();
      const description: string = data.description;
      if (description) {
        cc.add(description);
      }
      const location = data.location_desc;
      if (description.search(location) === -1) {
        cc.add(`Located in ${location}`);
      }
      const conditionRating = data.condition_rating;
      if (conditionRating) {
        cc.add(`Has a condition rating of ${conditionRating}`);
      }

      return await downloader.addTable({
        geometry,
        properties: {
          comment: cc.toString(),
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
