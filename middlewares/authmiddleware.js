export const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/userauth/showlogin');
};

export const isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/userauth/home');
};

export const DontHaveAnAccount = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/userauth/home');
};

// Creator middleware - only allows creators to access
export const isCreator = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/userauth/showlogin');
  }
  
  if (req.user && req.user.usertype === 'creator') {
    return next();
  }
  
  // creator അല്ലെങ്കിൽ ഹോം പേജിലേക്ക് തിരിച്ചുവിടുന്നു
  console.log('Access denied for user:', req.user ? req.user.username : 'Unknown', 'usertype:', req.user ? req.user.usertype : 'Unknown');
  res.status(403).send('Access denied. Only creators can perform this action. Please contact support to upgrade your account to creator status.');
};
    