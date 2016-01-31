#!/usr/bin/python2

#
# This script will download the latest data from the City of Edmonton 'baseball fields' dataset and replace our
# 'baseball fields' dataset with that one.
#

import json
import pymongo
import urllib

desired_columns = ["NAME", "LENGTH", "FIELD_NUMBER", "LATITUDE", "LONGITUDE"]

# Get baseball_fields database and throw it in to a JSON object
print("Downloading & parsing 'baseball fields' dataset...")
baseball_fields_url = urllib.urlopen("https://data.edmonton.ca/api/views/6mre-4inz/rows.json?accessType=DOWNLOAD")
#baseball_fields_file = open('baseball fields.json', 'r')
obj = json.load(baseball_fields_url)
#obj = json.load(baseball_fields_file)

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
baseball_fields = db.baseball_fields

# Clear all existing baseball_fields
print("Removing existing 'baseball fields' data...")
baseball_fields.delete_many({})

# Add all the baseball_fields
print("Adding 'baseball fields' data...")
num_baseball_fields = 0
for baseball_field in obj["data"]:
  name = baseball_field[columns["NAME"]]
  field_number = baseball_field[columns["FIELD_NUMBER"]]
  latitude = baseball_field[columns["LATITUDE"]]
  longitude = baseball_field[columns["LONGITUDE"]]
  length = baseball_field[columns["LENGTH"]]

  try:
    baseball_field = {
      "name" : name,
      "field_number" : field_number,
      "location" : [ float(longitude), float(latitude) ],
      "length" : length,
    }
    baseball_fields.insert(baseball_field)
    num_baseball_fields += 1
  except:
    print("Could not add baseball field: ", name, address, latitude, longitude, length, width)

print str(num_baseball_fields) + " baseball fields added!"
