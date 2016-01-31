#!/usr/bin/python2

#
# This script will download the latest data from the City of Edmonton 'soccer fields' dataset and replace our
# 'soccer fields' dataset with that one.
#

import json
import pymongo
import urllib

desired_columns = ["NAME", "LENGTH", "WIDTH", "FIELD_NUMBER", "LATITUDE", "LONGITUDE"]

# Get soccer_fields database and throw it in to a JSON object
print("Downloading & parsing 'soccer fields' dataset...")
soccer_fields_url = urllib.urlopen("https://data.edmonton.ca/api/views/6avx-8i8e/rows.json?accessType=DOWNLOAD")
#soccer_fields_file = open('soccer fields.json', 'r')
obj = json.load(soccer_fields_url)
#obj = json.load(soccer_fields_file)

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
soccer_fields = db.soccer_fields

# Clear all existing soccer_fields
print("Removing existing 'soccer fields' data...")
soccer_fields.delete_many({})

# Add all the soccer_fields
print("Adding 'soccer fields' data...")
num_soccer_fields = 0
for soccer_field in obj["data"]:
  name = soccer_field[columns["NAME"]]
  field_number = soccer_field[columns["FIELD_NUMBER"]]
  latitude = soccer_field[columns["LATITUDE"]]
  longitude = soccer_field[columns["LONGITUDE"]]
  length = soccer_field[columns["LENGTH"]]
  width = soccer_field[columns["WIDTH"]]

  try:
    soccer_field = {
      "name" : name,
      "field_number" : field_number,
      "location" : [ float(longitude), float(latitude) ],
      "length" : length,
      "width" : width
    }
    soccer_fields.insert(soccer_field)
    num_soccer_fields += 1
  except:
    print("Could not add soccer field: ", name, address, latitude, longitude, length, width)

print str(num_soccer_fields) + " soccer fields added!"
