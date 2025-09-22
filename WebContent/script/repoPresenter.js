class RepoPresenter {
    constructor() {
        this.currentSortMode = "nameAsc";
        this.onSortChange = null;
        this.setupSortListener();
    }

    setupSortListener() {
        const sortSelect = document.getElementById("sortMode");
        if (sortSelect) {
            sortSelect.addEventListener("change", () => {
                this.currentSortMode = sortSelect.value;
                if (typeof this.onSortChange === "function") {
                    this.onSortChange(this.currentSortMode);
                }
            });
        }
    }

    setSortChangeCallback(callback) {
        this.onSortChange = callback;
    }

    sortRepos(repoList, sortMode) {
        switch (sortMode) {
            case "nameAsc":
                return repoList.sort(this.compareReposAsc);
            case "nameDesc":
                return repoList.sort(this.compareReposDesc);
            case "ageAsc":
                return repoList.sort(this.compareReposAgeAsc.bind(this));
            case "ageDesc":
                return repoList.sort(this.compareReposAgeDesc.bind(this));
            default:
                return repoList.sort(this.compareReposAsc);
        }
    }

    compareReposAsc(a, b) {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }

    compareReposDesc(a, b) {
        return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
    }

    compareReposAgeAsc(a, b) {
        return this.getRepoAge(a) - this.getRepoAge(b);
    }

    compareReposAgeDesc(a, b) {
        return this.getRepoAge(b) - this.getRepoAge(a);
    }

    getRepoAge(repo) {
        // repo._latestCommitDate should be set in releaseArtifacts.js after fetching commit
        if (repo._latestCommitDate) {
            const commitDate = new Date(repo._latestCommitDate);
            return this.dhm(Date.now() - commitDate);
        }
        return Number.MAX_SAFE_INTEGER; // If no commit date, treat as oldest
    }

    displayRepos(repoList, ulType, fetchRepoVersion) {
        const projectList = document.getElementById(ulType);
        projectList.innerHTML = '';
        repoList.forEach(repo => {
            fetchRepoVersion(repo, projectList);
        });
    }

    createLi() {
        const li = document.createElement("li");
        li.className = "project";
        return li;
    }

    populateLi(li, versionText, versionNumber) {
        const header = document.createElement("h2");
        li.appendChild(header);
        header.innerText = versionText;
        const div = document.createElement("span");
        li.appendChild(div);
        div.className = "version";
        div.innerText = versionNumber;
    }

    updateCommitDays(data, li) {
        const span = document.createElement("span");
        li.appendChild(span);
        span.className = "commitDate";
        const days = this.countDaysFromCommit(data.commit.author.date);
        span.innerText = days;
        if (days < 1) {
            li.className += " updatedToday";
        } else if (days < 3) {
            li.className += " updatedYesterday";
        } else if (days < 8) {
            li.className += " updatedSevenDaysAgo";
        } else if (days > 365) {
            li.className += " overAYear";
        }
    }

    countDaysFromCommit(commitDateString) {
        const commitDate = new Date(commitDateString);
        return this.dhm(Date.now() - commitDate);
    }

    dhm(t) {
        const cd = 24 * 60 * 60 * 1000;
        const d = Math.floor(t / cd);
        return d;
    }
}

// Export for usage in other scripts
window.RepoPresenter = RepoPresenter;