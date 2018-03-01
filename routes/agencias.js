var express = require("express");
var router  = express.Router();
var Agencia = require("../models/agencia");
var Atividade = require("../models/atividade");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyDinjRMvDF5NiwP_krdMj1VYDHw_3b7whE'
  });
var { isLoggedIn, checkUserAgencia, checkUserAtividade, isAdmin, isSafe } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

router.get("/teste", function(req, res){
      // Geocode an address.
googleMapsClient.geocode({
    address: 'Lagarto, Sergipe'
  }, function(err, response) {
    if (!err) {
      console.log(response.json.results);
      res.send(response.json.results)
    }
    else {
        console.log(err);
        res.send(err);
    }
  });
});

//INDEX - show all agencias
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all agencias from DB
      Agencia.find({name: regex}, function(err, allAgencias){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allAgencias);
         }
      });
  } else {
      // Get all agencias from DB
      Agencia.find({}, function(err, allAgencias){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allAgencias);
            } else {
              res.render("agencias/index",{agencias: allAgencias, page: 'agencias'});
            }
         }
      });
  }
});

//CREATE - add new agencia to DB
router.post("/", isLoggedIn, isSafe, function(req, res){
  // get data from form and add to agencias array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || data.status === 'ZERO_RESULTS') {
      req.flash('error', 'Endereço Inválido');
      return res.redirect('back');
    }
    console.log(data.results[0]);
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newAgencia = {name: name, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
    // Create a new agencia and save to DB
    Agencia.create(newAgencia, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to agencias page
            console.log(newlyCreated);
            res.redirect("/agencias");
        }
    });
  });
});

//NEW - show form to create new agencia
router.get("/new", isLoggedIn, function(req, res){
   res.render("agencias/new"); 
});

// SHOW - shows more info about one agencia
router.get("/:id", function(req, res){
    var atividades = [];
    //find the agencia with provided ID
    Agencia.findById(req.params.id).populate("atividades").exec(function(err, foundAgencia){
        if(err || !foundAgencia){
            console.log(err);
            req.flash('error', 'Desculpe, essa agência não existe.');
            return res.redirect('/agencias');
        }
        console.log(foundAgencia)
        //render show template with that agencia
        res.render("agencias/show", {agencia: foundAgencia, atividades: atividades});
    });
});

router.get("/:id/atividades", function(req, res){   
    //find the agencia with provided ID
    Agencia.findById(req.params.id).populate("atividades").exec(function(err, foundAgencia){
        if(err || !foundAgencia){
            console.log(err);
            req.flash('error', 'Desculpe, essa agência não existe.');
            return res.redirect('/agencias');
        }
        foundAgencia.atividades.forEach(element => {
            element.url = "/agencias/" + req.params.id + "/atividades/" + element._id + "/edit";            
            /*if (element.km != 0 ){
                console.log(element.km);
                element.color = 'red';
            }*/
        });
        //render show template with that agencia
        res.send(foundAgencia.atividades);
    });
});

// EDIT - shows edit form for a agencia
router.get("/:id/edit", isLoggedIn, checkUserAgencia, function(req, res){
  //render edit template with that agencia
  res.render("agencias/edit", {agencia: req.agencia});
});

// PUT - updates agencia in the database
router.put("/:id", isSafe, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || data.status === 'ZERO_RESULTS') {
        req.flash('error', 'Endereço Inválido');
        return res.redirect('back');
    }
    if (!data && !data.results) {
        req.flash('error', 'Não foi possivel obter o endereço. Tente novamente mais tarde.');
        return res.redirect('back');
    }    
    
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, location: location, lat: lat, lng: lng};
    Agencia.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, agencia){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Atualizado com sucesso!");
            res.redirect("/agencias/" + agencia._id);
        }
    });

  });
});

// DELETE - removes agencia and its atividades from the database
router.delete("/:id", isLoggedIn, checkUserAgencia, function(req, res) {
    Atividade.remove({
      _id: {
        $in: req.agencia.atividades
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.agencia.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Agencia removida com sucesso!');            
            res.redirect('/agencias/');
          });
      }
    })
});

// Relatorios
router.get("/:id/relatorios", function(req, res){
    var filter = 'atividades';
    var name = req.body.name;
    filter = { path: 'atividades',                   
                   match: { fields: { $in: [ new RegExp(name, "i") ] } },
                   options: {sort:{start: "ascending"}}
                  }
    var atividades = [];
    //find the agencia with provided ID
    Agencia.findById(req.params.id).populate(filter).exec(function(err, foundAgencia){
        if(err || !foundAgencia){
            console.log(err);
            req.flash('error', 'Desculpe, essa agência não existe.');
            return res.redirect('/agencias');
        }
        console.log(foundAgencia)
        //render show template with that agencia
        res.render("agencias/relatorios", {agencia: foundAgencia, atividades: atividades});
    });
});

router.post("/:id/relatorios", function (req, res) {    
    var filter = 'atividades';
    var name = req.body.name;
    var start = req.body.start;
    var end = req.body.end;
    var filterStart = new Date(start.substr(0,4), start.substr(5,2) - 1, start.substr(8,2) , 0, 0, 0, 0);
    var filterEnd = new Date(end.substr(0,4), end.substr(5,2) -1, end.substr(8,2) , 23, 59, 59, 999);
    //start.setHours(0,0,0,0);
    
    //end.setHours(23,59,59,999);
    console.log('end: ', end);
    if (start != '') {
        filter = { path: 'atividades',                   
                   match: { fields: { $in: [ new RegExp(name, "i") ] },
                            start: {$gte: filterStart, $lte: filterEnd}                            
                         },                            
                   options: {sort:{start: "ascending"}}
                  }
    } else {
        filter = { path: 'atividades',                   
                   match: { fields: { $in: [ new RegExp(name, "i") ] } },
                   options: {sort:{start: "ascending"}}
                  }
    }
    //find the agencia with provided ID  
    Agencia.findById(req.params.id).populate(filter).exec(function (err, foundAgencia) {
        if (err || !foundAgencia) {
            console.log(err);
            req.flash('error', 'Desculpe, essa agência não existe.');
            return res.redirect('/agencias');
        }

        //render show template with that agencia
        res.render("agencias/relatorios", { agencia: foundAgencia, name: name, start: start, end: end });
    });
});


module.exports = router;

