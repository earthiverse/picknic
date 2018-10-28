import { ArcGISDownloader } from "../../ArcGISDownloader";

export const downloader = new ArcGISDownloader(
  "City of Peterborough",
  "http://maps.peterborough.ca/arcgis/rest/services/External/Operational/MapServer/20",
  "Picnic",
  "Unknown",
  "Unknown");

export async function run(): Promise<number> {
  await downloader.downloadDataset("1=1", "objectid", 1000);
  return downloader.parse(
    async (data: any) => {
      const coordinates: number[] = data.geometry.points[0];
      const id = data.attributes.OBJECTID;

      await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
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
