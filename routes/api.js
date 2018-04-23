var passport = require("passport");
var express = require("express");
var router = express.Router();
var Agencia = require("../models/agencia");
var Atividade = require("../models/atividade");
var User = require("../models/user");
var middleware = require("../middleware");
var Promise = require("bluebird");
var geocoder = Promise.promisifyAll(require('geocoder'));
var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyDinjRMvDF5NiwP_krdMj1VYDHw_3b7whE'
});

var auth = require('passport-local-authenticate');

var { isLoggedIn, checkUserAgencia, checkUserAtividade, isAdmin, isSafe, checkToken } = middleware; 
// destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

router.get('/md5', function(req, res){
    var md5 = require('md5');
    User.findById("5a95a144ae89600014d654ac", function(err, foundUser){
        if(err || !foundUser){
            res.send('Desculpe, essa usuario não foi encontrado!')            
        } else {
            foundUser.md5pass = md5('lagarto');
            foundUser.save();
            res.send('senha lagarto salva em md5: ' + md5('lagarto') );
        }
     });


    
});

// LOGIN
router.post('/login', function(req, res){
    var md5 = require('md5');
    const {username, password} = req.body;
    const md5pass = md5(password);


    User.findOne({username, md5pass}, function(err, foundUser){
        if(err || !foundUser){
            res.send({success:false, errorMessage:'Desculpe, esse usuario não foi encontrado!'})
        } else { 
            foundUser.token = foundUser.md5pass;
            foundUser.md5pass = undefined;
            res.send(foundUser);
        }
     });


    
});

router.get("/users", function (req, res) {
    // Get all agencias from DB
    User.find({}, function (err, allUsers) {
        if (err) {
            console.log(err);
        } else {
            res.json(allUsers);
        }
    });
});

// AGENCIAS
//INDEX - show all agencias
router.get("/agencias", function (req, res) {
    // Get all agencias from DB
    Agencia.find({}, function (err, allAgencias) {
        if (err) {
            console.log(err);
        } else {
            res.json(allAgencias);
        }
    });
});

//CREATE - add new agencia to DB
router.post("/agencias", function (req, res) {
    // get data from form and add to agencias array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.body._id,
        username: req.body.username
    }

    var lat, lng = 0;
    var location = "";

    geocoder.geocodeAsync(req.body.location)
    .then(function(data){
        if (data && data.results[0] && data.results[0].geometry){
            lat = data.results[0].geometry.location.lat;
            lng = data.results[0].geometry.location.lng;
            location = data.results[0].formatted_address;      
        } else {
            lat = 0;
            lng = 0;
        }
    });

    var newAgencia = { name: name, image: image, description: desc, author: author, location: location, lat: lat, lng: lng };

    // Create a new agencia and save to DB
    Agencia.create(newAgencia, function (err, newlyCreated) {
        if (err) {
            res.status(401).send({"err": err });
        } else {
            //redirect back to agencias page
            res.send(newlyCreated);            
        }
    });

});

// SHOW - shows more info about one agencia
router.get("/agencias/:id", function (req, res) {
    var atividades = [];
    //find the agencia with provided ID
    Agencia.findById(req.params.id).populate("atividades").exec(function (err, foundAgencia) {
        if (err || !foundAgencia) {
            console.log(err);
            req.flash('error', 'Desculpe, essa agência não existe.');
            return res.redirect('/agencias');
        }
        console.log(foundAgencia)
        //render show template with that agencia
        res.send(foundAgencia);
    });
});

router.get("/:id/atividades", function (req, res) {
    //find the agencia with provided ID
    Agencia.findById(req.params.id).populate("atividades").exec(function (err, foundAgencia) {
        if (err || !foundAgencia) {
            console.log(err);
            req.flash('error', 'Desculpe, essa agência não existe.');
            return res.redirect('/agencias');
        }
        foundAgencia.atividades.forEach(element => {
            element.url = "/agencias/" + req.params.id + "/atividades/" + element._id + "/view";
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
router.get("/:id/edit", isLoggedIn, checkUserAgencia, function (req, res) {
    //render edit template with that agencia
    res.render("agencias/edit", { agencia: req.agencia });
});

// PUT - updates agencia in the database
router.put("/:id", isSafe, function (req, res) {
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
        var newData = { name: req.body.name, image: req.body.image, description: req.body.description, location: location, lat: lat, lng: lng };
        Agencia.findByIdAndUpdate(req.params.id, { $set: newData }, function (err, agencia) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success", "Atualizado com sucesso!");
                res.redirect("/agencias/" + agencia._id);
            }
        });

    });
});

// DELETE - removes agencia and its atividades from the database
router.delete("agencias/:id",  function (req, res) {
    Atividade.remove({
        _id: {
            $in: req.agencia.atividades
        }
    }, function (err) {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/');
        } else {
            req.agencia.remove(function (err) {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('/');
                }
                req.flash('error', 'Agencia removida com sucesso!');
                res.redirect('/agencias/');
            });
        }
    })
});

