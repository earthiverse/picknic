import { CommentCreator } from "../../CommentCreator";
import { Downloader } from "../../Downloader";

export const downloader = new Downloader(
  "Edmonton Open Data Portal",
  "https://data.edmonton.ca/Facilities-and-Structures/Public-Picnic-Table-Locations/vk3s-q842",
  "Public Picnic Table Locations",
  "https://data.edmonton.ca/resource/9n58-dubd.json?$limit=50000&$select=location,table_type,surface_material,structural_material,id",
  "City of Edmonton Open Data Terms of Use (Version 2.1)",
  "http://www.edmonton.ca/city_government/documents/Web-version2.1-OpenDataAgreement.pdf");

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return await downloader.parse(
    async (data: any) => {
      const geometry = data.location;
      const type = data.table_type;
      const surface = data.surface_material;
      const structural = data.structural_material;
      const id = data.id;

      const cc = new CommentCreator();
      if (type === "other table") {
        cc.add(`A ${type}`);
      }
      if (structural) {
        if (surface) {
          cc.add(`made from ${structural.toLowerCase()} and ${surface.toLowerCase()}`);
        } else {
          cc.add(`made from ${structural.toLowerCase()}`);
        }
      } else if (surface) {
        cc.add(`made from ${surface.toLowerCase()}`);
      }

      return await downloader.addTable({
        geometry,
        properties: {
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
