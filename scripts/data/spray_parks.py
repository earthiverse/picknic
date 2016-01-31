#!/usr/bin/python2

#
# This script will download the latest data from the City of Edmonton 'spray parks' dataset and replace our
# 'spray parks' dataset with that one.
#

import json
import pymongo
import urllib

desired_columns = ["NAME", "ADDRESS", "LATITUDE", "LONGITUDE"]

# Get 'spray parks' database and throw it in to a JSON object
print("Downloading & parsing 'spray parks' dataset...")
spray_parks_url = urllib.urlopen("https://data.edmonton.ca/api/views/jyra-si4k/rows.json?accessType=DOWNLOAD")
#spray_parks_file = open('spray_parks.json', 'r')
obj = json.load(spray_parks_url)
#obj = json.load(spray_parks_file)

# Get indexes
columns = {}
column_number = 0
for column in obj["meta"]["view"]["columns"]:
  # DEBUG
  column_name = column["name"]
  if column_name in desired_columns:
    columns[column_name] = column_number
  column_number += 1

# Set Up Mongo Connection
mongo = pymongo.MongoClient()
db = mongo.picknic
spray_parks = db.spray_parks

# Clear all existing spray parks
print("Removing existing 'spray parks' data...")
spray_parks.delete_many({})

# Add all the spray parks
print("Adding 'spray parks' data...")
num_spray_parks = 0
for spray_park in obj["data"]:
  name = spray_park[columns["NAME"]]
  address = spray_park[columns["ADDRESS"]]
  latitude = spray_park[columns["LATITUDE"]]
  longitude = spray_park[columns["LONGITUDE"]]

  try:
    spray_park = {
      "name" : name,
      "address" : address,
      "location" : [ float(longitude), float(latitude) ]
    }
    spray_parks.insert(spray_park)
    num_spray_parks += 1
  except:
    print("Could not add spray park: ", name, address, latitude, longitude)

print str(num_spray_parks) + " spray parks added!"
