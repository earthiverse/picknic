#!/usr/bin/python2

#
# This script will download the latest data from the City of Edmonton 'trees' dataset and replace our 'trees' dataset
# with that one.
#

import json
import pymongo
import urllib

desired_columns = ["LOCATION_TYPE", "LATITUDE", "LONGITUDE", "CONDITION_PERCENT", "DIAMETER_BREAST_HEIGHT",
 "SPECIES_COMMON"]

# Get trees database and throw it in to a JSON object
print("Downloading & parsing 'trees' dataset...")
trees_url = urllib.urlopen("https://data.edmonton.ca/api/views/eecg-fc54/rows.json?accessType=DOWNLOAD")
#trees_file = open('trees.json', 'r')
obj = json.load(trees_url)
#obj = json.load(trees_file)

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
trees = db.trees

# Clear all existing trees
print("Removing existing 'trees' data...")
trees.delete_many({})

# Add all the trees
print("Adding 'trees' data...")
num_trees = 0
for tree in obj["data"]:
  location_type = tree[columns["LOCATION_TYPE"]]
  latitude = tree[columns["LATITUDE"]]
  longitude = tree[columns["LONGITUDE"]]
  condition_percent = tree[columns["CONDITION_PERCENT"]]
  diameter_breast_height = tree[columns["DIAMETER_BREAST_HEIGHT"]]
  species_common = tree[columns["SPECIES_COMMON"]]

  try:
    tree = {
      "location_type" : location_type,
      "location" : [ float(latitude), float(longitude) ],
      "condition_percent" : int(condition_percent),
      "diameter_breast_height" : int(diameter_breast_height),
      "species_common" : species_common
    }
    trees.insert(tree)
    num_trees += 1
  except:
    print("Could not add tree: ", location_type, latitude, longitude, condition_percent, diameter_breast_height,
     species_common)

  if num_trees % 50000 == 0:
    print str(num_trees) + " trees added!"

print str(num_trees) + " trees added!"
