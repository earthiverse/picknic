import { CommentCreator } from "../../CommentCreator";
import { capitalCase, Downloader } from "../../Downloader";

export const downloader = new Downloader(
  "dataACT",
  "https://www.data.act.gov.au/Infrastructure-and-Utilities/Public-Furniture-in-the-ACT/ch39-bukk",
  "Public Furniture in the ACT",
  "https://www.data.act.gov.au/resource/knzq-ianp.json?feature_type=TABLE&$limit=50000&$select=asset_id,location_1,location_name",
  "Creative Commons Attribution 4.0 International",
  "https://creativecommons.org/licenses/by/4.0/legalcode");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return await downloader.parse(
    async (data: any) => {
      const geometry = data.location_1;
      const id = data.asset_id;
      const location = data.location_name;

      const comment = new CommentCreator();
      if (location) {
        comment.add(`Located in ${capitalCase(location)}`);
      }

      return await downloader.addTable({
        geometry,
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
