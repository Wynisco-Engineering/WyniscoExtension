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
    } catch (e) {}
    return url;
}
function canonicalIndeedJobUrl(url) {
    try {
        const u = new URL(url);
        const jobKey = u.searchParams.get('vjk');
        if (jobKey) {
            return `https://${u.hostname}/viewjob?jk=${jobKey}`;
        }
    } catch (e) {}
    return url;
}
(function() {
    const hostname = window.location.hostname;
    console.log("Job Extractor content script loaded on", hostname);

    if (document.getElementById('fixed-right-image-btn')) return;

    if (hostname.includes('linkedin.com')) {
        injectLinkedInButton();
    } else if (hostname.includes('indeed.com')) {
        injectIndeedButton();
    }

    function injectLinkedInButton() {
        const btn = document.createElement('button');
        btn.id = 'fixed-right-image-btn';
        btn.title = 'Send job details to backend';
        btn.innerHTML = `<img src="${chrome.runtime.getURL('icon.png')}" alt="Send" style="width:32px;height:32px;pointer-events:none;">`;

        Object.assign(btn.style, {
            position: 'fixed',
            top: '50%',
            right: '0',
            transform: 'translateY(-50%)',
            width: '48px',
            height: '48px',
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: '2147483647',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        document.body.appendChild(btn);

        function extractLinkedInJobDetails() {
            let jobTitle = document.querySelector('div.t-24.job-details-jobs-unified-top-card__job-title h1 a')?.textContent.trim()
                || document.querySelector('div.t-24.job-details-jobs-unified-top-card__job-title h1')?.textContent.trim() || '';
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

        btn.onclick = () => {
            const details = extractLinkedInJobDetails();
            console.log('Job details:', details);
            if (!details.Jobtitle || !details.Employer || !details.JobUrl) {
                alert('Could not extract job details. Please ensure you are on a LinkedIn job page.');
                return;
            }
            fetch('http://localhost:8000/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(details)
            })
            .then(async response => {
                if (response.ok) {
                    alert('Job details sent!');
                } else if (response.status === 400) {
                    let msg = 'Job already applied for.';
                    try {
                        const data = await response.json();
                        if (data && data.detail) msg = data.detail;
                    } catch (e) {}
                    alert(msg);
                } else {
                    let msg = 'Failed to send job details.';
                    try {
                        const data = await response.json();
                        if (data && data.detail) msg = data.detail;
                    } catch (e) {}
                    alert(msg);
                }
            })
            .catch(() => alert('Network error sending job details.'));
        };
    }

    function injectIndeedButton() {
        const btn = document.createElement('button');
        btn.id = 'fixed-right-image-btn';
        btn.title = 'Send job details to backend';
        btn.innerHTML = `<img src="${chrome.runtime.getURL('icon.png')}" alt="Send" style="width:32px;height:32px;pointer-events:none;">`;

        Object.assign(btn.style, {
            position: 'fixed',
            top: '50%',
            right: '0',
            transform: 'translateY(-50%)',
            width: '48px',
            height: '48px',
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: '2147483647',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        document.body.appendChild(btn);

        function extractIndeedJobDetails() {
            let jobTitleRaw = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] span')?.childNodes[0]?.textContent.trim() || '';
            let jobTitle = jobTitleRaw.replace(/\s+-\s+job post$/, '');
            let employer = document.querySelector('[data-testid="inlineHeader-companyName"] a')?.textContent.trim() || document.querySelector('[data-testid="inlineHeader-companyName"] span')?.textContent.trim() || '';
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

        btn.onclick = () => {
            const details = extractIndeedJobDetails();
            console.log('Job details:', details);
            if (!details.Jobtitle || !details.Employer || !details.JobUrl) {
                alert('Could not extract job details. Please ensure you are on an Indeed job page.');
                return;
            }
            fetch('http://localhost:8000/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(details)
            })
            .then(async response => {
                if (response.ok) {
                    alert('Job details sent!');
                } else if (response.status === 400) {
                    let msg = 'Job already applied for.';
                    try {
                        const data = await response.json();
                        if (data && data.detail) msg = data.detail;
                    } catch (e) {}
                    alert(msg);
                } else {
                    let msg = 'Failed to send job details.';
                    try {
                        const data = await response.json();
                        if (data && data.detail) msg = data.detail;
                    } catch (e) {}
                    alert(msg);
                }
            })
            .catch(() => alert('Network error sending job details.'));
        };
    }
})();
