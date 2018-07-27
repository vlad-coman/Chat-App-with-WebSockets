const User           = require("../models/user"),
      middlewareObj  = {};

middlewareObj.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You must be logged in to do that!");
	res.redirect("/login");
}

middlewareObj.isLoggedOut = (req, res, next) => {
	if (!req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You are already logged in");
	res.redirect("/chat");
}

module.exports = middlewareObj;