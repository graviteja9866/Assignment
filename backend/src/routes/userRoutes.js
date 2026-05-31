const express = require('express');
const userService = require('../services/userService');
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin, requireManagerOrAdmin } = require('../middleware/rbac');
const { validate, createUserSchema, updateUserSchema, userIdParamSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/', requireManagerOrAdmin, async (req, res, next) => {
  try {
    const users = await userService.listUsers(req.user.organizationId);
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

router.use(requireAdmin);

router.post('/', validate(createUserSchema), async (req, res, next) => {
  try {
    const user = await userService.createUser(req.user.organizationId, req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(updateUserSchema), async (req, res, next) => {
  try {
    const userId = req.validatedParams?.id ?? req.params.id;
    const user = await userService.updateUser(req.user.organizationId, userId, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', validate(userIdParamSchema), async (req, res, next) => {
  try {
    const userId = req.validatedParams?.id ?? req.params.id;
    await userService.deleteUser(req.user.organizationId, userId, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
