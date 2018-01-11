var Comment = require('../models/comment');
var Agencia = require('../models/agencia');
module.exports = {
  isLoggedIn: function(req, res, next){
      if(req.isAuthenticated()){
          return next();
      }
      req.flash('error', 'You must be signed in to do that!');
      res.redirect('/login');
  },
  checkUserAgencia: function(req, res, next){
    Agencia.findById(req.params.id, function(err, foundAgencia){
      if(err || !foundAgencia){
          console.log(err);
          req.flash('error', 'Sorry, that agencia does not exist!');
          res.redirect('/agencias');
      } else if(foundAgencia.author.id.equals(req.user._id) || req.user.isAdmin){
          req.agencia = foundAgencia;
          next();
      } else {
          req.flash('error', 'You don\'t have permission to do that!');
          res.redirect('/agencias/' + req.params.id);
      }
    });
  },
  checkUserComment: function(req, res, next){
    Comment.findById(req.params.commentId, function(err, foundComment){
       if(err || !foundComment){
           console.log(err);
           req.flash('error', 'Sorry, that comment does not exist!');
           res.redirect('/agencias');
       } else if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
            req.comment = foundComment;
            next();
       } else {
           req.flash('error', 'You don\'t have permission to do that!');
           res.redirect('/agencias/' + req.params.id);
       }
    });
  },
  isAdmin: function(req, res, next) {
    if(req.user.isAdmin) {
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
  }
}