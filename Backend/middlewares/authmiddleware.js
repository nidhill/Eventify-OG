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

export const isCreator = (req, res, next) => {
  if (req.isAuthenticated() && req.user.usertype === 'creator') {
    return next();
  }
  res.status(403).send('Access Denied: Only creators can perform this action.');
};

// New middleware: Allow both creators and admins
export const isCreatorOrAdmin = (req, res, next) => {
  if (req.isAuthenticated() && (req.user.usertype === 'creator' || req.user.isAdmin)) {
    return next();
  }
  res.status(403).send('Access Denied: Only creators or admins can perform this action.');
};

// Puthതായി add cheyyunnathu
export const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/userauth/showlogin');
  }
  
  if (req.user.isBanned) {
    return res.status(403).send(`Your account has been suspended. Reason: ${req.user.banReason || 'Violation of community guidelines'}. You cannot access admin features until the suspension is lifted.`);
  }
  
  if (!req.user.isAdmin) {
    console.log('Admin access denied for user:', req.user.username, 'isAdmin:', req.user.isAdmin);
    return res.status(403).send('Access Denied: You do not have admin privileges. Contact an administrator.');
  }
  
  console.log('Admin access granted for user:', req.user.username);
  return next();
};

// Check if user is not banned
export const isNotBanned = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isBanned) {
    return res.status(403).send(`Your account has been suspended. Reason: ${req.user.banReason || 'Violation of community guidelines'}. You cannot access this feature until the suspension is lifted.`);
  }
  return next();
};