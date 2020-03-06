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

function init() {
	getRepos();
	//Timer 
	setInterval(getRepos, 30 * 60 * 1000);
}
function getRepos() {
	let projectList = document.getElementById("projectList");
	projectList.innerHTML = '';
	$.ajaxSetup({
		headers: {
			'Authorization': repoToken
		}
	});
	var repoUrl = "https://api.github.com/orgs/lsu-ub-uu/repos?per_page=500";
	$.get(repoUrl).done(function(repos) {
		console.log(repos)
		sortAndDisplayRepos(repos);
	});
}
function sortAndDisplayRepos(originalRepos) {
	let filteredRepos = filterAwayFromArray(originalRepos, "docker");
	let reposWithOutDocker = filteredRepos[0];
	let reposWithOnlyDockers = filteredRepos[1];
	
	//SORT
	reposWithOutDocker.sort(compareRepos);
	reposWithOnlyDockers.sort(compareRepos);

	getVersionsForRepositories(reposWithOutDocker, "projectList");
	getVersionsForRepositories(reposWithOnlyDockers, "dockerList");
}

function filterAwayFromArray(arrayIn, filterText){
	let arrayWithFilteredElements = [];
	let arrayWithOutFilteredElements = [];
	arrayIn.forEach(function(element, index, array){
		const name = element.name;
		if (name.includes(filterText)){
			console.log(element.name);
			arrayWithFilteredElements.push(element);
		}
		else{
			arrayWithOutFilteredElements.push(element);
		}
	});
	return [arrayWithOutFilteredElements, arrayWithFilteredElements];
}

function getVersionsForRepositories(repoList, ulType){
	repoList.forEach(function(repo) {
		console.log(repo);
		getVersionForRepository(repo, ulType);
	});
}

function getVersionForRepository(repo, ulType) {
	let projectList = document.getElementById(ulType);
	projectList.innerHTML = '';
	let url = repo.tags_url;
	console.log(url)
	$.get(url).done(function(tags) {
		
		try {
			let versions = getVersionTextAndNumber(tags);

			let versionText = versions[0];
			let versionNumber = versions[1];
			let commitUrl = versions[2];
			
			let li = createLi(versionText, versionNumber);
			getLatestUpdate(commitUrl, li)
			projectList.appendChild(li);
			
		} catch (e) {
			console.log(e);

			let li = createLi(repo.name, "-");
			li.className = li.className + " noVersion";
			projectList.appendChild(li);
		}
	});
}

function getLatestUpdate(commitUrl, li){
	$.get(commitUrl).done(function(data2){
		paintUpdatedDays(data2, li);
	});
}


function getVersionTextAndNumber(tags){
	let versions = sortAndFilterTagVersions(tags);
	let latestVersion = versions[0];
	console.log(latestVersion);

	let versionText = onlyText(latestVersion.name);
	let versionNumber = onlyNumber(latestVersion.name);
	let commitUrl = latestVersion.commit.url;
	return [versionText, versionNumber, commitUrl];
}

function sortAndFilterTagVersions(tags){
	return tags.sort(function(v1, v2) {
	let v1Name = onlyNumberFakeIfNotANumber(v1.name);
	let v2Name = onlyNumberFakeIfNotANumber(v2.name);

	return semver.compare(v2Name, v1Name)
	});
}

function paintUpdatedDays(data, li){
	let span = document.createElement("span");
	li.appendChild(span);
	span.className = "commitDate";
	let commitedDays = countDaysFromCommit(data.commit.author.date);
	span.innerText = commitedDays;

	if (commitedDays < 1) {
		li.className = li.className + " updatedToday";
	}
	else if (commitedDays < 2) {
		li.className = li.className + " updatedYesterday";
	}
	else if (commitedDays < 7) {
		li.className = li.className + " updatedSevenDaysAgo";
	}
}

function onlyNumberFakeIfNotANumber(name) {
	let number = onlyNumber(name);
	if (isNaN(number)) {
		return '0.0.1';
	}
	return number;
}

function onlyNumber(name) {
	return name.substring(name.lastIndexOf("-") + 1, name.length);
}

function onlyText(name) {
	return name.substring(0, name.lastIndexOf("-"));
}

function createLi(versionText, versionNumber) {
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
}

function countDaysFromCommit(commitDateString) {
	console.log("CommitDate " + commitDateString);
	let commitDate = new Date(commitDateString);
	console.log(Date.now() - commitDate);
	return dhm(Date.now() - commitDate);
}

function dhm(t) {
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
	//  return [d, pad(h), pad(m)].join(':');
	return d;
}

const compareRepos = function(a, b) {

	const repoA = a.name.toUpperCase();
	const repoB = b.name.toUpperCase();

	let comparison = 0;

	if (repoA > repoB) {
		comparison = 1;
	}
	else if (repoA < repoB) {
		comparison = -1;
	}
	return comparison;
}
//		return Object.freeze({
//			init: init
//		});
//	};
//	return cora;
//}(CORA));