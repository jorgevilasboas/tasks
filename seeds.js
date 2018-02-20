var mongoose = require("mongoose");
var Agencia = require("./models/agencia");
var Atividade   = require("./models/atividade");

var data = [
    {
        name: "Cloud's Rest", 
        image: "/images/ibge_apple_office.png",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    }
]

function seedDB(){
   //Remove all agencias
   Agencia.remove({}, function(err){
        if(err){
            console.log(err);
        }
        //console.log("removed agencias!");
         //add a few agencias
        data.forEach(function(seed){
            Agencia.create(seed, function(err, agencia){
                if(err){
                    console.log(err)
                } else {
                    console.log("added a agencia");
                    //create a atividade
                    Atividade.create(
                        {
                            text: "This place is great, but I wish there was internet",
                            author: "Homer"
                        }, function(err, atividade){
                            if(err){
                                console.log(err);
                            } else {
                                agencia.atividades.push(atividade);
                                agencia.save();
                                console.log("Created new atividade");
                            }
                        });
                }
            });
        });
    }); 
    //add a few atividades
}

module.exports = seedDB;
