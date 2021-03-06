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
    Atividade        = require("./models/atividade"),
    User           = require("./models/user"),
    session        = require("express-session"),
    seedDB         = require("./seeds"),
    methodOverride = require("method-override");   
    

// configure dotenv
require('dotenv').load();

var PORT = process.env.PORT || 3000;

//rotas

    
// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

const databaseUri = process.env.MONGODB_URI || 'mongodb://localhost/tasks';

console.log(databaseUri);

mongoose.connect(databaseUri, { useMongoClient: true })
      .then(() => console.log(`Database connected`))
      .catch(err => console.log(`Database connection error: ${err.message}`));

app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//requiring routes
var atividadeRoutes    = require("./routes/atividades"),
    apiRoutes = require("./routes/api"),
    agenciaRoutes = require("./routes/agencias"),
    indexRoutes      = require("./routes/index"),
    relatoriosRoutes = require("./routes/")

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
app.use("/api", apiRoutes);
app.use("/agencias", agenciaRoutes);
app.use("/agencias/:id/atividades", atividadeRoutes);
app.use(errorhandler())

app.listen(PORT, function () {
    console.log('Server listening on port ' + PORT );
  });