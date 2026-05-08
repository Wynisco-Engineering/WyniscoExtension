
function getLinkedInJobIdFromUrl(url) {
    try {
        const u = new URL(url);
        const m = u.pathname.match(/\/jobs\/view\/(\d+)/);
        if (m) return m[1];
        if (u.pathname.startsWith('/jobs/')) {
            const cur = u.searchParams.get('currentJobId');
            if (cur) return cur;
        }
    } catch (e) {}
    return null;
}

function getLinkedInJobId() {
    let id = getLinkedInJobIdFromUrl(window.location.href);
    if (id) return id;
    try { id = getLinkedInJobIdFromUrl(window.top.location.href); if (id) return id; } catch (e) {}
    try { id = getLinkedInJobIdFromUrl(document.referrer); if (id) return id; } catch (e) {}
    const link = document.querySelector('a[href*="/jobs/view/"]');
    if (link) {
        const m = link.getAttribute('href').match(/\/jobs\/view\/(\d+)/);
        if (m) return m[1];
    }
    const compKey = document.querySelector('[componentkey*="JobDetails_"]');
    if (compKey) {
        const m = compKey.getAttribute('componentkey').match(/(\d{6,})/);
        if (m) return m[1];
    }
    return null;
}

function canonicalLinkedInJobUrl(url) {
    const id = getLinkedInJobId();
    if (id) return `https://www.linkedin.com/jobs/view/${id}/`;
    return url;
}

function canonicalIndeedJobUrl(url) {
    try {
        const u = new URL(url);
        const jobKey = u.searchParams.get('vjk');
        if (jobKey) {
            return `https://${u.hostname}/viewjob?jk=${jobKey}`;
        }
    } catch (e) {
        console.error("Error in canonicalIndeedJobUrl:", e);
    }
    return url;
}

function canonicalSimplyHiredJobUrl(url) {
    try {
        const u = new URL(url);
        const jobId = u.searchParams.get('job');
        if (jobId) {
            return `https://${u.hostname}/job/${jobId}`;
        }
    } catch (e) {
        console.error("Error in canonicalSimplyHiredJobUrl:", e);
    }
    return url;
}

