import { CSVDownloader } from "../../CSVDownloader";

export const downloader = new CSVDownloader(
  "City of Airdrie",
  "http://data-airdrie.opendata.arcgis.com/datasets/airdrie-picnictables",
  "Airdrie Picnictables",
  "https://opendata.arcgis.com/datasets/b07ce15756884cfdab2537d5d9b92eb4_0.csv",
  "Open Data Licence - City of Airdrie (Version 1.0)",
  "http://data-airdrie.opendata.arcgis.com/pages/our-open-licence");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return downloader.parse(
    async (data: any) => {
      const coordinates = [parseFloat(data.X), parseFloat(data.Y)];
      const id: string = data.FID; // NOTE: This FID doesn't look meaninful.

      const color: string = data.COLOUR.trim().toLowerCase();
      const manufacturer: string = data.MANUFACTUR.trim().toLowerCase();
      let material: string = data.MATERIAL.trim().toLowerCase();
      let comment: string;
      if (color) {
        comment = "A " + color.toLowerCase() + " table";
      } else {
        comment = "A table";
      }
      if (material) {
        if (material === "wooden") {
          material = "wood";
        }
        comment += " made from " + material.toLowerCase;
      }
      if (manufacturer) {
        comment += " manufactured by " + manufacturer.toLowerCase;
      }
      comment += ".";

      return await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
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
