import { ArcGISDownloader } from "../../ArcGISDownloader";
import { CommentCreator } from "../../CommentCreator";
import { capitalCase } from "../../Downloader";

export const downloader = new ArcGISDownloader(
  "Lethbridge Open Data",
  "http://gis.lethbridge.ca/lethwebgisarcgis/rest/services/OpenData/odl_picnictables/MapServer/0",
  "Picnic Tables",
  "City of Lethbridge​ - Open Data License (Version 1.0)",
  "http://www.lethbridge.ca/Pages/OpenDataLicense.aspx");

export async function run(): Promise<number> {
  await downloader.downloadDataset("Status='Active'", "AssetID,Material,Surface,Accessible,Plaque,Dedication,Comment,Grnspc_ID");
  return downloader.parse(
    async (data: any) => {
      const coordinates = [parseFloat(data.geometry.x), parseFloat(data.geometry.y)];

      const id: string = data.AssetID;
      let accessible: boolean;
      if (data.attributes.Accessible && data.attributes.Accessible.startsWith("Y")) {
        accessible = true;
      } else if (data.attributes.Accessible && data.attributes.Accessible.startsWith("N")) {
        accessible = false;
      }

      const cc = new CommentCreator();
      cc.add(data.attributes.Comment);
      const surface: string = data.attributes.Surface;
      if (surface && !surface.startsWith("N")) {
        cc.add(`The table is on a surface that is ${surface}.`);
      }
      const plaque: boolean = data.attributes.Plaque.startsWith("Y");
      const dedication: string = data.attributes.Dedication;
      if (plaque) {
        if (dedication) {
          cc.add(`Has a plaque dedicated to ${dedication}`);
        } else {
          cc.add(`Has a plaque.`);
        }
      }
      const material: string = data.attributes.Material;
      if (material) {
        cc.add(`Made from ${material.toLowerCase()}.`);
      }
      const park: string = data.attributes.Grnspc_ID;
      if (park) {
        cc.add(`Located in ${capitalCase(park.match(/.+?(?= -)/)[0])}`);
      }

      return await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
          accessible,
          comment: cc.toString(),
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
