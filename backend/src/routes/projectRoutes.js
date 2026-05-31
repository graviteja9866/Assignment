const express = require('express');
const projectService = require('../services/projectService');
const { authenticate } = require('../middleware/authenticate');
const { requireManagerOrAdmin, requireAnyRole } = require('../middleware/rbac');
const { validate, createProjectSchema, updateProjectSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/', requireAnyRole, async (req, res, next) => {
  try {
    const projects = await projectService.listProjects(req.user.organizationId);
    res.json({ data: projects });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAnyRole, async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.user.organizationId, req.params.id);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireManagerOrAdmin, validate(createProjectSchema), async (req, res, next) => {
  try {
    const project = await projectService.createProject(
      req.user.organizationId,
      req.user.id,
      req.body
    );
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireManagerOrAdmin, validate(updateProjectSchema), async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.user.organizationId,
      req.params.id,
      req.body
    );
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireManagerOrAdmin, async (req, res, next) => {
  try {
    await projectService.deleteProject(req.user.organizationId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
