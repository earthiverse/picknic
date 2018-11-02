import { CSVDownloader } from "../../CSVDownloader";
import { capitalCase } from "../../Downloader";

export const downloader = new CSVDownloader(
  "Lethbridge Open Data",
  "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0",
  "Picnic Tables",
  "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0.csv",
  "City of Lethbridge​ - Open Data License (Version 1.0)",
  "http://www.lethbridge.ca/Pages/OpenDataLicense.aspx");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return downloader.parse(
    async (data: any) => {
      const coordinates = [parseFloat(data.X), parseFloat(data.Y)];

      const id: string = data.AssetID;
      const accessible: boolean = data.Accessible.startsWith("Y");

      const material: string = data.Material.toLowerCase();
      const surface: string = data.Surface.toLowerCase();
      const plaque: boolean = data.Plaque === "Yes";
      const dedication: string = data.Dedication.trim();
      const greenspaceID: string = data.Grnspc_ID;
      let comment: string = capitalCase(data.Comment.trim());
      if (comment) {
        comment += ".";
      }
      if (surface && surface !== "no") {
        comment += " The table is on a surface that is " + surface.toLowerCase() + ".";
      }
      if (plaque) {
        comment += " Has a plaque";
        if (dedication) {
          comment += " for " + dedication;
        }
        comment += ".";
      }
      comment.trimLeft();

      return await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
          accessible,
          comment,
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
