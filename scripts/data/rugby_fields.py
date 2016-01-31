#!/usr/bin/python2

#
# This script will download the latest data from the City of Edmonton 'rugby fields' dataset and replace our
# 'rugby fields' dataset with that one.
#

import json
import pymongo
import urllib

desired_columns = ["NAME", "OWNER", "WIDTH", "LENGTH", "LATITUDE", "LONGITUDE"]

# Get rugby_fields database and throw it in to a JSON object
print("Downloading & parsing 'rugby fields' dataset...")
rugby_fields_url = urllib.urlopen("https://data.edmonton.ca/api/views/692u-9tuj/rows.json?accessType=DOWNLOAD")
#rugby_fields_file = open('rugby fields.json', 'r')
obj = json.load(rugby_fields_url)
#obj = json.load(rugby_fields_file)

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
rugby_fields = db.rugby_fields

# Clear all existing rugby_fields
print("Removing existing 'rugby fields' data...")
rugby_fields.delete_many({})

# Add all the rugby_fields
print("Adding 'rugby fields' data...")
num_rugby_fields = 0
for rugby_field in obj["data"]:
  name = rugby_field[columns["NAME"]]
  owner = rugby_field[columns["OWNER"]]
  latitude = rugby_field[columns["LATITUDE"]]
  longitude = rugby_field[columns["LONGITUDE"]]
  length = rugby_field[columns["LENGTH"]]
  width = rugby_field[columns["WIDTH"]]

  try:
    rugby_field = {
      "name" : name,
      "owner" : owner,
      "location" : [ float(longitude), float(latitude) ],
      "length" : length,
      "width" : width
    }
    rugby_fields.insert(rugby_field)
    num_rugby_fields += 1
  except:
    print("Could not add rugby field: ", name, address, latitude, longitude, length, width)

print str(num_rugby_fields) + " rugby fields added!"
