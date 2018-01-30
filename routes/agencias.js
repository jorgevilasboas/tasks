var express = require("express");
var router  = express.Router();
var Agencia = require("../models/agencia");
var Atividade = require("../models/atividade");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var { isLoggedIn, checkUserAgencia, checkUserAtividade, isAdmin, isSafe } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

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
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
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
            req.flash('error', 'Sorry, that agencia does not exist!');
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
            req.flash('error', 'Sorry, that agencia does not exist!');
            return res.redirect('/agencias');
        }
        foundAgencia.atividades.forEach(element => {
            element.url = "/agencias/" + req.params.id + "/atividades/" + element._id + "/edit";
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
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, location: location, lat: lat, lng: lng};
    Agencia.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, agencia){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
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
            res.redirect('/agencias');
          });
      }
    })
});

module.exports = router;

