#!/usr/bin/python2

#
# This script will download the latest data from the City of Edmonton 'parklands' dataset and replace our 'parklands'
# dataset with that one.
#

import json
import pymongo
import urllib

# Get' parklands' database and throw it in to a JSON object
print("Downloading & parsing 'parklands' dataset...")
parklands_url = urllib.urlopen("https://data.edmonton.ca/api/geospatial/9jq5-psax?method=export&format=GeoJSON")
#parklands_file = open('parkland.json', 'r')
obj = json.load(parklands_url)
#obj = json.load(parklands_file)

# Get indexes
columns = {}
column_number = 0

# Set Up Mongo Connection
mongo = pymongo.MongoClient()
db = mongo.picknic
parklands = db.parkland

# Clear all existing parkland
print("Removing existing 'parkland' data...")
parklands.delete_many({})

# Add all the parklands
print("Adding 'parkland' data...")
num_parklands = 0
for parkland in obj["features"]:
  common_name = parkland["properties"]["common"]
  official_name = parkland["properties"]["official"]
  address = parkland["properties"]["address"]
  geometry = parkland["geometry"]

  try:
    parkland = {
      "common_name" : common_name,
      "official_name" : official_name,
      "address" : address,
      "geometry" : geometry,
    }
    parklands.insert(parkland)
    num_parklands += 1
  except:
    print("Could not add parkland: ", common_name, official_name, address, geometry)

print str(num_parklands) + " parklands added!"
