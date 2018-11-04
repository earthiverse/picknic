import { ArcGISDownloader } from "../../ArcGISDownloader";
import { CommentCreator } from "../../CommentCreator";
import { capitalCase } from "../../Downloader";

export const downloader = new ArcGISDownloader(
  "City of Gold Coast",
  "https://services.arcgis.com/3vStCH7NDoBOZ5zn/ArcGIS/rest/services/Outdoor_Tables/FeatureServer/0",
  "Outdoor Tables",
  "Creative Commons Attribution 3.0", // Probably... Other datasets like https://data-goldcoast.opendata.arcgis.com/datasets/d0cbb642baf74f74b7ed2f3b4a1c3e12_0 specify it.
  "https://creativecommons.org/licenses/by/3.0/");

// TODO: There's also PARK_SHELTERS on this server, you could potentially cross reference the data, and find
//       tables which are covered...

export async function run(): Promise<number> {
  await downloader.downloadDataset("1=1", "GlobalID,TABLE_STYLE,NO_OF_PLACES,GIS_DESCRIPTION", 1000);
  return await downloader.parse(
    async (data: any) => {
      const coordinates: any = [data.geometry.x, data.geometry.y];
      const id = data.attributes.GlobalID;

      const comment = new CommentCreator();
      const description = data.attributes.GIS_DESCRIPTION;
      if (description) {
        comment.add(description.toLowerCase());
      }
      const style = data.attributes.TABLE_STYLE;
      if (style) {
        comment.add(`${style.toLowerCase()} table`);
      }
      if (data.attributes.poilabeltype === "NAMED") {
        comment.add(capitalCase(data.attributes.poiname));
      }
      const numSeats = data.attributes.NO_OF_PLACES;
      if (numSeats) {
        comment.add(`Seats ${numSeats}`);
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
        },
      });
    });
}

if (require.main === module) {
  run();
}