(function() {
    const hostname = window.location.hostname;
    console.log("Job Extractor content script loaded on", hostname);

    if (document.getElementById('job-btn-container')) return;

    const btn = document.createElement('button');
    btn.id = 'fixed-right-image-btn';
    btn.title = 'Append job details to DB';
    btn.innerHTML = `<img src="${chrome.runtime.getURL('icon-round.png')}" alt="Send" style="width:32px;height:32px;pointer-events:none;">`;

    const editScrapedByBtn = document.createElement('button');
    editScrapedByBtn.id = 'edit-scraped-by-btn';
    editScrapedByBtn.title = 'Edit Scraped By';
    editScrapedByBtn.className = 'job-icon-btn';
    editScrapedByBtn.textContent = 'Scraped By';

    const editAuthTokenBtn = document.createElement('button');
    editAuthTokenBtn.id = 'edit-auth-token-btn';
    editAuthTokenBtn.title = 'Edit Auth Token';
    editAuthTokenBtn.className = 'job-icon-btn';
    editAuthTokenBtn.textContent = 'Auth Token';

    let scrapedBy = '';
    let authToken = '';

    chrome.storage.local.get(['scraped_by', 'auth_token'], function(result) {
        scrapedBy = result.scraped_by || '';
        authToken = result.auth_token || '';
    });

    btn.onclick = () => {
        chrome.storage.local.get(['scraped_by', 'auth_token'], function(result) {
            scrapedBy = result.scraped_by || '';
            authToken = result.auth_token || '';
            
            if (hostname.includes('linkedin.com')) {
                const details = extractLinkedInJobDetails();
                if (!details.job_title || !details.job_url) {
                    alert('Could not extract job details. Please ensure you are on a job page.');
                    return;
                }
                details.scraped_by = scrapedBy;
                details.employer_id=1;
                details.recruiter_info_avaiable = false;
                details.notes = ""
                sendJobToBackend(details, authToken);
            } else if (hostname.includes('indeed.com')) {
                const details = extractIndeedJobDetails();
                if (!details.job_title || !details.job_url) {
                    alert('Could not extract job details. Please ensure you are on a job page.');
                    return;
                }
                details.scraped_by = scrapedBy;
                details.employer_id=1;
                details.recruiter_info_avaiable = false;
                details.notes = ""
                sendJobToBackend(details, authToken);
            } else if (hostname.includes('jobright.ai')){
                const details = extractJobRightJobDetails();
                if (!details.job_title || !details.job_url) {
                    alert('Could not extract job details. Please ensure you are on a job page.');
                    return;
                }
                details.scraped_by = scrapedBy;
                details.employer_id=1;
                details.recruiter_info_avaiable = false;
                details.notes = ""
                sendJobToBackend(details, authToken);
            } else if(hostname.includes('simplyhired')){
                const details = extractSimplyHiredJobDetails();
                if (!details.job_title || !details.job_url) {
                    alert('Could not extract job details. Please ensure you are on a job page.');
                    return;
                }
                details.scraped_by = scrapedBy;
                details.employer_id=1;
                details.recruiter_info_avaiable = false;
                details.notes = ""
                sendJobToBackend(details, authToken);
            }
        });
    };

    editScrapedByBtn.onclick = () => {
        chrome.storage.local.get(['scraped_by'], function(result) {
            const current = result.scraped_by || '';
            const updated = prompt("Enter Scraped By:", current);
            if (updated !== null) {
                chrome.storage.local.set({ scraped_by: updated });
                scrapedBy = updated;
                alert(`Scraped By set to: ${updated}`);
            }
        });
    };

    editAuthTokenBtn.onclick = () => {
        chrome.storage.local.get(['auth_token'], function(result) {
            const current = result.auth_token || '';
            const updated = prompt("Enter Auth Token (copy from Wynisco App Header):", current);
            if (updated !== null) {
                chrome.storage.local.set({ auth_token: updated });
                authToken = updated;
                alert(`Auth Token updated!`);
            }
        });
    };

    // Helper to append multiple buttons
    function createButtonContainer(mainBtn, ...extraBtns) {
        const container = document.createElement('div');
        container.id = 'job-btn-container';
        container.className = 'job-btn-container'; 

        mainBtn.className = 'job-main-btn';

        extraBtns.forEach(b => {
             b.style.display = 'none'; // Initially hidden
             container.appendChild(b);
        });

        container.onmouseenter = () => {
            extraBtns.forEach(b => {
                b.style.display = 'block';
                b.classList.add('visible');
            });
        };
        container.onmouseleave = () => {
             extraBtns.forEach(b => {
                b.style.display = 'none';
                b.classList.remove('visible');
            });
        };

        container.appendChild(mainBtn);
        document.body.appendChild(container);
    }

    createButtonContainer(btn, editScrapedByBtn, editAuthTokenBtn);

    function extractLinkedInJobDetails() {
        const titleParts = document.title.match(
        /^(.+?)\s*\|\s*(.+?)\s*\|\s*LinkedIn\s*$/,
        );

        let jobTitle =
        document
            .querySelector(".job-details-jobs-unified-top-card__job-title h1 a")
            ?.textContent.trim() ||
        document
            .querySelector(".job-details-jobs-unified-top-card__job-title h1")
            ?.textContent.trim() ||
        "";
        if (!jobTitle && titleParts) jobTitle = titleParts[1].trim();

        const companyLink = document.querySelector('div.job-details-jobs-unified-top-card__company-name a')
            || document.querySelector('a[href*="/company/"][href*="/life/"]')
            || document.querySelector('a[href*="/company/"]');
        let employer = companyLink?.textContent.trim() || "";
        if (!employer && titleParts) employer = titleParts[2].trim();

        let employerLinkedinUrl = "";
        if (companyLink) {
            const slugMatch = companyLink.getAttribute('href')?.match(/\/company\/([^\/?#]+)/);
            if (slugMatch) {
                employerLinkedinUrl = `https://www.linkedin.com/company/${slugMatch[1]}/`;
            }
        }

        let jobLocation =
        document
            .querySelector(
            "div.job-details-jobs-unified-top-card__tertiary-description-container span.tvm__text--low-emphasis",
            )
            ?.textContent.trim() || "";
        if (!jobLocation) {
        const detailsScreen =
            document.querySelector('[data-sdui-screen*="JobDetails"]') || document;
        for (const p of detailsScreen.querySelectorAll("p")) {
            const t = p.textContent.trim();
            if (t.includes(" · ") && !p.querySelector("a")) {
            jobLocation = t.split(" · ")[0].trim();
            break;
            }
        }
        }

        function extractTextWithBreaks(el) {
            if (!el) return "";
            const clone = el.cloneNode(true);
            clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
            clone.querySelectorAll("li").forEach((li) => {
                li.prepend("• ");
                li.append("\n");
            });
            clone.querySelectorAll("p, div, h1, h2, h3, h4, ul, ol").forEach((b) => b.append("\n"));
            return clone.textContent.replace(/\n{3,}/g, "\n\n").trim();
        }

        let description = extractTextWithBreaks(
            document.querySelector('[data-testid="expandable-text-box"]'),
        );
        if (!description) {
            description = extractTextWithBreaks(
                document.querySelector("div.jobs-description__content"),
            );
        }

        const descriptionPrefix = "About the job";
        if (description.startsWith(descriptionPrefix)) {
        description = description.substring(descriptionPrefix.length);
        }
        const descriptionSuffix = "… more";
        description = description.replaceAll(descriptionSuffix, "");

        const jobUrl = canonicalLinkedInJobUrl(window.location.href);

        return {
        job_title: jobTitle,
        location: jobLocation,
        state: jobLocation,
        city: jobLocation,
        employer: employer,
        employer_linkedin_url: employerLinkedinUrl,
        job_description: description.trim(),
        job_url: jobUrl,
        source: "LinkedinExtension",
        };
    }

    function extractIndeedJobDetails() {
        const jobTitleRaw = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] span')?.childNodes[0]?.textContent.trim() || '';
        const jobTitle = jobTitleRaw.replace(/\s+-\s+job post$/, '');
        const employer = document.querySelector('[data-testid="inlineHeader-companyName"] a')?.textContent.trim()
            || document.querySelector('[data-testid="inlineHeader-companyName"] span')?.textContent.trim() || '';
        const jobLocation = document.querySelector('[data-testid="inlineHeader-companyLocation"] div')?.textContent.trim() || '';
        const description = document.querySelector('#jobDescriptionText')?.textContent.trim() || '';
        const jobUrl = canonicalIndeedJobUrl(window.location.href);

        return {
            job_title: jobTitle,
            state: jobLocation,
            city: jobLocation,
            location: jobLocation,
            employer: employer,
            job_description: description,
            job_url: jobUrl,
            source: 'IndeedExtension'
        };
    }

    function extractJobRightJobDetails() {
        const jobTitle =
          document
            .querySelector('[class*="index_job-title"]')
            ?.textContent.trim() || "";
        const employer =
          document
            .querySelector('[class*="index_company-name"]')
            ?.textContent.trim() || "";
        const jobLocation =
          document
            .querySelector(
              '[class*="index_job-metadata-item"] img[alt="position"] + span',
            )
            ?.textContent.trim() || "";
        let overview =
          document
            .querySelector('[class*="index_company-summary"]')
            ?.innerText.trim() || "";
        const responsibilitiesSection = Array.from(
          document.querySelectorAll("section"),
        ).find(
          (sec) =>
            sec.querySelector("h2")?.textContent.trim() === "Responsibilities",
        );

        let responsibilities = "";
        if (responsibilitiesSection) {
          responsibilities = Array.from(
            responsibilitiesSection.querySelectorAll(
              '[class*="index_listText"]',
            ),
          )
            .map((el) => "• " + el.textContent.trim())
            .join("\n");
        }

        let skills = Array.from(
          document.querySelectorAll(
            '#skills-section [class*="qualification-tag"]',
          ),
        )
          .map((el) => el.textContent.trim())
          .join(", ");
        let qualifications = Array.from(
          document.querySelectorAll(
            '#skills-section [class*="index_listText"]',
          ),
        )
          .map((el) => "• " + el.textContent.trim())
          .join("\n");

        let description = "";
        if (overview) {
          description += overview + "\n\n";
        }
        if (responsibilities) {
          description += "Responsibilities:\n" + responsibilities + "\n\n";
        }
        if (skills) {
          description += "Skills:\n" + skills + "\n\n";
        }
        if (qualifications) {
          description += "Qualifications:\n" + qualifications;
        }
        const jobUrl = window.location.href;
        return {
          job_title: jobTitle,
          state: jobLocation,
          city: jobLocation,
          location: jobLocation,
          employer: employer,
          job_description: description,
          job_url: jobUrl,
          source: "JobRightExtension",
        };
    }

    function extractSimplyHiredJobDetails() {
        const jobTitle = document.querySelector('[data-testid="viewJobTitle"]')?.textContent.trim() || '';
        const employer = document.querySelector('[data-testid="viewJobCompanyName"] [data-testid="detailText"]')?.textContent.trim() || '';
        const jobLocation = document.querySelector('[data-testid="viewJobCompanyLocation"] [data-testid="detailText"]')?.textContent.trim() || '';
        function extractJobDescription(){
            const descContainer = document.querySelector('[data-testid="viewJobBodyJobFullDescriptionContent"]');
            if (!descContainer) return '';
            let parts = [];
            descContainer.querySelectorAll('p').forEach(p => {
                const text = p.textContent.trim();
                if (text) parts.push(text);
            });
            descContainer.querySelectorAll('ul').forEach(ul => {
                ul.querySelectorAll('li').forEach(li => {
                    const text = li.textContent.trim();
                    if (text) parts.push('• ' + text);
                });
            });
            if (parts.length === 0) {
                const fallback = descContainer.textContent.trim();
                if (fallback) parts.push(fallback);
            }
            return parts.join('\n');
        }
        const description = extractJobDescription();
        const jobUrl = canonicalSimplyHiredJobUrl(window.location.href)

        return {
            job_title: jobTitle,
            state: jobLocation,
            city: jobLocation,
            location: jobLocation,
            employer: employer,
            job_description: description,
            job_url: jobUrl,
            source: 'SimplyHiredExtension'
        };
    }   
})();

async function sendJobToBackend(details, authToken) {
    const BASE_URL = "https://backend-dot-student-marketing-operations.el.r.appspot.com"
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Fallback if employer is missing
    if (!details.employer) {
        const userInput = prompt("Could not extract employer name. Please enter it:");
        if (userInput) {
            details.employer = userInput.trim();
        } else {
            alert("Employer name is required to save the job.");
            return;
        }
    }

    try {
        const linkedinParam = details.employer_linkedin_url
            ? `?linkedin_url=${encodeURIComponent(details.employer_linkedin_url)}`
            : '';
        delete details.employer_linkedin_url;

        const employerResponse = await fetch(
            `${BASE_URL}/api/v1/employers/find-or-create/${encodeURIComponent(details.employer)}${linkedinParam}`,
            { headers: headers }
        );

        if (employerResponse.status === 401) {
             alert('Authentication failed. Please update your Auth Token in the extension.');
             return;
        }

        if (!employerResponse.ok) {
             const txt = await employerResponse.text();
             throw new Error(`Failed to find/create employer. Status: ${employerResponse.status}. Msg: ${txt}`);
        }

        const employer = await employerResponse.json();
        details.employer_id = employer.id;
        
        console.log("Sending job with details:", details);
        
        fetch(`${BASE_URL}/api/v1/jobs/`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(details)
        })
        .then(async response => {
            if (response.status === 401) {
                throw new Error('Authentication failed. Please update your Auth Token.');
            }
            if (!response.ok) {
                const json = await response.json();
                const errText = json?.error || json?.message || response.statusText || 'Unknown error';
                alert(errText || 'Failed to save job.');
                return;
            }
            alert('Job details sent to backend!');
        })
        .catch(err => {
            alert('Error sending job: ' + err.message);
        });
    } catch (err) {
        alert('Error finding/creating employer: ' + err.message);
    }
}
