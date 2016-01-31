#!/usr/bin/python2

#
# This script will download the latest data from the City of Edmonton 'playgrounds' dataset and replace our 'playgrounds' dataset
# with that one.
#

import json
import pymongo
import urllib

desired_columns = ["NAME", "LATITUDE", "LONGITUDE"]

# Get playgrounds database and throw it in to a JSON object
print("Downloading & parsing 'playgrounds' dataset...")
playgrounds_url = urllib.urlopen("https://data.edmonton.ca/api/views/9nqb-w48x/rows.json?accessType=DOWNLOAD")
#playgrounds_file = open('playgrounds.json', 'r')
obj = json.load(playgrounds_url)
#obj = json.load(playgrounds_file)

# Get indexes
columns = {}
column_number = 0
for column in obj["meta"]["view"]["columns"]:
  # DEBUG
  column_name = column["name"]
  if column_name in desired_columns:
    print column_name
    columns[column_name] = column_number
  column_number += 1

# Set Up Mongo Connection
mongo = pymongo.MongoClient()
db = mongo.picknic
playgrounds = db.playgrounds

# Clear all existing playgrounds
print("Removing existing 'playgrounds' data...")
playgrounds.delete_many({})

# Add all the playgrounds
print("Adding 'playgrounds' data...")
num_playgrounds = 0
for playground in obj["data"]:
  name = playground[columns["NAME"]]
  latitude = playground[columns["LATITUDE"]]
  longitude = playground[columns["LONGITUDE"]]

  try:
    playground = {
      "name" : name,
      "location" : [ float(latitude), float(longitude) ]
    }
    playgrounds.insert(playground)
    num_playgrounds += 1
  except:
    print("Could not add playground: ", name, address, latitude, longitude)

print str(num_playgrounds) + " playgrounds added!"
