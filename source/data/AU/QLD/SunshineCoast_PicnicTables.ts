import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Sunshine Coast Council Open Data";
const dsName = "Picnic Tables";
const humanURL = "https://data.sunshinecoast.qld.gov.au/dataset/Picnic-Tables/emjg-3ene";
const dsURL = "https://data.sunshinecoast.qld.gov.au/api/views/emjg-3ene/rows.csv?accessType=DOWNLOAD";
const licenseName = "Creative Commons Attribution 3.0 Australia";
const licenseURL = "https://creativecommons.org/licenses/by/3.0/au/deed.en";

// Regular Expression for Location
const regex = new RegExp(/([\d\.-]+),\s([\d\.-]+)/);

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const match: RegExpExecArray = regex.exec(data.SHAPE);
    const lat: number = parseFloat(match[1]);
    const lng: number = parseFloat(match[2]);

    const objectID = data.OBJECTID;

    const status: string = data.Status;
    if (status === "Disposed") { continue; } // Skip here if the asset is disposed.

    let comment: string = "";
    let originalComments: string = data.Comments;
    originalComments = originalComments.trim();
    if (originalComments) {
      comment = "Original comment from dataset: \"" + originalComments + "\".";
    }
    let locationDescription: string = data.LocationDesc;
    locationDescription = locationDescription.trim();
    if (locationDescription) {
      comment += " Location description from dataset: \"" + locationDescription + "\".";
    }
    const owner: string = data.Owner;
    if (owner) {
      comment += " Owned by " + owner + ".";
    }
    const manager: string = data.AssetManager;
    if (manager) {
      comment += " Managed by " + manager + ".";
    }
    const maintainer: string = data.MaintainedBy;
    if (maintainer) {
      comment += " Maintained by " + maintainer + ".";
    }
    const condition: string = data.Condition;
    if (condition && condition !== "Not Assessed") {
      comment += " Condition (1-5, lower is better): " + condition + ".";
    }
    let conditionComments: string = data.ConditionComments;
    conditionComments = conditionComments.trim();
    if (conditionComments) {
      comment += " Condition comments from dataset: \"" + conditionComments + "\".";
    }
    const subType: string = data.AssetSubType;
    if (subType === "Fish Cleaning") { continue; } else if (subType) {
      comment += " Table style: " + subType + ".";
    }
    const seatType: string = data.SeatType;
    if (seatType) {
      comment += " Seat type: " + seatType + ".";
    }
    const tableMaterial: string = data.TableMaterial;
    if (tableMaterial) {
      comment += " Table material: " + tableMaterial + ".";
    }
    const tableFinish: string = data.TableFinishCoating;
    if (tableFinish) {
      comment += " Table finish: " + tableFinish + ".";
    }
    const mountingType: string = data.MountingType;
    if (mountingType) {
      comment += " Mounting type: " + mountingType + ".";
    }
    const manufacturer: string = data.Manufacturer;
    if (manufacturer) {
      comment += " Manufacturer: " + manufacturer + ".";
    }
    const length: string = data.Length_m;
    if (length) {
      comment += " Length: " + length + "m.";
    }
    const remainingLife: string = data.RemLife;
    if (remainingLife) {
      comment += " Remaining life: " + remainingLife + ".";
    }
    let equalAccess: any = data.EqualAccess;
    if (equalAccess === "No") {
      equalAccess = false;
    } else if (equalAccess === "Yes") {
      equalAccess = true;
    } else {
      equalAccess = undefined;
    }
    let sheltered: any = data.Sheltered;
    if (sheltered === "No") {
      sheltered = false;
    } else if (sheltered === "Yes") {
      sheltered = true;
    } else {
      sheltered = undefined;
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.accessible": equalAccess,
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.sheltered": sheltered,
          "properties.source.dataset": dsName,
          "properties.source.id": objectID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": humanURL,
          "properties.type": "table",
          "type": "Feature",
        },
      }, {
        upsert: true,
      }).exec();
    numOps += 1;
  }

  // Remove old tables from this data source
  await Picnic.deleteMany({
    "properties.source.dataset": dsName,
    "properties.source.name": sourceName,
    "properties.source.retrieved": { $lt: retrieved },
  }).lean().exec();
  numOps += 1;

  return numOps;
});
