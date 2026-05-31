const { AppError } = require('../utils/errors');

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }

    next();
  };
}

const requireAdmin = requireRoles('ADMIN');
const requireManagerOrAdmin = requireRoles('ADMIN', 'MANAGER');
const requireAnyRole = requireRoles('ADMIN', 'MANAGER', 'MEMBER');

module.exports = {
  requireRoles,
  requireAdmin,
  requireManagerOrAdmin,
  requireAnyRole,
};
