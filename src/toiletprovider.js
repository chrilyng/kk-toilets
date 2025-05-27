var MongoClient = require('mongodb').MongoClient,
    ToiletDocuments = require('../data/kk-toilets-array').ToiletDocuments,
    ToiletTypes = require('../data/kk-toilets-types').ToiletTypes;


ToiletProvider = function() {
  var that = this;
  mongodbUri = process.env.PROD_MONGODB /*MONGOLAB_URI*/ || 'mongodb://localhost/kktoiletslocater_dev';
  MongoClient.connect(mongodbUri, function(err, db){
    if(err) { return console.dir(err); }
    that.db = db;
/*    var typeCollectionMigration = function() {
      that.removeTypesCollection(that.createTypesCollection(that.loadTypesCollection(
      function(error) {         
        if(error) { return console.dir(error); }
        else console.log("Types loaded"); 
      })));
    };
    that.removeToiletsCollection(that.createCollection(that.loadToiletsCollection(
      function(error) {         
        if(error) { return console.dir(error); }
        else {
          console.log("Toilets loaded"); 
          typeCollectionMigration();
        }
      }
    )));
*/
  })
};

ToiletProvider.prototype.createCollection= function(callback) {
  this.db.createCollection("toilets", function(error) {
    if( error ) callback(error)
    else callback
  });
};

ToiletProvider.prototype.createTypesCollection= function(callback) {
  this.db.createCollection("toilettypes", function(error) {
    if( error ) callback(error)
    else callback
  });
};
ToiletProvider.prototype.getCollection= function(callback) {
  this.db.collection('toilets', function(error, toilet_collection) {
    if( error ) callback(error);
    else callback(null, toilet_collection);
  });
};

ToiletProvider.prototype.getTypeCollection= function(callback) {
  this.db.collection('toilettypes', function(error, toilet_types_collection) {
    if( error ) callback(error);
    else callback(null, toilet_types_collection);
  });
};

ToiletProvider.prototype.getTimeCollection= function(callback) {
  this.db.collection('toiletopens', function(error, toilet_times_collection) {
    if( error ) callback(error);
    else callback(null, toilet_times_collection);
  });
};
ToiletProvider.prototype.findAll = function(query, callback) {
    this.getCollection(function(error, toilet_collection) {
      if( error ) callback(error)
      else {
        toilet_collection.find(query).limit(10).toArray(function(error, results) {
          if( error ) callback(error)
          else {
            console.log(results.length);
            callback(null, results);
          }
        });
      }
    });
};
ToiletProvider.prototype.findNearby = function(coor, callback) {
    this.getCollection(function(error, toilet_collection) {
      if( error ) callback(error)
      else {
        toilet_collection.find( { geometry: { $near: { $geometry: { type: "Point" , coordinates: coor }, $maxDistance:1000}}}).toArray(function(error, result) {
           if( error ) callback(error)
           else {
             callback(null, result);
           }
         });
      }
    });
};

