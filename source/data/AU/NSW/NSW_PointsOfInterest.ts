import { ArcGISDownloader } from "../../ArcGISDownloader";
import { CommentCreator } from "../../CommentCreator";
import { capitalCase } from "../../Downloader";

export const downloader = new ArcGISDownloader(
  "NSW Spatial Data Catalogue",
  "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer/0",
  "Points of Interest",
  "Creative Commons Attribution 3.0 Australia", // As stated on https://datasets.seed.nsw.gov.au/dataset/nsw-points-of-interest-poi
  "https://creativecommons.org/licenses/by/3.0/au/");

export async function run(): Promise<number> {
  await downloader.downloadDataset("poitype='Picnic Area'", "poiname,poilabeltype,objectid", 1000);
  return await downloader.parse(
    async (data: any) => {
      const coordinates: any = [data.geometry.x, data.geometry.y];
      const id = data.attributes.objectid;
      const comment = new CommentCreator();
      if (data.attributes.poilabeltype === "NAMED") {
        comment.add(capitalCase(data.attributes.poiname));
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
          type: "site",
        },
      });
    });
}

if (require.main === module) {
  run();
}
