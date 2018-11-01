import { ArcGISDownloader } from "../../ArcGISDownloader";

export const downloader = new ArcGISDownloader(
  "Nebraska Game and Parks Commission",
  "https://maps.outdoornebraska.gov/arcgis/rest/services/OpenData/OpenDataLayers/MapServer/29",
  "Park Amenities",
  "Unknown",
  "Unknown");

export async function run(): Promise<number> {
  await downloader.downloadDataset("AmenityType LIKE 'PICNIC%'", "OBJECTID,ParkName,AmenityType,Description", 1000);
  return downloader.parse(
    async (data: any) => {
      const id = data.attributes.OBJECTID;
      const coordinates: number[] = [data.geometry.x, data.geometry.y];
      const type = data.attributes.AmenityType;
      const sheltered = type === "Picnic Shelter";
      const parkName = data.attributes.ParkName;
      const description = data.attributes.Description;
      let comment = "";
      if (parkName) {
        comment = `Located in ${parkName}.`;
      }
      if (description && type !== description) {
        comment = `${comment} ${description}.`;
      }
      if (!comment) {
        comment = undefined;
      } else {
        comment = comment.trimLeft();
      }

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
