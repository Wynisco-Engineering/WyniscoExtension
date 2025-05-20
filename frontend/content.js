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
    let jobTitle = document.querySelector('div.t-24.job-details-jobs-unified-top-card__job-title h1 a')?.textContent.trim() ||
                   document.querySelector('div.t-24.job-details-jobs-unified-top-card__job-title h1')?.textContent.trim() || '';

    let employer = document.querySelector('div.job-details-jobs-unified-top-card__company-name a')?.textContent.trim() || '';

    let jobLocation = document.querySelector('div.job-details-jobs-unified-top-card__tertiary-description-container span.tvm__text--low-emphasis')?.textContent.trim() || '';

    let description = document.querySelector('div.jobs-description__content')?.textContent.trim() || '';

    let jobUrl = window.location.href;

    return {
        Jobtitle: jobTitle,
        JobLocation: jobLocation,
        Employer: employer,
        description: description,
        JobUrl: jobUrl,
        source: 'LinkedinExtension'
    };
}

// 3. Button click handler
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
    .then(response => {
        if (response.ok) {
            alert('Job details sent!');
        } else {
            alert('Failed to send job details.');
        }
    })
    .catch(() => alert('Network error sending job details.'));
};

(function() {
    const hostname = window.location.hostname;
    console.log("Job Extractor content script loaded on", hostname);

    if (hostname.includes('linkedin.com')) {
        injectLinkedInButton();
    } else if (hostname.includes('indeed.com')){

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
            let jobTitle = document.querySelector('div.t-24.job-details-jobs-unified-top-card__job-title h1 a')?.textContent.trim() ||
                        document.querySelector('div.t-24.job-details-jobs-unified-top-card__job-title h1')?.textContent.trim() || '';

            let employer = document.querySelector('div.job-details-jobs-unified-top-card__company-name a')?.textContent.trim() || '';

            let jobLocation = document.querySelector('div.job-details-jobs-unified-top-card__tertiary-description-container span.tvm__text--low-emphasis')?.textContent.trim() || '';

            let description = document.querySelector('div.jobs-description__content')?.textContent.trim() || '';

            let jobUrl = window.location.href;

            return {
                Jobtitle: jobTitle,
                JobLocation: jobLocation,
                Employer: employer,
                description: description,
                JobUrl: jobUrl,
                source: 'LinkedinExtension'
            };
        }

        // 3. Button click handler
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
            .then(response => {
                if (response.ok) {
                    alert('Job details sent!');
                } else {
                    alert('Failed to send job details.');
                }
            })
            .catch(() => alert('Network error sending job details.'));
        };

    }
})();
