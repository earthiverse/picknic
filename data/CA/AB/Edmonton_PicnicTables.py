#!/usr/bin/python3
#
# ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
# ▒▒▒▒▒       ▒▒▒▒▒
# ▒▒▒▒   ▒▒▒   ▒▒▒▒
# ▒▒▒▒   ▒▒▒   ▒▒▒▒
# ▒▒▒▒▒       ▒▒▒▒▒
# ▒▒▒▒▒▒     ▒▒▒▒▒▒
# ▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒
# ▒▒░░  ░░  ░░  ░▒▒
# ▒▒▓▓▒▒▓▓▒▒▓▓▒▒▓▒▒
#

import codecs
import csv
import datetime
import pymongo
import urllib.request

# Important Fields
source_name = 'Edmonton Open Data Portal'
dataset_name = 'Public Picnic Table Locations'
dataset_url_human = 'https://data.edmonton.ca/Facilities-and-Structures/Public-Picnic-Table-Locations/vk3s-q842'
dataset_url_csv = "https://data.edmonton.ca/api/views/vk3s-q842/rows.csv?accessType=DOWNLOAD"
license = 'http://www.edmonton.ca/city_government/documents/Web-version2.1-OpenDataAgreement.pdf'

# Print Info
print("Source: {0}".format(source_name))
print("Dataset: {0}".format(dataset_name))

# Setup MongoDB
client = pymongo.MongoClient()
db = client.picknic

# Remove all tables related to this dataset
result = db.tables.delete_many({'properties.dataset_name': dataset_name, 'properties.source_name': source_name})
print("  Removed {0} tables".format(result.deleted_count))

# Parse CSV & add to table collection
stream = urllib.request.urlopen(dataset_url_csv)
data = csv.DictReader(codecs.iterdecode(stream, 'utf-8'))
num_tables = 0
for table in data:
  # Setup Table Data
  table_data = {
    "type": "Feature",
    "properties": {
      "license": license,
      "source_name": source_name,
      "dataset_name": dataset_name,
      "source": dataset_url_human,
      "updated": datetime.datetime.utcnow()),
    },
    "geometry": {
      "type": "Point",
      "coordinates": [float(table['Longitude']), float(table['Latitude'])]
    }
  }

  # Comments based on additional data available
  # Shape
  shape = table['Table Type'].lower()
  if shape == "other table":
    comment = "A table"
  else:
    # Some silly vowel checking
    comment = "A " + shape
  # Structural Material
  structural_material = table['Structural Material'].lower()
  comment += " made from " + structural_material
  # Surface Material
  surface_material = table['Surface Material'].lower()
  if surface_material != structural_material:
    comment += " and " + surface_material
  comment += " materials."
  table_data['properties']['comment'] = comment

  # Insert
  db.tables.insert_one(table_data)
  num_tables += 1

print("  Added {0} tables".format(num_tables))
