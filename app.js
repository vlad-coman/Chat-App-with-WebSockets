const express        = require("express"),
      socket         = require('socket.io'),
      mongoose       = require("mongoose"),
      passport       = require("passport"),
      LocalStrategy  = require("passport-local"),
      app            = express(),
      bodyParser     = require("body-parser"),
      flash          = require("connect-flash"),
      middleware     = require("./middlewares"),
      User           = require("./models/user"),
      Connection     = require("./models/connection"),
      authRoutes     = require("./routes/auth.js");

require('dotenv').config();
mongoose.connect(process.env.DB_URL);
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(flash());

//Session setup
app.use(require("express-session")({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
// Passport.js config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Setting up currentUser, flash messages to be available in views 
let loggedUser;
app.use((req, res, next) => {
    loggedUser = req.user
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
app.use("/", authRoutes)

// start server and install socket on server
const server = app.listen(process.env.PORT, () => {
    console.log("Server started!");

});
const io = socket(server);

// declare 'sockets' object for storing sockets of all users as key-value pairs {username1:socket.id1, username2:socket.id2,...}
// find the connection which contains all registered usernames and sockets ids
// load all users from DB and store usernames in 'sockets object'
// initial, all users will have the value for socket id as 'offline' eg. {'vlad':'offline', 'alin':'offline',...}
let sockets = {};
Connection.findById(process.env.SOCKETS_CONNECTIONS_ID, (err, connection) => {
    if (err) {
        console.log(err);
    } else {
        connection.users.forEach((user) => {
            sockets[user.username] = 'offline';
        });
    }
});

// listen for connection 'connection' from front-end
// check if we have a logged in user
// find the connection which contains all registered usernames and sockets ids
// check if currently logged user is already in the connections DB:
// - if it is, update its socketId with the socket.id of current connection
// - if it isn't, add new user to DB with username(logged in user's username) and socketId(current socket.id)
// update 'sockets' object to contain the socket id of the current connection for online users
io.on('connection', (socket) => {
    if (loggedUser) {
        Connection.findById(process.env.SOCKETS_CONNECTIONS_ID, (err, connection) => {
            if (err) {
                console.log(err);
            } else {
                var activeUser = connection.users.find((activeUser) => {
                    return activeUser.username === loggedUser.username;
                });
                if (activeUser) {
                    activeUser.socketId = socket.id;
                    connection.save();
                    sockets[loggedUser.username] = socket.id
                } else {
                    activeUser = {
                        username: loggedUser.username,
                        socketId: socket.id
                    }
                    connection.users.push(activeUser);
                    connection.save();
                    sockets[activeUser.username] = socket.id
                }

                // listen for events from front-end and emit based on conditions
                socket.on('reciever', (data) => {
                    if (data.reciever && sockets[data.reciever] && sockets[data.reciever] !== 'offline' && data.sender !== data.reciever) {
                        io.sockets.connected[sockets[data.reciever]].emit("reciever", data);
                    }
                });
                socket.on('sender', (data) => {
                    if (data.reciever && sockets[data.reciever] && sockets[data.reciever] !== 'offline') {
                        if (data.reciever === data.sender) {
                            io.sockets.connected[sockets[data.sender]].emit("sender", data.yourselfError);
                        } else {
                            io.sockets.connected[sockets[data.sender]].emit("sender", data);
                        }

                    }
                });
                socket.on('errors', (data) => {
                    if (!data.reciever) {
                        io.sockets.connected[sockets[data.sender]].emit("errors", data.errors.missingUsername);
                    } else if (!sockets[data.reciever]) {
                        io.sockets.connected[sockets[data.sender]].emit("errors", data.errors.invalidUsername);
                    } else if (sockets[data.reciever] === 'offline') {
                        io.sockets.connected[sockets[data.sender]].emit("errors", data.errors.offlineUsername);
                    }
                });
                socket.onclose = () => {
                    sockets[activeUser.username] = 'offline';
                };

            }
        });
    }
});

// Logout route
app.get("/logout", middleware.isLoggedIn, (req, res) => {
    sockets[loggedUser.username] = 'offline';
    req.logout();
    req.flash("success", "Successfully logged out");
    res.redirect("/login");
});


