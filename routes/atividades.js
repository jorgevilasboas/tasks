const express = require("express");
const router  = express.Router({mergeParams: true});
const Agencia = require("../models/agencia");
const Atividade = require("../models/atividade");
const middleware = require("../middleware");
const { isLoggedIn, checkUserAtividade, isAdmin } = middleware;

//Atividades New
router.get("/new", isLoggedIn, function(req, res){
    // find agencia by id
    //console.log(req.params.id);
    Agencia.findById(req.params.id, function(err, agencia){
        if(err){
            console.log(err);
        } else {
             res.render("atividades/new", {agencia: agencia});
        }
    })
});


//Atividades Create
router.post("/", isLoggedIn, function(req, res){
   //lookup agencia using ID   
   Agencia.findById(req.params.id, function(err, agencia){
       if(err){
           console.log(err);
           res.redirect("/agencias");
       } else {
        Atividade.create(req.body.atividade, function(err, atividade){
            console.log(req.body.atividade);
           if(err){
               console.log(err);
           } else {
               //add username and id to atividade
               atividade.author.id = req.user._id;
               atividade.author.username = req.user.username;
               console.log(req.body.atividade);
               //save atividade
               atividade.save();
               agencia.atividades.push(atividade);           
               agencia.save();               
               req.flash('success', 'Atividade criada com sucesso!');
               res.redirect('/agencias/' + agencia._id);
           }
        });        
       }
   });
});

router.get("/:atividadeId/edit", isLoggedIn, checkUserAtividade, function(req, res){
  res.render("atividades/edit", {agencia_id: req.params.id, atividade: req.atividade});
});

router.put("/:atividadeId", isAdmin, function(req, res){
   Atividade.findByIdAndUpdate(req.params.atividadeId, req.body.atividade, function(err, atividade){
       if(err){
          console.log(err);
           res.render("edit");
       } else {
           res.redirect("/agencias/" + req.params.id);
       }
   }); 
});

router.delete("/:atividadeId", isLoggedIn, checkUserAtividade, function(req, res){
  // find agencia, remove atividade from atividades array, delete atividade in db
  Agencia.findByIdAndUpdate(req.params.id, {
    $pull: {
      atividades: req.atividade.id
    }
  }, function(err) {
    if(err){ 
        console.log(err)
        req.flash('error', err.message);
        res.redirect('/');
    } else {
        req.atividade.remove(function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('error', 'Atividade removida com sucesso!');
          res.redirect("/agencias/" + req.params.id);
        });
    }
  });
});

module.exports = router;