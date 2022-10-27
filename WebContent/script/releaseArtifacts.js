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
//var CORA = (function(cora) {
//	"use strict";
//	cora.releaseArtifacts = function() {

const init = function() {

	let allRepos = [];
	let noRepoListsAdded = 0;
	let noOfReturnedRepos = 0;
	let totalRepos;
	let artifacts = [];

	const start = function() {
		getRepos();
		//Timer 
		setInterval(getRepos, 5 * 60 * 1000);
	};

	const getRepos = function() {
		$.ajaxSetup({
			headers: {
				'Authorization': repoToken
			}
		});
		var repoUrl = "https://api.github.com/orgs/lsu-ub-uu/repos?sort=updated&direction=desc&per_page=100&page=1";
		var repoUrl2 = "https://api.github.com/orgs/lsu-ub-uu/repos?sort=updated&direction=desc&per_page=100&page=2";
		$.get(repoUrl).done(function(repos) {
			joinRepos(repos);
		});
		$.get(repoUrl2).done(function(repos) {
			joinRepos(repos);
		});
	};

	const joinRepos = function(repos) {
		allRepos = allRepos.concat(repos);
		noRepoListsAdded++;
		if (noRepoListsAdded == 2) {
			sortAndDisplayRepos(allRepos);
			noRepoListsAdded = 0;
			allRepos = new Array(0);
		}
	}

	const sortAndDisplayRepos = function(originalRepos) {
		let filteredRepos = filterAwayFromArray(originalRepos, "docker");
		let reposWithOutDocker = filteredRepos[0];
		let reposWithOnlyDockers = filteredRepos[1];

		//SORT
		reposWithOutDocker.sort(compareRepos);
		reposWithOnlyDockers.sort(compareRepos);

		getVersionsForRepositories(reposWithOutDocker, "projectList");
		getVersionsForRepositories(reposWithOnlyDockers, "dockerList");
	};

	const filterAwayFromArray = function(arrayIn, filterText) {
		let arrayWithFilteredElements = [];
		let arrayWithOutFilteredElements = [];
		arrayIn.forEach(function(element) {
			const name = element.name;
			if (name.includes(filterText)) {
				arrayWithFilteredElements.push(element);
			}
			else {
				arrayWithOutFilteredElements.push(element);
			}
		});
		return [arrayWithOutFilteredElements, arrayWithFilteredElements];
	};

	const getVersionsForRepositories = function(repoList, ulType) {
		let projectList = document.getElementById(ulType);
		projectList.innerHTML = '';

		totalRepos = repoList.length;
		repoList.forEach(function(repo) {
			getVersionForRepository(repo.tags_url);
		});
		possiblyCreateInner();
		
		//		artifacts.forEach(function(artifact) {
		//			createInnerHtmlForArtifacts(artifact, projectList);
		//		});
	};

	const getVersionForRepository = function(url) {
		$.get(url).done(function(tags) {
			let versions = getVersionTextAndNumber(tags);
			let artifact = {};
			artifact.versionText = versions[0];
			artifact.versionNumber = versions[1];
			artifact.commitUrl = versions[2];
			artifacts.push(artifact);
			getLatestUpdate(artifact);
			noOfReturnedRepos++;
			possiblyCreateInner(noOfReturnedRepos);	
		});
	};
	
	const possiblyCreateInner = function(noOfReturned) {
		if (noOfReturned == totalRepos) {
			// console.log(artifacts);
			artifacts.forEach(function(artifact) {
				console.log(artifact);
				createInnerHtmlForArtifacts(artifact, projectList);
			});
		}
	};

	const getLatestUpdate = function(artifact) {
		$.get(artifact.commitUrl).done(function(data) {
			artifact.commitedDate = data.commit.author.date;
		});
	};

	const createInnerHtmlForArtifacts = function(artifact, ulNode) {
		try {
			// console.log("here");
			// console.log(artifact.versionText);
			// console.log(artifact);
			// console.log(JSON.stringify(artifact));
			let li = createLi(artifact.versionText, artifact.versionNumber);
			//			paintUpdatedDays(artifact.commitedDate, li)
			ulNode.appendChild(li);

		} catch (e) {
			// console.log(artifact.versionText + " : " + e);

			let li = createLi(artifact.versionText, "-");
			li.className = li.className + " noVersion";
			ulNode.appendChild(li);
		}
	}

	const getVersionTextAndNumber = function(tags) {
		let versions = sortAndFilterTagVersions(tags);
		let latestVersion = versions[0];
		if (latestVersion === undefined) {
			return ["", "", ""];
		}
		let versionText = onlyText(latestVersion.name);
		let versionNumber = onlyNumber(latestVersion.name);
		let commitUrl = latestVersion.commit.url;
		return [versionText, versionNumber, commitUrl];
	};

	const sortAndFilterTagVersions = function(tags) {
		return tags.sort(function(v1, v2) {
			let v1Name = onlyNumberFakeIfNotANumber(v1.name);
			let v2Name = onlyNumberFakeIfNotANumber(v2.name);

			return semver.compare(v2Name, v1Name)
		});
	};

	const paintUpdatedDays = function(commitedDate, li) {
		let span = document.createElement("span");
		li.appendChild(span);
		span.className = "commitDate";
		span.innerText = commitedDate;

		if (commitedDate < 1) {
			li.className = li.className + " updatedToday";
		}
		else if (commitedDate < 2) {
			li.className = li.className + " updatedYesterday";
		}
		else if (commitedDate < 7) {
			li.className = li.className + " updatedSevenDaysAgo";
		}
	};

	const onlyNumberFakeIfNotANumber = function(name) {
		let number = onlyNumber(name);
		if (isNaN(number)) {
			return '0.0.1';
		}
		if (hasVersionWrongFormat(number)) {
			return '0.0.1';
		}
		return number;
	};

	const onlyNumber = function(name) {
		return name.substring(name.lastIndexOf("-") + 1, name.length);
	};

	const onlyText = function(name) {
		return name.substring(0, name.lastIndexOf("-"));
	};

	const createLi = function(versionText, versionNumber) {
		let li = document.createElement("li");
		li.className = "project";

		let header = document.createElement("h2");
		li.appendChild(header);
		header.innerText = versionText;

		let div = document.createElement("span");
		li.appendChild(div);
		div.className = "version";
		div.innerText = versionNumber;
		return li;
	};

	const countDaysFromCommit = function(commitDateString) {
		let commitDate = new Date(commitDateString);
		return dhm(Date.now() - commitDate);
	};

	const dhm = function(t) {
		var cd = 24 * 60 * 60 * 1000,
			ch = 60 * 60 * 1000,
			d = Math.floor(t / cd),
			h = Math.floor((t - d * cd) / ch),
			m = Math.round((t - d * cd - h * ch) / 60000),
			pad = function(n) { return n < 10 ? '0' + n : n; };
		if (m === 60) {
			h++;
			m = 0;
		}
		if (h === 24) {
			d++;
			h = 0;
		}
		return d;
	};

	const compareRepos = function(a, b) {

		const repoA = a.name.toUpperCase();
		const repoB = b.name.toUpperCase();

		if (repoA > repoB) {
			return 1;
		}
		else if (repoA < repoB) {
			return -1;
		}
		return 0;
	};

	const hasVersionWrongFormat = function(number) {
		if ((number.split(".").length - 1) === 1) {
			return true;
		} else {
			return false;
		}
	};

	start();
};