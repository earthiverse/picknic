#!/usr/bin/python2

#
# This script will download the latest data from the City of Edmonton 'tennis courts' dataset and replace our
# 'tennis courts' dataset with that one.
#

import json
import pymongo
import urllib

desired_columns = ["NAME", "LATITUDE", "LONGITUDE"]

# Get 'tennis courts' database and throw it in to a JSON object
print("Downloading & parsing 'tennis courts' dataset...")
tennis_courts_url = urllib.urlopen("https://data.edmonton.ca/api/views/jyra-si4k/rows.json?accessType=DOWNLOAD")
#tennis_courts_file = open('tennis_courts.json', 'r')
obj = json.load(tennis_courts_url)
#obj = json.load(tennis_courts_file)

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
tennis_courts = db.tennis_courts

# Clear all existing tennis courts
print("Removing existing 'tennis courts' data...")
tennis_courts.delete_many({})

# Add all the tennis courts
print("Adding 'tennis courts' data...")
num_tennis_courts = 0
for tennis_court in obj["data"]:
  name = tennis_court[columns["NAME"]]
  latitude = tennis_court[columns["LATITUDE"]]
  longitude = tennis_court[columns["LONGITUDE"]]

  try:
    tennis_court = {
      "name" : name,
      "location" : [ float(longitude), float(latitude) ]
    }
    tennis_courts.insert(tennis_court)
    num_tennis_courts += 1
  except:
    print("Could not add tennis court: ", name, address, latitude, longitude)

print str(num_tennis_courts) + " tennis courts added!"
