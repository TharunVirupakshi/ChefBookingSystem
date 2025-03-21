const {admin} = require('../config/firebase'); // Import the Firebase admin instance

const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Access Denied');

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Add the decoded token to make it available for futher process
    next();
  } catch (error) {
    res.status(403).send('Invalid Token');
  }
};

const authenticateChef = (req, res, next) => {
  if (req.user && req.user.chef) {
      next(); // User is an admin, proceed to the next middleware or route handler
  } else {
      res.status(403).json({ success: false, message: 'Access denied: Chefs only.' });
  }
}; 

const authenticateAdmin = (req, res, next) => {
  if (req.user && req.user.admin) {
      next(); // User is an admin, proceed to the next middleware or route handler
  } else {
      res.status(403).json({ success: false, message: 'Access denied: Admins only.' });
  }
};

module.exports = { authenticateToken, authenticateAdmin, authenticateChef };