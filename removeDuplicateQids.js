const fs = require('fs-extra');
const path = require('path');
const detectJsonIndent = require('detect-json-indent');

/**
 * @param {Map} map 
 */
function setOrIncrement(map, key) {
  if (map.has(key)) {
    map.set(key, map.get(key) + 1);
  } else {
    map.set(key, 1);
  }
}

function findDuplicateIds(thing, idCounts) {
  if (Array.isArray(thing)) {
    thing.forEach(t => findDuplicateIds(t, idCounts));
  } else {
    Object.entries(thing).forEach(([key, value]) => {
      if (typeof value === 'object') {
        findDuplicateIds(value, idCounts);
        return;
      }
      if (key === 'id') {
        setOrIncrement(idCounts, value);
      }
    });
  }
}

/**
 * Walks into an object looking for arrays, removes `count` entries
 * of arrays which contain an `id` prop matching `id`.
 */
function removeInstancesOfId(thing, id, count) {
  if (Array.isArray(thing)) {
    const newArray = [];
    for (let i = 0; i < thing.length; i++) {
      const entry = thing[i];
      removeInstancesOfId(entry, id, count);
      if (typeof entry !== 'object' || count.value <= 0 || !('id' in entry) || (entry.id !== id)) {
        newArray.push(entry);
      } else {
        console.log(`removing value; prev count: ${count.value}`);
        count.value -= 1;
      }
    }
    return newArray;
  } else if (typeof thing === 'object') {
    for (const key of Object.keys(thing)) {
      thing[key] = removeInstancesOfId(thing[key], id, count);
      if (count.value <= 0) return;
    }
  } else {
    return thing;
  }
}

function removeDuplicateId(infoAssessment, id, count) {
  removeInstancesOfId(infoAssessment, id, { value: count - 1 });
}

async function removeDuplicateIds(infoAssessmentPath) {
  const assessmentInfoJson = await fs.readFile(infoAssessmentPath, 'utf8');
  const assessmentInfo = JSON.parse(assessmentInfoJson);
  const indent = detectJsonIndent(assessmentInfoJson);

  // Walk into zones looking for IDs
  const idCounts = new Map();
  findDuplicateIds(assessmentInfo.zones, idCounts);
  const duplicateIds = [...idCounts.entries()].filter(([_, count]) => count > 1);
  if (duplicateIds.length === 0) return [];
  console.log(infoAssessmentPath, duplicateIds);

  for (const [id, count] of duplicateIds) {
    removeDuplicateId(assessmentInfo, id, count);
  }

  await fs.writeJSON(infoAssessmentPath, assessmentInfo, { spaces: indent });

  return [...duplicateIds];
}

(async () => {
  const courseDir = process.cwd();
  const courseInfoPath = path.join(courseDir, 'infoCourse.json');
  const courseInfoExists = await fs.exists(courseInfoPath);
  if (!courseInfoExists) {
    process.exit(1);
  }

  let duplicatesListMarkdown = '';

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
      const duplicateIds = await removeDuplicateIds(assessmentInfoPath);
      if (duplicateIds.length === 0) continue;
      duplicatesListMarkdown += `* **${courseInstance} - ${assessment}**\n`;
      for (const id of duplicateIds) {
        duplicatesListMarkdown += `  * ${id}\n`;
      }
      duplicatesListMarkdown += '\n';
    }
  }

  const dataDir = process.env.SHEPHERD_DATA_DIR;
  if (!dataDir) return;
  await fs.writeFile(path.join(dataDir, 'dupeslist.md'), duplicatesListMarkdown);;
})().catch(err => console.error(err));
