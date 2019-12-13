/*
 * Copyright 2019 Uppsala University Library
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
function start() {
	$.ajaxSetup({
		headers: {
			'Authorization': repoToken
		}
	});
	var repoUrl = "https://api.github.com/orgs/lsu-ub-uu/repos?per_page=500";
	$.get(repoUrl).done(function(data) {
		data.forEach((repo) => getVersionForRepository(repo.name));
	});

	getVersionForRepository("cora-parent");
	getVersionForRepository("cora-fitnesse");

}
function onlyNumber(name) {
	return name.substring(name.lastIndexOf("-") + 1, name.length);
}
function onlyText(name) {
	return name.substring(0, name.lastIndexOf("-"));
}
function getUrlForRepository(repo) {
	return 'https://api.github.com/repos/' + 'lsu-ub-uu/' + repo + '/tags';
}
function getVersionForRepository(repo) {
	let projectList = document.getElementById("projectList");
	var url = getUrlForRepository(repo);
	$.get(url).done(function(data) {
		try {
			let versions = data.sort(function(v1, v2) {
				let v1Name = onlyNumber(v1.name);
				let v2Name = onlyNumber(v2.name);

				return semver.compare(v2Name, v1Name)
			});
			$('#result').html(versions[0].name);

			let versionText = onlyText(versions[0].name);
			let versionNumber = onlyNumber(versions[0].name);
			let li = createLi(versionText, versionNumber);
			projectList.appendChild(li);
		} catch (e) {
			console.log(e);
			
			let li = createLi(repo, "NOT FOUND!");
			li.className = li.className + " noVersion";
			projectList.appendChild(li);
		}
	});
}
function createLi(versionText, versionNumber) {
//	let versionText = onlyText(name);
//	let versionNumber = onlyNumber(name);

	let li = document.createElement("li");
	li.className = "project";

	let header = document.createElement("h2");
	li.appendChild(header);
	header.innerText = versionText;

	let div = document.createElement("div");
	li.appendChild(div);
	div.className = "version";
	div.innerText = versionNumber;
	return li;
}