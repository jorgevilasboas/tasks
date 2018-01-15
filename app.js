var express        = require("express"),
    app            = express(),
    logger         = require('morgan'),
    bodyParser     = require("body-parser"),
    errorhandler   = require('errorhandler'),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    cookieParser   = require("cookie-parser"), 
    LocalStrategy  = require("passport-local"),
    flash          = require("connect-flash"),
    Agencia        = require("./models/agencia"),
    Comment        = require("./models/comment"),
    User           = require("./models/user"),
    session        = require("express-session"),
    seedDB         = require("./seeds"),
    methodOverride = require("method-override");   
    

// configure dotenv
require('dotenv').load();

var PORT = process.env.PORT;

//requiring routes
var commentRoutes    = require("./routes/comments"),
    agenciaRoutes = require("./routes/agencias"),
    indexRoutes      = require("./routes/index")
    
// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

const databaseUri = process.env.MONGODB_URI || 'mongodb://localhost/tasks';

console.log(databaseUri);

mongoose.connect(databaseUri, { useMongoClient: true })
      .then(() => console.log(`Database connected`))
      .catch(err => console.log(`Database connection error: ${err.message}`));

app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));
//require moment
app.locals.moment = require('moment');
// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "O por do sol esta chuvoso!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});


app.use("/", indexRoutes);
app.use("/agencias", agenciaRoutes);
app.use("/agencias/:id/comments", commentRoutes);
app.use(errorhandler())
//second arg process.env.IP
/*app.listen(PORT, "localhost",  function(){
   console.log("The YelpCamp Server Has Started!");
});
*/

app.listen(PORT, function () {
    console.log('Server listening on port 3000!');
  });