ToiletProvider.prototype.findByType = function(page, type_query, district_query, time_query, callback) {
    var thisToiletProvider = this;
    var time_results;

    var toiletCollectionQuery = function(error, type_results) {
        thisToiletProvider.getCollection(function(error, toilet_collection) {
          if( error ) callback(error)
          else {
              var type_results_filtered = [];
              for(i = 0; i<type_results.length; i++) {
                type_results_filtered.push(type_results[i].toilet_type);
              }
              var time_results_filtered = [];
              for(j = 0; j<time_results.length; j++) {
                time_results_filtered.push(time_results[j].tidsperiode);
              }
              var query_obj = {};
              if(type_results.length > 0 && type_query) 
				 query_obj['properties.toilet_type'] = { $in: type_results_filtered };
              if(district_query)
				 query_obj['properties.bydel'] = district_query;
              if(time_results.length>0 && time_query)
                 query_obj['properties.toilet_aaben_tid'] = { $in: time_results_filtered };
              var paged_query = function(res_per_page, res_pages) {
                var pages_count = res_pages;
                toilet_collection.find(query_obj,{type: 0}).skip(res_per_page*page).limit(res_per_page).toArray(function(error, results) {
                  if( error ) callback(error)
                  else callback(null,results, pages_count);
                });
              }
              var per_page = 10;
              var totalcount = 0;
              toilet_collection.find(query_obj).count(function(error, count) {
                totalcount = count;
                query_pages = Math.ceil(totalcount/per_page);
                paged_query(per_page, query_pages);
              });
              
          }
        });
      };

    var toiletTypeQuery = function(error, time_results_cb) { 
      time_results = time_results_cb;
      thisToiletProvider.getTypeCollection(function(error, toilet_type_collection) {
        toilet_type_collection.find({gruppe: type_query},{gruppe: 0, _id: 0}).toArray(toiletCollectionQuery);
      });
    }
    this.getTimeCollection(function(error, toilet_time_collection) {
      toilet_time_collection.find({gruppe: time_query},{gruppe: 0, _id: 0}).toArray(toiletTypeQuery);
    });
};

ToiletProvider.prototype.bydelSelector = function(callback) {
    this.getCollection(function(error, toilet_collection) {
      if( error ) callback(error)
      else {
        toilet_collection.aggregate([{$group: {_id: '$properties.bydel'}}, { $sort : { _id: 1 } } ]).toArray(function(error, results) {
          if( error ) callback(error)
          else {
            callback(null, results);
          }
        });
      }
    });
};

ToiletProvider.prototype.typeSelector = function(callback) {
    this.getTypeCollection(function(error, toilet_types_collection) {
      if( error ) callback(error)
      else {
        toilet_types_collection.aggregate([{$group: {_id: '$gruppe'}},  { $sort : { _id: 1 } }]).toArray(function(error, results) {
          if( error ) callback(error)
          else {
            callback(null, results);
          }
        });
      }
    });
};

ToiletProvider.prototype.timeSelector = function(callback) {
    this.getTimeCollection(function(error, toilet_times_collection) {
      if( error ) callback(error)
      else {
        toilet_times_collection.aggregate([{$group: {_id: '$gruppe'}},  { $sort : { _id: 1 } }]).toArray(function(error, results) {
          if( error ) callback(error)
          else {
            callback(null, results);
          }
        });
      }
    });
};
ToiletProvider.prototype.findById = function(id, callback) {
    this.getCollection(function(error, toilet_collection) {
      if( error ) callback(error)
      else {
        toilet_collection.findOne({_id: toilet_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};

ToiletProvider.prototype.removeToiletsCollection = function(callback) {
    this.getCollection(function(error, toilet_collection) {
      if( error ) callback(error)
      else {
        toilet_collection.remove(function(error, result) {
          if( error ) callback(error) 
          else callback
        });
      }
     });
};
ToiletProvider.prototype.removeTypesCollection = function(callback) {
    this.getTypeCollection(function(error, toilet_collection) {
      if( error ) callback(error)
      else {
        toilet_collection.remove(function(error, result) {
          if( error ) callback(error) 
          else callback
        });
      }
     });
};
ToiletProvider.prototype.loadToiletsCollection = function(callback) {
    this.getCollection(function(error, toilet_collection) {
      if( error ) callback(error)
      else {
        var createIndex = function() {
          toilet_collection.createIndex( { geometry : "2dsphere" }, function(error) {
            if( error ) callback(error)
            else callback()
          } );
        }
        toilet_collection.insert(ToiletDocuments, function(error) {
          if( error ) callback(error)
          else createIndex()
        });
      }
    });
};
ToiletProvider.prototype.loadTypesCollection = function(callback) {
    this.getTypeCollection(function(error, toilet_collection) {
      if( error ) callback(error)
      else {
        toilet_collection.insert(ToiletTypes, function(error, results) {
      if( error ) callback(error)
      else {
           callback();
          }
        });
      }
   });
};
exports.ToiletProvider = ToiletProvider;
