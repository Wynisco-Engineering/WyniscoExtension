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

function appendJobToLocalStorage(details) {
    const key = 'job_details_csv';
    const csvRow = [
        details.Jobtitle || '',
        details.JobLocation || '',
        details.Employer || '',
        (details.Description || '').replace(/\n/g, ' '),
        details.JobUrl || '',
        details.Source || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    let existing = localStorage.getItem(key) || '';
    existing += csvRow + '\n';
    localStorage.setItem(key, existing);
}

function downloadCSVFromLocalStorage() {
    const key = 'job_details_csv';
    let csv = localStorage.getItem(key);
    if (!csv || !csv.trim()) {
        alert('No job data to download!');
        return;
    }
    const header = '"Jobtitle","JobLocation","Employer","Description","JobUrl","Source"\n';
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job_details_all.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
(function() {
    const hostname = window.location.hostname;
    console.log("Job Extractor content script loaded on", hostname);

    if (document.getElementById('job-btn-container')) return;

    if (hostname.includes('linkedin.com')) {
        injectLinkedInButton();
    } else if (hostname.includes('indeed.com')) {
        injectIndeedButton();
    } else if (hostname.includes('jobright.ai')){
        injectJobRightButton();
    }

    function createButtonContainer(mainBtn, downloadBtn) {
        const container = document.createElement('div');
        container.id = 'job-btn-container';
        container.className = 'job-btn-container'; 

        downloadBtn.className = 'job-download-btn';
        mainBtn.className = 'job-main-btn';

        container.onmouseenter = () => {
            downloadBtn.classList.add('visible');
        };
        container.onmouseleave = () => {
            downloadBtn.classList.remove('visible');
        };

        container.appendChild(downloadBtn);
        container.appendChild(mainBtn);
        document.body.appendChild(container);
    }

    function injectLinkedInButton() {
        const btn = document.createElement('button');
        btn.id = 'fixed-right-image-btn';
        btn.title = 'Append job details to CSV';
        btn.innerHTML = `<img src="${chrome.runtime.getURL('icon-round.png')}" alt="Send" style="width:32px;height:32px;pointer-events:none;">`;

        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'download-csv-btn';
        downloadBtn.title = 'Download CSV';
        downloadBtn.textContent = 'Download CSV';

        btn.onclick = () => {
            const details = extractLinkedInJobDetails();
            if (!details.Jobtitle || !details.Employer || !details.JobUrl) {
                alert('Could not extract job details. Please ensure you are on a LinkedIn job page.');
                return;
            }
            appendJobToLocalStorage(details);
            alert('Job details appended to CSV data! Hover and click ⬇️ Download CSV to download.');
        };
        downloadBtn.onclick = downloadCSVFromLocalStorage;

        createButtonContainer(btn, downloadBtn);

        function extractLinkedInJobDetails() {
            let jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title h1 a')?.textContent.trim()
                || document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.textContent.trim() || '';
            let employer = document.querySelector('div.job-details-jobs-unified-top-card__company-name a')?.textContent.trim() || '';
            let jobLocation = document.querySelector('div.job-details-jobs-unified-top-card__tertiary-description-container span.tvm__text--low-emphasis')?.textContent.trim() || '';
            let description = document.querySelector('div.jobs-description__content')?.textContent.trim() || '';
            let jobUrl = canonicalLinkedInJobUrl(window.location.href);

            return {
                Jobtitle: jobTitle,
                JobLocation: jobLocation,
                Employer: employer,
                Description: description,
                JobUrl: jobUrl,
                Source: 'LinkedinExtension'
            };
        }
    }

    function injectIndeedButton() {
        const btn = document.createElement('button');
        btn.id = 'fixed-right-image-btn';
        btn.title = 'Append job details to CSV';
        btn.innerHTML = `<img src="${chrome.runtime.getURL('icon-round.png')}" alt="Send" style="width:32px;height:32px;pointer-events:none;">`;

        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'download-csv-btn';
        downloadBtn.title = 'Download CSV';
        downloadBtn.textContent = 'Download CSV';

        btn.onclick = () => {
            const details = extractIndeedJobDetails();
            if (!details.Jobtitle || !details.Employer || !details.JobUrl) {
                alert('Could not extract job details. Please ensure you are on an Indeed job page.');
                return;
            }
            appendJobToLocalStorage(details);
            alert('Job details appended to CSV data! Hover and click ⬇️ Download CSV to download.');
        };
        downloadBtn.onclick = downloadCSVFromLocalStorage;

        createButtonContainer(btn, downloadBtn);

        function extractIndeedJobDetails() {
            let jobTitleRaw = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] span')?.childNodes[0]?.textContent.trim() || '';
            let jobTitle = jobTitleRaw.replace(/\s+-\s+job post$/, '');
            let employer = document.querySelector('[data-testid="inlineHeader-companyName"] a')?.textContent.trim()
                || document.querySelector('[data-testid="inlineHeader-companyName"] span')?.textContent.trim() || '';
            let jobLocation = document.querySelector('[data-testid="inlineHeader-companyLocation"] div')?.textContent.trim() || '';
            let description = document.querySelector('#jobDescriptionText')?.textContent.trim() || '';
            let jobUrl = canonicalIndeedJobUrl(window.location.href);

            return {
                Jobtitle: jobTitle,
                JobLocation: jobLocation,
                Employer: employer,
                Description: description,
                JobUrl: jobUrl,
                Source: 'IndeedExtension'
            };
        }
    }

    function injectJobRightButton() {
        const btn = document.createElement('button');
        btn.id = 'fixed-right-image-btn';
        btn.title = 'Append job details to CSV';
        btn.innerHTML = `<img src="${chrome.runtime.getURL('icon-round.png')}" alt="Send" style="width:32px;height:32px;pointer-events:none;">`;

        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'download-csv-btn';
        downloadBtn.title = 'Download CSV';
        downloadBtn.textContent = 'Download CSV';

        btn.onclick = () => {
            const details = extractJobRightJobDetails();
            if (!details.Jobtitle || !details.Employer || !details.JobUrl) {
                alert('Could not extract job details. Please ensure you are on a JobRight job page.');
                return;
            }
            appendJobToLocalStorage(details);
            alert('Job details appended to CSV data! Hover and click ⬇️ Download CSV to download.');
        };
        downloadBtn.onclick = downloadCSVFromLocalStorage;

        createButtonContainer(btn, downloadBtn);

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
                Jobtitle: jobTitle,
                JobLocation: jobLocation,
                Employer: employer,
                Description: description,
                JobUrl: jobUrl,
                Source: 'JobRightExtension'
            };
        }
    }
})();
