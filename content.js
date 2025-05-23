
function canonicalLinkedInJobUrl(url) {
    try {
        const u = new URL(url);
        const viewMatch = u.pathname.match(/^\/jobs\/view\/(\d+)/);
        if (viewMatch) {
            return `https://www.linkedin.com/jobs/view/${viewMatch[1]}/`;
        }
        if (u.pathname.startsWith('/jobs/search/')) {
            const jobId = u.searchParams.get('currentJobId');
            if (jobId) {
                return `https://www.linkedin.com/jobs/view/${jobId}/`;
            }
        }
    } catch (e) {
        console.error("Error in canonicalLinkedInJobUrl:", e);
    }
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

    function createButtonContainer(mainBtn, editBtn) {
        const container = document.createElement('div');
        container.id = 'job-btn-container';
        container.className = 'job-btn-container'; 

        editBtn.className = 'job-download-btn';
        editBtn.innerHTML = `Edit Scraped By`;

        mainBtn.className = 'job-main-btn';

        container.onmouseenter = () => {
            editBtn.classList.add('visible');
        };
        container.onmouseleave = () => {
            editBtn.classList.remove('visible');
        };

        container.appendChild(editBtn);
        container.appendChild(mainBtn);
        document.body.appendChild(container);
    }

    const btn = document.createElement('button');
    btn.id = 'fixed-right-image-btn';
    btn.title = 'Append job details to DB';
    btn.innerHTML = `<img src="${chrome.runtime.getURL('icon-round.png')}" alt="Send" style="width:32px;height:32px;pointer-events:none;">`;

    const editScrapedByBtn = document.createElement('button');
    editScrapedByBtn.id = 'edit-scraped-by-btn';
    editScrapedByBtn.title = 'Edit Scraped By';
    editScrapedByBtn.textContent = 'Edit Scraped By';

    let scrapedBy = '';

    chrome.storage.local.get(['scraped_by'], function(result) {
        scrapedBy = result.scraped_by || '';
    });
    btn.onclick = () => {
        chrome.storage.local.get(['scraped_by'], function(result) {
            scrapedBy = result.scraped_by || '';
            
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
                sendJobToBackend(details);
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
                sendJobToBackend(details);
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
                sendJobToBackend(details);
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
                sendJobToBackend(details);
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
    createButtonContainer(btn, editScrapedByBtn);

    function extractLinkedInJobDetails(){
        const jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title h1 a')?.textContent.trim()
            || document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.textContent.trim() || '';
        const employer = document.querySelector('div.job-details-jobs-unified-top-card__company-name a')?.textContent.trim() || '';
        const jobLocation = document.querySelector('div.job-details-jobs-unified-top-card__tertiary-description-container span.tvm__text--low-emphasis')?.textContent.trim() || '';
        const description = document.querySelector('div.jobs-description__content')?.textContent.trim() || '';
        const jobUrl = canonicalLinkedInJobUrl(window.location.href);

        return {
            job_title: jobTitle,
            state: jobLocation,
            city: jobLocation,
            // employer: employer,
            job_description: description,
            job_url: jobUrl,
            source: 'LinkedinExtension'
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
            // employer: employer,
            job_description: description,
            job_url: jobUrl,
            source: 'IndeedExtension'
        };
    }

    function extractJobRightJobDetails() {
        const jobTitle = document.querySelector('.index_job-title__sStdA')?.textContent.trim() || '';
        const employer = document.querySelector('.index_company-row__vOzgg strong')?.textContent.trim() || '';
        const jobLocation = document.querySelector('.index_job-metadata-item__Wv_Xh img[alt="position"] + span')?.textContent.trim() || '';
        
        let overview = document.querySelector('.index_company-summary__8nWbU')?.innerText.trim() || '';
        let responsibilityBullets = Array.from(document.querySelectorAll('section .index_listText__ENCyh'))
        .map(el => '• ' + el.textContent.trim()).join('\n') || '';

        let qualifications = '';
        const qualificationBlocks = document.querySelectorAll('section#index_skills-section .index_listText__ENCyh')  || '';
        if(qualificationBlocks.length>0){
            qualifications = '\nQualifications:\n' + Array.from(qualificationBlocks).map(el => '• ' + el.textContent.trim()).join('\n');
        }

        let description = '';
        if (overview) description += overview + '\n\n';
        if (responsibilityBullets) description += 'Responsibilities:\n' + responsibilityBullets + '\n\n';
        if (qualifications) description += qualifications;
        const jobUrl = window.location.href;
        return {
            job_title: jobTitle,
            state: jobLocation,
            city: jobLocation,
            // employer: employer,
            job_description: description,
            job_url: jobUrl,
            source: 'JobRightExtension'
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
            // employer: employer,
            job_description: description,
            job_url: jobUrl,
            source: 'SimplyHiredExtension'
        };
    }   
})();

function sendJobToBackend(details) {
    console.log(details)
    fetch('https://backend-dot-student-marketing-operations.el.r.appspot.com/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save job');
        alert('Job details sent to backend!');
    })
    .catch(err => {
        alert('Error sending job: ' + err.message);
    });
}
