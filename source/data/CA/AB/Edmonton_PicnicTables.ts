import { CSVDownloader } from "../../CSVDownloader";

export const downloader = new CSVDownloader(
  "Edmonton Open Data Portal",
  "https://data.edmonton.ca/Facilities-and-Structures/Public-Picnic-Table-Locations/vk3s-q842",
  "Public Picnic Table Locations",
  "https://data.edmonton.ca/api/views/vk3s-q842/rows.csv?accessType=DOWNLOAD",
  "City of Edmonton Open Data Terms of Use (Version 2.1)",
  "http://www.edmonton.ca/city_government/documents/Web-version2.1-OpenDataAgreement.pdf");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return downloader.parse(
    /* Parse */
    async (data: any) => {
      const lat = parseFloat(data.Latitude);
      const lng = parseFloat(data.Longitude);

      const type = data["Table Type"].toLowerCase();
      const surface = data["Surface Material"].toLowerCase();
      const structural = data["Structural Material"].toLowerCase();
      let comment: string;
      if (type === "other table") {
        comment = "A table";
      } else {
        comment = "A " + type;
      }
      comment += " made from " + structural;
      if (surface !== structural) {
        comment += " and " + surface;
      }
      comment += " materials.";

      await downloader.addTable2({
        geometry: {
          coordinates: [lng, lat],
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
