var Atividade = require('../models/atividade');
var Agencia = require('../models/agencia');
module.exports = {
  isLoggedIn: function(req, res, next){
      if(req.isAuthenticated()){
          return next();
      }
      req.flash('error', 'Você deve estar logado para fazer isso!');
      res.redirect('/login');
  },
  checkUserAgencia: function(req, res, next){
    Agencia.findById(req.params.id, function(err, foundAgencia){
      if(err || !foundAgencia){
          console.log(err);
          req.flash('error', 'Desculpe, essa agencia não existe!');
          res.redirect('/agencias');
      } else if(foundAgencia.author.id.equals(req.user._id) || req.user.isAdmin){
          req.agencia = foundAgencia;
          next();
      } else {
          req.flash('error', 'Você não tem permissão para fazer isso!');
          res.redirect('/agencias/' + req.params.id);
      }
    });
  },
  checkUserAtividade: function(req, res, next){
    Atividade.findById(req.params.atividadeId, function(err, foundAtividade){
       if(err || !foundAtividade){
           console.log(err);
           req.flash('error', 'Desculpe, essa atividade não existe!');
           res.redirect('/agencias');
       } else if(foundAtividade.author.id.equals(req.user._id) || req.user.isAdmin){
            req.atividade = foundAtividade;
            next();
       } else {
           req.flash('error', 'Você não tem permissão para fazer isso!');
           res.redirect('/agencias/' + req.params.id);
       }
    });
  },
  apiCheckUserAtividade: function(req, res, next){
    Atividade.findById(req.params.atividadeId, function(err, foundAtividade){
       if(err || !foundAtividade){
           console.log(err);           
           res.send({success:false, errorMessage:'Desculpe, essa atividade não existe!'});           
       } else if(foundAtividade.author.id.equals(req.body.user) ){
            req.atividade = foundAtividade;
            next();
       } else {
           console.log("FoundAtividade:", foundAtividade.author.id);
           console.log("User: ", req.body.user);
           res.send({success:false, errorMessage:'Você não tem permissão para fazer isso!'});
       }
    });
  },
  isAdmin: function(req, res, next) {
    //req.user.isAdmin
    if(true) {
      next();
    } else {
      req.flash('error', 'This site is now read only thanks to spam and trolls.');
      res.redirect('back');
    }
  },
  isSafe: function(req, res, next) {
    next();
   // if(req.body.image.match(/^https:\/\/images\.unsplash\.com\/.*/)) {
      //next();
    //}else {
      //req.flash('error', 'Only images from images.unsplash.com allowed.\nSee https://youtu.be/Bn3weNRQRDE for how to copy image urls from unsplash.');
      //res.redirect('back');
    //}
  },
  checkToken: function(req, res, next) {
    next();
   // if(req.body.image.match(/^https:\/\/images\.unsplash\.com\/.*/)) {
      //next();
    //}else {
      //req.flash('error', 'Only images from images.unsplash.com allowed.\nSee https://youtu.be/Bn3weNRQRDE for how to copy image urls from unsplash.');
      //res.redirect('back');
    //}
  }
}