/*
 * Copyright 2019, 2020 Uppsala University Library
 *
 * This file is part of Friday.
 *
 *     Cora is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     Cora is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with Friday.  If not, see <http://www.gnu.org/licenses/>.
 */

const init = function() {
    let allRepos = [];
    let repoListsFetched = 0;
    const presenter = new window.RepoPresenter();
    let currentSortMode = "nameAsc";

    // Counter logic
    const REFRESH_INTERVAL_SEC = 1800; // 30 minutes
    let counter = REFRESH_INTERVAL_SEC;
    let counterIntervalId = null;
    const counterElem = document.getElementById("refreshCounter");

    function startCounter() {
        counter = REFRESH_INTERVAL_SEC;
        updateCounterDisplay();
        if (counterIntervalId) clearInterval(counterIntervalId);
        counterIntervalId = setInterval(() => {
            counter--;
            if (counter <= 0) {
                counter = 0;
            }
            updateCounterDisplay();
        }, 1000);
    }

    function updateCounterDisplay() {
        if (counterElem) {
            const min = Math.floor(counter / 60).toString().padStart(2, '0');
            const sec = (counter % 60).toString().padStart(2, '0');
            counterElem.textContent = `Next refresh in: ${min}:${sec}`;
        }
    }

    function highlightCounter() {
        if (counterElem) {
            counterElem.classList.add('refreshing');
            setTimeout(() => counterElem.classList.remove('refreshing'), 1200);
        }
    }

    const start = function() {
        setupSortListener();
        startCounter();
        fetchRepos();
        setInterval(() => {
            fetchRepos();
            startCounter();
            highlightCounter();
        }, REFRESH_INTERVAL_SEC * 1000);
    };

    const setupSortListener = function() {
        const sortSelect = document.getElementById("sortMode");
        sortSelect.addEventListener("change", function() {
            currentSortMode = sortSelect.value;
            processRepos(allRepos);
        });
    };

    const fetchRepos = function() {
        allRepos = [];
        repoListsFetched = 0;
        const repoUrls = [
            "https://api.github.com/orgs/lsu-ub-uu/repos?sort=updated&direction=desc&per_page=100&page=1",
            "https://api.github.com/orgs/lsu-ub-uu/repos?sort=updated&direction=desc&per_page=100&page=2"
        ];
        $.ajaxSetup({ headers: { 'Authorization': repoToken } });
        repoUrls.forEach(url => {
            $.get(url).done(function(repos) {
                allRepos = allRepos.concat(repos);
                repoListsFetched++;
                if (repoListsFetched === repoUrls.length) {
                    processRepos(allRepos);
                }
            });
        });
    };

    const processRepos = function(repos) {
        const [nonDockerRepos, dockerRepos] = filterRepos(repos, "docker");
        presenter.sortRepos(nonDockerRepos, currentSortMode);
        presenter.sortRepos(dockerRepos, currentSortMode);
        presenter.displayRepos(nonDockerRepos, "projectList", fetchRepoVersion);
        presenter.displayRepos(dockerRepos, "dockerList", fetchRepoVersion);
    };

    const filterRepos = function(repos, filterText) {
        return repos.reduce((acc, repo) => {
            if (!repo.archived) {
                if (repo.name.includes(filterText)) {
                    acc[1].push(repo);
                } else {
                    acc[0].push(repo);
                }
            }
            return acc;
        }, [[], []]);
    };

    const fetchRepoVersion = function(repo, projectList) {
        const li = presenter.createLi();
        projectList.appendChild(li);
        $.get(repo.tags_url).done(function(tags) {
            try {
                const [versionText, versionNumber, commitUrl] = extractVersion(tags);
                presenter.populateLi(li, repo.name, versionNumber);
                fetchLatestUpdate(commitUrl, li, repo);
            } catch (e) {
                console.log(repo.name + " : " + e);
                presenter.populateLi(li, repo.name, "-");
                li.className += " noVersion";
            }
        });
    };

    const fetchLatestUpdate = function(commitUrl, li, repo) {
        $.get(commitUrl).done(function(data) {
            presenter.updateCommitDays(data, li);
            // Store latest commit date for sorting by age
            if (repo) {
                repo._latestCommitDate = data.commit.author.date;
            }
        });
    };

    const extractVersion = function(tags) {
        if (!tags.length) throw "No tags";
        const versions = tags.sort((a, b) => {
            const vA = validSemverOrDefault(a.name);
            const vB = validSemverOrDefault(b.name);
            return semver.compare(vB, vA);
        });
        const latest = versions[0];
        const versionText = latest.name.split('-')[0];
        const versionNumber = onlyNumber(latest.name);
        const commitUrl = latest.commit.url;
        return [versionText, versionNumber, commitUrl];
    };

    const validSemverOrDefault = function(name) {
        const number = onlyNumber(name);
        const valid = semver.valid(number);
        if (!valid || hasVersionWrongFormat(valid)) {
            return '0.0.1';
        }
        return valid;
    };

    const onlyNumber = function(name) {
        const match = name.match(/\d+\.\d+\.\d+/);
        return match ? match[0] : '0.0.1';
    };

    const hasVersionWrongFormat = function(number) {
        return (number.split(".").length - 1) === 1;
    };

    start();
};