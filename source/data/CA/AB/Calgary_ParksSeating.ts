import { CSVDownloader } from "../../CSVDownloader";

export const downloader = new CSVDownloader(
  "Open Calgary",
  "https://data.calgary.ca/Recreation-and-Culture/Parks-Seating/ikeb-n5bc",
  "Parks Seating",
  "https://data.calgary.ca/api/views/ikeb-n5bc/rows.csv?accessType=DOWNLOAD",
  "Open Government License - City of Calgary (Version 2.1)",
  "https://data.calgary.ca/stories/s/Open-Calgary-Terms-of-Use/u45n-7awa");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return downloader.parse(
    async (data: any) => {
      const coordinates = [parseFloat(data.longitude), parseFloat(data.latitude)];

      const type = data.TYPE_DESCRIPTION;
      if (type !== "PICNIC TABLE" && type !== "MEMORIAL PICNIC TABLE") {
        return;
      }
      const active = data.LIFE_CYCLE_STATUS;
      if (active !== "ACTIVE") {
        return;
      }

      const assetClass: string = data.ASSET_CLASS;
      const maintInfo: string = data.MAINT_INFO;
      let comment = "";
      if (assetClass.search("REMOVED") !== -1) {
        comment += " Might be missing.";
      }
      if (maintInfo.search("PORTABLE") !== -1) {
        comment += " This is a portable table, so it might be moved, or missing.";
      }
      comment = comment.trimLeft();
      if (!comment) {
        comment = undefined;
      }

      await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
          comment,
        },
      });
    });
}

if (require.main === module) {
  run();
}