// Relatorios ------------------------------------
router.get("/:id/relatorios", function (req, res) {
    var filter = 'atividades';
    var name = req.body.name;
    filter = {
        path: 'atividades',
        match: { fields: { $in: [new RegExp(name, "i")] } },
        options: { sort: { end: "ascending" } }
    }
    var atividades = [];
    //find the agencia with provided ID
    Agencia.findById(req.params.id).populate(filter).exec(function (err, foundAgencia) {
        if (err || !foundAgencia) {
            console.log(err);
            req.flash('error', 'Desculpe, essa agência não existe.');
            return res.redirect('/agencias');
        }
        console.log(foundAgencia)
        //render show template with that agencia
        res.render("agencias/relatorios", { agencia: foundAgencia, atividades: atividades });
    });
});

router.post("/:id/relatorios", function (req, res) {
    var title = req.body.title;
    var equipe = req.body.equipe;
    var start = req.body.start;
    var end = req.body.end;
    var car = req.body.car;
    var filterStart = new Date(start.substr(0, 4), start.substr(5, 2) - 1, start.substr(8, 2), 0, 0, 0, 0);
    var filterEnd = new Date(end.substr(0, 4), end.substr(5, 2) - 1, end.substr(8, 2), 23, 59, 59, 999);
    console.log('filterStart', filterStart);
    console.log('filterEnd', filterEnd);

    //start.setHours(0,0,0,0);

    //end.setHours(23,59,59,999);
    filter = {
        path: 'atividades',
        match: {
            fields: { $in: [new RegExp(equipe, "i")] },
            car: { $in: new RegExp(car, "i") },
            title: { $in: new RegExp(title, "i") }
        },
        options: { sort: { end: "ascending" } }
    }

    if (start != '' && end != '') {
        filter.match.start = { $gte: filterStart, $lte: filterEnd };
    }
    //find the agencia with provided ID  
    Agencia.findById(req.params.id).populate(filter).exec(function (err, foundAgencia) {
        if (err || !foundAgencia) {
            console.log(err);
            req.flash('error', 'Desculpe, essa agência não existe.');
            return res.redirect('/agencias');
        }

        //render show template with that agencia
        res.render("agencias/relatorios", { agencia: foundAgencia, equipe: equipe, start: start, end: end, car: car, title: title });
    });
});

// ATIVIDADES

router.post("/:id/atividades", checkToken, function (req, res) {
    //lookup agencia using ID   
    Agencia.findById(req.params.id, function (err, agencia) {
        if (err) {
            console.log(err);
            res.send({success:false, errorMessage:'Agencia não foi encontrada!'})
        } else {
            Atividade.create(req.body.atividade, function (err, atividade) {
                //console.log(req.body.atividade);
                if (err) {
                    console.log(err);
                    res.send({success:false, errorMessage:'Erro ao criar atividade'})
                } else {
                    //add username and id to atividade
                    atividade.author.id = req.body._id;
                    atividade.author.username = req.body.username;
                    //console.log(req.body.atividade);
                    //save atividade
                    atividade.save();
                    agencia.atividades.push(atividade);
                    agencia.save();
                    res.send({atividade});
                }
            });
        }
    });
});

router.put("/:id/atividades/:atividadeId", checkToken, function (req, res) {
    Atividade.findByIdAndUpdate(req.params.atividadeId, req.body.atividade, function (err, atividade) {
        if (err) {            
            res.send({success:false, errorMessage:'Erro ao atualizar atividade'});
        } else {
            res.send({atividade});
        }
    });
});

router.delete("/:id/atividades/:atividadeId", checkToken, function (req, res) {
    // find agencia, remove atividade from atividades array, delete atividade in db
    Agencia.findByIdAndUpdate(req.params.id, {
        $pull: {
            atividades: req.atividade.id
        }
    }, function (err) {
        if (err) {
            console.log(err)
            res.send({success:false, errorMessage:'Erro ao encontar agencia para deletar atividade'});
        } else {
            req.atividade.remove(function (err) {
                if (err) {
                    res.send({success:false, errorMessage:'Erro ao deletar atividade'});
                }
                res.send({success:true, errorMessage:'Atividade removida com sucesso'});
            });
        }
    });
});


module.exports = router;

