#!/bin/bash
setup_git() {
  git config --global user.email "travis@travis-ci.com"
  git config --global user.name "Travis CI"
}


setup_git
npm run build-docs
git add docs/.
git commit --message "chore(automated): Docs Update ${TRAVIS_BUILD_NUMBER} [ci skip]"
git remote add origin-update https://${GH_TOKEN}@github.com/TobiTenno/json-fetch-cache.git
git push --quiet --set-upstream origin-update $TRAVIS_BRANCH