import { execSync } from 'child_process';

/**
 * Script to increment Major, Minor, or Patch versions based on git tags.
 * Usage: node minor.js [major|minor|patch]
 */

const bumpType = process.argv[2] || 'patch';

function getLatestTag() {
  try {
    const output = execSync('git tag -l').toString().trim();
    if (!output) return '1.0.0';
    
    const tags = output.split('\n').filter(t => /^\d+\.\d+\.\d+$/.test(t));
    if (!tags.length) return '1.0.0';

    // Sort tags by version number
    return tags.sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if (pa[i] !== pb[i]) return pb[i] - pa[i];
      }
      return 0;
    })[0];
  } catch (err) {
    return '1.0.0';
  }
}

function getBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (e) {
    return 'dev';
  }
}

const latest = getLatestTag();
const parts = latest.split('.').map(Number);

let next;
if (bumpType === 'major') {
  next = `${parts[0] + 1}.0.0`;
} else if (bumpType === 'minor') {
  next = `${parts[0]}.${parts[1] + 1}.0`;
} else {
  next = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

const branch = getBranch();
console.log(`\n🚀 Bumping ${bumpType.toUpperCase()}: ${latest} -> ${next}`);

try {
  // Check if tag already exists
  const existing = execSync(`git tag -l ${next}`).toString().trim();
  if (existing) {
    console.warn(`⚠️ Tag ${next} already exists. Skipping tag creation.`);
  } else {
    execSync(`git tag ${next}`);
    console.log(`✅ Created tag ${next}`);
  }

  // Push branch and tags
  console.log(`📤 Pushing to origin ${branch}...`);
  execSync(`git push origin ${branch}`);
  execSync(`git push origin ${next}`);
  console.log(`🎉 Done!`);
} catch (err) {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
}
