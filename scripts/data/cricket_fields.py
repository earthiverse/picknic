#!/usr/bin/python2

#
# This script will download the latest data from the City of Edmonton 'cricket fields' dataset and replace our
# 'cricket fields' dataset with that one.
#

import json
import pymongo
import urllib

desired_columns = ["NAME", "LENGTH", "WIDTH", "LATITUDE", "LONGITUDE"]

# Get cricket_fields database and throw it in to a JSON object
print("Downloading & parsing 'cricket fields' dataset...")
cricket_fields_url = urllib.urlopen("https://data.edmonton.ca/api/views/8svr-ivxz/rows.json?accessType=DOWNLOAD")
#cricket_fields_file = open('cricket fields.json', 'r')
obj = json.load(cricket_fields_url)
#obj = json.load(cricket_fields_file)

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
cricket_fields = db.cricket_fields

# Clear all existing cricket_fields
print("Removing existing 'cricket fields' data...")
cricket_fields.delete_many({})

# Add all the cricket_fields
print("Adding 'cricket fields' data...")
num_cricket_fields = 0
for cricket_field in obj["data"]:
  name = cricket_field[columns["NAME"]]
  latitude = cricket_field[columns["LATITUDE"]]
  longitude = cricket_field[columns["LONGITUDE"]]
  length = cricket_field[columns["LENGTH"]]
  width = cricket_field[columns["WIDTH"]]

  try:
    cricket_field = {
      "name" : name,
      "location" : [ float(longitude), float(latitude) ],
      "length" : length,
      "width" : width
    }
    cricket_fields.insert(cricket_field)
    num_cricket_fields += 1
  except:
    print("Could not add cricket_field: ", name, address, latitude, longitude, length, width)

print str(num_cricket_fields) + " cricket_fields added!"
