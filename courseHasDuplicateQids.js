#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

function findDuplicateIds(thing, foundIds, duplicateIds) {
  if (Array.isArray(thing)) {
    thing.forEach(t => findDuplicateIds(t, foundIds, duplicateIds));
  } else {
    Object.entries(thing).forEach(([key, value]) => {
      if (typeof value === 'object') {
        findDuplicateIds(value, foundIds, duplicateIds);
        return;
      }
      if (key === 'id') {
        if (foundIds.has(value)) {
          duplicateIds.add(value);
        } else {
          foundIds.add(value);
        }
      }
    });
  }
}

(async () => {
  const courseDir = process.cwd();
  const courseInfoPath = path.join(courseDir, 'infoCourse.json');
  const courseInfoExists = await fs.exists(courseInfoPath);
  if (!courseInfoExists) {
    process.exit(1);
  }

  // Get a list of course instances
  const courseInstancesPath = path.join(courseDir, 'courseInstances');
  if (!(await fs.exists(courseInstancesPath))) {
    process.exit(1);
  }
  const courseInstances = await fs.readdir(courseInstancesPath);
  for (const courseInstance of courseInstances) {
    const courseInstancePath = path.join(courseInstancesPath, courseInstance);
    const courseInstanceAssessmentsPath = path.join(courseInstancePath, 'assessments');
    if (!(await fs.exists(courseInstanceAssessmentsPath))) {
      continue;
    }
    const courseInstanceAssessments = await fs.readdir(courseInstanceAssessmentsPath);
    for (const assessment of courseInstanceAssessments) {
      const assessmentInfoPath = path.join(courseInstanceAssessmentsPath, assessment, 'infoAssessment.json');
      if (!(await fs.exists(assessmentInfoPath))) {
        continue;
      }
      const assessmentInfo = await fs.readJSON(assessmentInfoPath);
      // Walk into zones looking for IDs
      const foundIds = new Set();
      const duplicateIds = new Set();
      findDuplicateIds(assessmentInfo.zones, foundIds, duplicateIds);
      if (duplicateIds.size > 0) {
        process.exit(0);
      }
    }
  }

  // Did not find any duplicates
  process.exit(1);
})().catch(err => console.error(err));
