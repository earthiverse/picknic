import { ArcGISDownloader } from "../../ArcGISDownloader";

export const downloader = new ArcGISDownloader(
  "FirstMap Delaware",
  "https://firstmap.delaware.gov/arcgis/rest/services/Society/DE_Park_Facilities/FeatureServer/0",
  "Park Facilities",
  "Unknown",
  "Unknown");

export async function run(): Promise<number> {
  await downloader.downloadDataset("FACILITY LIKE 'Picnic%'", "OBJECTID_1,PARK,FACILITY,DESCRIPTION", 1000);
  return downloader.parse(
    async (data: any) => {
      const coordinates: number[] = [data.geometry.x, data.geometry.y];
      const type = data.attributes.FACILITY;
      const sheltered = type === "Picnic Pavilion";
      let comment = data.attributes.description;
      if (!comment) {
        comment = undefined;
      }
      const id = data.attributes.OBJECTID_1;

      await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
          comment,
          sheltered,
          source: {
            id,
          },
          type: "site",
        },
      });
    });
}

if (require.main === module) {
  run();
}
