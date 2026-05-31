const express = require('express');
const taskService = require('../services/taskService');
const { authenticate } = require('../middleware/authenticate');
const { requireManagerOrAdmin, requireAnyRole } = require('../middleware/rbac');
const {
  validate,
  createTaskSchema,
  updateTaskSchema,
  transitionTaskSchema,
  listTasksSchema,
} = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/', requireAnyRole, validate(listTasksSchema), async (req, res, next) => {
  try {
    const query = req.validatedQuery ?? req.query;
    const result = await taskService.listTasks(req.user.organizationId, req.user, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAnyRole, async (req, res, next) => {
  try {
    const task = await taskService.getTask(req.user.organizationId, req.params.id, req.user);
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireManagerOrAdmin, validate(createTaskSchema), async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.user.organizationId, req.user, req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAnyRole, validate(updateTaskSchema), async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.user.organizationId,
      req.params.id,
      req.user,
      req.body
    );
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/transition', requireAnyRole, validate(transitionTaskSchema), async (req, res, next) => {
  try {
    const task = await taskService.transitionTask(
      req.user.organizationId,
      req.params.id,
      req.user,
      req.body.status
    );
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireManagerOrAdmin, async (req, res, next) => {
  try {
    await taskService.deleteTask(req.user.organizationId, req.params.id, req.user);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
