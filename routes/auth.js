const express    = require('express'),
      router     = express.Router(),
      User       = require("../models/user"),
      passport   = require("passport"),
      middleware = require("../middlewares");

//Index Route
router.get("/", (req, res) => {
  res.redirect("/login");
});

//Chat Route
router.get("/chat", middleware.isLoggedIn, (req, res) => {
  res.render("chat");
});

// Register Route
router.get("/register", (req, res) => {
  res.render("register");
});

// Handling Register Logic
router.post("/register", (req, res) => {
  let newUser = new User({
    username: req.body.username
  });
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      req.flash("error", err.message)
      res.redirect("back");
    } else {
      passport.authenticate("local")(req, res, () => {
        req.flash("succes", "Successfully registered")
        res.redirect("/chat");
      });
    }
  });
});

// Login Route
router.get("/login", middleware.isLoggedOut, (req, res) => {
  res.render("login");
});

// Handling Login logic
router.post("/login", middleware.isLoggedOut, passport.authenticate("local", {
  successRedirect: "/chat",
  failureRedirect: "/login",
  failureFlash: true
}), (req, res) => {});

module.exports = router;