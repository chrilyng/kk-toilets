/**
 * Module dependencies.
 */
require('dotenv').config();

var express = require('express')
  , path = require('path')
  , ToiletProvider = require('./toiletprovider').ToiletProvider
;

var app = express();

var toiletProvider= new ToiletProvider();
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'pug');
  app.set('view options', {layout: false});
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.enable('trust proxy');

});


app.configure('development', function(){
  app.use(express.errorHandler());
});


//Routes
app.get('/', function(req, res){
  toiletProvider.timeSelector(function(error, tims){
  toiletProvider.bydelSelector(function(error, byls){
    byls.splice(0,1);      
    toiletProvider.typeSelector(function(error, typs){
    var paging = function(page,req_sub, res_sub) { 
	  var selectedType = req_sub.param('type');
	  var selectedRegion = req_sub.param('bydel');
	  var selectedTime = req_sub.param('tid');
      toiletProvider.findByType(page, selectedType, selectedRegion, selectedTime
        ,function(error, tois, query_pages){
        page_links = [];
        active_page = parseInt(page)+1;
        for(i=0; i<query_pages; i++) {
          plink = "/?page="+i;
          if(selectedType!=null) {
            plink += "&type="+selectedType;
          }
          if(selectedRegion!=null) {
            plink += "&bydel="+selectedRegion
          } 
          if(selectedTime!=null) {
            plink += "&tid="+selectedTime
          }
          page_links.push({page_no:i+1, page_link:plink});
        }
		var toiletResults = tois;
		if (!toiletResults)
			toiletResults = [];
        res.render('index', {
            title: 'Toiletter',
            toilets:toiletResults,
            times:tims,
            bydels:byls,
            ttyps:typs,
            pages:page_links,
            active:active_page,
			selected_type:selectedType,
			selected_region:selectedRegion,
			selected_time:selectedTime,
			
        });
      });
    }
    if(req.param('page')!=null) paging(req.param('page'), req, res)
    else paging(0, req, res)
    });
  });
  });
});

app.get('/toilet', function(req, res){
  toiletProvider.timeSelector(function(error, tims){
  toiletProvider.bydelSelector(function(error, byls){
    byls.splice(0,1);      
    toiletProvider.typeSelector(function(error, typs){
    var paging = function(page,req_sub, res_sub) { 
      toiletProvider.findByType(page, req_sub.param('type'), req_sub.param('bydel'), req_sub.param('tid')
        ,function(error, tois, query_pages){
        page_links = [];
        for(i=0; i<query_pages; i++) {
          plink = "/?page="+i;
          if(req_sub.param('type')!=null) {
            plink += "&type="+req_sub.param('type');
          }
          if(req_sub.param('bydel')!=null) {
            plink += "&bydel="+req_sub.param('bydel')
          } 
          if(req_sub.param('tid')!=null) {
            plink += "&tid="+req_sub.param('tid')
          } 
          page_links.push({page_no:i+1, page_link:plink});
        }
        res.send(200,tois);
      });
    }
    if(req.param('page')!=null) paging(req.param('page'), req, res)
    else paging(0, req, res)
    });
  });
  });
});

app.get('/bydele', function(req, res){
  toiletProvider.bydelSelector(function(error, byls){
    if (error) {
      console.log(error);
      res.send(400);
    }
    //remove null value
    byls.splice(0,1);      
    res.send(200,byls);
  });
});

app.get('/typer', function(req, res){
  toiletProvider.typeSelector(function(error, typs){
    if (error) {
      console.log(error);
      res.send(400);
    }
    res.send(200,typs);
  });
});

app.get('/tider', function(req, res){
  toiletProvider.timeSelector(function(error, typs){
    if (error) {
      console.log(error);
      res.send(400);
    }
    res.send(200,typs);
  });
});

app.get('/nearby', function(req, res){
  toiletProvider.findNearby([ 12.563557100425985,  55.7220095532857 ], function(error, typs){
    if (error) {
      console.log(error);
      res.send(400);
    }
    res.send(200,typs);
  });
});

app.listen(process.env.PORT || 3000);
